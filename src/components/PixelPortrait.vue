<template>
  <div class="px-portrait" :style="{ background: bg }">
    <svg
      class="px-portrait-svg"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label="Retrato del paciente"
    >
      <rect
        v-for="(r, i) in rects"
        :key="i"
        :x="r.x"
        :y="r.y"
        :width="r.w"
        :height="r.h"
        :fill="r.c"
      />
    </svg>
    <div class="px-portrait-scan" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
/**
 * PixelPortrait — Retrato pixel-art procedural.
 *
 * Genera un busto 16×16 de forma determinista a partir de una semilla
 * (RUT del paciente), su edad y su sexo, para que el mismo paciente tenga
 * siempre la misma cara. Es puramente visual: no altera datos del juego.
 */
import { computed } from 'vue'

interface Props {
  /** Semilla estable (p. ej. el RUT). */
  seed: string
  /** Edad en años (define peinado, ropa y arrugas). */
  edad: number
  /** Sexo del paciente. */
  sexo: 'M' | 'F'
}

const props = defineProps<Props>()

interface Px { x: number; y: number; w: number; h: number; c: string }

// ─── Utilidades ───────────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function darken(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

// ─── Paletas ──────────────────────────────────────────────────────────────────

const SKINS = [
  { b: '#f2c9a0', s: '#d9a57a' },
  { b: '#e0ac80', s: '#c48a5e' },
  { b: '#c68b5c', s: '#a56c42' },
  { b: '#9a6340', s: '#7a4a2e' },
  { b: '#f5d5b8', s: '#e0b392' },
]
const HAIRS = ['#2b1d14', '#4a2f1c', '#1c1c22', '#7a4a22', '#a0522d', '#c9a24a']
const HAIRS_MAYOR = ['#e8e8e8', '#c4c4c8', '#d8d2c4']
const CLOTHES = ['#3f6b4a', '#8a3b3b', '#3c5a8a', '#6b4a8a', '#b58b2e', '#4a4a52', '#2f6f73']

const OUT = '#1a1210'
const EYE = '#1d1a1a'
const MOUTH = '#7a2e2e'

// ─── Composición del sprite ───────────────────────────────────────────────────

const rects = computed<Px[]>(() => {
  const r = mulberry32(hashString(props.seed + '|' + props.sexo))
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)]

  const out: Px[] = []
  const rect = (x: number, y: number, w: number, h: number, c: string) => out.push({ x, y, w, h, c })
  const px = (x: number, y: number, c: string) => rect(x, y, 1, 1, c)

  const edad = props.edad
  const nino = edad < 12
  const mayor = edad >= 65
  const esF = props.sexo === 'F'

  const skin = pick(SKINS)
  const hc = mayor ? pick(HAIRS_MAYOR) : pick(HAIRS)
  const hs = darken(hc, 0.72)
  const cloth = pick(CLOTHES)
  const clothS = darken(cloth, 0.72)

  const style: string = nino
    ? pick(['messy', 'short', esF ? 'pigtails' : 'messy'])
    : esF
      ? (mayor ? 'bun' : pick(['long', 'long', 'bob', 'bun']))
      : (mayor ? 'thin' : pick(['short', 'messy', 'short']))

  // — Pelo trasero (detrás de la cabeza) —
  if (style === 'long') {
    rect(2, 4, 2, 9, hc); rect(12, 4, 2, 9, hc)
    rect(2, 11, 2, 2, hs); rect(12, 11, 2, 2, hs)
  } else if (style === 'bob') {
    rect(2, 4, 2, 6, hc); rect(12, 4, 2, 6, hc)
    rect(2, 9, 2, 1, hs); rect(12, 9, 2, 1, hs)
  } else if (style === 'pigtails') {
    rect(1, 7, 2, 5, hc); rect(13, 7, 2, 5, hc)
    rect(1, 11, 2, 1, hs); rect(13, 11, 2, 1, hs)
  }

  // — Cuello —
  rect(6, 11, 4, 2, skin.s)

  // — Ropa —
  const hoodie = r() < 0.5
  if (nino) {
    rect(2, 14, 12, 2, cloth)
    rect(3, 13, 10, 1, cloth)
    rect(2, 15, 12, 1, clothS)
  } else {
    rect(1, 13, 14, 3, cloth)
    rect(2, 12, 12, 1, cloth)
    rect(1, 15, 14, 1, clothS)
  }
  if (hoodie) {
    rect(3, 11, 2, 1, cloth); rect(11, 11, 2, 1, cloth)
    px(6, 14, '#d8d2c0'); px(9, 14, '#d8d2c0')
    px(6, 15, '#d8d2c0'); px(9, 15, '#d8d2c0')
  }
  // Escote en V
  rect(6, 12, 4, 1, skin.s)
  rect(7, 13, 2, 1, skin.s)

  // — Cabeza —
  rect(4, 2, 8, 1, OUT)
  rect(3, 3, 10, 7, OUT)
  rect(4, 3, 8, 7, skin.b)
  rect(4, 10, 8, 1, OUT)
  rect(5, 10, 6, 1, skin.b)
  rect(5, 11, 6, 1, OUT)
  // Orejas
  rect(2, 6, 1, 2, skin.b)
  rect(13, 6, 1, 2, skin.b)

  // — Pelo frontal —
  if (style === 'short' || style === 'messy' || style === 'bun' || style === 'pigtails') {
    rect(3, 2, 10, 2, hc)
    rect(3, 4, 1, 3, hc); rect(12, 4, 1, 3, hc)
    rect(4, 4, 3, 1, hc); rect(9, 4, 3, 1, hc)
    px(7, 4, hs)
    if (style === 'messy') {
      rect(2, 3, 1, 2, hc); rect(13, 3, 1, 2, hc)
      rect(5, 1, 2, 1, hc); rect(9, 1, 3, 1, hc); rect(7, 0, 2, 1, hc)
    }
    if (style === 'bun') {
      rect(6, 0, 4, 2, hc); px(6, 1, hs); px(9, 1, hs)
    }
  } else if (style === 'long' || style === 'bob') {
    rect(3, 2, 10, 2, hc)
    rect(3, 4, 2, 5, hc); rect(11, 4, 2, 5, hc)
    rect(4, 4, 8, 1, hc)
    px(8, 4, skin.b); px(7, 4, hs)
  } else if (style === 'thin') {
    rect(3, 2, 10, 1, hc)
    rect(3, 3, 2, 3, hc); rect(11, 3, 2, 3, hc)
    px(6, 3, '#fff6e0')
  }

  // — Ojos y cejas —
  if (nino) {
    rect(5, 6, 2, 2, EYE); rect(9, 6, 2, 2, EYE)
    px(5, 6, '#ffffff'); px(9, 6, '#ffffff')
    px(5, 9, '#c07a50'); px(10, 9, '#c07a50'); px(6, 9, '#c07a50')
  } else {
    rect(5, 6, 2, 1, EYE); rect(9, 6, 2, 1, EYE)
    rect(5, 7, 2, 1, skin.s); rect(9, 7, 2, 1, skin.s)
  }
  const brow = mayor ? '#bcbcc2' : darken(hc, 0.6)
  rect(5, 5, 2, 1, brow); rect(9, 5, 2, 1, brow)

  // — Nariz —
  px(8, 8, skin.s)

  // — Barba (hombres adultos) —
  const barba = !esF && !nino && edad >= 20 && r() < (mayor ? 0.7 : 0.35)
  if (barba) {
    const bc = mayor ? '#d8d8dc' : darken(hc, 0.9)
    rect(4, 8, 8, 2, bc)
    rect(5, 10, 6, 1, bc)
    px(8, 8, skin.s)
  }

  // — Arrugas —
  if (mayor) {
    rect(6, 4, 4, 1, skin.s)
    if (!barba) { px(4, 8, skin.s); px(11, 8, skin.s); px(4, 9, skin.s); px(11, 9, skin.s) }
  }

  // — Gafas —
  const gafas = !nino && r() < (mayor ? 0.65 : 0.18)
  if (gafas) {
    const g = '#2a2a30'
    rect(4, 5, 4, 1, g); rect(4, 7, 4, 1, g); px(4, 6, g); px(7, 6, g)
    rect(8, 5, 4, 1, g); rect(8, 7, 4, 1, g); px(8, 6, g); px(11, 6, g)
  }

  // — Boca (cansada / preocupada) —
  if (r() < 0.5) {
    rect(7, 9, 2, 1, MOUTH)
    px(6, 10, MOUTH); px(9, 10, MOUTH)
  } else {
    rect(6, 9, 4, 1, MOUTH)
  }

  return out
})

/** Fondo tipo foto de carnet, con matiz derivado de la semilla. */
const bg = computed(() => {
  const h = 175 + (hashString(props.seed) % 50)
  return `linear-gradient(180deg, hsl(${h}, 22%, 30%) 0%, hsl(${h}, 24%, 20%) 100%)`
})
</script>

<style scoped>
.px-portrait {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.px-portrait-svg {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  display: block;
}

/* Scanlines sutiles para reforzar el look retro */
.px-portrait-scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 2px,
    rgba(0, 0, 0, 0.12) 2px,
    rgba(0, 0, 0, 0.12) 3px
  );
}
</style>
