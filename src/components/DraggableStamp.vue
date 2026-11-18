<template>
  <div
    class="stamp-wrapper"
    :class="`stamp-${tipo}`"
    draggable="true"
    :aria-label="`${tipo === 'aprobado' ? 'Aprobar indicación' : 'Rechazar indicación'}`"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="stamp-body" :class="{ dragging: isDragging }">
      <div class="stamp-text-container">
        <span class="stamp-label">{{ tipo === 'aprobado' ? 'APROBAR' : 'RECHAZAR' }}</span>
        <span class="stamp-sublabel">PRÁCTICA CLÍNICA</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * DraggableStamp — Sello arrastrable para emitir la indicación clínica.
 *
 * Implementa la API nativa HTML5 Drag and Drop sin dependencias externas.
 * El hint "Arrastra sobre la receta" está centralizado en App.vue.
 */
import { ref } from 'vue'

interface Props {
  /** Tipo de sello: determina color, texto y dato transferido. */
  tipo: 'aprobado' | 'rechazado'
}

const props = defineProps<Props>()

const isDragging = ref(false)

/**
 * Inicia el drag: pone el tipo de sello en el dataTransfer y activa
 * el estilo visual de "siendo arrastrado".
 */
function onDragStart(event: DragEvent): void {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('sello', props.tipo)
  event.dataTransfer.effectAllowed = 'copy'
  isDragging.value = true
}

/**
 * Restaura el estado visual al terminar el drag (exitoso o no).
 */
function onDragEnd(): void {
  isDragging.value = false
}
</script>

<style scoped>
.stamp-wrapper {
  user-select: none;
  cursor: grab;
  display: inline-flex;
}

.stamp-wrapper:active,
.stamp-wrapper:active .stamp-body {
  cursor: grabbing;
}

/* ── Cuerpo del sello ───────────────────────────────────────────────────── */

.stamp-body {
  position: relative;
  width: 136px;
  padding: 14px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-width: 3px;
  border-style: solid;
  transition:
    opacity 0.2s ease,
    transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.15s ease;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3), 4px 4px 0 rgba(0, 0, 0, 0.45);
}

.stamp-body::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px dashed;
  border-color: inherit;
  opacity: 0.3;
  border-radius: 2px;
  pointer-events: none;
}

.stamp-wrapper:not(.dragging):hover .stamp-body {
  transform: scale(1.06) rotate(-1.5deg);
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.3),
    4px 4px 0 rgba(0, 0, 0, 0.45),
    0 0 20px rgba(255, 255, 255, 0.08);
}

.stamp-body.dragging {
  opacity: 0.35;
  transform: scale(0.92);
  box-shadow: none;
  cursor: grabbing;
}

/* ── APROBAR ────────────────────────────────────────────────────────────── */
.stamp-aprobado .stamp-body {
  border-color: #16a34a;
  background: linear-gradient(145deg, #14532d, #166534);
  color: #4ade80;
}

/* ── RECHAZAR ───────────────────────────────────────────────────────────── */
.stamp-rechazado .stamp-body {
  border-color: #dc2626;
  background: linear-gradient(145deg, #450a0a, #7f1d1d);
  color: #f87171;
}

/* ── Texto ──────────────────────────────────────────────────────────────── */
.stamp-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stamp-label {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-align: center;
  text-shadow: 0 0 10px currentColor;
}

.stamp-sublabel {
  font-family: var(--font-mono);
  font-size: 0.4rem;
  letter-spacing: 0.2em;
  opacity: 0.65;
  text-align: center;
}
</style>
