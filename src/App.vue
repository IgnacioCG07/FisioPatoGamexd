<template>
  <div id="app-root">

    <!-- ══ PANTALLA DE INICIO ══════════════════════════════════════════ -->
    <Transition name="screen-fade">
      <div v-if="!juegoIniciado" class="screen-intro wood-surface">
        <div class="intro-scanlines" />
        <div class="intro-content">

          <div class="intro-logo">
            <span class="logo-badge">SIMULADOR CLÍNICO · NUTRICIÓN</span>
            <h1 class="intro-title">PRÁCTICA<br /><span class="title-accent">CLÍNICA</span></h1>
            <p class="intro-subtitle">Nutrición Clínica · Rotación Hospitalaria</p>
          </div>

          <div class="intro-lore">
            <p>
              Eres el <strong>nutricionista de turno</strong>. Recibirás pacientes con sus
              antecedentes, laboratorio y receta médica. Tu trabajo es evaluarlos como
              profesional clínico.
            </p>
            <p>
              Revisa los documentos, <strong>diagnostica la patología</strong>,
              indica el <strong>plan nutricional correcto</strong> y detecta cualquier
              <strong>riesgo farmacológico</strong>. Cuando estés seguro, timbra la ficha.
            </p>
            <p class="intro-ra-info">
              Los casos evalúan:<br />
              <strong>RA1</strong> Manifestaciones clínicas ·
              <strong>RA2</strong> Factores de riesgo ·
              <strong>RA3</strong> Interacciones fármaco-nutriente
            </p>
          </div>

          <div class="intro-controles">
            <div class="control-item">
              <span class="control-key">🩺 Evaluación</span>
              <span class="control-desc">Diagnóstico, plan nutricional y riesgo farmacológico</span>
            </div>
            <div class="control-item">
              <span class="control-key">🔴 Timbre</span>
              <span class="control-desc">Timbra la ficha cuando hayas completado la evaluación</span>
            </div>
            <div class="control-item">
              <span class="control-key">⭐ / 🔥 Dificultad</span>
              <span class="control-desc">Fácil (opciones) o Difícil (diagnóstico libre)</span>
            </div>
          </div>

          <!-- Panel Carrera (Rangos, requisitos con ✓ y herramientas) -->
          <PanelCarrera />

          <!-- Selector de Bloque Temático de Estudio (Los 5 documentos de clases) -->
          <div class="selector-estudio-panel">
            <span class="selector-estudio-label">📚 BLOQUE DE ESTUDIO PARA ESTE TURNO:</span>
            <div class="selector-estudio-chips">
              <button
                v-for="b in BLOQUES_ESTUDIO"
                :key="b.id"
                type="button"
                class="chip-bloque"
                :class="{ activo: bloqueEstudioSeleccionado === b.id }"
                @click="bloqueEstudioSeleccionado = b.id"
              >
                {{ b.label }}
              </button>
            </div>
          </div>

          <div class="intro-botones-row">
            <button class="btn-start" @click="startGame">
              INICIAR TURNO
            </button>

            <button
              v-if="tracker.cantidadErroresPendientes > 0"
              class="btn-repasar-intro"
              @click="startGameRepaso"
            >
              🔁 REPASAR ERRORES ({{ tracker.cantidadErroresPendientes }})
            </button>
          </div>

          <div class="intro-progreso-previo" v-if="tracker.progreso.casosCompletadosTotal > 0">
            <span class="progreso-icon">📊</span>
            <span>
              {{ tracker.progreso.casosCompletadosTotal }} casos completados ·
              Dominio reciente: <strong>{{ tracker.dominioRecienteGlobal }}%</strong>
            </span>
          </div>

        </div>
      </div>
    </Transition>

    <!-- ══ JUEGO ACTIVO ═══════════════════════════════════════════════ -->
    <Transition name="screen-fade">
      <div
        v-if="juegoIniciado && !gameManager.turnoFinalizado"
        class="game-layout"
      >
        <!-- ── HUD Superior ─────────────────────────────────────────── -->
        <header class="hud">

          <!-- Panel: PACIENTE -->
          <section class="hud-panel hud-patient" aria-label="Paciente">
            <span class="panel-tab tab-gold"><span class="tab-star">✦</span> PACIENTE</span>

            <Transition name="patient-fade" mode="out-in">
              <div v-if="gameManager.pacienteActual" :key="gameManager.pacienteActual.id" class="patient-body">
                <div class="portrait-frame">
                  <PixelPortrait
                    :seed="gameManager.pacienteActual.carnet.rut"
                    :edad="gameManager.pacienteActual.anamnesis.edadAnos"
                    :sexo="sexoPaciente"
                  />
                </div>

                <dl class="patient-data">
                  <dt>NOMBRE:</dt>
                  <dd class="dd-strong">
                    {{ gameManager.pacienteActual.carnet.nombre }}
                    {{ gameManager.pacienteActual.carnet.apellido }}
                  </dd>
                  <dt>EDAD:</dt>
                  <dd>{{ Math.floor(gameManager.pacienteActual.anamnesis.edadAnos) }} AÑOS</dd>
                  <dt>SEXO:</dt>
                  <dd>{{ sexoPaciente }}</dd>
                  <dt>PESO:</dt>
                  <dd>{{ gameManager.pacienteActual.anamnesis.pesoKg }} KG</dd>
                  <dt>TALLA:</dt>
                  <dd>{{ gameManager.pacienteActual.anamnesis.tallaCm }} CM</dd>
                  <dt>ESTADO:</dt>
                  <dd>
                    <span class="estado-badge">{{ LABELS_ESTADO[gameManager.pacienteActual.anamnesis.estadoNutricional] ?? gameManager.pacienteActual.anamnesis.estadoNutricional }}</span>
                  </dd>
                </dl>

                <div class="paciente-badges-col">
                  <div v-if="gameManager.pacienteActual.esRepaso" class="tag-caso-repaso">
                    🔁 REPASO
                  </div>
                  <div v-if="gameManager.pacienteActual.esControl" class="tag-caso-control">
                    CONTROL · 4 semanas después
                  </div>
                  <div class="paciente-dificultad" :class="`dif-${gameManager.pacienteActual.dificultad}`">
                    {{ gameManager.pacienteActual.dificultad.toUpperCase() }}
                  </div>
                </div>
              </div>
              <div v-else class="patient-body patient-loading">CARGANDO EXPEDIENTE…</div>
            </Transition>
          </section>

          <!-- Panel: MONITOR DE TURNO (tiempo y resultados) -->
          <section class="hud-panel hud-monitor" aria-label="Monitor de turno">
            <span class="panel-tab tab-green">MONITOR DE TURNO</span>

            <div class="monitor-screen">
              <div class="vital vital-time" :class="estadoTiempo.clase">
                <span class="vital-label">⏱ TIEMPO</span>
                <span class="vital-value">{{ gameManager.tiempoFormateado }}</span>
                <div class="vital-bar">
                  <div
                    class="time-bar-fill"
                    :class="{
                      'time-warning': gameManager.progresoTiempo < 30,
                      'time-danger': gameManager.progresoTiempo < 15,
                    }"
                    :style="{ width: `${gameManager.progresoTiempo}%` }"
                  />
                </div>
                <div class="ecg" aria-hidden="true">
                  <svg viewBox="0 0 480 28" preserveAspectRatio="none">
                    <path :d="ECG_PATH" />
                  </svg>
                </div>
              </div>

              <div class="vital vital-score">
                <span class="vital-label">✓ / ✗ RESULTADOS</span>
                <span class="vital-value">
                  <span class="correct-count">{{ gameManager.estadisticasTurno.correctos }}</span>
                  <span class="score-sep">/</span>
                  <span class="error-count">{{ gameManager.estadisticasTurno.incorrectos }}</span>
                </span>
                <div class="case-pips" aria-hidden="true">
                  <span
                    v-for="n in gameManager.casosPorTurno"
                    :key="n"
                    class="pip"
                    :class="{
                      'pip-done': n - 1 < gameManager.indiceCasoActual,
                      'pip-now': n - 1 === gameManager.indiceCasoActual,
                    }"
                  />
                </div>
                <div class="ecg ecg-orange" aria-hidden="true">
                  <svg viewBox="0 0 480 28" preserveAspectRatio="none">
                    <path :d="WAVE_PATH" />
                  </svg>
                </div>
              </div>
            </div>

            <span class="monitor-status" :class="estadoTiempo.clase">
              ESTADO: {{ estadoTiempo.texto }}
              <template v-if="tracker.progreso.rachaActual >= 3">
                · <span class="racha">🔥 RACHA {{ tracker.progreso.rachaActual }}</span>
              </template>
            </span>
          </section>

          <!-- Panel: REGLAS DEL TURNO + RANGO -->
          <section class="hud-panel hud-rules" aria-label="Reglas del turno">
            <span class="panel-tab tab-gold">CARRERA Y REGLAS</span>
            <InsigniaRango />
            <ul class="rules-list">
              <li>Revisa todos los documentos</li>
              <li>Diagnostica o evalúa control</li>
              <li>Elige plan/minuta y riesgo</li>
              <li>Timbra la ficha</li>
            </ul>
          </section>

          <!-- Calendario + reloj de turno -->
          <div class="hud-datetime">
            <div class="hud-calendar" aria-label="Fecha simulada">
              <div class="cal-top">{{ fechaCal.mes }}</div>
              <div class="cal-day">{{ fechaCal.dia }}</div>
              <div class="cal-week">{{ fechaCal.semana }}</div>
            </div>
            <div class="hud-clock" aria-label="Turno y caso">
              <span class="clock-label">TURNO {{ gameManager.turnoActual }} · CASO</span>
              <span class="clock-digits">
                {{ gameManager.indiceCasoActual + 1 }}/{{ gameManager.casosPorTurno }}
              </span>
            </div>
          </div>
        </header>

        <!-- ── Escritorio ───────────────────────────────────────────── -->
        <main class="desk wood-surface" v-if="gameManager.pacienteActual">
          <Transition name="patient-slide" mode="out-in">
            <div class="desk-inner" :key="gameManager.pacienteActual.id">

              <!-- Cuaderno de expediente con pestañas -->
              <section class="notebook-wrap" aria-label="Expediente del paciente">
                <div class="notebook">

                  <nav class="notebook-tabs" role="tablist" aria-label="Documentos del expediente">
                    <button
                      v-for="tab in TABS"
                      :key="tab.id"
                      class="book-tab"
                      :class="[`bt-${tab.id}`, { 'bt-active': tabActiva === tab.id }]"
                      role="tab"
                      :aria-selected="tabActiva === tab.id"
                      :title="tab.label"
                      @click="seleccionarTab(tab.id)"
                    >
                      <span class="book-tab-text">{{ tab.corto }}</span>
                    </button>
                  </nav>

                  <div class="notebook-book">
                    <div class="book-sheet">
                      <div class="book-rings" aria-hidden="true">
                        <span class="ring" />
                        <span class="ring" />
                        <span class="ring" />
                      </div>

                      <header class="book-head">
                        <span class="head-cross" aria-hidden="true" />
                        <span class="head-title">EXPEDIENTE</span>
                        <span class="head-sep">›</span>
                        <span class="head-sub">{{ tabActual.titulo }}</span>
                        <span v-if="gameManager.pacienteActual.esRepaso" class="head-badge-repaso">REPASO</span>
                        <span v-if="gameManager.pacienteActual.esControl" class="head-badge-control">CONTROL · 4 semanas después</span>
                      </header>

                      <div class="book-scroll">
                        <!-- Tab: Anamnesis -->
                        <div v-if="tabActiva === 'anamnesis'" class="doc-section">
                          <div class="doc-field-group">
                            <div class="doc-field-label">MOTIVO DE CONSULTA</div>
                            <div class="doc-field-value">{{ gameManager.pacienteActual.anamnesis.observaciones }}</div>
                          </div>
                          <div class="doc-field-group">
                            <div class="doc-field-label">SÍNTOMAS PRESENTES</div>
                            <ul class="sintomas-lista">
                              <li v-for="(s, i) in gameManager.pacienteActual.anamnesis.sintomas" :key="i">
                                {{ s }}
                              </li>
                            </ul>
                          </div>
                          <div class="doc-field-group">
                            <div class="doc-field-label">ANTECEDENTES</div>
                            <ul class="sintomas-lista lista-suave">
                              <li v-for="(a, i) in gameManager.pacienteActual.anamnesis.antecedentes" :key="i">
                                {{ a }}
                              </li>
                            </ul>
                          </div>
                          <div class="doc-field-group">
                            <div class="doc-field-label">DATOS ANTROPOMÉTRICOS</div>
                            <div class="antro-grid">
                              <div class="antro-item">
                                <span class="antro-label">Peso</span>
                                <span class="antro-value">{{ gameManager.pacienteActual.anamnesis.pesoKg }} kg</span>
                              </div>
                              <div class="antro-item">
                                <span class="antro-label">Talla</span>
                                <span class="antro-value">{{ gameManager.pacienteActual.anamnesis.tallaCm }} cm</span>
                              </div>
                              <div class="antro-item antro-wide">
                                <span class="antro-label">Índice</span>
                                <span class="antro-value mono-sm">{{ gameManager.pacienteActual.anamnesis.valorIndice }}</span>
                              </div>
                              <div class="antro-item antro-wide">
                                <span class="antro-label">Estándar</span>
                                <span class="antro-value mono-sm">{{ gameManager.pacienteActual.anamnesis.estandarUsado }}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Tab: Laboratorio -->
                        <div v-if="tabActiva === 'laboratorio'" class="doc-section">
                          <div class="lab-fecha">Fecha exámenes: {{ gameManager.pacienteActual.laboratorio.fecha }}</div>
                          <div class="lab-tabla">
                            <div
                              v-for="(resultado, clave) in gameManager.pacienteActual.laboratorio.resultados"
                              :key="clave"
                              class="lab-row"
                              :class="`lab-${resultado.estado}`"
                            >
                              <span class="lab-nombre">{{ formatLabNombre(clave) }}</span>
                              <span class="lab-valor">
                                {{ resultado.valor }}
                                <span v-if="resultado.valorAnterior" class="lab-valor-previo">
                                  (Previo: {{ resultado.valorAnterior }})
                                </span>
                              </span>
                              <span class="lab-estado-badge" :class="`estado-${resultado.estado}`">
                                {{ resultado.estado === 'normal' ? 'NORMAL' : resultado.estado === 'alto' ? '↑ ALTO' : '↓ BAJO' }}
                              </span>
                              <span class="lab-ref">Ref: {{ resultado.referencia }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Tab: Receta -->
                        <div v-if="tabActiva === 'receta'" class="doc-section">
                          <div class="receta-medico">
                            <span class="receta-label">Médico</span>
                            <span>{{ gameManager.pacienteActual.receta.medicoNombre }}</span>
                          </div>
                          <div class="doc-field-group">
                            <div class="doc-field-label">MEDICAMENTOS INDICADOS</div>
                            <ul class="receta-lista">
                              <li v-for="(m, i) in gameManager.pacienteActual.receta.medicamentos" :key="i">
                                💊 {{ m }}
                              </li>
                            </ul>
                          </div>
                          <div class="doc-field-group" v-if="gameManager.pacienteActual.receta.indicacionesNutricionales.length">
                            <div class="doc-field-label">INDICACIONES NUTRICIONALES</div>
                            <ul class="receta-lista">
                              <li v-for="(ind, i) in gameManager.pacienteActual.receta.indicacionesNutricionales" :key="i">
                                🥗 {{ ind }}
                              </li>
                            </ul>
                          </div>
                          <div class="receta-footer">
                            N° Receta: {{ gameManager.pacienteActual.receta.numeroReceta }} ·
                            {{ gameManager.pacienteActual.receta.fechaEmision }}
                          </div>
                        </div>

                        <!-- Tab: Carnet -->
                        <div v-if="tabActiva === 'carnet'" class="doc-section">
                          <div class="carnet-display">
                            <div class="carnet-photo">
                              <PixelPortrait
                                :seed="gameManager.pacienteActual.carnet.rut"
                                :edad="gameManager.pacienteActual.anamnesis.edadAnos"
                                :sexo="sexoPaciente"
                              />
                            </div>
                            <div class="carnet-datos">
                              <div class="carnet-nombre">
                                {{ gameManager.pacienteActual.carnet.nombre }}
                                {{ gameManager.pacienteActual.carnet.apellido }}
                              </div>
                              <div class="carnet-row">
                                <span class="carnet-label">RUT</span>
                                <span class="carnet-value mono-sm">{{ gameManager.pacienteActual.carnet.rut }}</span>
                              </div>
                              <div class="carnet-row">
                                <span class="carnet-label">Nacimiento</span>
                                <span class="carnet-value mono-sm">{{ gameManager.pacienteActual.carnet.fechaNacimiento }}</span>
                              </div>
                              <div class="carnet-row">
                                <span class="carnet-label">Vencimiento</span>
                                <span class="carnet-value mono-sm">{{ gameManager.pacienteActual.carnet.fechaVencimiento }}</span>
                              </div>
                              <div class="carnet-row">
                                <span class="carnet-label">N° Documento</span>
                                <span class="carnet-value mono-sm">{{ gameManager.pacienteActual.carnet.numeroDocumento }}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Tab: Entrevista (desde Rango 2) -->
                        <div v-if="tabActiva === 'entrevista'" class="doc-section">
                          <EntrevistaPaciente />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              <!-- Panel de evaluación clínica (ficha + bandeja de timbre) -->
              <section class="evaluacion-column">
                <EvaluacionClinica />
              </section>

              <!-- Accesorios de escritorio -->
              <aside class="desk-side">
                <div class="side-top" aria-hidden="true">
                  <svg class="deco deco-plant" viewBox="0 0 16 18" shape-rendering="crispEdges">
                    <rect v-for="(r, i) in PLANT" :key="i" :x="r[0]" :y="r[1]" :width="r[2]" :height="r[3]" :fill="r[4]" />
                  </svg>
                  <svg class="deco deco-mug" viewBox="0 0 14 13" shape-rendering="crispEdges">
                    <rect v-for="(r, i) in MUG" :key="i" :x="r[0]" :y="r[1]" :width="r[2]" :height="r[3]" :fill="r[4]" />
                  </svg>
                </div>

                <div class="sticky-note">
                  <h3 class="sticky-title">★ NO OLVIDES</h3>
                  <ul class="sticky-list">
                    <li v-for="item in checklist" :key="item.id" :class="{ done: item.done }">
                      <span class="chk">{{ item.done ? '✓' : '' }}</span>
                      <span class="chk-label">{{ item.label }}</span>
                    </li>
                  </ul>
                </div>

                <div class="notes-pad">
                  <h3 class="pad-title">NOTAS DEL TURNO</h3>
                  <ul class="pad-lines">
                    <li>Turno {{ gameManager.turnoActual }} · Caso {{ gameManager.indiceCasoActual + 1 }}/{{ gameManager.casosPorTurno }}</li>
                    <li>Aciertos: {{ gameManager.estadisticasTurno.correctos }}</li>
                    <li>Errores: {{ gameManager.estadisticasTurno.incorrectos }}</li>
                    <li v-if="tracker.progreso.rachaActual >= 3">🔥 Racha de {{ tracker.progreso.rachaActual }}</li>
                    <li v-else>Documentos: {{ tabsVistas.length }}/{{ TABS.length }}</li>
                  </ul>
                </div>

                <div class="desk-plaque">
                  BUEN CRITERIO,<br />DECISIONES CUIDADOSAS.
                </div>

                <svg class="deco deco-pen" viewBox="0 0 30 6" shape-rendering="crispEdges" aria-hidden="true">
                  <rect v-for="(r, i) in PEN" :key="i" :x="r[0]" :y="r[1]" :width="r[2]" :height="r[3]" :fill="r[4]" />
                </svg>
              </aside>

            </div>
          </Transition>
        </main>

        <!-- Cargando paciente -->
        <div v-else class="loading-state">
          <div class="loading-spinner" />
          <span>Cargando expediente…</span>
        </div>

        <!-- ── Barra inferior ───────────────────────────────────────── -->
        <footer class="game-footer">
          <span class="footer-hint">
            <span class="kbd">CLIC</span> PESTAÑAS PARA CAMBIAR DE DOCUMENTO
          </span>
          <button class="help-btn" @click="showTutorial = true" title="Ver guía rápida">
            <span class="help-q">?</span> AYUDA
          </button>
        </footer>

      </div>
    </Transition>

    <!-- ══ RESUMEN DE TURNO ══════════════════════════════════════════ -->
    <Transition name="screen-fade">
      <ResumenTurno v-if="juegoIniciado && gameManager.turnoFinalizado" />
    </Transition>

    <!-- ══ TUTORIAL ─────────────────────────────────────────────────── -->
    <Transition name="screen-fade">
      <div v-if="showTutorial" class="tutorial-overlay" @click.self="dismissTutorial">
        <div class="tutorial-card">
          <div class="tutorial-header">
            <span class="tutorial-icon">🩺</span>
            <h3>Guía rápida — Tu primer turno como nutricionista</h3>
          </div>
          <ol class="tutorial-steps">
            <li>
              <span class="step-num">1</span>
              <div>
                <strong>Revisa el expediente del paciente</strong><br />
                Usa las pestañas: Anamnesis, Laboratorio, Receta y Carnet.
              </div>
            </li>
            <li>
              <span class="step-num">2</span>
              <div>
                <strong>Completa la evaluación clínica</strong><br />
                Diagnóstico, Plan Nutricional y Riesgo Farmacológico. Puedes hacerlo en cualquier orden.
              </div>
            </li>
            <li>
              <span class="step-num">3</span>
              <div>
                <strong>Timbra la ficha cuando estés seguro</strong><br />
                El botón <span class="tutorial-accent">🔴 TIMBRAR FICHA</span> se activa cuando completas las 3 secciones.
              </div>
            </li>
            <li>
              <span class="step-num">4</span>
              <div>
                <strong>Lee el feedback con calma</strong><br />
                Verás qué acertaste y el razonamiento clínico correcto para aprender.
              </div>
            </li>
          </ol>
          <button class="btn-tutorial-ok" @click="dismissTutorial">¡Entendido, empezar!</button>
        </div>
      </div>
    </Transition>

    <!-- ══ FEEDBACK POST-CASO ════════════════════════════════════════ -->
    <FeedbackAcademico />

    <!-- ══ MODAL DE ASCENSO DE RANGO ═════════════════════════════════ -->
    <ModalAscenso />

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useGameManager } from './composables/useGameManager'
import { useProgressTracker } from './composables/useProgressTracker'
import { useCarrera } from './composables/useCarrera'
import EvaluacionClinica from './components/EvaluacionClinica.vue'
import FeedbackAcademico from './components/FeedbackAcademico.vue'
import ResumenTurno from './components/ResumenTurno.vue'
import PixelPortrait from './components/PixelPortrait.vue'
import PanelCarrera from './components/PanelCarrera.vue'
import InsigniaRango from './components/InsigniaRango.vue'
import ModalAscenso from './components/ModalAscenso.vue'
import EntrevistaPaciente from './components/EntrevistaPaciente.vue'
import type { EstadoNutricional } from './types/models'

const gameManager = useGameManager()
const tracker = useProgressTracker()
const carrera = useCarrera()

// ─── Estado local ─────────────────────────────────────────────────────────────

const juegoIniciado = ref(false)
type TabId = 'anamnesis' | 'laboratorio' | 'receta' | 'carnet' | 'entrevista'
const tabActiva = ref<TabId>('anamnesis')

const TABS = computed(() => [
  { id: 'anamnesis' as const, icon: '📋', label: 'Anamnesis', corto: 'ANAMNESIS', titulo: 'HISTORIA CLÍNICA' },
  { id: 'laboratorio' as const, icon: '🔬', label: 'Laboratorio', corto: 'LAB', titulo: 'RESULTADOS DE LABORATORIO' },
  { id: 'receta' as const, icon: '💊', label: 'Receta', corto: 'RECETA', titulo: '℞ RECETA MÉDICA' },
  { id: 'carnet' as const, icon: '🪪', label: 'Carnet', corto: 'CARNET', titulo: 'DOCUMENTO DE IDENTIDAD' },
  {
    id: 'entrevista' as const,
    icon: carrera.entrevistaDesbloqueada ? '💬' : '🔒',
    label: carrera.entrevistaDesbloqueada ? 'Entrevista al paciente' : 'Entrevista (Se desbloquea en Rango 2: Nutricionista en práctica)',
    corto: carrera.entrevistaDesbloqueada ? 'ENTREVISTA' : '🔒 ENTREV.',
    titulo: 'ENTREVISTA AL PACIENTE',
  },
])

const tabActual = computed(() => TABS.value.find(t => t.id === tabActiva.value) ?? TABS.value[0])

/** Pestañas ya abiertas por el estudiante en el caso actual (solo guía visual). */
const tabsVistas = ref<TabId[]>(['anamnesis'])

function seleccionarTab(id: TabId): void {
  tabActiva.value = id
  if (!tabsVistas.value.includes(id)) tabsVistas.value.push(id)
}

const LABELS_ESTADO: Partial<Record<EstadoNutricional, string>> = {
  desnutricion_aguda: 'Desnutrición Aguda',
  desnutricion_cronica: 'Desnutrición Crónica',
  bajo_peso: 'Bajo Peso',
  eutrofia: 'Eutrófico',
  riesgo_sobrepeso: 'Riesgo Sobrepeso',
  sobrepeso: 'Sobrepeso',
  obesidad: 'Obesidad',
  obesidad_sarcopenica: 'Obesidad Sarcopénica',
}

// ─── Tutorial ─────────────────────────────────────────────────────────────────

const TUTORIAL_KEY = 'practica-clinica-v2-tutorial-shown'
const showTutorial = ref(false)

function dismissTutorial(): void {
  showTutorial.value = false
  localStorage.setItem(TUTORIAL_KEY, '1')
}

// ─── Derivados visuales (solo presentación) ──────────────────────────────────

/** El sexo viaja dentro del texto de observaciones generado por patientFactory. */
const sexoPaciente = computed<'M' | 'F'>(() =>
  /femenin/i.test(gameManager.pacienteActual?.anamnesis.observaciones ?? '') ? 'F' : 'M',
)

/** Fecha simulada del turno, mostrada en el calendario del HUD. */
const fechaCal = computed(() => {
  const d = gameManager.fechaSimulada
  const limpiar = (s: string) => s.replace('.', '').toUpperCase()
  return {
    mes: limpiar(d.toLocaleDateString('es-CL', { month: 'short' })),
    dia: d.getDate(),
    semana: limpiar(d.toLocaleDateString('es-CL', { weekday: 'short' })),
  }
})

/** Estado del monitor según el tiempo restante. */
const estadoTiempo = computed(() => {
  const p = gameManager.progresoTiempo
  if (p < 15) return { texto: 'TIEMPO CRÍTICO', clase: 'time-danger' }
  if (p < 30) return { texto: 'TIEMPO LIMITADO', clase: 'time-warning' }
  return { texto: 'EN CURSO', clase: '' }
})

/** Lista "No olvides": refleja el avance real de la evaluación. */
const checklist = computed(() => {
  const ev = gameManager.evaluacionActual
  const pac = gameManager.pacienteActual
  if (pac?.esControl) {
    return [
      { id: 'docs', label: 'Revisar documentos', done: tabsVistas.value.length >= 4 },
      { id: 'evol', label: 'Evolución', done: Boolean(ev.evolucionSeleccionada) },
      { id: 'cond', label: 'Conducta', done: Boolean(ev.conductaSeleccionada) },
      { id: 'riesgo', label: 'Riesgo farmacológico', done: ev.riesgoSeleccionado !== null },
    ]
  }
  const items = [
    { id: 'docs', label: 'Revisar documentos', done: tabsVistas.value.length >= 4 },
    { id: 'dx', label: 'Diagnóstico', done: ev.diagnosticoSeleccionado !== null },
    { id: 'plan', label: gameManager.usaMinutaEnCasoActual ? 'Minuta diaria' : 'Plan nutricional', done: ev.planSeleccionado !== null },
    { id: 'riesgo', label: 'Riesgo farmacológico', done: ev.riesgoSeleccionado !== null },
  ]
  if (pac?.opcionesMecanismo) {
    items.push({ id: 'mec', label: 'Mecanismo', done: ev.mecanismoSeleccionado !== null })
  }
  return items
})

/** Trazado de electrocardiograma repetido (para animar el desplazamiento). */
const ECG_PATH = (() => {
  let d = 'M0 17'
  for (let i = 0; i < 8; i++) {
    const o = i * 60
    d += ` L${o + 14} 17 L${o + 18} 17 L${o + 22} 3 L${o + 27} 26 L${o + 31} 11 L${o + 34} 17 L${o + 60} 17`
  }
  return d
})()

/** Onda suave para el segundo indicador. */
const WAVE_PATH = (() => {
  let d = 'M0 14'
  for (let i = 0; i < 12; i++) {
    const o = i * 40
    d += ` Q${o + 10} 2 ${o + 20} 14 T${o + 40} 14`
  }
  return d
})()

// ─── Pixel art decorativo [x, y, w, h, color] ────────────────────────────────

type PxRect = [number, number, number, number, string]

const MUG: PxRect[] = [
  [1, 2, 10, 11, '#1a1210'],
  [2, 3, 8, 9, '#ece8de'],
  [8, 3, 2, 9, '#cfc9bb'],
  [2, 3, 8, 2, '#3b2314'],
  [3, 3, 3, 1, '#6a4428'],
  [11, 4, 3, 1, '#1a1210'],
  [13, 4, 1, 6, '#1a1210'],
  [11, 9, 3, 1, '#1a1210'],
  [5, 7, 2, 4, '#3b78c4'],
  [4, 8, 4, 2, '#3b78c4'],
]

const PLANT: PxRect[] = [
  [7, 2, 2, 9, '#2f6b33'],
  [3, 4, 4, 3, '#4f9d4a'],
  [2, 5, 2, 2, '#4f9d4a'],
  [3, 4, 2, 1, '#7cc56a'],
  [9, 2, 5, 3, '#4f9d4a'],
  [12, 3, 3, 2, '#4f9d4a'],
  [9, 2, 3, 1, '#7cc56a'],
  [4, 8, 3, 3, '#3d8540'],
  [3, 9, 1, 1, '#3d8540'],
  [9, 7, 4, 3, '#3d8540'],
  [12, 8, 2, 1, '#3d8540'],
  [4, 10, 8, 1, '#3a2616'],
  [3, 11, 10, 2, '#1a1210'],
  [4, 11, 8, 1, '#cf7040'],
  [4, 12, 8, 1, '#a34e2c'],
  [4, 13, 8, 5, '#1a1210'],
  [5, 13, 6, 4, '#b5562f'],
  [9, 13, 2, 4, '#8f3f22'],
]

const PEN: PxRect[] = [
  [3, 1, 22, 4, '#1a1210'],
  [4, 2, 20, 2, '#1f3a7a'],
  [4, 2, 20, 1, '#3a5bb0'],
  [1, 2, 2, 2, '#1a1210'],
  [2, 2, 1, 2, '#9aa0a6'],
  [25, 1, 3, 4, '#1a1210'],
  [25, 2, 2, 2, '#d9b34a'],
  [14, 0, 10, 1, '#d9b34a'],
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLabNombre(clave: string): string {
  return clave
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// ─── Watchers ─────────────────────────────────────────────────────────────────

/** Resetear tab activa al cambiar de paciente */
watch(
  () => gameManager.pacienteActual?.id,
  () => {
    tabActiva.value = 'anamnesis'
    tabsVistas.value = ['anamnesis']
  },
)

// ─── Acciones ─────────────────────────────────────────────────────────────────

const bloqueEstudioSeleccionado = ref<string>('todos')

const BLOQUES_ESTUDIO = [
  { id: 'todos', label: '🌐 Todos los bloques (26 casos)', filtros: [] as string[] },
  { id: 'Cardiovascular', label: '❤️ Cardiovascular y Sangre', filtros: ['Cardiovascular'] },
  { id: 'Renal', label: '🫘 Renal (LRA, ERC y Electrolitos)', filtros: ['Renal'] },
  { id: 'Respiratorio', label: '🫁 Respiratorio (EPOC, Asma, Fibrosis)', filtros: ['Respiratorio'] },
  { id: 'Digestivo', label: '🫙 Digestivo, Hígado y Páncreas', filtros: ['Digestivo'] },
  { id: 'Endocrino_Metabolico', label: '⚗️ Endocrino-Metabólico', filtros: ['Endocrino_Metabolico'] },
  { id: 'Musculoesqueletico', label: '🦴 Geriatría y Sarcopenia', filtros: ['Musculoesqueletico'] },
]

function startGame(): void {
  juegoIniciado.value = true
  const bloque = BLOQUES_ESTUDIO.find(b => b.id === bloqueEstudioSeleccionado.value)
  gameManager.reiniciarJuego(false, bloque ? bloque.filtros : [])
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    showTutorial.value = true
  }
}

function startGameRepaso(): void {
  juegoIniciado.value = true
  gameManager.reiniciarJuego(true, [])
}
</script>

<style>
/* ── Reset y fuentes ──────────────────────────────────────────────────────── */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-deep: #0a0d14;
  --bg-dark: #0f1420;
  --bg-card: #141822;
  --bg-surface: #1a1f2e;
  --border-subtle: rgba(148, 163, 184, 0.08);
  --border-mid: rgba(148, 163, 184, 0.15);
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
  --accent-teal: #00d4aa;
  --accent-blue: #2563eb;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;

  /* ── Tema "escritorio clínico" ──
     Antes: Pixelify Sans / VT323 (números poco legibles: 1/7, 3/8, 0/O).
     Ahora: fuentes con cifras claras. */
  --font-pixel: 'Inter', system-ui, sans-serif;
  --font-digits: 'JetBrains Mono', 'Consolas', monospace;
  --hud-bg: #0b0e10;
  --hud-line: #2a343a;
  --px-green: #6fd47a;
  --px-gold: #e8c15a;
  --px-cyan: #6fd6ee;
  --px-red: #ff5a4f;
  --px-orange: #f29a3a;
  --paper: #ece1c5;
  --paper-2: #e0d2ab;
  --paper-line: rgba(120, 95, 50, 0.14);
  --ink: #3b2f25;
  --ink-soft: #6b5a46;
  --ink-blue: #2f5d8c;
}

html, body {
  height: 100%;
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-variant-numeric: tabular-nums slashed-zero;
  overflow: hidden;
}

#app-root {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(90, 70, 40, 0.45); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(90, 70, 40, 0.7); }

/* ── Superficie de madera (escritorio) ───────────────────────────────────── */

.wood-surface {
  background-color: #64391f;
  background-image:
    radial-gradient(ellipse at 50% 35%, rgba(255, 205, 150, 0.14), transparent 62%),
    radial-gradient(ellipse at 50% 115%, rgba(0, 0, 0, 0.5), transparent 58%),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='98'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.008 0.45' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0.16  0 0 0 0 0.07  0 0 0 0 0.03  0 0 0 1.2 -0.4'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"),
    repeating-linear-gradient(180deg, transparent 0 94px, rgba(0, 0, 0, 0.5) 94px 97px, rgba(255, 255, 255, 0.06) 97px 98px),
    repeating-linear-gradient(180deg, #6b3e22 0 98px, #603620 98px 196px, #744629 196px 294px);
  background-size: auto, auto, 360px 98px, auto, auto;
}

/* ── Transiciones ──────────────────────────────────────────────────────────── */

.screen-fade-enter-active, .screen-fade-leave-active { transition: opacity 0.5s ease; }
.screen-fade-enter-from, .screen-fade-leave-to { opacity: 0; }

.patient-slide-enter-active, .patient-slide-leave-active { transition: all 0.3s ease; }
.patient-slide-enter-from { opacity: 0; transform: translateX(20px); }
.patient-slide-leave-to { opacity: 0; transform: translateX(-20px); }

.patient-fade-enter-active, .patient-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.patient-fade-enter-from { opacity: 0; transform: translateY(6px); }
.patient-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* ══ PANTALLA DE INICIO ══════════════════════════════════════════════════════ */

.screen-intro {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.screen-intro::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.78) 85%);
  pointer-events: none;
}

.intro-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom, transparent 0, transparent 3px,
    rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px
  );
  pointer-events: none;
}

.intro-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  max-width: 720px;
  max-height: 96vh;
  overflow-y: auto;
  padding: 32px 40px;
  text-align: center;
  background: linear-gradient(#171d20, #101417);
  border: 3px solid var(--hud-line);
  border-radius: 8px;
  box-shadow:
    inset 0 0 0 3px #0a0d0f,
    inset 0 0 40px rgba(0, 0, 0, 0.6),
    0 10px 0 rgba(0, 0, 0, 0.45),
    0 30px 60px rgba(0, 0, 0, 0.6);
}

.logo-badge {
  display: inline-block;
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  color: var(--px-gold);
  border: 2px solid var(--hud-line);
  background: var(--hud-bg);
  padding: 3px 12px;
  border-radius: 3px;
  margin-bottom: 14px;
  font-family: var(--font-pixel);
}

.intro-title {
  font-family: var(--font-pixel);
  font-size: 4.2rem;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.02em;
  color: #f3ead2;
  text-shadow: 4px 4px 0 #000;
}

.title-accent {
  color: var(--px-green);
  text-shadow: 4px 4px 0 #0a2a12, 0 0 30px rgba(111, 212, 122, 0.45);
}

.intro-subtitle {
  font-size: 0.85rem;
  letter-spacing: 0.16em;
  color: #8fa3ab;
  margin-top: 10px;
  font-family: var(--font-pixel);
  text-transform: uppercase;
}

.intro-lore {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #c3ccd0;
  font-family: var(--font-pixel);
  font-size: 0.95rem;
  line-height: 1.6;
  text-align: left;
  background: var(--paper);
  color: var(--ink);
  border: 2px solid #b9a77f;
  border-radius: 4px;
  padding: 18px 24px;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.4);
  background-image: repeating-linear-gradient(180deg, transparent 0 25px, var(--paper-line) 25px 26px);
}

.intro-lore strong { color: #1d3b66; }

.intro-ra-info {
  border-top: 2px dashed rgba(60, 45, 20, 0.3);
  padding-top: 10px;
  color: var(--ink-blue);
  font-size: 0.85rem;
  line-height: 1.6;
}

.intro-controles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.control-item {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 0.85rem;
  font-family: var(--font-pixel);
}

.control-key {
  background: var(--hud-bg);
  color: #e8eef0;
  padding: 3px 10px;
  border-radius: 3px;
  font-family: var(--font-pixel);
  font-size: 0.78rem;
  white-space: nowrap;
  border: 2px solid var(--hud-line);
}

.control-desc { color: #8fa3ab; text-align: left; }

.btn-start {
  background: #3fa34d;
  color: #fff;
  border: 3px solid #0a0d0f;
  border-bottom-width: 6px;
  padding: 12px 44px;
  border-radius: 6px;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  cursor: pointer;
  font-family: var(--font-pixel);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.45);
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.28), inset 0 -4px 0 rgba(0, 0, 0, 0.22);
  transition: transform 0.12s ease, filter 0.12s ease;
}

.btn-start:hover { transform: translateY(-2px); filter: brightness(1.12); }
.btn-start:active { transform: translateY(3px); border-bottom-width: 3px; }

.intro-progreso-previo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-family: var(--font-pixel);
  color: #8fa3ab;
  background: var(--hud-bg);
  border: 2px solid var(--hud-line);
  border-radius: 4px;
  padding: 8px 16px;
}

.progreso-icon { font-size: 1rem; }
.intro-progreso-previo strong { color: var(--px-gold); }

/* ══ LAYOUT DE JUEGO ════════════════════════════════════════════════════════ */

.game-layout {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--hud-bg);
}

/* ── HUD ─────────────────────────────────────────────────────────────────── */

.hud {
  display: grid;
  grid-template-columns: minmax(360px, 1.55fr) minmax(250px, 1fr) minmax(200px, 0.9fr) 132px;
  gap: 12px;
  padding: 18px 12px 14px;
  height: clamp(150px, 21vh, 196px);
  flex-shrink: 0;
  background: linear-gradient(#10151a, #0a0d10);
  border-bottom: 4px solid #050607;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 3;
}

.hud-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 16px 12px 8px;
  background: linear-gradient(#171d20, #101417);
  border: 2px solid var(--hud-line);
  border-radius: 6px;
  box-shadow: inset 0 0 0 2px #0a0d0f, inset 0 0 18px rgba(0, 0, 0, 0.6);
}

.panel-tab {
  position: absolute;
  top: 0;
  left: 12px;
  transform: translateY(-55%);
  z-index: 2;
  padding: 1px 9px;
  background: var(--hud-bg);
  border: 2px solid var(--hud-line);
  border-radius: 4px;
  font: 600 11px/1.5 var(--font-pixel);
  letter-spacing: 0.14em;
  white-space: nowrap;
}

.tab-gold { color: var(--px-gold); }
.tab-green { color: var(--px-green); left: 50%; transform: translate(-50%, -55%); }
.tab-star { color: var(--px-gold); margin-right: 2px; }

/* — Paciente — */

.patient-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 14px;
  align-items: center;
}

.patient-loading {
  justify-content: center;
  color: #6e929c;
  font: 500 13px var(--font-pixel);
  letter-spacing: 0.12em;
}

.portrait-frame {
  --portrait: clamp(84px, 12vh, 124px);
  width: var(--portrait);
  height: var(--portrait);
  flex-shrink: 0;
  background: #1b2327;
  border: 3px solid #0a0d0f;
  outline: 2px solid #3a464d;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.55);
}

.patient-data {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 10px;
  row-gap: 1px;
  align-content: center;
  min-width: 0;
  font: 500 clamp(12px, 1.75vh, 14px) / 1.2 var(--font-pixel);
  letter-spacing: 0.04em;
}

.patient-data dt { color: #8fb3bd; }

.patient-data dd {
  color: #e8eef0;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
}

.patient-data .dd-strong { color: #fff; font-weight: 700; }

.estado-badge {
  color: var(--px-green);
  font-weight: 600;
}

.paciente-dificultad {
  position: absolute;
  top: -4px;
  right: 0;
  font: 700 10px/1 var(--font-pixel);
  letter-spacing: 0.12em;
  padding: 4px 8px;
  border-radius: 3px;
  border: 2px solid;
}

.dif-baja { color: #4ade80; border-color: rgba(74, 222, 128, 0.45); background: rgba(22, 163, 74, 0.14); }
.dif-media { color: #fbbf24; border-color: rgba(251, 191, 36, 0.45); background: rgba(180, 83, 9, 0.14); }
.dif-alta { color: #f87171; border-color: rgba(248, 113, 113, 0.45); background: rgba(185, 28, 28, 0.14); }

/* — Monitor de turno — */

.hud-monitor { padding: 16px 10px 14px; }

.monitor-screen {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 6px;
  background: #050a08;
  border: 2px solid #1d3a2c;
  border-radius: 4px;
  box-shadow: inset 0 0 16px rgba(60, 255, 150, 0.1);
  overflow: hidden;
}

.monitor-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(0, 0, 0, 0.2) 2px, rgba(0, 0, 0, 0.2) 3px);
}

.vital {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 4px 8px 0;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 3px;
  overflow: hidden;
}

.vital-label {
  font: 600 11px/1.3 var(--font-pixel);
  letter-spacing: 0.1em;
  color: #8fb3bd;
  white-space: nowrap;
}

.vital-value {
  font: 400 clamp(34px, 6.2vh, 54px) / 0.95 var(--font-digits);
  letter-spacing: 0.04em;
  color: var(--px-green);
  text-shadow: 0 0 10px currentColor;
}

.vital-time.time-warning .vital-value { color: #f4b942; }
.vital-time.time-danger .vital-value { color: var(--px-red); animation: danger-blink 0.6s ease-in-out infinite; }

.vital-score .vital-value { color: #cfd8dc; text-shadow: none; }
.correct-count { color: #6fd47a; text-shadow: 0 0 10px rgba(111, 212, 122, 0.55); }
.error-count { color: #ff6b61; text-shadow: 0 0 10px rgba(255, 107, 97, 0.55); }
.score-sep { color: #5b6b72; margin: 0 4px; }

.vital-bar {
  height: 4px;
  margin-top: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.time-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2f8a45, #6fd47a);
  transition: width 0.9s linear, background 0.4s ease;
}

.time-bar-fill.time-warning { background: linear-gradient(90deg, #b45309, #fbbf24); }
.time-bar-fill.time-danger {
  background: linear-gradient(90deg, #991b1b, #ef4444);
  animation: danger-blink 0.6s ease-in-out infinite;
}

@keyframes danger-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.case-pips {
  display: flex;
  gap: 3px;
  margin-top: 5px;
}

.pip {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
}

.pip-done { background: #6fd47a; }
.pip-now { background: var(--px-orange); animation: danger-blink 1s ease-in-out infinite; }

.ecg {
  position: relative;
  margin-top: auto;
  height: 24px;
  overflow: hidden;
  color: var(--px-green);
}

.ecg svg {
  display: block;
  width: 480px;
  height: 24px;
  animation: ecg-scroll 2.4s linear infinite;
}

.ecg path {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 3px currentColor);
}

.ecg-orange { color: var(--px-orange); }
.ecg-orange svg { animation-duration: 3.6s; }

.vital-time.time-warning .ecg { color: #f4b942; }
.vital-time.time-danger .ecg { color: var(--px-red); }
.vital-time.time-danger .ecg svg { animation-duration: 1.1s; }

@keyframes ecg-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-60px); }
}

.monitor-status {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 55%);
  padding: 0 12px;
  background: var(--hud-bg);
  border: 2px solid var(--hud-line);
  border-radius: 4px;
  font: 600 11px/1.5 var(--font-pixel);
  letter-spacing: 0.12em;
  color: var(--px-green);
  white-space: nowrap;
}

.monitor-status.time-warning { color: #f4b942; }
.monitor-status.time-danger { color: var(--px-red); }
.monitor-status .racha { color: var(--px-orange); }

/* — Reglas — */

.hud-rules { justify-content: center; }

.rules-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font: 500 clamp(11px, 1.6vh, 13px) / 1.2 var(--font-pixel);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #d6dde0;
}

.rules-list li::before {
  content: '•';
  color: var(--px-gold);
  margin-right: 7px;
}

.rules-foot {
  margin-top: 8px;
  font: 500 11px/1.3 var(--font-pixel);
  letter-spacing: 0.06em;
  color: var(--px-green);
}

/* — Calendario y reloj de turno — */

.hud-datetime {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.hud-calendar {
  flex: 1.5;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f3ead2;
  border: 2px solid #0a0d0f;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.55);
}

.cal-top {
  background: #c93a3a;
  color: #fff;
  text-align: center;
  font: 700 12px/1.5 var(--font-pixel);
  letter-spacing: 0.22em;
  border-bottom: 2px solid #7a1f1f;
}

.cal-day {
  flex: 1;
  display: grid;
  place-items: center;
  font: 700 clamp(26px, 5vh, 40px) / 1 var(--font-pixel);
  color: #2b2118;
}

.cal-week {
  text-align: center;
  background: #5b4a38;
  color: #f3ead2;
  font: 600 11px/1.5 var(--font-pixel);
  letter-spacing: 0.18em;
}

.hud-clock {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #06090b;
  border: 2px solid #1f3a44;
  border-radius: 4px;
  box-shadow: inset 0 0 14px rgba(111, 214, 238, 0.16);
}

.clock-label {
  font: 600 9px/1.3 var(--font-pixel);
  letter-spacing: 0.1em;
  color: #6e929c;
}

.clock-digits {
  font: 400 clamp(26px, 4.6vh, 38px) / 1 var(--font-digits);
  letter-spacing: 0.06em;
  color: var(--px-cyan);
  text-shadow: 0 0 10px rgba(111, 214, 238, 0.6);
}

/* ── Escritorio ──────────────────────────────────────────────────────────── */

.desk {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 16px 18px 14px;
  overflow: hidden;
}

.desk-inner {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(340px, 30vw, 430px) 210px;
  gap: 20px;
}

/* ── Cuaderno ────────────────────────────────────────────────────────────── */

.notebook-wrap {
  position: relative;
  min-height: 0;
  min-width: 0;
  padding-right: 30px;
}

.notebook {
  position: relative;
  height: 100%;
}

.notebook-book {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 10px;
  background: linear-gradient(#34363b, #26282c);
  border: 2px solid #0e0f11;
  border-radius: 10px;
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.35), 0 20px 30px rgba(0, 0, 0, 0.45);
}

.book-sheet {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  overflow: hidden;
  color: var(--ink);
  background:
    linear-gradient(90deg,
      transparent calc(50% - 22px),
      rgba(70, 50, 20, 0.14) calc(50% - 2px),
      rgba(70, 50, 20, 0.32) 50%,
      rgba(255, 255, 255, 0.35) calc(50% + 1px),
      transparent calc(50% + 22px)),
    repeating-linear-gradient(180deg, transparent 0 25px, var(--paper-line) 25px 26px),
    var(--paper);
  box-shadow: inset 0 0 30px rgba(120, 90, 40, 0.25);
}

.book-rings {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  pointer-events: none;
}

.ring {
  width: 36px;
  height: 13px;
  margin-left: 0;
  border-radius: 8px;
  background: linear-gradient(#e2e6e8, #7d858b);
  border: 2px solid #1c1e21;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.3);
}

.book-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px 8px;
  font: 700 14px/1 var(--font-pixel);
  letter-spacing: 0.08em;
  color: var(--ink-blue);
  border-bottom: 2px dashed rgba(60, 45, 20, 0.28);
  flex-shrink: 0;
}

.head-cross {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.head-cross::before, .head-cross::after {
  content: '';
  position: absolute;
  background: var(--ink-blue);
}
.head-cross::before { left: 6px; top: 0; width: 4px; height: 16px; }
.head-cross::after { left: 0; top: 6px; width: 16px; height: 4px; }

.head-sep { color: var(--ink-soft); }
.head-sub { color: var(--ink); font-size: 12px; letter-spacing: 0.1em; }

.book-scroll {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 22px 16px;
}

/* — Pestañas laterales (separadores del cuaderno) — */

.notebook-tabs {
  position: absolute;
  z-index: 1;
  top: 54px;
  right: -30px;
  width: 64px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.book-tab {
  height: 84px;
  padding: 0 0 0 38px;
  border: 2px solid rgba(0, 0, 0, 0.6);
  border-left: 0;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  color: #fff;
  font: 700 11px/1 var(--font-pixel);
  letter-spacing: 0.12em;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.5);
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.25), 2px 3px 0 rgba(0, 0, 0, 0.4);
  transition: transform 0.18s ease, filter 0.18s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-tab-text {
  writing-mode: vertical-rl;
  white-space: nowrap;
}

.book-tab:hover { filter: brightness(1.15); transform: translateX(3px); }
.book-tab.bt-active { transform: translateX(8px); filter: brightness(1.1); }
.book-tab:focus-visible { outline: 2px solid var(--px-gold); outline-offset: 1px; }

.bt-anamnesis { background: linear-gradient(#3e7bd0, #2c5ea5); }
.bt-laboratorio { background: linear-gradient(#35a85a, #247d41); }
.bt-receta { background: linear-gradient(#8e55c9, #6a3a9f); }
.bt-carnet { background: linear-gradient(#e0801f, #b3600f); }

/* ── Contenido de documentos (dos páginas) ───────────────────────────────── */

.doc-section {
  column-count: 2;
  column-gap: 52px;
  font-family: var(--font-pixel);
  color: var(--ink);
}

.doc-field-group {
  break-inside: avoid;
  margin-bottom: 16px;
}

.doc-field-label {
  display: inline-block;
  margin-bottom: 6px;
  padding-bottom: 1px;
  font: 700 11px/1.3 var(--font-pixel);
  letter-spacing: 0.14em;
  color: var(--ink-blue);
  border-bottom: 2px solid rgba(47, 93, 140, 0.35);
}

.doc-field-value {
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink);
}

.sintomas-lista, .receta-lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0;
}

.sintomas-lista li {
  position: relative;
  padding-left: 16px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--ink);
}

.sintomas-lista li::before {
  content: '▪';
  position: absolute;
  left: 2px;
  color: #b8322c;
}

.sintomas-lista.lista-suave li { color: var(--ink-soft); font-size: 13px; }
.sintomas-lista.lista-suave li::before { color: var(--ink-blue); }

.receta-lista li {
  font-size: 14px;
  line-height: 1.4;
  padding: 3px 0 4px;
  color: var(--ink);
  border-bottom: 1px dashed rgba(60, 45, 20, 0.25);
}

.antro-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.antro-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 5px 8px;
  background: rgba(255, 255, 255, 0.38);
  border: 2px solid rgba(120, 95, 50, 0.35);
  border-radius: 3px;
}

.antro-wide { grid-column: 1 / -1; }

.antro-label {
  font: 600 10px/1.3 var(--font-pixel);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.antro-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.mono-sm {
  font-family: var(--font-pixel);
  font-size: 13px;
  font-weight: 500;
}

/* — Laboratorio — */

.lab-fecha {
  break-inside: avoid;
  margin-bottom: 8px;
  font: 600 12px var(--font-pixel);
  letter-spacing: 0.06em;
  color: var(--ink-soft);
}

.lab-tabla { display: block; }

.lab-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: 'n v' 'r b';
  gap: 1px 10px;
  align-items: center;
  padding: 6px 2px 7px;
  border-bottom: 1px dashed rgba(60, 45, 20, 0.3);
  break-inside: avoid;
}

.lab-nombre {
  grid-area: n;
  font: 700 14px/1.2 var(--font-pixel);
  letter-spacing: 0.04em;
  color: var(--ink);
}

.lab-valor {
  grid-area: v;
  justify-self: end;
  padding: 1px 9px;
  border-radius: 3px;
  font: 700 15px/1.3 var(--font-pixel);
  color: var(--ink);
}

.lab-row.lab-alto .lab-valor { background: #f2b3ae; color: #7a1816; }
.lab-row.lab-bajo .lab-valor { background: #b7cdf0; color: #1b3d78; }

.lab-ref {
  grid-area: r;
  font: 500 11px var(--font-pixel);
  color: var(--ink-soft);
}

.lab-estado-badge {
  grid-area: b;
  justify-self: end;
  font: 700 10px/1.4 var(--font-pixel);
  letter-spacing: 0.1em;
  padding: 0 5px;
  border-radius: 2px;
}

.estado-normal { color: #2d7a3b; }
.estado-alto { color: #b8322c; }
.estado-bajo { color: #2a5cb0; }

/* — Receta — */

.receta-medico {
  break-inside: avoid;
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 14px;
  padding-bottom: 8px;
  font-size: 14px;
  color: var(--ink);
  border-bottom: 2px solid rgba(60, 45, 20, 0.25);
}

.receta-label {
  font: 700 11px var(--font-pixel);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-blue);
}

.receta-footer {
  break-inside: avoid;
  padding-top: 8px;
  font: 500 12px var(--font-pixel);
  color: var(--ink-soft);
  border-top: 2px dashed rgba(60, 45, 20, 0.28);
}

/* — Carnet — */

.carnet-display {
  break-inside: avoid;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 14px;
  background: linear-gradient(135deg, #f7f1de, #e7dcb8);
  border: 3px solid #1d3b66;
  border-radius: 8px;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.28);
}

.carnet-photo {
  width: 92px;
  height: 92px;
  flex-shrink: 0;
  border: 3px solid #0a0d0f;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}

.carnet-datos {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.carnet-nombre {
  font: 700 16px/1.2 var(--font-pixel);
  color: #1d3b66;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.carnet-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.carnet-label {
  width: 92px;
  flex-shrink: 0;
  font: 700 10px var(--font-pixel);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.carnet-value { font-size: 13px; color: var(--ink); }

/* ── Columna evaluación ──────────────────────────────────────────────────── */

.evaluacion-column {
  min-height: 0;
  min-width: 0;
}

/* ── Accesorios de escritorio ────────────────────────────────────────────── */

.desk-side {
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
  overflow: hidden;
  padding-top: 2px;
}

.side-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 4px;
  flex-shrink: 0;
}

.deco { image-rendering: pixelated; filter: drop-shadow(0 5px 0 rgba(0, 0, 0, 0.35)); }
.deco-plant { width: 74px; height: auto; }
.deco-mug { width: 78px; height: auto; }

.sticky-note {
  flex-shrink: 0;
  padding: 10px 12px 12px;
  background: linear-gradient(#f3d567, #e8c24c);
  color: #4a3a10;
  transform: rotate(-1.4deg);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 12px 18px rgba(0, 0, 0, 0.3);
}

.sticky-title {
  font: 700 13px/1 var(--font-pixel);
  letter-spacing: 0.1em;
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 2px dashed rgba(74, 58, 16, 0.4);
}

.sticky-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sticky-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font: 500 13px/1.1 var(--font-pixel);
  transition: opacity 0.2s ease;
}

.sticky-list li.done { opacity: 0.6; }
.sticky-list li.done .chk-label { text-decoration: line-through; text-decoration-thickness: 2px; }

.chk {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 2px solid #5a4310;
  background: rgba(255, 255, 255, 0.35);
  font: 700 12px/1 var(--font-pixel);
  color: #1f6b2c;
}

.notes-pad {
  flex-shrink: 0;
  position: relative;
  padding: 18px 12px 10px;
  background: linear-gradient(#f4ecd4, #e9dfbf);
  color: var(--ink);
  transform: rotate(1deg);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 12px 18px rgba(0, 0, 0, 0.3);
  background-image: repeating-linear-gradient(180deg, transparent 0 21px, rgba(60, 90, 140, 0.22) 21px 22px);
}

.notes-pad::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 8px;
  right: 8px;
  height: 8px;
  background: radial-gradient(circle at 5px 4px, #3a3a40 0 3px, transparent 3.5px) 0 0 / 14px 8px repeat-x;
}

.pad-title {
  font: 700 11px/1 var(--font-pixel);
  letter-spacing: 0.12em;
  color: #b8322c;
  margin-bottom: 6px;
}

.pad-lines {
  list-style: none;
  font: 500 13px/22px var(--font-pixel);
}

.desk-plaque {
  flex-shrink: 0;
  margin-top: auto;
  padding: 8px 10px;
  text-align: center;
  font: 600 11px/1.4 var(--font-pixel);
  letter-spacing: 0.08em;
  color: #f6e7b4;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6);
  background: linear-gradient(#9a7430, #6f5120);
  border: 2px solid #3d2c10;
  border-radius: 3px;
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.25), 0 4px 0 rgba(0, 0, 0, 0.4);
}

.deco-pen {
  position: absolute;
  right: -6px;
  bottom: 54px;
  width: 128px;
  height: auto;
  transform: rotate(-52deg);
  transform-origin: 100% 100%;
  pointer-events: none;
}

/* ── Barra inferior ──────────────────────────────────────────────────────── */

.game-footer {
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: var(--hud-bg);
  border-top: 4px solid #050607;
  font: 500 12px var(--font-pixel);
  letter-spacing: 0.1em;
  color: #8fa3ab;
}

.kbd {
  display: inline-block;
  padding: 0 7px;
  margin-right: 6px;
  border: 2px solid var(--hud-line);
  border-radius: 3px;
  color: var(--px-cyan);
  background: #12181b;
}

.help-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: #8fa3ab;
  font: 500 12px var(--font-pixel);
  letter-spacing: 0.12em;
  transition: color 0.15s ease;
}

.help-btn:hover { color: var(--px-cyan); }

.help-q {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 2px solid var(--px-cyan);
  border-radius: 3px;
  color: var(--px-cyan);
  font-weight: 700;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */

@media (max-width: 1280px) {
  .desk-inner { grid-template-columns: minmax(0, 1fr) clamp(340px, 34vw, 420px); }
  .desk-side { display: none; }
}

@media (max-width: 1100px) {
  .hud { grid-template-columns: minmax(340px, 1.5fr) minmax(240px, 1fr) 124px; }
  .hud-rules { display: none; }
}

@media (max-height: 760px) {
  .desk-plaque, .rules-foot { display: none; }
}

@media (max-height: 640px) {
  .notes-pad { display: none; }
}

/* ── Loading ─────────────────────────────────────────────────────────────── */

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #8fa3ab;
  font-family: var(--font-pixel);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #1e293b;
  border-top-color: var(--px-green);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Tutorial ────────────────────────────────────────────────────────────── */

.tutorial-overlay {
  position: absolute;
  inset: 0;
  background: rgba(5, 8, 16, 0.7);
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 24px;
  z-index: 300;
  backdrop-filter: blur(2px);
}

.tutorial-card {
  background: var(--paper);
  color: var(--ink);
  border: 3px solid #1d1a14;
  border-radius: 6px;
  padding: 22px 26px;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.4), 0 24px 60px rgba(0, 0, 0, 0.6);
  background-image: repeating-linear-gradient(180deg, transparent 0 25px, var(--paper-line) 25px 26px);
  font-family: var(--font-pixel);
  animation: tutorial-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes tutorial-slide-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.tutorial-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 2px dashed rgba(60, 45, 20, 0.3);
}

.tutorial-icon { font-size: 1.4rem; }

.tutorial-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink-blue);
  margin: 0;
  letter-spacing: 0.02em;
}

.tutorial-steps {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tutorial-steps li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 0.88rem;
  color: var(--ink);
  line-height: 1.5;
}

.tutorial-steps strong {
  color: #1d3b66;
  display: block;
  margin-bottom: 1px;
}

.tutorial-accent { color: #b8322c; font-weight: 700; }

.step-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: #3fa34d;
  color: #fff;
  border: 2px solid #0a0d0f;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: var(--font-pixel);
  margin-top: 1px;
}

.btn-tutorial-ok {
  background: #3fa34d;
  color: white;
  border: 3px solid #0a0d0f;
  border-bottom-width: 5px;
  padding: 8px 20px;
  border-radius: 5px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  font-family: var(--font-pixel);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.28);
  transition: transform 0.12s ease, filter 0.12s ease;
  align-self: flex-end;
}

.btn-tutorial-ok:hover { transform: translateY(-1px); filter: brightness(1.12); }
.btn-tutorial-ok:active { transform: translateY(2px); border-bottom-width: 3px; }

.mono { font-family: var(--font-mono); }

/* ── Nuevas mecánicas: Repaso, Rangos, Entrevista, Seguimiento y Minuta ──── */

.intro-botones-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.btn-repasar-intro {
  background: linear-gradient(135deg, #b45309, #d97706);
  color: #fff;
  border: 3px solid #0a0d0f;
  border-bottom-width: 5px;
  padding: 12px 22px;
  border-radius: 6px;
  font: 700 14px var(--font-pixel);
  letter-spacing: 0.08em;
  cursor: pointer;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.25);
  transition: transform 0.12s ease, filter 0.12s ease;
}

.btn-repasar-intro:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.paciente-badges-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: auto;
}

.tag-caso-repaso {
  padding: 2px 7px;
  border-radius: 3px;
  font: 800 9px var(--font-digits);
  letter-spacing: 0.08em;
  background: rgba(245, 158, 11, 0.22);
  color: #fbbf24;
  border: 1px solid #f59e0b;
}

.tag-caso-control {
  padding: 2px 7px;
  border-radius: 3px;
  font: 800 9px var(--font-digits);
  letter-spacing: 0.05em;
  background: rgba(56, 189, 248, 0.22);
  color: #7dd3fc;
  border: 1px solid #38bdf8;
  white-space: nowrap;
}

.head-badge-repaso {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 3px;
  font: 800 10px var(--font-digits);
  background: #d97706;
  color: #fff;
  letter-spacing: 0.08em;
}

.head-badge-control {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 3px;
  font: 800 10px var(--font-digits);
  background: #0284c7;
  color: #fff;
  letter-spacing: 0.05em;
}

.bt-entrevista {
  background: linear-gradient(180deg, #7c3aed, #5b21b6);
  color: #f5f3ff;
}

.lab-valor-previo {
  display: block;
  font-size: 10px;
  color: #6b5a46;
  font-weight: 500;
}

.screen-intro {
  overflow-y: auto;
}

.selector-estudio-panel {
  width: 100%;
  background: rgba(15, 20, 32, 0.85);
  border: 1px solid rgba(111, 214, 238, 0.25);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.selector-estudio-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #6fd6ee;
  font-family: var(--font-mono, monospace);
}

.selector-estudio-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-bloque {
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-bloque:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: #6fd6ee;
}

.chip-bloque.activo {
  background: rgba(37, 99, 235, 0.35);
  color: #fff;
  border-color: #60a5fa;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}
</style>
