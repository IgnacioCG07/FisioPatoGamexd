<template>
  <!--
    ResumenTurno — Pantalla de fin de turno con análisis de progreso académico.

    Se muestra al completar la cola de CASOS_POR_TURNO casos del turno.
    Incluye:
    - Resumen de aciertos/errores del turno
    - Gráfico de barras (HTML/CSS puro) de dominio por RA y sistema corporal
    - Lista de áreas débiles con botón de repaso dirigido
    - Botón de nuevo turno estándar
  -->
  <div class="resumen-overlay">
    <div class="resumen-card">

      <!-- ── Encabezado ─────────────────────────────────────────────── -->
      <div class="resumen-header">
        <div class="resumen-icon">🎓</div>
        <div class="resumen-header-text">
          <h2 class="resumen-titulo">
            Turno {{ turnoActual }} completado
            <span v-if="gameManager.modoRepasoActivo" class="tag-repaso-turno">MODO REPASO</span>
          </h2>
          <p class="resumen-subtitulo">Revisa tu progreso antes de continuar</p>
        </div>
        <InsigniaRango />
      </div>

      <!-- ── Errores superados en el turno (Repaso) ─────────────────── -->
      <div v-if="gameManager.erroresSuperadosTurno.length > 0" class="errores-superados-seccion">
        <p class="errores-superados-titulo">✅ Errores superados en este turno (2 aciertos seguidos)</p>
        <div class="errores-superados-lista">
          <span
            v-for="pat in gameManager.erroresSuperadosTurno"
            :key="pat"
            class="error-superado-tag"
          >
            ✓ {{ pat }}
          </span>
        </div>
      </div>

      <!-- ── Evaluación final (escala 1–100, 60% exigencia) ──────────── -->
      <div class="nota-card" :class="aprobado ? 'nota-aprobado' : 'nota-reprobado'">
        <div class="nota-circulo">
          <span class="nota-valor">{{ notaFinal }}</span>
          <span class="nota-escala">/ 100</span>
        </div>
        <div class="nota-info">
          <span class="nota-estado">{{ aprobado ? '✅ APROBADO' : '❌ REPROBADO' }}</span>
          <span class="nota-concepto">{{ conceptoNota }}</span>
          <span class="nota-detalle">
            Logro: {{ puntos.obtenidos }} / {{ puntos.posibles }} puntos ({{ porcentajeLogro }}%)
          </span>
          <div class="nota-barra">
            <div class="nota-barra-fill" :style="{ width: `${porcentajeLogro}%` }"></div>
            <div class="nota-barra-corte" title="Exigencia 60%"></div>
          </div>
          <span class="nota-regla">Escala 1–100 · Aprobación 51 · Exigencia 60%</span>
        </div>
      </div>

      <!-- ── Estadísticas del turno ── -->
      <div class="turno-stats">
        <div class="turno-stat">
          <span class="turno-stat-num correcto">{{ estadisticas.correctos }}</span>
          <span class="turno-stat-label">Correctos</span>
        </div>
        <div class="turno-stat">
          <span class="turno-stat-num incorrecto">{{ estadisticas.incorrectos }}</span>
          <span class="turno-stat-label">A revisar</span>
        </div>
        <div class="turno-stat">
          <span class="turno-stat-num neutral">{{ precisionTurno }}%</span>
          <span class="turno-stat-label">Precisión</span>
        </div>
        <div class="turno-stat" v-if="tracker.progreso.rachaActual > 0">
          <span class="turno-stat-num racha">🔥 {{ tracker.progreso.rachaActual }}</span>
          <span class="turno-stat-label">Racha actual</span>
        </div>
      </div>

      <!-- ── Gráfico de dominio acumulado ─────────────────────────── -->
      <div class="graficos-seccion">
        <p class="graficos-titulo">Dominio académico acumulado</p>

        <div class="graficos-columnas">
          <!-- Por Resultado de Aprendizaje -->
          <div class="grafico-grupo">
            <p class="grafico-grupo-label">Resultados de Aprendizaje</p>
            <div class="barras-lista">
              <BarraDominio
                v-for="ra in RA_ORDEN"
                :key="ra"
                :label="LABELS_RA[ra]"
                :porcentaje="tracker.progreso.porResultadoAprendizaje[ra].porcentajeDominio"
                :correctos="tracker.progreso.porResultadoAprendizaje[ra].correctos"
                :intentos="tracker.progreso.porResultadoAprendizaje[ra].correctos + tracker.progreso.porResultadoAprendizaje[ra].incorrectos"
              />
            </div>
          </div>

          <!-- Por Sistema Corporal -->
          <div class="grafico-grupo">
            <p class="grafico-grupo-label">Sistemas Corporales</p>
            <div class="barras-lista">
              <BarraDominio
                v-for="sc in SC_ORDEN"
                :key="sc"
                :label="LABELS_SC[sc]"
                :porcentaje="tracker.progreso.porSistemaCorporal[sc].porcentajeDominio"
                :correctos="tracker.progreso.porSistemaCorporal[sc].correctos"
                :intentos="tracker.progreso.porSistemaCorporal[sc].correctos + tracker.progreso.porSistemaCorporal[sc].incorrectos"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Áreas débiles ─────────────────────────────────────────── -->
      <div class="areas-debiles-seccion" v-if="areasDebiles.length > 0">
        <p class="areas-debiles-titulo">⚠ Áreas para reforzar (dominio &lt; 60%)</p>
        <div class="areas-debiles-lista">
          <span
            v-for="area in areasDebiles"
            :key="area"
            class="area-debil-tag"
          >
            {{ labelArea(area) }}
          </span>
        </div>
        <button class="btn-repasar" @click="onRepasar">
          🎯 Repasar estas áreas
        </button>
      </div>

      <!-- ── Dominio global ─────────────────────────────────────────── -->
      <div class="dominio-global">
        <span class="dominio-global-label">Dominio global acumulado</span>
        <span class="dominio-global-valor" :class="claseColorGlobal">
          {{ tracker.dominioGlobal }}%
        </span>
      </div>

      <!-- ── Acciones ───────────────────────────────────────────────── -->
      <div class="resumen-acciones">
        <button class="btn-reiniciar-progreso" @click="onReiniciarProgreso">
          Reiniciar bitácora
        </button>
        <div class="resumen-acciones-derecha">
          <button
            v-if="tracker.cantidadErroresPendientes > 0"
            class="btn-repasar-errores"
            @click="onRepasarErrores"
          >
            🔁 REPASAR ERRORES ({{ tracker.cantidadErroresPendientes }})
          </button>
          <button class="btn-nuevo-turno" @click="onNuevoTurno">
            Nuevo turno →
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ResumenTurno — Pantalla de análisis de progreso al finalizar un turno.
 *
 * Consume el estado de `useProgressTracker` (acumulado histórico) y de
 * `useGameManager` (estadísticas del turno actual) para presentar:
 * - Precisión del turno recién completado.
 * - Gráfico de barras de dominio por RA y sistema corporal.
 * - Áreas débiles con opción de iniciar un turno de repaso dirigido.
 *
 * El botón "Repasar estas áreas" llama a `iniciarTurno()` con los filtros
 * de las áreas débiles, haciendo que patientFactory genere solo casos
 * de esos sistemas/RA hasta que mejore el dominio.
 */
import { computed } from 'vue'
import { useGameManager } from '../composables/useGameManager'
import { useProgressTracker } from '../composables/useProgressTracker'
import BarraDominio from './BarraDominio.vue'
import InsigniaRango from './InsigniaRango.vue'
import type { ResultadoAprendizaje, SistemaCorporal } from '../types/models'

const gameManager = useGameManager()
const tracker = useProgressTracker()

// ── Props ────────────────────────────────────────────────────────────────────

const turnoActual = computed(() => gameManager.turnoActual)
const estadisticas = computed(() => gameManager.estadisticasTurno)

// ── Computeds ─────────────────────────────────────────────────────────────────

/** Precisión del turno actual (solo este turno, no acumulado). */
const precisionTurno = computed<number>(() => {
  const total = estadisticas.value.correctos + estadisticas.value.incorrectos
  if (total === 0) return 0
  return Math.round((estadisticas.value.correctos / total) * 100)
})

// ── Nota final ────────────────────────────────────────────────────────────────────────────

const NOTA_MIN = 1
const NOTA_MAX = 100
const NOTA_APROBACION = 51
const EXIGENCIA = 0.6

const puntos = computed(() => ({
  obtenidos: gameManager.puntosObtenidos,
  posibles: gameManager.puntosPosibles,
}))

const porcentajeLogro = computed<number>(() => {
  if (puntos.value.posibles === 0) return 0
  return Math.round((puntos.value.obtenidos / puntos.value.posibles) * 100)
})

/**
 * Escala lineal por tramos: 0%→1, 60%→51, 100%→100.
 */
const notaFinal = computed<number>(() => {
  const { obtenidos, posibles } = puntos.value
  if (posibles === 0) return NOTA_MIN
  const p = obtenidos / posibles
  const nota = p < EXIGENCIA
    ? NOTA_MIN + (NOTA_APROBACION - NOTA_MIN) * (p / EXIGENCIA)
    : NOTA_APROBACION + (NOTA_MAX - NOTA_APROBACION) * ((p - EXIGENCIA) / (1 - EXIGENCIA))
  return Math.round(nota)
})

const aprobado = computed<boolean>(() => notaFinal.value >= NOTA_APROBACION)

const conceptoNota = computed<string>(() => {
  const n = notaFinal.value
  if (n >= 90) return 'Excelente desempeño clínico'
  if (n >= 75) return 'Muy buen desempeño'
  if (n >= 61) return 'Buen desempeño'
  if (n >= 51) return 'Suficiente'
  if (n >= 30) return 'Insuficiente: repasa las áreas débiles'
  return 'Deficiente: se recomienda un turno de repaso'
})

/** Áreas débiles según el umbral del tracker. */
const areasDebiles = computed<string[]>(() => tracker.obtenerAreasDebiles(60, 3))

/** Clase CSS para el dominio global. */
const claseColorGlobal = computed<string>(() => {
  const d = tracker.dominioGlobal
  if (d >= 70) return 'dominio-verde'
  if (d >= 40) return 'dominio-amarillo'
  return 'dominio-rojo'
})

// ── Orden y labels ────────────────────────────────────────────────────────────

const RA_ORDEN: ResultadoAprendizaje[] = ['RA1', 'RA2', 'RA3']
const SC_ORDEN: SistemaCorporal[] = [
  'Cardiovascular',
  'Renal',
  'Respiratorio',
  'Digestivo',
  'Endocrino_Metabolico',
  'Musculoesqueletico',
]

const LABELS_RA: Record<ResultadoAprendizaje, string> = {
  RA1: 'RA1 — Manifestación clínica',
  RA2: 'RA2 — Factor de riesgo',
  RA3: 'RA3 — Interacción fármaco-nutriente',
}

const LABELS_SC: Record<SistemaCorporal, string> = {
  Cardiovascular: '❤️ Cardiovascular',
  Renal: '🫘 Renal',
  Respiratorio: '🫁 Respiratorio',
  Digestivo: '🫙 Digestivo',
  Endocrino_Metabolico: '⚗️ Endocrino-Metabólico',
  Musculoesqueletico: '🦴 Musculoesquelético',
}

/**
 * Convierte un identificador de área (RA o sistema) a etiqueta legible.
 * Usado para los tags de áreas débiles.
 */
function labelArea(area: string): string {
  const mapa: Record<string, string> = {
    ...LABELS_RA,
    ...LABELS_SC,
  }
  return mapa[area] ?? area
}

// ── Acciones ──────────────────────────────────────────────────────────────────

/** Inicia un turno de repaso dirigido con las áreas débiles como filtro. */
function onRepasar(): void {
  gameManager.iniciarTurno(areasDebiles.value)
}

/** Inicia un turno exclusivo con patologías falladas pendientes de repaso. */
function onRepasarErrores(): void {
  gameManager.iniciarTurnoRepaso()
}

/** Inicia un turno estándar sin filtros. */
function onNuevoTurno(): void {
  gameManager.iniciarTurno()
}

/** Reinicia el progreso académico acumulado (bitácora nueva). */
function onReiniciarProgreso(): void {
  if (confirm('¿Reiniciar la bitácora de progreso? Se perderán todos los datos acumulados.')) {
    tracker.reiniciarProgreso()
  }
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */

.resumen-overlay {
  position: absolute;
  inset: 0;
  background: rgba(5, 8, 16, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
  overflow-y: auto;
}

.resumen-card {
  background: #141822;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-top: 3px solid #2563eb;
  border-radius: 10px;
  padding: 32px 36px;
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
}

/* ── Encabezado ──────────────────────────────────────────────────────────── */

.resumen-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.resumen-icon { font-size: 2.4rem; }

.resumen-titulo {
  font-size: 1.15rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}

.resumen-subtitulo {
  font-size: 0.78rem;
  color: #64748b;
  margin: 4px 0 0;
  font-family: var(--font-mono, monospace);
}

/* ── Nota final ── */

.nota-card {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 18px 22px;
  border-radius: 10px;
  background: #1a1f2e;
  border: 1px solid rgba(148, 163, 184, 0.1);
  animation: nota-in 0.6s ease both;
}
.nota-aprobado { border-left: 4px solid #4ade80; box-shadow: 0 0 30px rgba(74, 222, 128, 0.12); }
.nota-reprobado { border-left: 4px solid #f87171; box-shadow: 0 0 30px rgba(248, 113, 113, 0.12); }

.nota-circulo {
  width: 96px; height: 96px; flex-shrink: 0;
  border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: var(--font-mono, monospace);
}
.nota-aprobado .nota-circulo { background: radial-gradient(circle, rgba(74,222,128,0.18), transparent 70%); border: 2px solid #4ade80; color: #4ade80; }
.nota-reprobado .nota-circulo { background: radial-gradient(circle, rgba(248,113,113,0.18), transparent 70%); border: 2px solid #f87171; color: #f87171; }
.nota-valor { font-size: 2.2rem; font-weight: 800; line-height: 1; }
.nota-escala { font-size: 0.6rem; opacity: 0.7; }

.nota-info { display: flex; flex-direction: column; gap: 5px; flex: 1; font-family: var(--font-mono, monospace); }
.nota-estado { font-size: 0.95rem; font-weight: 700; color: #e2e8f0; letter-spacing: 0.08em; }
.nota-concepto { font-size: 0.78rem; color: #94a3b8; }
.nota-detalle { font-size: 0.7rem; color: #64748b; }
.nota-regla { font-size: 0.58rem; color: #475569; letter-spacing: 0.08em; }

.nota-barra { position: relative; height: 8px; background: #0f131c; border-radius: 4px; overflow: hidden; margin: 4px 0; }
.nota-barra-fill { height: 100%; transition: width 1s ease; }
.nota-aprobado .nota-barra-fill { background: linear-gradient(90deg, #16a34a, #4ade80); }
.nota-reprobado .nota-barra-fill { background: linear-gradient(90deg, #b91c1c, #f87171); }
.nota-barra-corte { position: absolute; top: 0; bottom: 0; left: 60%; width: 2px; background: #fbbf24; }

@keyframes nota-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

/* ── Estadísticas del turno ──────────────────────────────────────────────── */

.turno-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.turno-stat {
  flex: 1;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: #1a1f2e;
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 6px;
  padding: 14px 10px;
}

.turno-stat-num {
  font-size: 1.8rem;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
}

.correcto { color: #4ade80; }
.incorrecto { color: #f87171; }
.neutral { color: #fbbf24; }
.racha { color: #fb923c; font-size: 1.2rem; }

.turno-stat-label {
  font-size: 0.6rem;
  color: #475569;
  letter-spacing: 0.1em;
  text-align: center;
  font-family: var(--font-mono, monospace);
}

/* ── Gráficos ────────────────────────────────────────────────────────────── */

.graficos-seccion {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.graficos-titulo {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: #475569;
  font-family: var(--font-mono, monospace);
  text-transform: uppercase;
  margin: 0;
}

.graficos-columnas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) {
  .graficos-columnas { grid-template-columns: 1fr; }
}

.grafico-grupo {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grafico-grupo-label {
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  color: #334155;
  font-family: var(--font-mono, monospace);
  margin: 0;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 6px;
}

.barras-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Áreas débiles ────────────────────────────────────────────────────────── */

.areas-debiles-seccion {
  background: rgba(185, 28, 28, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.areas-debiles-titulo {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #f87171;
  font-family: var(--font-mono, monospace);
  margin: 0;
}

.areas-debiles-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.area-debil-tag {
  background: rgba(220, 38, 38, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 3px;
  padding: 3px 10px;
  font-size: 0.65rem;
  font-family: var(--font-mono, monospace);
}

.btn-repasar {
  background: linear-gradient(135deg, #991b1b, #dc2626);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  font-family: var(--font-mono, monospace);
  transition: all 0.2s ease;
  align-self: flex-start;
}

.btn-repasar:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
}

/* ── Dominio global ───────────────────────────────────────────────────────── */

.dominio-global {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a1f2e;
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 6px;
  padding: 12px 16px;
}

.dominio-global-label {
  font-size: 0.72rem;
  color: #64748b;
  letter-spacing: 0.1em;
  font-family: var(--font-mono, monospace);
}

.dominio-global-valor {
  font-size: 1.4rem;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
}

.dominio-verde { color: #4ade80; }
.dominio-amarillo { color: #fbbf24; }
.dominio-rojo { color: #f87171; }

/* ── Acciones ─────────────────────────────────────────────────────────────── */

.resumen-acciones {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.resumen-acciones-derecha {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.resumen-header-text {
  flex: 1;
}

.tag-repaso-turno {
  font-size: 0.65rem;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.45);
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
  vertical-align: middle;
}

.errores-superados-seccion {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.28);
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.errores-superados-titulo {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #4ade80;
  font-family: var(--font-mono, monospace);
  margin: 0;
}

.errores-superados-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.error-superado-tag {
  background: rgba(16, 185, 129, 0.16);
  color: #86efac;
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 3px;
  padding: 3px 10px;
  font-size: 0.68rem;
  font-family: var(--font-mono, monospace);
}

.btn-repasar-errores {
  background: linear-gradient(135deg, #b45309, #d97706);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  font-family: var(--font-mono, monospace);
  transition: all 0.2s ease;
}

.btn-repasar-errores:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(217, 119, 6, 0.4);
}

.btn-reiniciar-progreso {
  background: transparent;
  color: #475569;
  border: 1px solid #1e293b;
  padding: 9px 16px;
  border-radius: 4px;
  font-size: 0.72rem;
  cursor: pointer;
  font-family: var(--font-mono, monospace);
  transition: all 0.2s ease;
}

.btn-reiniciar-progreso:hover {
  border-color: #f87171;
  color: #f87171;
}

.btn-nuevo-turno {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  font-family: var(--font-mono, monospace);
  transition: all 0.2s ease;
}

.btn-nuevo-turno:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}
</style>
