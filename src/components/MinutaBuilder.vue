<template>
  <!--
    MinutaBuilder — Constructor/corrector de minuta diaria por porciones (Modo Difícil, Rango 4+).
    El estudiante corrige una minuta base que trae 2 o 3 errores clínicos guiándose
    por las barras de nutrientes con zona objetivo en verde en tiempo real.
  -->
  <div class="minuta-builder" v-if="configMinuta">
    <!-- Instrucción clínica -->
    <div class="minuta-instruccion">
      <span class="minuta-badge">🍽️ CORRECCIÓN DE MINUTA DIARIA</span>
      <p class="minuta-instruccion-texto">{{ configMinuta.instruccionClinica }}</p>
    </div>

    <!-- Barras de nutrientes en tiempo real -->
    <div class="nutrientes-panel">
      <div class="nutrientes-header">
        <span>METAS NUTRICIONALES ({{ paciente.anamnesis.pesoKg }} kg)</span>
        <span
          class="estado-global-pill"
          :class="evaluacionMinuta.cumpleCriticos ? 'pill-ok' : 'pill-pendiente'"
        >
          {{ evaluacionMinuta.cumpleCriticos ? '✓ Metas críticas en rango' : '⚠ Ajusta nutrientes fuera de rango' }}
        </span>
      </div>

      <div class="barras-nutrientes">
        <div
          v-for="n in evaluacionMinuta.nutrientesEvaluados"
          :key="n.nutriente"
          class="nutriente-row"
          :class="`nut-${n.estado}`"
        >
          <div class="nut-top">
            <span class="nut-label">
              {{ n.label }}
              <span v-if="n.esCritico" class="critico-star" title="Restricción crítica">*</span>
            </span>
            <span class="nut-valores">
              <strong>{{ Math.round(n.valorActual) }}</strong>
              <span class="nut-rango">/ meta {{ n.min }}–{{ n.max }} {{ n.unidad }}</span>
            </span>
          </div>

          <div class="nut-bar-track">
            <!-- Zona objetivo en verde -->
            <div
              class="nut-target-zone"
              :style="estiloZonaObjetivo(n.min, n.max)"
              title="Zona objetivo"
            />
            <!-- Barra de valor actual -->
            <div
              class="nut-bar-fill"
              :class="`fill-${n.estado}`"
              :style="{ width: `${porcentajeBarra(n.valorActual, n.max)}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Bandeja diaria actual (para quitar errores o ajustar porciones) -->
    <div class="bandeja-panel">
      <div class="bandeja-header">
        <span>📋 BANDEJA DIARIA ACTUAL ({{ itemsActuales.length }} alimentos)</span>
        <button class="btn-reset-minuta" type="button" @click="restaurarMinutaBase">
          ↺ Restaurar base
        </button>
      </div>

      <div class="bandeja-lista">
        <div
          v-for="item in itemsDetallados"
          :key="item.alimento.id"
          class="bandeja-item"
        >
          <div class="bandeja-item-info">
            <span class="bandeja-item-nombre">{{ item.alimento.nombre }}</span>
            <span class="bandeja-item-aportes">
              {{ Math.round(item.alimento.kcal * item.porciones) }} kcal ·
              P: {{ Math.round(item.alimento.proteinas * item.porciones) }}g ·
              Na: {{ Math.round(item.alimento.sodio * item.porciones) }}mg ·
              K: {{ Math.round(item.alimento.potasio * item.porciones) }}mg
            </span>
          </div>
          <div class="bandeja-controles">
            <button type="button" class="btn-porcion" @click="cambiarPorcion(item.alimento.id, -1)">−</button>
            <span class="porcion-num">{{ item.porciones }}p</span>
            <button type="button" class="btn-porcion" @click="cambiarPorcion(item.alimento.id, 1)">+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Catálogo por grupos para agregar alimentos -->
    <div class="catalogo-panel">
      <div class="catalogo-titulo">+ AGREGAR ALIMENTO DEL CATÁLOGO CHILENO:</div>
      <div class="grupos-tabs">
        <button
          v-for="g in GRUPOS"
          :key="g.id"
          type="button"
          class="grupo-tab"
          :class="{ activo: grupoActivo === g.id }"
          @click="grupoActivo = g.id"
        >
          {{ g.icono }} {{ g.corto }}
        </button>
      </div>

      <div class="catalogo-lista">
        <button
          v-for="alim in alimentosDelGrupo"
          :key="alim.id"
          type="button"
          class="catalogo-item"
          @click="cambiarPorcion(alim.id, 1)"
        >
          <div class="cat-info">
            <span class="cat-nombre">{{ alim.nombre }}</span>
            <span class="cat-meta">
              {{ alim.kcal }} kcal · P:{{ alim.proteinas }}g · CHO:{{ alim.carbohidratos }}g · Na:{{ alim.sodio }}mg · K:{{ alim.potasio }}mg · Fibra:{{ alim.fibra }}g
            </span>
          </div>
          <span class="cat-add">+1</span>
        </button>
      </div>
    </div>

    <button
      type="button"
      class="btn-confirmar-minuta"
      :class="{ 'confirmada': minutaConfirmada }"
      @click="confirmarMinutaManual"
    >
      {{ minutaConfirmada ? '✓ Minuta lista para evaluación (puedes seguir editando)' : '✓ Confirmar minuta corregida' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGameManager } from '../composables/useGameManager'
import alimentosRaw from '../data/alimentos.json'
import type {
  AlimentoCatalogo,
  GrupoAlimento,
  ItemMinuta,
  ResultadoEvaluacionMinuta,
  NutrienteClave,
} from '../types/models'

const catalogo = alimentosRaw as unknown as AlimentoCatalogo[]
const catalogoMap = new Map<string, AlimentoCatalogo>(catalogo.map(a => [a.id, a]))

const gameManager = useGameManager()

const paciente = computed(() => gameManager.pacienteActual!)
const configMinuta = computed(() => paciente.value?.configMinuta)

const GRUPOS: { id: GrupoAlimento; icono: string; corto: string }[] = [
  { id: 'carnes_huevos_legumbres', icono: '🍗', corto: 'Carnes/Leg.' },
  { id: 'lacteos', icono: '🥛', corto: 'Lácteos' },
  { id: 'cereales_tuberculos', icono: '🌾', corto: 'Cereales' },
  { id: 'verduras', icono: '🥦', corto: 'Verduras' },
  { id: 'frutas', icono: '🍎', corto: 'Frutas' },
  { id: 'bebidas_suplementos', icono: '🍼', corto: 'Suplem.' },
  { id: 'aceites_grasas', icono: '🥑', corto: 'Grasas' },
  { id: 'azucares_procesados', icono: '🧁', corto: 'Procesados' },
]

const grupoActivo = ref<GrupoAlimento>('carnes_huevos_legumbres')
const itemsActuales = ref<ItemMinuta[]>([])
const minutaConfirmada = ref(false)

function inicializarBandeja(): void {
  if (!configMinuta.value) return
  if (gameManager.evaluacionActual.minutaItems && gameManager.evaluacionActual.minutaItems.length > 0) {
    itemsActuales.value = gameManager.evaluacionActual.minutaItems.map(i => ({ ...i }))
    minutaConfirmada.value = gameManager.evaluacionActual.planSeleccionado !== null
  } else {
    itemsActuales.value = configMinuta.value.itemsBase.map(i => ({ ...i }))
    minutaConfirmada.value = false
  }
}

onMounted(() => {
  inicializarBandeja()
})

watch(
  () => paciente.value?.id,
  () => {
    inicializarBandeja()
  },
)

const itemsDetallados = computed(() =>
  itemsActuales.value
    .map(item => {
      const alim = catalogoMap.get(item.alimentoId)
      return alim ? { alimento: alim, porciones: item.porciones } : null
    })
    .filter((x): x is { alimento: AlimentoCatalogo; porciones: number } => x !== null),
)

const alimentosDelGrupo = computed(() =>
  catalogo.filter(a => a.grupo === grupoActivo.value),
)

function calcularTotalesNutrientes(): Record<NutrienteClave, number> {
  const totales: Record<NutrienteClave, number> = {
    kcal: 0,
    proteinas: 0,
    carbohidratos: 0,
    grasas: 0,
    sodio: 0,
    potasio: 0,
    fosforo: 0,
    fibra: 0,
    azucaresSimples: 0,
  }

  for (const { alimento, porciones } of itemsDetallados.value) {
    totales.kcal += alimento.kcal * porciones
    totales.proteinas += alimento.proteinas * porciones
    totales.carbohidratos += alimento.carbohidratos * porciones
    totales.grasas += alimento.grasas * porciones
    totales.sodio += alimento.sodio * porciones
    totales.potasio += alimento.potasio * porciones
    totales.fosforo += alimento.fosforo * porciones
    totales.fibra += alimento.fibra * porciones
    totales.azucaresSimples += alimento.azucaresSimples * porciones
  }

  return totales
}

const evaluacionMinuta = computed<ResultadoEvaluacionMinuta>(() => {
  const totales = calcularTotalesNutrientes()
  const metas = configMinuta.value?.metasCalculadas ?? []

  const nutrientesEvaluados = metas.map(m => {
    const val = Math.round(totales[m.nutriente] * 10) / 10
    const estado: 'ok' | 'bajo' | 'alto' =
      val < m.min ? 'bajo' : val > m.max ? 'alto' : 'ok'
    return {
      nutriente: m.nutriente,
      label: m.label,
      unidad: m.unidad,
      valorActual: val,
      min: m.min,
      max: m.max,
      esCritico: m.esCritico,
      estado,
      razonClinica: m.razonClinica,
    }
  })

  const cumpleCriticos = nutrientesEvaluados
    .filter(n => n.esCritico)
    .every(n => n.estado === 'ok')

  const cumpleTodo = nutrientesEvaluados.every(n => n.estado === 'ok')

  return {
    cumpleTodo,
    cumpleCriticos,
    nutrientesEvaluados,
  }
})

function sincronizarConStore(): void {
  minutaConfirmada.value = true
  gameManager.actualizarMinuta(
    itemsActuales.value.map(i => ({ ...i })),
    evaluacionMinuta.value,
  )
}

function cambiarPorcion(alimentoId: string, delta: number): void {
  const idx = itemsActuales.value.findIndex(i => i.alimentoId === alimentoId)
  if (idx >= 0) {
    const nueva = itemsActuales.value[idx].porciones + delta
    if (nueva <= 0) {
      itemsActuales.value.splice(idx, 1)
    } else {
      itemsActuales.value[idx].porciones = Math.min(8, nueva)
    }
  } else if (delta > 0) {
    itemsActuales.value.push({ alimentoId, porciones: delta })
  }
  sincronizarConStore()
}

function restaurarMinutaBase(): void {
  if (!configMinuta.value) return
  itemsActuales.value = configMinuta.value.itemsBase.map(i => ({ ...i }))
  sincronizarConStore()
}

function confirmarMinutaManual(): void {
  sincronizarConStore()
}

// ── Escalado visual de barras ───────────────────────────────────────────────

function escalaMaxima(maxMeta: number): number {
  return Math.max(maxMeta * 1.4, 1)
}

function porcentajeBarra(valor: number, maxMeta: number): number {
  const tope = escalaMaxima(maxMeta)
  return Math.min(100, Math.max(2, Math.round((valor / tope) * 100)))
}

function estiloZonaObjetivo(minMeta: number, maxMeta: number): Record<string, string> {
  const tope = escalaMaxima(maxMeta)
  const left = Math.min(100, Math.max(0, Math.round((minMeta / tope) * 100)))
  const right = Math.min(100, Math.max(left + 4, Math.round((maxMeta / tope) * 100)))
  return {
    left: `${left}%`,
    width: `${right - left}%`,
  }
}
</script>

<style scoped>
.minuta-builder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-pixel, sans-serif);
}

.minuta-instruccion {
  background: rgba(47, 93, 140, 0.1);
  border-left: 3px solid #2f5d8c;
  padding: 6px 8px;
  border-radius: 0 4px 4px 0;
}

.minuta-badge {
  font-size: 10px;
  font-weight: 800;
  color: #2f5d8c;
  letter-spacing: 0.06em;
  display: block;
}

.minuta-instruccion-texto {
  font-size: 11px;
  line-height: 1.35;
  color: #3b2f25;
  margin: 2px 0 0;
}

/* ── Barras de nutrientes ─────────────────────────────────────────────────── */

.nutrientes-panel {
  background: #f7f0da;
  border: 1.5px solid rgba(120, 95, 50, 0.45);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nutrientes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 10px;
  font-weight: 800;
  color: #5b4937;
}

.estado-global-pill {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9.5px;
  font-weight: 700;
}

.pill-ok {
  background: rgba(63, 163, 77, 0.2);
  color: #1e5a28;
}

.pill-pendiente {
  background: rgba(217, 119, 6, 0.2);
  color: #92400e;
}

.barras-nutrientes {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nutriente-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nut-top {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.nut-label {
  font-weight: 700;
  color: #3b2f25;
}

.critico-star {
  color: #b91c1c;
  font-weight: 900;
}

.nut-valores {
  font-family: var(--font-digits, monospace);
  font-size: 10.5px;
}

.nut-ok .nut-valores strong { color: #1e5a28; }
.nut-bajo .nut-valores strong { color: #b45309; }
.nut-alto .nut-valores strong { color: #b91c1c; }

.nut-rango {
  color: #6b5a46;
  font-size: 10px;
  margin-left: 3px;
}

.nut-bar-track {
  position: relative;
  height: 10px;
  background: #e2d5b5;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(90, 70, 40, 0.35);
}

.nut-target-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(63, 163, 77, 0.28);
  border-left: 1.5px dashed #1e5a28;
  border-right: 1.5px dashed #1e5a28;
  z-index: 1;
}

.nut-bar-fill {
  position: relative;
  height: 100%;
  transition: width 0.2s ease, background-color 0.2s ease;
  z-index: 2;
  opacity: 0.85;
}

.fill-ok { background: #2d8a3e; }
.fill-bajo { background: #d97706; }
.fill-alto { background: #dc2626; }

/* ── Bandeja diaria ──────────────────────────────────────────────────────── */

.bandeja-panel {
  background: rgba(255, 255, 255, 0.45);
  border: 1.5px solid rgba(120, 95, 50, 0.4);
  border-radius: 4px;
  padding: 7px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.bandeja-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  font-weight: 800;
  color: #3b2f25;
}

.btn-reset-minuta {
  background: transparent;
  border: 1px solid rgba(120, 95, 50, 0.5);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 9.5px;
  color: #5b4937;
  cursor: pointer;
}

.bandeja-lista {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 135px;
  overflow-y: auto;
}

.bandeja-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px;
  background: #f7f0da;
  border: 1px solid rgba(120, 95, 50, 0.35);
  border-radius: 3px;
}

.bandeja-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.bandeja-item-nombre {
  font-size: 11px;
  font-weight: 700;
  color: #2b2118;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bandeja-item-aportes {
  font-size: 9.5px;
  color: #6b5a46;
  font-family: var(--font-digits, monospace);
}

.bandeja-controles {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.btn-porcion {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #5b4937;
  background: #ece1c5;
  color: #2b2118;
  font-weight: 800;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}

.btn-porcion:hover {
  background: #fbe9a6;
}

.porcion-num {
  font: 700 11px var(--font-digits, monospace);
  min-width: 20px;
  text-align: center;
}

/* ── Catálogo ────────────────────────────────────────────────────────────── */

.catalogo-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.catalogo-titulo {
  font-size: 10px;
  font-weight: 800;
  color: #3b2f25;
}

.grupos-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.grupo-tab {
  padding: 3px 6px;
  font-size: 10px;
  font-weight: 700;
  background: #e0d2ab;
  border: 1px solid rgba(90, 70, 40, 0.45);
  border-radius: 3px;
  color: #3b2f25;
  cursor: pointer;
}

.grupo-tab.activo {
  background: #2f5d8c;
  color: #fff;
  border-color: #15283d;
}

.catalogo-lista {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 115px;
  overflow-y: auto;
}

.catalogo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 7px;
  background: #f7f0da;
  border: 1px solid rgba(120, 95, 50, 0.35);
  border-radius: 3px;
  text-align: left;
  cursor: pointer;
}

.catalogo-item:hover {
  background: #fbe9a6;
  border-color: #b8860b;
}

.cat-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cat-nombre {
  font-size: 11px;
  font-weight: 600;
  color: #2b2118;
}

.cat-meta {
  font-size: 9.5px;
  color: #6b5a46;
  font-family: var(--font-digits, monospace);
}

.cat-add {
  flex-shrink: 0;
  padding: 2px 6px;
  background: #3fa34d;
  color: #fff;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 800;
}

.btn-confirmar-minuta {
  padding: 7px 10px;
  border-radius: 4px;
  border: 2px solid #1e5a28;
  background: #3fa34d;
  color: #fff;
  font: 700 11.5px var(--font-pixel, sans-serif);
  cursor: pointer;
}

.btn-confirmar-minuta.confirmada {
  background: #2d7a3b;
}
</style>
