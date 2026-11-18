<template>
  <Teleport to="body">
    <TransitionGroup name="toast-list" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.tipo}`"
      >
        <span class="toast-icon">{{ toast.tipo === 'correcto' ? '✅' : '❌' }}</span>
        <div class="toast-body">
          <span class="toast-title">{{ toast.titulo }}</span>
          <span v-if="toast.detalle" class="toast-detalle">{{ toast.detalle }}</span>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * ResultToast — Notificación breve (2-3 s) que aparece tras cada veredicto.
 *
 * Consume `ultimoResultado` del store `useGameManager` y genera un toast
 * que explica en lenguaje simple qué salió bien o mal, usando el
 * `motivoInfraccion` que ya produce `patientFactory`.
 *
 * Se monta una sola vez en App.vue y usa <Teleport to="body"> para
 * aparecer sobre cualquier overlay o z-index de la interfaz.
 */
import { ref, watch } from 'vue'
import { useGameManager } from '../composables/useGameManager'

const gameManager = useGameManager()

interface Toast {
  id: number
  tipo: 'correcto' | 'error'
  titulo: string
  detalle?: string
}

let nextId = 0
const toasts = ref<Toast[]>([])

/**
 * Agrega un toast y lo elimina automáticamente tras `duracionMs` ms.
 */
function mostrarToast(toast: Omit<Toast, 'id'>, duracionMs = 3200): void {
  const id = nextId++
  toasts.value.push({ ...toast, id })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duracionMs)
}

/**
 * Observa `ultimoResultado` del store y genera el toast correspondiente.
 */
watch(
  () => gameManager.ultimoResultado,
  (resultado) => {
    if (!resultado) return

    if (resultado.correcto) {
      mostrarToast({
        tipo: 'correcto',
        titulo: `+$10.000 — Auditoría correcta`,
        detalle: resultado.mensaje,
      }, 2800)
    } else {
      mostrarToast({
        tipo: 'error',
        titulo: `–$5.000 — Error de auditoría`,
        detalle: resultado.mensaje,
      }, 4000)
    }
  },
  { deep: true },
)
</script>

<style scoped>
/* ── Contenedor de toasts (esquina inferior derecha) ─────────────────────── */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
  pointer-events: none;
  width: 360px;
  max-width: calc(100vw - 48px);
}

/* ── Toast individual ────────────────────────────────────────────────────── */
.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.toast-correcto {
  background: rgba(20, 83, 45, 0.92);
  border-color: #16a34a;
  color: #bbf7d0;
}

.toast-error {
  background: rgba(69, 10, 10, 0.94);
  border-color: #dc2626;
  color: #fecaca;
}

.toast-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  line-height: 1.4;
}

.toast-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.toast-title {
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  letter-spacing: 0.04em;
}

.toast-detalle {
  font-size: 0.7rem;
  line-height: 1.5;
  opacity: 0.85;
  word-break: break-word;
}

/* ── Animaciones ─────────────────────────────────────────────────────────── */
.toast-list-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-list-leave-active {
  transition: all 0.25s ease;
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.toast-list-move {
  transition: transform 0.25s ease;
}
</style>
