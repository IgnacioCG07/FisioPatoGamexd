<template>
  <!--
    EvaluacionClinica — Panel derecho de evaluación del nutricionista.

    Soporta:
    - Casos normales:
      1. Diagnóstico (tarjetas en modo fácil, desplegable en difícil)
      2. Plan Nutricional (3 opciones en fácil; MinutaBuilder en modo difícil desde Rango 4)
      3. Riesgo Farmacológico (3 opciones)
      4. Mecanismo Fisiopatológico (si el caso lo incluye)
    - Casos de Seguimiento (Control · 4 semanas después):
      1. Evolución (mejoró / se mantuvo / empeoró + causa)
      2. Conducta (mantener / ajustar / derivar)
      3. Riesgo Farmacológico
  -->
  <div class="evaluacion-panel">

    <!-- ── Portapapeles con la ficha de evaluación ─────────────────────── -->
    <div class="eval-clipboard">
      <span class="clip" aria-hidden="true" />

      <div class="eval-sheet">
        <div class="eval-header">
          <span class="eval-icon" aria-hidden="true">{{ paciente.esControl ? '📅' : '✚' }}</span>
          <div>
            <h2 class="eval-titulo">
              {{ paciente.esControl ? 'Evaluación de Control' : 'Tu Evaluación Clínica' }}
            </h2>
            <p class="eval-subtitulo">
              <template v-if="paciente.esControl">
                Evalúa evolución, conducta y riesgo (4 semanas después)
              </template>
              <template v-else>
                Completa {{ paciente.opcionesMecanismo?.length ? '4 secciones' : '3 secciones' }} y timbra la ficha
              </template>
            </p>
          </div>
          <div class="modo-badge" @click="toggleModo" title="Cambiar dificultad">
            <span>{{ modoDificultad === 'facil' ? '⭐ Fácil' : '🔥 Difícil' }}</span>
          </div>
        </div>

        <!-- ── Progreso de secciones ─────────────────────────────────────── -->
        <div class="eval-progreso">
          <div class="progreso-dot" :class="{ done: seccion1Completa }">
            {{ seccion1Completa ? '✓' : '1' }}
          </div>
          <div class="progreso-line" :class="{ done: seccion1Completa }" />
          <div class="progreso-dot" :class="{ done: seccion2Completa }">
            {{ seccion2Completa ? '✓' : '2' }}
          </div>
          <div class="progreso-line" :class="{ done: seccion2Completa }" />
          <div class="progreso-dot" :class="{ done: evaluacion.riesgoSeleccionado !== null }">
            {{ evaluacion.riesgoSeleccionado !== null ? '✓' : '3' }}
          </div>
          <template v-if="!paciente.esControl && paciente.opcionesMecanismo?.length">
            <div class="progreso-line" :class="{ done: evaluacion.riesgoSeleccionado !== null }" />
            <div class="progreso-dot progreso-dot-fisio" :class="{ done: evaluacion.mecanismoSeleccionado !== null }">
              {{ evaluacion.mecanismoSeleccionado !== null ? '✓' : '4' }}
            </div>
          </template>
        </div>

        <div class="eval-secciones">

          <!-- ══════════════════════════════════════════════════════════════ -->
          <!-- MODO CONTROL (SEGUIMIENTO 4 SEMANAS DESPUÉS)                  -->
          <!-- ══════════════════════════════════════════════════════════════ -->
          <template v-if="paciente.esControl && paciente.datosControl">

            <!-- SECCIÓN 1 (Control): Evolución -->
            <div class="eval-seccion" :class="{ 'seccion-done': seccion1Completa }">
              <button class="seccion-header" @click="toggleSeccion('diagnostico')">
                <div class="seccion-titulo-row">
                  <span class="seccion-num" :class="{ done: seccion1Completa }">
                    {{ seccion1Completa ? '✓' : '1' }}
                  </span>
                  <span class="seccion-titulo">Evolución del Paciente</span>
                  <span v-if="evaluacion.evolucionSeleccionada" class="seccion-seleccion-preview">
                    {{ evaluacion.evolucionSeleccionada.texto.substring(0, 28) }}…
                  </span>
                </div>
                <span class="seccion-chevron" :class="{ rotated: seccionesAbiertas.diagnostico }">▾</span>
              </button>

              <Transition name="seccion-expand">
                <div v-if="seccionesAbiertas.diagnostico" class="seccion-contenido">
                  <div class="opciones-lista">
                    <button
                      v-for="(opcion, idx) in paciente.datosControl.opcionesEvolucion"
                      :key="idx"
                      class="opcion-lista-item"
                      :class="{ 'opcion-seleccionada': evaluacion.evolucionSeleccionada === opcion }"
                      @click="onSeleccionarEvolucion(opcion)"
                    >
                      <span class="opcion-radio" :class="{ activo: evaluacion.evolucionSeleccionada === opcion }">
                        {{ evaluacion.evolucionSeleccionada === opcion ? '●' : '○' }}
                      </span>
                      <span class="opcion-texto-lista">{{ opcion.texto }}</span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- SECCIÓN 2 (Control): Conducta -->
            <div class="eval-seccion" :class="{ 'seccion-done': seccion2Completa }">
              <button class="seccion-header" @click="toggleSeccion('plan')">
                <div class="seccion-titulo-row">
                  <span class="seccion-num" :class="{ done: seccion2Completa }">
                    {{ seccion2Completa ? '✓' : '2' }}
                  </span>
                  <span class="seccion-titulo">Conducta Clínica</span>
                  <span v-if="evaluacion.conductaSeleccionada" class="seccion-seleccion-preview">
                    {{ evaluacion.conductaSeleccionada.texto.substring(0, 28) }}…
                  </span>
                </div>
                <span class="seccion-chevron" :class="{ rotated: seccionesAbiertas.plan }">▾</span>
              </button>

              <Transition name="seccion-expand">
                <div v-if="seccionesAbiertas.plan" class="seccion-contenido">
                  <div class="opciones-lista">
                    <button
                      v-for="(opcion, idx) in paciente.datosControl.opcionesConducta"
                      :key="idx"
                      class="opcion-lista-item"
                      :class="{ 'opcion-seleccionada': evaluacion.conductaSeleccionada === opcion }"
                      @click="onSeleccionarConducta(opcion)"
                    >
                      <span class="opcion-radio" :class="{ activo: evaluacion.conductaSeleccionada === opcion }">
                        {{ evaluacion.conductaSeleccionada === opcion ? '●' : '○' }}
                      </span>
                      <span class="opcion-texto-lista">{{ opcion.texto }}</span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

          </template>

          <!-- ══════════════════════════════════════════════════════════════ -->
          <!-- MODO CASO NORMAL                                              -->
          <!-- ══════════════════════════════════════════════════════════════ -->
          <template v-else>

            <!-- SECCIÓN 1: Diagnóstico -->
            <div class="eval-seccion" :class="{ 'seccion-done': evaluacion.diagnosticoSeleccionado !== null }">
              <button class="seccion-header" @click="toggleSeccion('diagnostico')">
                <div class="seccion-titulo-row">
                  <span class="seccion-num" :class="{ done: evaluacion.diagnosticoSeleccionado !== null }">
                    {{ evaluacion.diagnosticoSeleccionado !== null ? '✓' : '1' }}
                  </span>
                  <span class="seccion-titulo">Diagnóstico</span>
                  <span v-if="evaluacion.diagnosticoSeleccionado" class="seccion-seleccion-preview">
                    {{ evaluacion.diagnosticoSeleccionado }}
                  </span>
                </div>
                <span class="seccion-chevron" :class="{ rotated: seccionesAbiertas.diagnostico }">▾</span>
              </button>

              <Transition name="seccion-expand">
                <div v-if="seccionesAbiertas.diagnostico" class="seccion-contenido">

                  <!-- Modo Fácil: tarjetas -->
                  <div v-if="modoDificultad === 'facil'" class="opciones-grid">
                    <button
                      v-for="opcion in paciente.opcionesDiagnostico"
                      :key="opcion"
                      class="opcion-card"
                      :class="{ 'opcion-seleccionada': evaluacion.diagnosticoSeleccionado === opcion }"
                      @click="seleccionarDiagnostico(opcion)"
                    >
                      <span class="opcion-icono">🔬</span>
                      <span class="opcion-texto">{{ opcion }}</span>
                    </button>
                  </div>

                  <!-- Modo Difícil: desplegable -->
                  <div v-else class="opcion-select-wrapper">
                    <select
                      class="opcion-select"
                      :value="evaluacion.diagnosticoSeleccionado ?? ''"
                      @change="(e) => seleccionarDiagnostico((e.target as HTMLSelectElement).value)"
                    >
                      <option value="" disabled>Seleccionar diagnóstico…</option>
                      <option
                        v-for="opcion in todasLasPatologias"
                        :key="opcion"
                        :value="opcion"
                      >{{ opcion }}</option>
                    </select>
                  </div>

                </div>
              </Transition>
            </div>

            <!-- SECCIÓN 2: Plan Nutricional o Minuta (en modo Difícil Rango 4+) -->
            <div class="eval-seccion" :class="{ 'seccion-done': evaluacion.planSeleccionado !== null }">
              <button class="seccion-header" @click="toggleSeccion('plan')">
                <div class="seccion-titulo-row">
                  <span class="seccion-num" :class="{ done: evaluacion.planSeleccionado !== null }">
                    {{ evaluacion.planSeleccionado !== null ? '✓' : '2' }}
                  </span>
                  <span class="seccion-titulo">
                    {{ usaMinuta ? '🍽️ Minuta Diaria' : 'Plan Nutricional' }}
                  </span>
                  <span v-if="evaluacion.planSeleccionado" class="seccion-seleccion-preview">
                    {{ evaluacion.planSeleccionado.texto.substring(0, 30) }}…
                  </span>
                </div>
                <span class="seccion-chevron" :class="{ rotated: seccionesAbiertas.plan }">▾</span>
              </button>

              <Transition name="seccion-expand">
                <div v-if="seccionesAbiertas.plan" class="seccion-contenido">
                  <!-- Constructor de Minuta en modo Difícil si está desbloqueado (Rango 4+) -->
                  <MinutaBuilder v-if="usaMinuta" />

                  <!-- Opciones estándar en modo Fácil (o si Minuta aún está bloqueada en modo Difícil) -->
                  <template v-else>
                    <div
                      v-if="modoDificultad === 'dificil' && !carrera.minutaDesbloqueada"
                      class="locked-minuta-notice"
                    >
                      🔒 El Constructor de Minuta se desbloquea en el rango <strong>⭐ Especialista</strong>.
                    </div>
                    <div class="opciones-lista">
                      <button
                        v-for="(opcion, idx) in paciente.opcionesPlanNutricional"
                        :key="idx"
                        class="opcion-lista-item"
                        :class="{ 'opcion-seleccionada': evaluacion.planSeleccionado === opcion }"
                        @click="seleccionarPlan(opcion)"
                      >
                        <span class="opcion-radio" :class="{ activo: evaluacion.planSeleccionado === opcion }">
                          {{ evaluacion.planSeleccionado === opcion ? '●' : '○' }}
                        </span>
                        <span class="opcion-texto-lista">{{ opcion.texto }}</span>
                      </button>
                    </div>
                  </template>
                </div>
              </Transition>
            </div>

          </template>

          <!-- ── SECCIÓN 3: Riesgo Farmacológico (común a todos los casos) ── -->
          <div class="eval-seccion" :class="{ 'seccion-done': evaluacion.riesgoSeleccionado !== null }">
            <button class="seccion-header" @click="toggleSeccion('riesgo')">
              <div class="seccion-titulo-row">
                <span class="seccion-num" :class="{ done: evaluacion.riesgoSeleccionado !== null }">
                  {{ evaluacion.riesgoSeleccionado !== null ? '✓' : '3' }}
                </span>
                <span class="seccion-titulo">Riesgo Farmacológico</span>
                <span v-if="evaluacion.riesgoSeleccionado" class="seccion-seleccion-preview">
                  {{ evaluacion.riesgoSeleccionado.texto.substring(0, 30) }}…
                </span>
              </div>
              <span class="seccion-chevron" :class="{ rotated: seccionesAbiertas.riesgo }">▾</span>
            </button>

            <Transition name="seccion-expand">
              <div v-if="seccionesAbiertas.riesgo" class="seccion-contenido">
                <div class="opciones-lista">
                  <button
                    v-for="(opcion, idx) in paciente.opcionesRiesgoFarmacologico"
                    :key="idx"
                    class="opcion-lista-item"
                    :class="{ 'opcion-seleccionada': evaluacion.riesgoSeleccionado === opcion }"
                    @click="seleccionarRiesgo(opcion)"
                  >
                    <span class="opcion-radio" :class="{ activo: evaluacion.riesgoSeleccionado === opcion }">
                      {{ evaluacion.riesgoSeleccionado === opcion ? '●' : '○' }}
                    </span>
                    <span class="opcion-texto-lista">{{ opcion.texto }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- ── SECCIÓN 4: Mecanismo Fisiopatológico (solo casos del ramo) ── -->
          <div
            v-if="!paciente.esControl && paciente.opcionesMecanismo?.length"
            class="eval-seccion eval-seccion-fisio"
            :class="{ 'seccion-done': evaluacion.mecanismoSeleccionado !== null }"
          >
            <button class="seccion-header" @click="toggleSeccion('mecanismo')">
              <div class="seccion-titulo-row">
                <span class="seccion-num seccion-num-fisio" :class="{ done: evaluacion.mecanismoSeleccionado !== null }">
                  {{ evaluacion.mecanismoSeleccionado !== null ? '✓' : '4' }}
                </span>
                <span class="seccion-titulo">🧬 Mecanismo Fisiopatológico</span>
                <span v-if="evaluacion.mecanismoSeleccionado" class="seccion-seleccion-preview">
                  {{ evaluacion.mecanismoSeleccionado.texto.substring(0, 30) }}…
                </span>
              </div>
              <span class="seccion-chevron" :class="{ rotated: seccionesAbiertas.mecanismo }">▾</span>
            </button>

            <Transition name="seccion-expand">
              <div v-if="seccionesAbiertas.mecanismo" class="seccion-contenido">
                <p class="mecanism-hint">¿Cuál es la secuencia fisiopatológica correcta?</p>
                <div class="opciones-lista opciones-lista-mecanismo">
                  <button
                    v-for="(opcion, idx) in paciente.opcionesMecanismo"
                    :key="idx"
                    class="opcion-lista-item opcion-mecanismo"
                    :class="{ 'opcion-seleccionada': evaluacion.mecanismoSeleccionado === opcion }"
                    @click="seleccionarMecanismo(opcion)"
                  >
                    <span class="opcion-radio" :class="{ activo: evaluacion.mecanismoSeleccionado === opcion }">
                      {{ evaluacion.mecanismoSeleccionado === opcion ? '●' : '○' }}
                    </span>
                    <span class="opcion-texto-lista">{{ opcion.texto }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>

        </div>
      </div>
    </div>

    <!-- ── TIMBRE (bandeja de sellos) ─────────────────────────────────── -->
    <div class="stamp-tray">
      <div v-if="!evaluacionCompleta" class="timbre-hint">
        {{ seccionesPendientes }} sección{{ seccionesPendientes !== 1 ? 'es' : '' }} pendiente{{ seccionesPendientes !== 1 ? 's' : '' }}
      </div>
      <button
        class="btn-timbre"
        :class="{ 'timbre-ready': evaluacionCompleta }"
        :disabled="!evaluacionCompleta"
        @click="onTimbrar"
      >
        <span class="stamp-art" aria-hidden="true">
          <span class="stamp-knob">✓</span>
          <span class="stamp-neck" />
          <span class="stamp-base">TIMBRE</span>
        </span>
        <div class="timbre-label">
          <span class="timbre-titulo">TIMBRAR FICHA</span>
          <span class="timbre-subtitulo">{{ evaluacionCompleta ? 'Ficha lista para timbre' : 'Completa la evaluación' }}</span>
        </div>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameManager } from '../composables/useGameManager'
import { useCarrera } from '../composables/useCarrera'
import MinutaBuilder from './MinutaBuilder.vue'
import clinicalDataRaw from '../data/clinicalData.json'
import type {
  PatologiaClinica,
  OpcionPlan,
  OpcionRiesgo,
  OpcionMecanismo,
  OpcionEvolucion,
  OpcionConducta,
} from '../types/models'

const clinicalData = clinicalDataRaw as unknown as PatologiaClinica[]

const gameManager = useGameManager()
const carrera = useCarrera()

const paciente = computed(() => gameManager.pacienteActual!)
const evaluacion = computed(() => gameManager.evaluacionActual)
const evaluacionCompleta = computed(() => gameManager.evaluacionCompleta)
const modoDificultad = computed(() => gameManager.modoDificultad)
const usaMinuta = computed(() => gameManager.usaMinutaEnCasoActual)

const seccion1Completa = computed(() =>
  paciente.value?.esControl
    ? Boolean(evaluacion.value.evolucionSeleccionada)
    : evaluacion.value.diagnosticoSeleccionado !== null,
)

const seccion2Completa = computed(() =>
  paciente.value?.esControl
    ? Boolean(evaluacion.value.conductaSeleccionada)
    : evaluacion.value.planSeleccionado !== null,
)

/** Lista de todos los nombres de patologías para el selector difícil */
const todasLasPatologias = computed(() => clinicalData.map(p => p.nombre).sort())

// ── Estado de apertura de secciones ──────────────────────────────────────────

const seccionesAbiertas = ref({
  diagnostico: true,
  plan: false,
  riesgo: false,
  mecanismo: false,
})

function toggleSeccion(seccion: 'diagnostico' | 'plan' | 'riesgo' | 'mecanismo'): void {
  seccionesAbiertas.value[seccion] = !seccionesAbiertas.value[seccion]
}

function toggleModo(): void {
  gameManager.modoDificultad = gameManager.modoDificultad === 'facil' ? 'dificil' : 'facil'
}

// ── Secciones pendientes ──────────────────────────────────────────────────────

const seccionesPendientes = computed(() => {
  let pendientes = 0
  if (!seccion1Completa.value) pendientes++
  if (!seccion2Completa.value) pendientes++
  if (evaluacion.value.riesgoSeleccionado === null) pendientes++
  if (
    !paciente.value?.esControl &&
    paciente.value?.opcionesMecanismo?.length &&
    evaluacion.value.mecanismoSeleccionado === null
  ) {
    pendientes++
  }
  return pendientes
})

// ── Acciones ──────────────────────────────────────────────────────────────────

function seleccionarDiagnostico(diagnostico: string): void {
  if (!diagnostico) return
  gameManager.seleccionarDiagnostico(diagnostico)
  if (!seccion2Completa.value) {
    seccionesAbiertas.value.diagnostico = false
    seccionesAbiertas.value.plan = true
  }
}

function seleccionarPlan(plan: OpcionPlan): void {
  gameManager.seleccionarPlan(plan)
  if (evaluacion.value.riesgoSeleccionado === null) {
    seccionesAbiertas.value.plan = false
    seccionesAbiertas.value.riesgo = true
  }
}

function onSeleccionarEvolucion(evolucion: OpcionEvolucion): void {
  gameManager.seleccionarEvolucion(evolucion)
  if (!seccion2Completa.value) {
    seccionesAbiertas.value.diagnostico = false
    seccionesAbiertas.value.plan = true
  }
}

function onSeleccionarConducta(conducta: OpcionConducta): void {
  gameManager.seleccionarConducta(conducta)
  if (evaluacion.value.riesgoSeleccionado === null) {
    seccionesAbiertas.value.plan = false
    seccionesAbiertas.value.riesgo = true
  }
}

function seleccionarRiesgo(riesgo: OpcionRiesgo): void {
  gameManager.seleccionarRiesgo(riesgo)
  if (!paciente.value?.esControl && paciente.value?.opcionesMecanismo?.length) {
    seccionesAbiertas.value.riesgo = false
    seccionesAbiertas.value.mecanismo = true
  } else {
    seccionesAbiertas.value.riesgo = false
  }
}

function seleccionarMecanismo(mecanismo: OpcionMecanismo): void {
  gameManager.seleccionarMecanismo(mecanismo)
  seccionesAbiertas.value.mecanismo = false
}

function onTimbrar(): void {
  if (!evaluacionCompleta.value) return
  gameManager.timbrarFicha()
}
</script>

<style scoped>
/* ── Panel principal ─────────────────────────────────────────────────────── */

.evaluacion-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  font-family: var(--font-pixel, 'Pixelify Sans', sans-serif);
}

/* ── Portapapeles ────────────────────────────────────────────────────────── */

.eval-clipboard {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 22px 10px 10px;
  background: linear-gradient(#9a7a4f, #7d6040);
  border: 2px solid #2b1d0f;
  border-radius: 8px;
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.35), 0 20px 30px rgba(0, 0, 0, 0.45);
}

.clip {
  position: absolute;
  top: 4px;
  left: 50%;
  width: 84px;
  height: 22px;
  transform: translateX(-50%);
  z-index: 3;
  background: linear-gradient(#e2e6e8, #8a9298);
  border: 2px solid #1c1e21;
  border-radius: 4px;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.35);
}

.clip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 6px;
  width: 36px;
  height: 6px;
  transform: translateX(-50%);
  background: #2a2d31;
  border-radius: 3px;
}

.eval-sheet {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 14px 12px;
  color: var(--ink, #3b2f25);
  background:
    repeating-linear-gradient(180deg, transparent 0 25px, var(--paper-line, rgba(120, 95, 50, 0.14)) 25px 26px),
    var(--paper, #ece1c5);
  border-radius: 3px;
  box-shadow: inset 0 0 26px rgba(120, 90, 40, 0.22);
}

/* ── Header ──────────────────────────────────────────────────────────────── */

.eval-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.eval-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: var(--ink-blue, #2f5d8c);
  border: 2px solid #15283d;
  border-radius: 4px;
}

.eval-titulo {
  font: 700 15px/1.1 var(--font-pixel, sans-serif);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-blue, #2f5d8c);
  margin: 0;
}

.eval-subtitulo {
  font: 500 11px/1.3 var(--font-pixel, sans-serif);
  color: var(--ink-soft, #6b5a46);
  margin: 2px 0 0;
  letter-spacing: 0.04em;
}

.modo-badge {
  margin-left: auto;
  flex-shrink: 0;
  padding: 3px 9px;
  font: 700 11px/1.4 var(--font-pixel, sans-serif);
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: #f3ead2;
  background: #26303a;
  border: 2px solid #0c1014;
  border-bottom-width: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease;
}

.modo-badge:hover { filter: brightness(1.25); transform: translateY(-1px); }
.modo-badge:active { transform: translateY(2px); border-bottom-width: 2px; }

/* ── Progreso visual ─────────────────────────────────────────────────────── */

.eval-progreso {
  display: flex;
  align-items: center;
  padding: 0 2px;
  flex-shrink: 0;
}

.progreso-dot {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font: 700 11px/1 var(--font-pixel, sans-serif);
  color: var(--ink-soft, #6b5a46);
  background: var(--paper-2, #e0d2ab);
  border: 2px solid rgba(60, 45, 20, 0.55);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.progreso-dot.done {
  color: #fff;
  background: #3fa34d;
  border-color: #1e5a28;
}

.progreso-line {
  flex: 1;
  height: 4px;
  background: repeating-linear-gradient(90deg, rgba(60, 45, 20, 0.35) 0 4px, transparent 4px 8px);
  transition: background 0.3s ease;
}

.progreso-line.done { background: #3fa34d; }

/* ── Secciones ───────────────────────────────────────────────────────────── */

.eval-secciones {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 3px;
}

.eval-seccion {
  background: rgba(255, 255, 255, 0.35);
  border: 2px solid rgba(120, 95, 50, 0.4);
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  transition: border-color 0.3s ease, background 0.3s ease;
}

.eval-seccion.seccion-done {
  border-color: #3fa34d;
  background: rgba(120, 200, 120, 0.14);
}

.seccion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--ink, #3b2f25);
  text-align: left;
  font-family: inherit;
}

.seccion-header:hover { background: rgba(255, 255, 255, 0.35); }

.seccion-titulo-row {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
}

.seccion-num {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font: 700 11px/1 var(--font-pixel, sans-serif);
  color: var(--ink-soft, #6b5a46);
  background: var(--paper-2, #e0d2ab);
  border: 2px solid rgba(60, 45, 20, 0.55);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.seccion-num.done {
  color: #fff;
  background: #3fa34d;
  border-color: #1e5a28;
}

.seccion-titulo {
  font: 700 13px/1.2 var(--font-pixel, sans-serif);
  letter-spacing: 0.04em;
  color: var(--ink, #3b2f25);
  white-space: nowrap;
}

.seccion-seleccion-preview {
  min-width: 0;
  max-width: 130px;
  font: 500 11px var(--font-pixel, sans-serif);
  color: #2d7a3b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seccion-chevron {
  flex-shrink: 0;
  font-size: 0.85rem;
  color: var(--ink-soft, #6b5a46);
  transition: transform 0.25s ease;
}

.seccion-chevron.rotated { transform: rotate(180deg); }

.seccion-contenido {
  padding: 10px;
  border-top: 2px dashed rgba(60, 45, 20, 0.25);
}

.locked-minuta-notice {
  margin-bottom: 8px;
  padding: 5px 8px;
  font-size: 11px;
  color: #5b4937;
  background: rgba(90, 70, 40, 0.12);
  border: 1px dashed rgba(90, 70, 40, 0.45);
  border-radius: 4px;
}

/* ── Transición de secciones ─────────────────────────────────────────────── */

.seccion-expand-enter-active,
.seccion-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.seccion-expand-enter-from,
.seccion-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.seccion-expand-enter-to,
.seccion-expand-leave-from {
  opacity: 1;
  max-height: 680px;
}

/* ── Opciones en grid (modo fácil: diagnóstico) ─────────────────────────── */

.opciones-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.opcion-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 6px;
  color: var(--ink, #3b2f25);
  text-align: center;
  background: #f7f0da;
  border: 2px solid rgba(120, 95, 50, 0.55);
  border-bottom-width: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease;
}

.opcion-card:hover {
  background: #fbe9a6;
  border-color: #b8860b;
  transform: translateY(-1px);
}

.opcion-card:active { transform: translateY(2px); border-bottom-width: 2px; }

.opcion-card.opcion-seleccionada {
  background: #f6e08a;
  border-color: #8a6410;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.45);
}

.opcion-icono { font-size: 1.05rem; }

.opcion-texto {
  font: 600 12px/1.3 var(--font-pixel, sans-serif);
  letter-spacing: 0.02em;
}

/* ── Selector difícil ────────────────────────────────────────────────────── */

.opcion-select-wrapper { position: relative; }

.opcion-select {
  width: 100%;
  padding: 9px 10px;
  background: #f7f0da;
  border: 2px solid rgba(120, 95, 50, 0.6);
  border-radius: 4px;
  color: var(--ink, #3b2f25);
  font: 600 13px var(--font-pixel, sans-serif);
  cursor: pointer;
  outline: none;
}

.opcion-select:focus { border-color: var(--ink-blue, #2f5d8c); }

/* ── Opciones en lista (plan / riesgo) ───────────────────────────────────── */

.opciones-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.opcion-lista-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 8px 10px;
  color: var(--ink, #3b2f25);
  text-align: left;
  background: #f7f0da;
  border: 2px solid rgba(120, 95, 50, 0.45);
  border-bottom-width: 3px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
}

.opcion-lista-item:hover {
  background: #fbe9a6;
  border-color: #b8860b;
}

.opcion-lista-item:active { transform: translateY(1px); }

.opcion-lista-item.opcion-seleccionada {
  background: #f6e08a;
  border-color: #8a6410;
}

.opcion-radio {
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 0.9rem;
  color: var(--ink-soft, #6b5a46);
  transition: color 0.2s;
}

.opcion-radio.activo { color: #8a3a10; }

.opcion-texto-lista {
  font: 500 13px/1.4 var(--font-pixel, sans-serif);
}

/* ── Sección 4: Mecanismo Fisiopatológico ─────────────────────────────────── */

.eval-seccion-fisio { border-left: 5px solid rgba(106, 58, 159, 0.5); }
.eval-seccion-fisio.seccion-done { border-left-color: #6a3a9f; }

.seccion-num-fisio {
  color: #fff;
  background: #8e55c9;
  border-color: #4a2370;
}

.seccion-num-fisio.done { background: #6a3a9f; }

.progreso-dot-fisio {
  color: #fff;
  background: #8e55c9;
  border-color: #4a2370;
}

.progreso-dot-fisio.done {
  background: #3fa34d;
  border-color: #1e5a28;
}

.mecanism-hint {
  margin: 0 0 8px 0;
  padding: 6px 10px;
  font: 500 12px/1.4 var(--font-pixel, sans-serif);
  font-style: italic;
  color: #5a2f8a;
  background: rgba(142, 85, 201, 0.12);
  border-left: 3px solid rgba(106, 58, 159, 0.6);
  border-radius: 0 4px 4px 0;
}

.opciones-lista-mecanismo { gap: 8px; }

.opcion-mecanismo {
  align-items: flex-start;
  min-height: 52px;
  line-height: 1.4;
}

.opcion-mecanismo .opcion-texto-lista {
  font-size: 12px;
  white-space: normal;
  text-align: left;
}

.opcion-mecanismo.opcion-seleccionada {
  background: #e4d3f5;
  border-color: #6a3a9f;
}

.opcion-mecanismo.opcion-seleccionada .opcion-radio { color: #6a3a9f; }

/* ── Bandeja de sellos (timbre) ──────────────────────────────────────────── */

.stamp-tray {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px 12px;
  background: linear-gradient(#4b5157, #30353a);
  border: 3px solid #14171a;
  border-radius: 8px;
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.12), 0 6px 0 rgba(0, 0, 0, 0.4), 0 16px 24px rgba(0, 0, 0, 0.4);
}

.timbre-hint {
  text-align: center;
  font: 500 11px var(--font-pixel, sans-serif);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9fb0b8;
}

.btn-timbre {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 8px 14px;
  text-align: left;
  background: #1a1e22;
  border: 3px solid #0b0d0f;
  border-radius: 6px;
  box-shadow: inset 0 5px 12px rgba(0, 0, 0, 0.75);
  cursor: not-allowed;
  font-family: inherit;
  transition: box-shadow 0.3s ease;
}

.stamp-art {
  width: 56px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: grayscale(1) brightness(0.55);
  transition: filter 0.3s ease, transform 0.12s ease;
}

.stamp-knob {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  font: 700 18px/1 var(--font-pixel, sans-serif);
  color: #fff;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
  background: radial-gradient(circle at 35% 30%, #86e895, #2f8a45 62%, #1d5a2c);
  border: 3px solid #0b0d0f;
  border-radius: 50%;
}

.stamp-neck {
  width: 14px;
  height: 8px;
  background: #2f8a45;
  border-left: 3px solid #0b0d0f;
  border-right: 3px solid #0b0d0f;
}

.stamp-base {
  width: 56px;
  padding: 2px 0;
  text-align: center;
  font: 700 9px/12px var(--font-pixel, sans-serif);
  letter-spacing: 0.1em;
  color: #0d2a12;
  background: linear-gradient(#4fb85d, #338640);
  border: 3px solid #0b0d0f;
  border-radius: 3px 3px 6px 6px;
}

.btn-timbre.timbre-ready {
  cursor: pointer;
  animation: timbre-pulse 2s ease-in-out infinite;
}

.timbre-ready .stamp-art {
  filter: none;
  animation: stamp-bob 1.4s ease-in-out infinite;
}

.btn-timbre.timbre-ready:hover .stamp-art { animation: none; transform: translateY(3px); }
.btn-timbre.timbre-ready:active .stamp-art { transform: translateY(7px); }

@keyframes timbre-pulse {
  0%, 100% { box-shadow: inset 0 5px 12px rgba(0, 0, 0, 0.75), 0 0 0 2px rgba(111, 212, 122, 0.55), 0 0 14px rgba(111, 212, 122, 0.25); }
  50% { box-shadow: inset 0 5px 12px rgba(0, 0, 0, 0.75), 0 0 0 2px rgba(111, 212, 122, 0.9), 0 0 24px rgba(111, 212, 122, 0.5); }
}

@keyframes stamp-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.timbre-label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.timbre-titulo {
  font: 700 15px/1 var(--font-pixel, sans-serif);
  letter-spacing: 0.12em;
  color: #e8eef0;
}

.timbre-subtitulo {
  font: 500 11px/1.2 var(--font-pixel, sans-serif);
  letter-spacing: 0.04em;
  color: #6e929c;
}

.timbre-ready .timbre-subtitulo { color: #6fd47a; }
</style>
