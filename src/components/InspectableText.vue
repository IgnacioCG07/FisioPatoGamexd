<template>
  <span
    :class="[
      'inspectable-text',
      { 'is-active': isInspectionModeActive },
      { 'is-selected': isSelected },
      { 'is-confirmed': isConfirmed },
      { 'is-incorrect': isIncorrect },
    ]"
    :title="isInspectionModeActive ? `Clic para inspeccionar: ${clave}` : ''"
    @click="handleClick"
  >
    <span v-if="isSelected && !isConfirmed && !isIncorrect" class="selection-indicator">●</span>
    <span v-if="isConfirmed" class="confirmed-indicator">✓</span>
    {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
/**
 * InspectableText — Elemento de texto interactivo para el Modo Inspección.
 *
 * Cada dato visible en los documentos médicos se envuelve en este componente.
 * Cuando el Modo Inspección está activo, el clic sobre este elemento lo marca
 * para comparación. Si los dos elementos seleccionados forman la discrepancia
 * del caso actual, se activa el estilo `is-confirmed`.
 */
import { computed, inject } from 'vue'
import type { InspectionContext } from '../composables/useInspection'

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  /** Clave identificadora del dato, ej. "carnet.rut" o "receta.medicamentos". */
  clave: string
  /** Valor a mostrar (puede ser string o número). */
  valor: string | number
  /** Nodos conflictivos del paciente actual (pasados desde MedicalDocument). */
  nodosConflictivos?: [string, string] | null
}

const props = defineProps<Props>()

// ─── Injection del contexto de inspección ───────────────────────────────────

const inspection = inject<InspectionContext>('inspection')!

// ─── Computed ────────────────────────────────────────────────────────────────

const isInspectionModeActive = computed(() => inspection.isInspectionModeActive.value)
const isSelected = computed(() => inspection.estaSeleccionado(props.clave))
const isConfirmed = computed(() => inspection.discrepanciaConfirmada.value && isSelected.value)
const isIncorrect = computed(() =>
  inspection.seleccionIncorrecta.value && isSelected.value && !isConfirmed.value
)

/** Formatea el valor para mostrar: trunca si es demasiado largo. */
const displayValue = computed(() => {
  const v = String(props.valor)
  return v.length > 120 ? v.substring(0, 120) + '…' : v
})

// ─── Handlers ────────────────────────────────────────────────────────────────

function handleClick(): void {
  if (!isInspectionModeActive.value) return
  inspection.seleccionarElemento(props.clave, props.nodosConflictivos ?? null)
}
</script>

<style scoped>
.inspectable-text {
  display: inline;
  border-radius: 3px;
  transition: background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
  cursor: default;
  position: relative;
  padding: 1px 3px;
}

/* ── Modo inspección ACTIVO: cursor lupa + hover visible (invitación al clic) */
.inspectable-text.is-active {
  cursor: zoom-in;
}

/* Hover SOLO cuando el modo inspección está activo */
.inspectable-text.is-active:hover {
  background-color: rgba(251, 191, 36, 0.2);
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.6);
  text-decoration: underline;
  text-decoration-color: rgba(251, 191, 36, 0.5);
  text-decoration-style: dotted;
}

/* ── Elemento seleccionado (uno de los dos máx.) ── */
.inspectable-text.is-selected {
  background-color: rgba(251, 191, 36, 0.3);
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.8);
  color: #fde68a;
}

/* ── Discrepancia confirmada — los dos elementos coinciden ── */
.inspectable-text.is-confirmed {
  background-color: rgba(34, 197, 94, 0.25);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.9), 0 0 12px rgba(34, 197, 94, 0.4);
  color: #86efac;
  animation: pulse-confirmed 1.5s ease-in-out infinite;
}

/* ── Selección incorrecta (dos elementos que no forman la discrepancia) ── */
.inspectable-text.is-incorrect {
  background-color: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.7);
  color: #fca5a5;
}

.selection-indicator {
  margin-right: 3px;
  color: #fbbf24;
  font-size: 0.6em;
  vertical-align: middle;
}

.confirmed-indicator {
  margin-right: 3px;
  color: #4ade80;
  font-size: 0.75em;
  vertical-align: middle;
  font-weight: bold;
}

@keyframes pulse-confirmed {
  0%, 100% { box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.9), 0 0 12px rgba(34, 197, 94, 0.4); }
  50%       { box-shadow: 0 0 0 3px rgba(34, 197, 94, 1.0), 0 0 22px rgba(34, 197, 94, 0.7); }
}
</style>
