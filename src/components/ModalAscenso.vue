<template>
  <!--
    ModalAscenso — Ventana de ascenso al final del turno: "¡Ascendiste! Desbloqueaste: …".
  -->
  <Teleport to="body">
    <Transition name="ascenso-fade">
      <div
        v-if="carrera.rangoAscensoPendiente"
        class="ascenso-overlay"
        role="dialog"
        aria-modal="true"
      >
        <div class="ascenso-card">
          <div class="ascenso-badge">ASCENSO DE CARRERA</div>
          <div class="ascenso-icono">{{ carrera.rangoAscensoPendiente.icono }}</div>
          <h2 class="ascenso-titulo">¡Ascendiste a {{ carrera.rangoAscensoPendiente.titulo }}!</h2>
          <p class="ascenso-desc">{{ carrera.rangoAscensoPendiente.descripcionCorta }}</p>

          <div class="ascenso-unlock-box">
            <span class="unlock-label">🔓 DESBLOQUEASTE</span>
            <span class="unlock-valor">{{ carrera.rangoAscensoPendiente.desbloquea }}</span>
          </div>

          <button class="btn-ascenso-ok" @click="carrera.cerrarModalAscenso()">
            ¡Excelente, continuar!
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useCarrera } from '../composables/useCarrera'

const carrera = useCarrera()
</script>

<style scoped>
.ascenso-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 16, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 650;
  padding: 20px;
}

.ascenso-card {
  background: linear-gradient(160deg, #1e293b, #0f172a);
  border: 2px solid #eab308;
  border-radius: 12px;
  padding: 30px 34px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.75), 0 0 40px rgba(234, 179, 8, 0.25);
}

.ascenso-badge {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #fde047;
  background: rgba(234, 179, 8, 0.16);
  border: 1px solid rgba(234, 179, 8, 0.4);
  padding: 4px 12px;
  border-radius: 999px;
  font-family: var(--font-mono, monospace);
}

.ascenso-icono {
  font-size: 3.4rem;
  line-height: 1;
  margin: 4px 0;
}

.ascenso-titulo {
  font-size: 1.3rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.ascenso-desc {
  font-size: 0.84rem;
  color: #94a3b8;
  margin: 0;
}

.ascenso-unlock-box {
  width: 100%;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.unlock-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #34d399;
  font-family: var(--font-mono, monospace);
}

.unlock-valor {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ecfdf5;
}

.btn-ascenso-ok {
  margin-top: 6px;
  background: linear-gradient(135deg, #ca8a04, #eab308);
  color: #0f172a;
  border: none;
  padding: 12px 28px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-ascenso-ok:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.ascenso-fade-enter-active,
.ascenso-fade-leave-active {
  transition: all 0.3s ease;
}

.ascenso-fade-enter-from,
.ascenso-fade-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
