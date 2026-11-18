<template>
  <!--
    EntrevistaPaciente — Pestaña de entrevista clínica en formato de chat (desde Rango 2).
    Hay 8 preguntas disponibles por caso y el estudiante puede hacer máximo 3.
  -->
  <div class="entrevista-wrap">
    <!-- Estado bloqueado (Rango < 2 y sin modo docente) -->
    <div v-if="!carrera.entrevistaDesbloqueada" class="entrevista-locked">
      <div class="lock-icon">🔒</div>
      <h4 class="lock-title">Entrevista al Paciente bloqueada</h4>
      <p class="lock-desc">
        Alcanza el rango <strong>📋 Nutricionista en práctica</strong> (≥ 10 casos y ≥ 60 % de dominio reciente en RA1, RA2 y RA3) para habilitar la anamnesis directa con el paciente.
      </p>
    </div>

    <!-- Entrevista desbloqueada -->
    <template v-else>
      <div class="entrevista-header">
        <div class="entrevista-info">
          <span class="entrevista-badge">💬 ANAMNESIS DIRECTA</span>
          <span class="entrevista-hint">
            Elige hasta 3 preguntas clave para descubrir hábitos, suplementos o adherencia.
          </span>
        </div>
        <div class="entrevista-counter" :class="{ agotadas: preguntasHechas.length >= MAX_PREGUNTAS }">
          {{ preguntasHechas.length }} / {{ MAX_PREGUNTAS }} preguntas
        </div>
      </div>

      <!-- Historial de chat -->
      <div class="chat-log">
        <!-- Mensaje inicial del paciente -->
        <div class="chat-msg msg-paciente">
          <div class="msg-autor">
            🧑‍⚕️ {{ paciente.carnet.nombre }} {{ paciente.carnet.apellido.split(' ')[0] }}
          </div>
          <div class="msg-bubble">
            Hola nutricionista, dígame qué necesita saber sobre mis comidas o mis remedios.
          </div>
        </div>

        <template v-for="item in preguntasRespondidas" :key="item.id">
          <div class="chat-msg msg-nutri">
            <div class="msg-autor">🩺 Tú (Nutricionista)</div>
            <div class="msg-bubble">{{ item.pregunta }}</div>
          </div>

          <div class="chat-msg msg-paciente">
            <div class="msg-autor">
              🧑‍⚕️ {{ paciente.carnet.nombre }} {{ paciente.carnet.apellido.split(' ')[0] }}
            </div>
            <div class="msg-bubble">{{ item.respuesta }}</div>
          </div>
        </template>
      </div>

      <!-- Selector de preguntas disponibles -->
      <div class="preguntas-panel">
        <div class="preguntas-panel-titulo">
          <span v-if="preguntasHechas.length < MAX_PREGUNTAS">
            Selecciona una pregunta ({{ MAX_PREGUNTAS - preguntasHechas.length }} restante{{ MAX_PREGUNTAS - preguntasHechas.length !== 1 ? 's' : '' }}):
          </span>
          <span v-else class="limite-alcanzado">
            ✓ Has realizado el máximo de 3 preguntas para esta consulta.
          </span>
        </div>

        <div class="preguntas-lista">
          <button
            v-for="p in preguntasDisponibles"
            :key="p.id"
            class="btn-pregunta"
            :class="{ 'ya-hecha': preguntasHechas.includes(p.id) }"
            :disabled="preguntasHechas.includes(p.id) || preguntasHechas.length >= MAX_PREGUNTAS"
            @click="hacerPregunta(p.id)"
          >
            <span class="preg-bullet">{{ preguntasHechas.includes(p.id) ? '✓' : '▸' }}</span>
            <span class="preg-texto">{{ p.pregunta }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameManager } from '../composables/useGameManager'
import { useCarrera } from '../composables/useCarrera'
import type { PreguntaEntrevista } from '../types/models'

const MAX_PREGUNTAS = 3

const gameManager = useGameManager()
const carrera = useCarrera()

const paciente = computed(() => gameManager.pacienteActual!)

const preguntasDisponibles = computed<PreguntaEntrevista[]>(
  () => paciente.value?.preguntasEntrevista ?? [],
)

const preguntasHechas = computed<string[]>(
  () => gameManager.evaluacionActual.preguntasRealizadasIds ?? [],
)

const preguntasRespondidas = computed<PreguntaEntrevista[]>(() =>
  preguntasHechas.value
    .map(id => preguntasDisponibles.value.find(p => p.id === id))
    .filter((p): p is PreguntaEntrevista => Boolean(p)),
)

function hacerPregunta(id: string): void {
  if (preguntasHechas.value.length >= MAX_PREGUNTAS) return
  if (preguntasHechas.value.includes(id)) return
  gameManager.registrarPreguntaEntrevista(id)
}
</script>

<style scoped>
.entrevista-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--ink, #3b2f25);
}

.entrevista-locked {
  padding: 28px 18px;
  text-align: center;
  background: rgba(60, 45, 20, 0.08);
  border: 2px dashed rgba(120, 95, 50, 0.45);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.lock-icon {
  font-size: 2rem;
}

.lock-title {
  font-size: 14px;
  font-weight: 800;
  color: #3b2f25;
  margin: 0;
}

.lock-desc {
  font-size: 12px;
  line-height: 1.5;
  color: #5b4937;
  max-width: 380px;
  margin: 0;
}

.entrevista-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(120, 95, 50, 0.25);
}

.entrevista-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entrevista-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #2f5d8c;
}

.entrevista-hint {
  font-size: 11px;
  color: #6b5a46;
}

.entrevista-counter {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 4px;
  font: 700 11px var(--font-digits, monospace);
  background: #2f5d8c;
  color: #fff;
}

.entrevista-counter.agotadas {
  background: #5b4937;
}

.chat-log {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.45);
  border: 2px solid rgba(120, 95, 50, 0.35);
  border-radius: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.chat-msg {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 88%;
}

.msg-paciente {
  align-self: flex-start;
}

.msg-nutri {
  align-self: flex-end;
  text-align: right;
}

.msg-autor {
  font-size: 10px;
  font-weight: 700;
  color: #6b5a46;
}

.msg-bubble {
  padding: 8px 11px;
  border-radius: 6px;
  font-size: 12.5px;
  line-height: 1.4;
}

.msg-paciente .msg-bubble {
  background: #f7f0da;
  border: 1px solid rgba(120, 95, 50, 0.45);
  color: #2b2118;
}

.msg-nutri .msg-bubble {
  background: #2f5d8c;
  color: #fff;
}

.preguntas-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preguntas-panel-titulo {
  font-size: 11.5px;
  font-weight: 700;
  color: #3b2f25;
}

.limite-alcanzado {
  color: #2d7a3b;
}

.preguntas-lista {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.btn-pregunta {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 10px;
  text-align: left;
  background: #f7f0da;
  border: 1.5px solid rgba(120, 95, 50, 0.45);
  border-radius: 4px;
  color: #2b2118;
  font: 500 12px/1.35 var(--font-pixel, sans-serif);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.btn-pregunta:hover:not(:disabled) {
  background: #fbe9a6;
  border-color: #b8860b;
  transform: translateX(2px);
}

.btn-pregunta:disabled {
  cursor: default;
  opacity: 0.6;
}

.btn-pregunta.ya-hecha {
  background: rgba(63, 163, 77, 0.14);
  border-color: rgba(63, 163, 77, 0.5);
  opacity: 0.85;
}

.preg-bullet {
  font-weight: 800;
  color: #2f5d8c;
  flex-shrink: 0;
}

.btn-pregunta.ya-hecha .preg-bullet {
  color: #2d7a3b;
}
</style>
