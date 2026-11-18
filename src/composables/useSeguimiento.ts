// src/composables/useSeguimiento.ts
/**
 * Composable de Agenda de Seguimiento de Pacientes (desde Rango 3).
 *
 * Guarda en localStorage los pacientes atendidos para que regresen a control
 * en el turno siguiente ("CONTROL · 4 semanas después"), con un máximo de
 * 2 controles por turno.
 *
 * @module useSeguimiento
 */

import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import type { Paciente, RegistroControlAgendado } from '../types/models'

const STORAGE_KEY_SEGUIMIENTO = 'practica-clinica-seguimiento'
const MAX_AGENDA_GUARDADA = 8
const MAX_CONTROLES_POR_TURNO = 2

export const useSeguimiento = defineStore('seguimiento', () => {
  function cargarAgenda(): RegistroControlAgendado[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SEGUIMIENTO)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const agenda = ref<RegistroControlAgendado[]>(cargarAgenda())

  function persistir(): void {
    localStorage.setItem(STORAGE_KEY_SEGUIMIENTO, JSON.stringify(agenda.value))
  }

  /**
   * Agenda un paciente recién atendido (si no era ya un control) para volver en un turno futuro.
   * Prioriza agendar casos donde hubo algún error, y un porcentaje de casos correctos para
   * que el estudiante también experimente controles con evolución favorable.
   */
  function agendarSiCorresponde(
    paciente: Paciente,
    turnoActual: number,
    resultado: {
      diagnosticoCorrecto: boolean
      planCorrecto: boolean
      riesgoCorrecto: boolean
    },
  ): void {
    // No re-agendar un caso que ya es un control
    if (paciente.esControl) return

    // Evitar duplicar el mismo RUT en la agenda
    if (agenda.value.some(a => a.carnet.rut === paciente.carnet.rut)) return

    const huboFallo = !resultado.planCorrecto || !resultado.riesgoCorrecto
    // Si falló plan o riesgo, 85% prob de agendar; si acertó todo, 45% prob de agendar
    const probabilidad = huboFallo ? 0.85 : 0.45
    if (Math.random() > probabilidad && agenda.value.length > 0) return

    const sexo: 'M' | 'F' = /femenin/i.test(paciente.anamnesis.observaciones) ? 'F' : 'M'

    const nuevoRegistro: RegistroControlAgendado = {
      id: `ctrl-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      patologiaId: paciente.patologiaRef.id,
      carnet: JSON.parse(JSON.stringify(paciente.carnet)),
      anamnesisBase: JSON.parse(JSON.stringify(paciente.anamnesis)),
      laboratorioBase: JSON.parse(JSON.stringify(paciente.laboratorio)),
      recetaBase: JSON.parse(JSON.stringify(paciente.receta)),
      sexo,
      turnoAtendido: turnoActual,
      planFueCorrecto: resultado.planCorrecto,
      riesgoFueCorrecto: resultado.riesgoCorrecto,
      diagnosticoFueCorrecto: resultado.diagnosticoCorrecto,
    }

    agenda.value.push(nuevoRegistro)
    if (agenda.value.length > MAX_AGENDA_GUARDADA) {
      agenda.value = agenda.value.slice(-MAX_AGENDA_GUARDADA)
    }
    persistir()
  }

  /**
   * Extrae hasta `MAX_CONTROLES_POR_TURNO` (2) pacientes agendados en turnos anteriores
   * para incluirlos en el turno que comienza.
   */
  function extraerControlesParaTurno(turnoActual: number): RegistroControlAgendado[] {
    const elegibles = agenda.value.filter(a => a.turnoAtendido < turnoActual)
    if (elegibles.length === 0) return []

    const seleccionados = elegibles.slice(0, MAX_CONTROLES_POR_TURNO)
    const idsSeleccionados = new Set(seleccionados.map(s => s.id))
    agenda.value = agenda.value.filter(a => !idsSeleccionados.has(a.id))
    persistir()

    return seleccionados
  }

  function limpiarAgenda(): void {
    agenda.value = []
    persistir()
  }

  const cantidadAgendados = computed<number>(() => agenda.value.length)

  return {
    agenda,
    cantidadAgendados,
    agendarSiCorresponde,
    extraerControlesParaTurno,
    limpiarAgenda,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeguimiento, import.meta.hot))
}
