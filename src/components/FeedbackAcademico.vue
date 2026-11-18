<template>
  <!--
    FeedbackAcademico — Panel post-caso para el modo Nutricionista.

    Muestra:
    - Resultado de las dimensiones clínicas (Diagnóstico/Evolución, Plan/Conducta/Minuta, Riesgo y Mecanismo)
    - Si superó un error pendiente de repaso (2 aciertos seguidos)
    - Desglose de nutrientes cuando se usó Minuta en modo Difícil
    - Preguntas clave de la Entrevista realizadas vs faltantes
    - Notas educativas e interacciones fármaco-nutriente
  -->
  <Teleport to="body">
    <Transition name="feedback-slide">
      <div
        v-if="visible && resultado"
        class="feedback-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-titulo"
      >
        <div class="feedback-card" :class="resultado.correcto ? 'card-correcto' : 'card-incorrecto'">

          <!-- ── Encabezado ─────────────────────────────────────────── -->
          <div class="feedback-header">
            <div class="feedback-result-icon">
              {{ resultado.tiempoAgotado ? '⏰' : resultado.correcto ? '🎉' : '📖' }}
            </div>
            <div class="feedback-result-text">
              <h2 id="feedback-titulo" class="feedback-titulo">
                {{ resultado.tiempoAgotado
                  ? '¡Se acabó el tiempo!'
                  : resultado.correcto
                    ? '¡Evaluación perfecta!'
                    : 'Hay puntos para revisar' }}
              </h2>
              <p class="feedback-subtitulo">
                <span v-if="resultado.esControl" class="tag-inline-control">CONTROL 4 SEM</span>
                {{ resultado.patologia.nombre }} ·
                {{ LABELS_SISTEMA[resultado.patologia.sistemaCorporal] }}
              </p>
            </div>
          </div>

          <!-- ── Aviso de error superado en Repaso ─────────────────── -->
          <div v-if="resultado.errorSuperado" class="feedback-superado">
            🔁 ✅ <strong>¡Error superado!</strong> Acertaste 2 veces seguidas <em>{{ resultado.patologia.nombre }}</em> y sale de tu lista de repaso.
          </div>

          <!-- ── Resultados por dimensión ──────────────────────────── -->
          <div class="feedback-dimensiones">

            <!-- Dimensión 1: Diagnóstico o Evolución (en control) -->
            <div class="dimension-item" :class="resultado.diagnosticoCorrecto ? 'dim-ok' : 'dim-error'">
              <span class="dim-icon">{{ resultado.diagnosticoCorrecto ? '✅' : '❌' }}</span>
              <div class="dim-contenido">
                <span class="dim-label">{{ resultado.esControl ? 'Evolución del Control' : 'Diagnóstico' }}</span>
                <template v-if="resultado.esControl">
                  <span class="dim-valor">
                    {{ resultado.evaluacion.evolucionSeleccionada?.texto ?? '(sin respuesta)' }}
                  </span>
                  <span class="dim-correcto">
                    {{ resultado.evaluacion.evolucionSeleccionada?.explicacion }}
                  </span>
                </template>
                <template v-else>
                  <span class="dim-valor">
                    {{ resultado.evaluacion.diagnosticoSeleccionado ?? '(sin respuesta)' }}
                  </span>
                  <span v-if="!resultado.diagnosticoCorrecto" class="dim-correcto">
                    ✓ Correcto: {{ resultado.patologia.nombre }}
                  </span>
                </template>
              </div>
            </div>

            <!-- Dimensión 2: Plan Nutricional, Conducta (en control) o Minuta (modo difícil) -->
            <div class="dimension-item" :class="resultado.planCorrecto ? 'dim-ok' : 'dim-error'">
              <span class="dim-icon">{{ resultado.planCorrecto ? '✅' : '❌' }}</span>
              <div class="dim-contenido">
                <span class="dim-label">
                  {{ resultado.esControl ? 'Conducta Clínica' : resultado.usoMinuta ? 'Minuta Diaria (Modo Difícil)' : 'Plan Nutricional' }}
                </span>

                <template v-if="resultado.esControl">
                  <span class="dim-valor">
                    {{ resultado.evaluacion.conductaSeleccionada?.texto ?? '(sin respuesta)' }}
                  </span>
                  <span class="dim-correcto">
                    {{ resultado.evaluacion.conductaSeleccionada?.explicacion }}
                  </span>
                </template>

                <template v-else-if="resultado.usoMinuta && resultado.evaluacion.minutaEvaluacion">
                  <span class="dim-valor">
                    {{ resultado.planCorrecto ? 'Cumpliste todas las restricciones críticas de la patología.' : 'Quedaron nutrientes críticos fuera del rango terapéutico:' }}
                  </span>
                  <ul class="minuta-feedback-lista">
                    <li
                      v-for="n in resultado.evaluacion.minutaEvaluacion.nutrientesEvaluados"
                      :key="n.nutriente"
                      :class="n.estado === 'ok' ? 'nut-fb-ok' : 'nut-fb-err'"
                    >
                      <strong>{{ n.label }}:</strong> {{ Math.round(n.valorActual) }} {{ n.unidad }}
                      (meta {{ n.min }}–{{ n.max }} {{ n.unidad }}) —
                      {{ n.estado === 'ok' ? '✓ En rango' : n.estado === 'alto' ? `↑ Excedido (${n.razonClinica})` : `↓ Insuficiente (${n.razonClinica})` }}
                    </li>
                  </ul>
                </template>

                <template v-else>
                  <span class="dim-valor">
                    {{ resultado.evaluacion.planSeleccionado?.texto ?? '(sin respuesta)' }}
                  </span>
                  <span v-if="!resultado.planCorrecto" class="dim-correcto">
                    ✓ Correcto: {{ resultado.patologia.tratamientoCorrecto[0] }}
                  </span>
                </template>
              </div>
            </div>

            <!-- Dimensión 3: Riesgo Farmacológico -->
            <div class="dimension-item" :class="resultado.riesgoCorrecto ? 'dim-ok' : 'dim-error'">
              <span class="dim-icon">{{ resultado.riesgoCorrecto ? '✅' : '❌' }}</span>
              <div class="dim-contenido">
                <span class="dim-label">Riesgo Farmacológico</span>
                <span class="dim-valor">
                  {{ resultado.evaluacion.riesgoSeleccionado?.texto ?? '(sin respuesta)' }}
                </span>
                <span v-if="!resultado.riesgoCorrecto && resultado.evaluacion.riesgoSeleccionado?.justificacion" class="dim-correcto">
                  ✓ {{ resultado.evaluacion.riesgoSeleccionado.justificacion }}
                </span>
              </div>
            </div>

            <!-- Dimensión 4 (opcional): Mecanismo Fisiopatológico -->
            <div
              v-if="resultado.mecanismoCorrecto !== null"
              class="dimension-item"
              :class="resultado.mecanismoCorrecto ? 'dim-ok' : 'dim-error'"
            >
              <span class="dim-icon">{{ resultado.mecanismoCorrecto ? '✅' : '❌' }}</span>
              <div class="dim-contenido">
                <span class="dim-label">Mecanismo Fisiopatológico</span>
                <span class="dim-valor">
                  {{ resultado.evaluacion.mecanismoSeleccionado?.texto ?? '(sin respuesta)' }}
                </span>
                <span v-if="resultado.evaluacion.mecanismoSeleccionado?.explicacion" class="dim-correcto">
                  {{ resultado.evaluacion.mecanismoSeleccionado.explicacion }}
                </span>
              </div>
            </div>

          </div>

          <!-- ── Retroalimentación de la Entrevista (si está desbloqueada) ── -->
          <div
            v-if="carrera.entrevistaDesbloqueada && preguntasClaveCaso.length > 0"
            class="feedback-entrevista"
          >
            <p class="notas-encabezado">💬 Entrevista clínica (Preguntas clave)</p>
            <div class="entrevista-fb-lista">
              <div
                v-for="p in preguntasClaveCaso"
                :key="p.id"
                class="entrevista-fb-item"
                :class="fuePreguntada(p.id) ? 'preg-hecha' : 'preg-faltante'"
              >
                <span class="preg-fb-badge">
                  {{ fuePreguntada(p.id) ? '✓ La hiciste' : '○ Te faltó' }}
                </span>
                <div class="preg-fb-body">
                  <span class="preg-fb-q">{{ p.pregunta }}</span>
                  <span v-if="p.importancia" class="preg-fb-imp">{{ p.importancia }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Badges académicos ──────────────────────────────────── -->
          <div class="feedback-badges">
            <span class="badge badge-ra">{{ resultado.patologia.resultadoAprendizaje }}</span>
            <span class="badge badge-sistema">{{ LABELS_SISTEMA[resultado.patologia.sistemaCorporal] }}</span>
            <span class="badge badge-dificultad" :class="`dif-${resultado.patologia.dificultad}`">
              {{ resultado.patologia.dificultad.toUpperCase() }}
            </span>
          </div>

          <!-- ── Notas educativas ───────────────────────────────────── -->
          <div class="feedback-notas">
            <p class="notas-encabezado">
              📚 Razonamiento clínico
              <span v-if="resultado.patologia.focoClinico" style="color: #38bdf8; font-weight: 500;">
                — {{ resultado.patologia.focoClinico }}
              </span>
            </p>
            <p class="notas-texto">{{ resultado.patologia.notasEducativas }}</p>
          </div>

          <!-- ── Conceptos clave de la clase ────────────────────────── -->
          <div
            v-if="resultado.patologia.conceptosClave?.length"
            class="feedback-interacciones"
          >
            <p class="notas-encabezado">🎯 Conceptos clave de la clase para estudiar</p>
            <ul class="interacciones-lista">
              <li
                v-for="(concepto, idx) in resultado.patologia.conceptosClave"
                :key="idx"
              >
                {{ concepto }}
              </li>
            </ul>
          </div>

          <!-- ── Interacciones fármaco-nutriente ───────────────────── -->
          <div
            v-if="resultado.patologia.interaccionesFarmacoNutriente?.length"
            class="feedback-interacciones"
          >
            <p class="notas-encabezado">⚗️ Interacciones fármaco-nutriente</p>
            <ul class="interacciones-lista">
              <li
                v-for="(inter, idx) in resultado.patologia.interaccionesFarmacoNutriente"
                :key="idx"
              >
                {{ inter }}
              </li>
            </ul>
          </div>

          <!-- ── Racha motivacional ─────────────────────────────────── -->
          <div v-if="tracker.progreso.rachaActual >= 3" class="feedback-racha">
            🔥 ¡Racha de {{ tracker.progreso.rachaActual }} aciertos consecutivos!
          </div>

          <!-- ── Acción ─────────────────────────────────────────────── -->
          <button class="btn-siguiente" @click="onSiguiente">
            Siguiente paciente →
          </button>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameManager } from '../composables/useGameManager'
import { useProgressTracker } from '../composables/useProgressTracker'
import { useCarrera } from '../composables/useCarrera'
import type { SistemaCorporal, PreguntaEntrevista } from '../types/models'

const gameManager = useGameManager()
const tracker = useProgressTracker()
const carrera = useCarrera()

const visible = computed(() => gameManager.mostrandoFeedback)
const resultado = computed(() => gameManager.ultimoResultado)

const LABELS_SISTEMA: Record<SistemaCorporal, string> = {
  Cardiovascular: '❤️ Cardiovascular',
  Renal: '🫘 Renal',
  Respiratorio: '🫁 Respiratorio',
  Digestivo: '🫙 Digestivo',
  Endocrino_Metabolico: '⚗️ Endocrino-Metabólico',
  Musculoesqueletico: '🦴 Musculoesquelético',
}

const preguntasClaveCaso = computed<PreguntaEntrevista[]>(() =>
  (resultado.value?.preguntasEntrevista ?? []).filter(p => p.esClave),
)

function fuePreguntada(id: string): boolean {
  return (resultado.value?.evaluacion.preguntasRealizadasIds ?? []).includes(id)
}

function onSiguiente(): void {
  gameManager.continuarSiguientePaciente()
}
</script>

<style scoped>
.feedback-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 16, 0.80);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.feedback-card {
  background: #141822;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  padding: 24px 28px;
  max-width: 620px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7);
  max-height: 92vh;
  overflow-y: auto;
}

.card-correcto { border-top: 3px solid #00d4aa; }
.card-incorrecto { border-top: 3px solid #f97316; }

.feedback-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.feedback-result-icon {
  font-size: 2rem;
  flex-shrink: 0;
  line-height: 1;
}

.feedback-result-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feedback-titulo {
  font-size: 1rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}

.feedback-subtitulo {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-inline-control {
  background: rgba(56, 189, 248, 0.18);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
}

.feedback-superado {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
}

/* ── Dimensiones ─────────────────────────────────────────────────────────── */

.feedback-dimensiones {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dimension-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid;
}

.dim-ok {
  background: rgba(0, 212, 170, 0.06);
  border-color: rgba(0, 212, 170, 0.2);
}

.dim-error {
  background: rgba(249, 115, 22, 0.06);
  border-color: rgba(249, 115, 22, 0.2);
}

.dim-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.dim-contenido {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.dim-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #64748b;
  font-family: var(--font-mono, monospace);
}

.dim-valor {
  font-size: 0.78rem;
  color: #e2e8f0;
  line-height: 1.4;
}

.dim-correcto {
  font-size: 0.72rem;
  color: #00d4aa;
  margin-top: 2px;
}

.minuta-feedback-lista {
  list-style: none;
  padding: 4px 0 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.72rem;
}

.nut-fb-ok { color: #6ee7b7; }
.nut-fb-err { color: #fca5a5; }

/* ── Entrevista feedback ─────────────────────────────────────────────────── */

.feedback-entrevista {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entrevista-fb-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.entrevista-fb-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 0.74rem;
}

.preg-hecha {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.preg-faltante {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.preg-fb-badge {
  flex-shrink: 0;
  font-size: 0.62rem;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  padding: 2px 6px;
  border-radius: 3px;
}

.preg-hecha .preg-fb-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

.preg-faltante .preg-fb-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.preg-fb-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preg-fb-q {
  color: #e2e8f0;
  font-weight: 600;
}

.preg-fb-imp {
  color: #94a3b8;
  font-size: 0.68rem;
}

/* ── Badges ──────────────────────────────────────────────────────────────── */

.feedback-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 3px;
  font-family: var(--font-mono, monospace);
}

.badge-ra {
  background: rgba(124, 58, 237, 0.15);
  color: #c4b5fd;
  border: 1px solid rgba(124, 58, 237, 0.3);
}

.badge-sistema {
  background: rgba(8, 145, 178, 0.15);
  color: #67e8f9;
  border: 1px solid rgba(8, 145, 178, 0.3);
}

.badge-dificultad { border: 1px solid; }
.dif-baja { background: rgba(22, 163, 74, 0.15); color: #86efac; border-color: rgba(22, 163, 74, 0.3); }
.dif-media { background: rgba(180, 83, 9, 0.15); color: #fcd34d; border-color: rgba(180, 83, 9, 0.3); }
.dif-alta { background: rgba(185, 28, 28, 0.15); color: #fca5a5; border-color: rgba(185, 28, 28, 0.3); }

/* ── Notas ───────────────────────────────────────────────────────────────── */

.feedback-notas, .feedback-interacciones {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 6px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notas-encabezado {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #64748b;
  font-family: var(--font-mono, monospace);
  margin: 0;
}

.notas-texto {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.65;
  margin: 0;
}

.interacciones-lista {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.interacciones-lista li {
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.5;
  padding-left: 12px;
  border-left: 2px solid rgba(8, 145, 178, 0.4);
}

/* ── Racha ───────────────────────────────────────────────────────────────── */

.feedback-racha {
  font-size: 0.78rem;
  font-weight: 700;
  color: #fbbf24;
  text-align: center;
  background: rgba(180, 83, 9, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 4px;
  padding: 8px;
  letter-spacing: 0.04em;
}

/* ── Botón ───────────────────────────────────────────────────────────────── */

.btn-siguiente {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  font-family: var(--font-mono, monospace);
  transition: all 0.2s ease;
  align-self: flex-end;
}

.btn-siguiente:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

/* ── Transición ──────────────────────────────────────────────────────────── */

.feedback-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.feedback-slide-leave-active {
  transition: all 0.25s ease;
}

.feedback-slide-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(16px);
}

.feedback-slide-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}
</style>
