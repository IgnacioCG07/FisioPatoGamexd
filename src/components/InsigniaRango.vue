<template>
  <!--
    InsigniaRango — Insignia de rango profesional para el HUD y la pantalla de inicio.
  -->
  <div
    class="insignia-rango"
    :class="[`rango-${carrera.rangoActual.id}`, { 'modo-docente': carrera.modoDocente }]"
    :title="`${carrera.rangoActual.titulo} · ${carrera.rangoActual.descripcionCorta}`"
  >
    <span class="insignia-icono">{{ carrera.rangoActual.icono }}</span>
    <div class="insignia-textos">
      <span class="insignia-label">
        RANGO {{ carrera.rangoActual.orden }}/5
        <span v-if="carrera.modoDocente" class="docente-tag">DOCENTE</span>
      </span>
      <span class="insignia-titulo">{{ carrera.rangoActual.titulo }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCarrera } from '../composables/useCarrera'

const carrera = useCarrera()
</script>

<style scoped>
.insignia-rango {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: #10161b;
  border: 2px solid #2b3942;
  border-radius: 5px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-family: var(--font-pixel, sans-serif);
}

.rango-interno { border-color: #475569; }
.rango-practicante { border-color: #38bdf8; }
.rango-clinico { border-color: #34d399; }
.rango-especialista { border-color: #f59e0b; }
.rango-jefe {
  border-color: #eab308;
  background: linear-gradient(135deg, #1c1917, #292524);
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.25);
}

.insignia-icono {
  font-size: 1.25rem;
  line-height: 1;
}

.insignia-textos {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.insignia-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #94a3b8;
  font-family: var(--font-digits, monospace);
  display: flex;
  align-items: center;
  gap: 4px;
}

.docente-tag {
  background: #7c3aed;
  color: #fff;
  padding: 0 4px;
  border-radius: 2px;
  font-size: 8px;
}

.insignia-titulo {
  font-size: 11px;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
}
</style>
