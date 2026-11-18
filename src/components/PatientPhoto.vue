<template>
  <div class="patient-photo" :style="{ background: bgGradient }">
    <svg class="photo-silhouette" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Cabeza -->
      <circle cx="40" cy="28" r="16" :fill="skinColor" />
      <!-- Cuerpo / torso -->
      <path
        d="M12 90 C12 68 28 58 40 58 C52 58 68 68 68 90 Z"
        :fill="skinColor"
        opacity="0.85"
      />
      <!-- Ropa -->
      <path
        d="M22 90 C22 73 30 65 40 63 C50 65 58 73 58 90 Z"
        :fill="shirtColor"
      />
    </svg>

    <!-- Iniciales como fallback y badge de identidad -->
    <div class="photo-initials">{{ initials }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * PatientPhoto — Avatar generativo para el carnet de identidad.
 *
 * Genera un avatar consistente (mismo color para el mismo nombre+RUT)
 * usando el RUT como semilla para determinar la paleta, de modo que
 * el mismo paciente siempre tenga el mismo aspecto visual.
 */
import { computed } from 'vue'

interface Props {
  /** Nombre completo del paciente (para iniciales). */
  nombre: string
  /** RUT del paciente (usado como semilla de color). */
  rut: string
}

const props = defineProps<Props>()

// ─── Paletas de avatar ────────────────────────────────────────────────────────

const SKIN_TONES = [
  '#f5cba7', '#e8b68a', '#d4956b', '#c17c4e', '#a0603a', '#7a4030',
]

const SHIRT_COLORS = [
  '#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#1d4ed8', '#4f46e5', '#0e7490', '#047857',
]

// ─── Semilla determinista desde el RUT ───────────────────────────────────────

/**
 * Genera un número entero a partir de una cadena (hash simple).
 * Mismo string → mismo número, siempre.
 */
function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convertir a 32-bit int
  }
  return Math.abs(hash)
}

const seed = computed(() => hashString(props.rut.replace(/\D/g, '')))

const skinColor = computed(() => SKIN_TONES[seed.value % SKIN_TONES.length])
const shirtColor = computed(() => SHIRT_COLORS[(seed.value >> 2) % SHIRT_COLORS.length])

/** Gradiente de fondo del carnet coherente con la paleta del avatar. */
const bgGradient = computed(() => {
  const h = (seed.value % 360)
  return `linear-gradient(145deg, hsl(${h}, 30%, 18%), hsl(${h}, 25%, 12%))`
})

/** Iniciales del nombre (máx. 2 caracteres). */
const initials = computed(() => {
  const words = props.nombre.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return words[0].substring(0, 2).toUpperCase()
})
</script>

<style scoped>
.patient-photo {
  width: 80px;
  height: 96px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.photo-silhouette {
  width: 80px;
  height: 76px;
  position: absolute;
  bottom: 0;
}

.photo-initials {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 0.52rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.05em;
  line-height: 1;
}
</style>
