<template>
  <!--
    BarraDominio — Barra de progreso académico reutilizable.
    Muestra un label, el porcentaje de dominio y un color semafórico
    según el nivel de dominio: rojo < 40%, amarillo 40-70%, verde > 70%.
    Usada dentro de ResumenTurno.vue para cada RA y sistema corporal.
  -->
  <div class="barra-dominio">
    <div class="barra-header">
      <span class="barra-label">{{ label }}</span>
      <div class="barra-meta">
        <span class="barra-intentos" v-if="intentos > 0">
          {{ correctos }}/{{ intentos }}
        </span>
        <span class="barra-pct" :class="claseColor">{{ porcentaje }}%</span>
      </div>
    </div>
    <div class="barra-track">
      <div
        class="barra-fill"
        :class="claseColor"
        :style="{ width: intentos > 0 ? `${porcentaje}%` : '0%' }"
        role="progressbar"
        :aria-valuenow="porcentaje"
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
    <p class="barra-sin-datos" v-if="intentos === 0">Sin datos aún</p>
  </div>
</template>

<script setup lang="ts">
/**
 * BarraDominio — Barra de progreso de dominio académico.
 *
 * Muestra de forma visual el porcentaje de respuestas correctas
 * para un Resultado de Aprendizaje o Sistema Corporal específico,
 * con codificación de color semafórica para guiar la atención del estudiante.
 *
 * Umbrales de color:
 * - Verde  (≥ 70%): dominio consolidado
 * - Amarillo (40–69%): dominio en desarrollo
 * - Rojo   (< 40%): área de repaso prioritario
 *
 * @prop label — Nombre del RA o sistema corporal a mostrar
 * @prop porcentaje — Porcentaje de dominio (0-100)
 * @prop correctos — Número de respuestas correctas
 * @prop intentos — Número total de intentos
 */
import { computed } from 'vue'

interface Props {
  label: string
  porcentaje: number
  correctos: number
  intentos: number
}

const props = defineProps<Props>()

/**
 * Clase CSS semafórica basada en el porcentaje de dominio.
 * Solo aplica color si hay intentos registrados.
 */
const claseColor = computed<string>(() => {
  if (props.intentos === 0) return 'color-sin-datos'
  if (props.porcentaje >= 70) return 'color-verde'
  if (props.porcentaje >= 40) return 'color-amarillo'
  return 'color-rojo'
})
</script>

<style scoped>
.barra-dominio {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Encabezado: label + meta (intentos + porcentaje) ─────────────────── */

.barra-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.barra-label {
  font-size: 0.72rem;
  color: #94a3b8;
  font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.barra-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.barra-intentos {
  font-size: 0.65rem;
  color: #475569;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.barra-pct {
  font-size: 0.78rem;
  font-weight: 700;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  min-width: 36px;
  text-align: right;
}

/* ── Track ───────────────────────────────────────────────────────────── */

.barra-track {
  height: 6px;
  background: #1e293b;
  border-radius: 3px;
  overflow: hidden;
}

.barra-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Sin datos ───────────────────────────────────────────────────────── */

.barra-sin-datos {
  font-size: 0.6rem;
  color: #334155;
  font-family: var(--font-mono, monospace);
  font-style: italic;
  margin: 0;
}

/* ── Colores semafóricos ─────────────────────────────────────────────── */

.color-verde {
  color: #4ade80;
}
.color-verde.barra-fill {
  background: linear-gradient(90deg, #15803d, #4ade80);
}

.color-amarillo {
  color: #fbbf24;
}
.color-amarillo.barra-fill {
  background: linear-gradient(90deg, #b45309, #fbbf24);
}

.color-rojo {
  color: #f87171;
}
.color-rojo.barra-fill {
  background: linear-gradient(90deg, #991b1b, #f87171);
}

.color-sin-datos {
  color: #334155;
}
</style>
