// src/composables/useGameManager.ts
/**
 * Estado global del juego — Práctica Clínica (modo Nutricionista).
 *
 * Integra las 5 mecánicas nuevas:
 * 1. Repaso de errores (selector ponderado + modo repaso exclusivo + errores superados)
 * 2. Rangos por dominio reciente (verificación de ascenso al final del turno)
 * 3. Entrevista al paciente (registro de hasta 3 preguntas por caso)
 * 4. Seguimiento de pacientes (controles a las 4 semanas con Evolución + Conducta + Riesgo)
 * 5. Minuta (reemplaza Plan Nutricional en modo Difícil desde Rango 4 Especialista)
 *
 * @module useGameManager
 */

import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Paciente,
  EstadisticasTurno,
  ResultadoVeredicto,
  EvaluacionEstudiante,
  SistemaCorporal,
  ResultadoAprendizaje,
  ModoDificultad,
  PatologiaClinica,
  DimensionEvaluacion,
  RegistroControlAgendado,
  OpcionEvolucion,
  OpcionConducta,
  ItemMinuta,
  ResultadoEvaluacionMinuta,
} from '../types/models'
import { generarPaciente } from '../utils/patientFactory'
import { seleccionarSiguientePatologia } from '../utils/selectorCasos'
import { generarPacienteControl } from '../utils/seguimientoFactory'
import { useProgressTracker } from './useProgressTracker'
import { useCarrera } from './useCarrera'
import { useSeguimiento } from './useSeguimiento'
import clinicalDataRaw from '../data/clinicalData.json'

const clinicalData = clinicalDataRaw as unknown as PatologiaClinica[]

// ─── Constantes de tiempo ─────────────────────────────────────────────────────

const TIEMPO_POR_DIFICULTAD: Record<'baja' | 'media' | 'alta', number> = {
  baja: 300,
  media: 300,
  alta: 300,
}

const CASOS_POR_TURNO = 8

function formatearTiempo(segundos: number): string {
  const m = Math.floor(Math.max(0, segundos) / 60)
  const s = Math.max(0, segundos) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function evaluacionVacia(): EvaluacionEstudiante {
  return {
    diagnosticoSeleccionado: null,
    planSeleccionado: null,
    riesgoSeleccionado: null,
    mecanismoSeleccionado: null,
    evolucionSeleccionada: null,
    conductaSeleccionada: null,
    minutaItems: [],
    minutaEvaluacion: null,
    preguntasRealizadasIds: [],
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameManager = defineStore('gameManager', () => {
  const progressTracker = useProgressTracker()
  const carrera = useCarrera()
  const seguimiento = useSeguimiento()

  // ── Estado del turno ──────────────────────────────────────────────────────

  const turnoActual = ref<number>(1)
  const pacienteActual = ref<Paciente | null>(null)
  const indiceCasoActual = ref<number>(0)
  const estadisticasTurno = ref<EstadisticasTurno>({ correctos: 0, incorrectos: 0 })
  const turnoFinalizado = ref<boolean>(false)
  const ultimoResultado = ref<ResultadoVeredicto | null>(null)
  const mostrandoFeedback = ref<boolean>(false)

  /** Puntaje acumulado del turno (1 punto por dimensión evaluada correcta). */
  const puntosObtenidos = ref<number>(0)
  const puntosPosibles = ref<number>(0)

  // ── Estado de Repaso de Errores y Seguimiento en el turno ─────────────────

  /** Si el turno se inició desde el botón 🔁 REPASAR ERRORES (N). */
  const modoRepasoActivo = ref<boolean>(false)

  /** IDs de patologías que ya salieron en el turno actual (evita repetición salvo en modo repaso). */
  const patologiasUsadasTurno = ref<string[]>([])

  /** Nombres de patologías que salieron de la lista de errores durante este turno. */
  const erroresSuperadosTurno = ref<string[]>([])

  /** Cola de pacientes de control agendados para aparecer en este turno (máx 2). */
  const colaControlesTurno = ref<RegistroControlAgendado[]>([])

  // ── Modo de dificultad del juego ──────────────────────────────────────────

  /** facil = opciones múltiple con tarjetas | dificil = desplegable libre + Minuta (Rango 4+) */
  const modoDificultad = ref<ModoDificultad>('facil')

  /** ¿El caso actual usa el constructor de Minuta en lugar de las 3 alternativas de Plan? */
  const usaMinutaEnCasoActual = computed<boolean>(() => {
    return (
      modoDificultad.value === 'dificil' &&
      carrera.minutaDesbloqueada &&
      !pacienteActual.value?.esControl &&
      Boolean(pacienteActual.value?.configMinuta)
    )
  })

  // ── Evaluación en curso del estudiante ────────────────────────────────────

  const evaluacionActual = ref<EvaluacionEstudiante>(evaluacionVacia())

  /** ¿El estudiante completó todas las secciones requeridas? */
  const evaluacionCompleta = computed(() => {
    const pac = pacienteActual.value
    if (!pac) return false

    if (pac.esControl) {
      return (
        evaluacionActual.value.evolucionSeleccionada !== null &&
        evaluacionActual.value.evolucionSeleccionada !== undefined &&
        evaluacionActual.value.conductaSeleccionada !== null &&
        evaluacionActual.value.conductaSeleccionada !== undefined &&
        evaluacionActual.value.riesgoSeleccionado !== null
      )
    }

    const base =
      evaluacionActual.value.diagnosticoSeleccionado !== null &&
      evaluacionActual.value.planSeleccionado !== null &&
      evaluacionActual.value.riesgoSeleccionado !== null

    const tieneMecanismo = !!(pac.opcionesMecanismo?.length)
    if (!tieneMecanismo) return base
    return base && evaluacionActual.value.mecanismoSeleccionado !== null
  })

  // ── Reloj por caso ────────────────────────────────────────────────────────

  const segundosRestantes = ref<number>(0)
  const tiempoTotalCaso = ref<number>(300)
  let temporizadorId: ReturnType<typeof setInterval> | null = null

  const tiempoFormateado = computed<string>(() => formatearTiempo(segundosRestantes.value))

  const progresoTiempo = computed<number>(() => {
    if (tiempoTotalCaso.value === 0) return 0
    return Math.round((segundosRestantes.value / tiempoTotalCaso.value) * 100)
  })

  const fechaSimulada = computed<Date>(() => {
    const d = new Date(2025, 0, 1)
    d.setDate(d.getDate() + turnoActual.value - 1)
    return d
  })

  // ── Filtro de casos ───────────────────────────────────────────────────────

  const filtroActivo = ref<string[]>([])

  // ── Gestión del temporizador ──────────────────────────────────────────────

  function iniciarTemporizador(): void {
    detenerTemporizador()

    const dificultad = pacienteActual.value?.dificultad ?? 'media'
    const tiempoAsignado = TIEMPO_POR_DIFICULTAD[dificultad]
    segundosRestantes.value = tiempoAsignado
    tiempoTotalCaso.value = tiempoAsignado

    temporizadorId = setInterval(() => {
      if (mostrandoFeedback.value) return
      segundosRestantes.value = Math.max(0, segundosRestantes.value - 1)
      if (segundosRestantes.value <= 0) {
        detenerTemporizador()
        _registrarTiempoAgotado()
      }
    }, 1000)
  }

  function detenerTemporizador(): void {
    if (temporizadorId !== null) {
      clearInterval(temporizadorId)
      temporizadorId = null
    }
  }

  function _registrarTiempoAgotado(): void {
    if (!pacienteActual.value || mostrandoFeedback.value) return

    const paciente = pacienteActual.value
    const eval_ = evaluacionActual.value
    const tieneMecanismo = !!(paciente.opcionesMecanismo?.length) && !paciente.esControl
    estadisticasTurno.value.incorrectos++
    puntosPosibles.value += tieneMecanismo ? 4 : 3

    const dimensionesFalladas: DimensionEvaluacion[] = ['diagnostico', 'plan', 'riesgo']
    if (tieneMecanismo) dimensionesFalladas.push('mecanismo')

    progressTracker.registrarResultado(paciente.patologiaRef, false, {
      dimensionesFalladas,
      turno: turnoActual.value,
      eraRepaso: Boolean(paciente.esRepaso),
      eraControl: Boolean(paciente.esControl),
    })

    ultimoResultado.value = {
      diagnosticoCorrecto: false,
      planCorrecto: false,
      riesgoCorrecto: false,
      mecanismoCorrecto: tieneMecanismo ? false : null,
      correcto: false,
      patologia: paciente.patologiaRef,
      evaluacion: { ...eval_ },
      tiempoAgotado: true,
      esControl: paciente.esControl,
      datosControl: paciente.datosControl,
      preguntasEntrevista: paciente.preguntasEntrevista,
      usoMinuta: usaMinutaEnCasoActual.value,
    }
    mostrandoFeedback.value = true
  }

  // ── Generación de pacientes ───────────────────────────────────────────────

  function avanzarPaciente(): void {
    // 1. Si hay pacientes de control agendados para este turno (puestos 2 o 4 por ejemplo, o al inicio),
    //    atender un control si la cola tiene elementos
    if (colaControlesTurno.value.length > 0 && (indiceCasoActual.value === 1 || indiceCasoActual.value === 4 || indiceCasoActual.value >= CASOS_POR_TURNO - colaControlesTurno.value.length)) {
      const regControl = colaControlesTurno.value.shift()!
      const pat =
        clinicalData.find(p => p.id === regControl.patologiaId) ?? clinicalData[0]
      pacienteActual.value = generarPacienteControl(
        regControl,
        pat,
        clinicalData,
        fechaSimulada.value,
      )
      patologiasUsadasTurno.value.push(pat.id)
      evaluacionActual.value = evaluacionVacia()
      return
    }

    // 2. Filtrar base de datos si hay filtro activo
    const db =
      filtroActivo.value.length > 0
        ? clinicalData.filter(
            p =>
              filtroActivo.value.includes(p.sistemaCorporal) ||
              filtroActivo.value.includes(p.resultadoAprendizaje),
          )
        : clinicalData

    const baseFinal = db.length > 0 ? db : clinicalData

    // 3. Seleccionar patología con el motor ponderado / modo repaso
    const seleccion = seleccionarSiguientePatologia({
      candidatas: baseFinal,
      historialPorPatologia: progressTracker.progreso.historialPorPatologia,
      usadasEnTurno: patologiasUsadasTurno.value,
      turnoActual: turnoActual.value,
      modoRepaso: modoRepasoActivo.value,
    })

    patologiasUsadasTurno.value.push(seleccion.patologia.id)

    pacienteActual.value = generarPaciente(baseFinal, clinicalData, fechaSimulada.value, {
      patologiaForzada: seleccion.patologia,
      esRepaso: seleccion.esRepaso,
    })

    // 4. Resetear la evaluación para el nuevo paciente
    evaluacionActual.value = evaluacionVacia()
  }

  // ── Evaluación del timbre ─────────────────────────────────────────────────

  function timbrarFicha(): void {
    if (!pacienteActual.value || mostrandoFeedback.value || !evaluacionCompleta.value) return

    detenerTemporizador()

    const paciente = pacienteActual.value
    const eval_ = evaluacionActual.value

    let diagnosticoCorrecto = false
    let planCorrecto = false
    const riesgoCorrecto = eval_.riesgoSeleccionado?.esCorrecta ?? false
    let mecanismoCorrecto: boolean | null = null
    let tieneMecanismo = false

    if (paciente.esControl) {
      diagnosticoCorrecto = eval_.evolucionSeleccionada?.esCorrecta ?? false
      planCorrecto = eval_.conductaSeleccionada?.esCorrecta ?? false
    } else {
      diagnosticoCorrecto =
        eval_.diagnosticoSeleccionado === paciente.patologiaRef.nombre
      planCorrecto = eval_.planSeleccionado?.esCorrecta ?? false
      tieneMecanismo = !!(paciente.opcionesMecanismo?.length)
      mecanismoCorrecto = tieneMecanismo
        ? (eval_.mecanismoSeleccionado?.esCorrecta ?? false)
        : null
    }

    const esAcierto =
      diagnosticoCorrecto &&
      planCorrecto &&
      riesgoCorrecto &&
      (mecanismoCorrecto === null || mecanismoCorrecto === true)

    const dimensionesFalladas: DimensionEvaluacion[] = []
    if (!diagnosticoCorrecto) dimensionesFalladas.push('diagnostico')
    if (!planCorrecto) dimensionesFalladas.push('plan')
    if (!riesgoCorrecto) dimensionesFalladas.push('riesgo')
    if (tieneMecanismo && !mecanismoCorrecto) dimensionesFalladas.push('mecanismo')

    ultimoResultado.value = null

    if (esAcierto) {
      estadisticasTurno.value.correctos++
    } else {
      estadisticasTurno.value.incorrectos++
    }

    puntosPosibles.value += tieneMecanismo ? 4 : 3
    puntosObtenidos.value +=
      Number(diagnosticoCorrecto) +
      Number(planCorrecto) +
      Number(riesgoCorrecto) +
      Number(mecanismoCorrecto === true)

    const errorSuperado = progressTracker.registrarResultado(
      paciente.patologiaRef,
      esAcierto,
      {
        dimensionesFalladas,
        turno: turnoActual.value,
        eraRepaso: Boolean(paciente.esRepaso),
        eraControl: Boolean(paciente.esControl),
      },
    )

    if (
      errorSuperado &&
      !erroresSuperadosTurno.value.includes(paciente.patologiaRef.nombre)
    ) {
      erroresSuperadosTurno.value.push(paciente.patologiaRef.nombre)
    }

    // Si el seguimiento está desbloqueado (Rango 3+ o modo docente) y no es ya un control, agendar
    if (carrera.seguimientoDesbloqueado && !paciente.esControl) {
      seguimiento.agendarSiCorresponde(paciente, turnoActual.value, {
        diagnosticoCorrecto,
        planCorrecto,
        riesgoCorrecto,
      })
    }

    ultimoResultado.value = {
      diagnosticoCorrecto,
      planCorrecto,
      riesgoCorrecto,
      mecanismoCorrecto,
      correcto: esAcierto,
      patologia: paciente.patologiaRef,
      evaluacion: {
        ...eval_,
        preguntasRealizadasIds: [...(eval_.preguntasRealizadasIds ?? [])],
        minutaItems: eval_.minutaItems ? [...eval_.minutaItems] : undefined,
      },
      errorSuperado,
      esControl: paciente.esControl,
      datosControl: paciente.datosControl,
      preguntasEntrevista: paciente.preguntasEntrevista,
      usoMinuta: usaMinutaEnCasoActual.value,
    }

    mostrandoFeedback.value = true
  }

  /** Compatibilidad con MedicalDocument drag-drop antiguo si se invoca. */
  function evaluarVeredicto(_sello?: 'aprobado' | 'rechazado'): void {
    if (evaluacionCompleta.value) {
      timbrarFicha()
    }
  }

  /**
   * El estudiante cierra el panel de feedback y solicita el siguiente paciente.
   */
  function continuarSiguientePaciente(): void {
    mostrandoFeedback.value = false
    ultimoResultado.value = null
    indiceCasoActual.value++

    if (indiceCasoActual.value >= CASOS_POR_TURNO) {
      turnoFinalizado.value = true
      carrera.verificarAscensoFinDeTurno()
      return
    }

    avanzarPaciente()
    iniciarTemporizador()
  }

  // ── Acciones de evaluación ────────────────────────────────────────────────

  function seleccionarDiagnostico(diagnostico: string): void {
    evaluacionActual.value.diagnosticoSeleccionado = diagnostico
  }

  function seleccionarPlan(plan: typeof evaluacionActual.value.planSeleccionado): void {
    evaluacionActual.value.planSeleccionado = plan
  }

  function seleccionarRiesgo(riesgo: typeof evaluacionActual.value.riesgoSeleccionado): void {
    evaluacionActual.value.riesgoSeleccionado = riesgo
  }

  function seleccionarMecanismo(mecanismo: typeof evaluacionActual.value.mecanismoSeleccionado): void {
    evaluacionActual.value.mecanismoSeleccionado = mecanismo
  }

  function seleccionarEvolucion(evolucion: OpcionEvolucion): void {
    evaluacionActual.value.evolucionSeleccionada = evolucion
  }

  function seleccionarConducta(conducta: OpcionConducta): void {
    evaluacionActual.value.conductaSeleccionada = conducta
  }

  function actualizarMinuta(
    items: ItemMinuta[],
    resultadoEval: ResultadoEvaluacionMinuta,
  ): void {
    evaluacionActual.value.minutaItems = items
    evaluacionActual.value.minutaEvaluacion = resultadoEval

    const fueraDeRango = resultadoEval.nutrientesEvaluados
      .filter(n => n.esCritico && n.estado !== 'ok')
      .map(n => `${n.label} (${n.estado === 'alto' ? 'alto' : 'bajo'})`)

    evaluacionActual.value.planSeleccionado = {
      texto: resultadoEval.cumpleCriticos
        ? `Minuta ajustada (${items.length} alimentos · metas críticas cumplidas)`
        : `Minuta con desajustes: ${fueraDeRango.join(', ')}`,
      esCorrecta: resultadoEval.cumpleCriticos,
    }
  }

  function registrarPreguntaEntrevista(preguntaId: string): void {
    const lista = evaluacionActual.value.preguntasRealizadasIds ?? []
    if (lista.length >= 3 || lista.includes(preguntaId)) return
    evaluacionActual.value.preguntasRealizadasIds = [...lista, preguntaId]
  }

  // ── Gestión del turno ─────────────────────────────────────────────────────

  function iniciarTurno(filtros: string[] = [], modoRepaso = false): void {
    filtroActivo.value = filtros
    modoRepasoActivo.value = modoRepaso
    turnoActual.value++
    indiceCasoActual.value = 0
    turnoFinalizado.value = false
    estadisticasTurno.value = { correctos: 0, incorrectos: 0 }
    puntosObtenidos.value = 0
    puntosPosibles.value = 0
    mostrandoFeedback.value = false
    ultimoResultado.value = null
    patologiasUsadasTurno.value = []
    erroresSuperadosTurno.value = []

    // Extraer hasta 2 controles si el seguimiento está desbloqueado y no es turno exclusivo de repaso
    if (carrera.seguimientoDesbloqueado && !modoRepaso) {
      colaControlesTurno.value = seguimiento.extraerControlesParaTurno(turnoActual.value)
    } else {
      colaControlesTurno.value = []
    }

    avanzarPaciente()
    iniciarTemporizador()
  }

  /** Inicia un turno compuesto solo por patologías con errores pendientes de repaso. */
  function iniciarTurnoRepaso(): void {
    iniciarTurno([], true)
  }

  function reiniciarJuego(modoRepaso = false, filtros: string[] = []): void {
    detenerTemporizador()
    turnoActual.value = Math.max(0, turnoActual.value)
    indiceCasoActual.value = 0
    turnoFinalizado.value = false
    estadisticasTurno.value = { correctos: 0, incorrectos: 0 }
    mostrandoFeedback.value = false
    ultimoResultado.value = null
    pacienteActual.value = null
    filtroActivo.value = filtros

    iniciarTurno(filtros, modoRepaso)
  }

  // ── Expose ────────────────────────────────────────────────────────────────

  return {
    // Estado
    turnoActual,
    pacienteActual,
    indiceCasoActual,
    estadisticasTurno,
    puntosObtenidos,
    puntosPosibles,
    turnoFinalizado,
    ultimoResultado,
    mostrandoFeedback,
    segundosRestantes,
    tiempoFormateado,
    progresoTiempo,
    tiempoTotalCaso,
    fechaSimulada,
    filtroActivo,
    modoDificultad,
    usaMinutaEnCasoActual,
    modoRepasoActivo,
    erroresSuperadosTurno,
    evaluacionActual,
    evaluacionCompleta,
    casosPorTurno: CASOS_POR_TURNO,
    // Acciones
    timbrarFicha,
    evaluarVeredicto,
    continuarSiguientePaciente,
    iniciarTurno,
    iniciarTurnoRepaso,
    reiniciarJuego,
    avanzarPaciente,
    iniciarTemporizador,
    detenerTemporizador,
    seleccionarDiagnostico,
    seleccionarPlan,
    seleccionarRiesgo,
    seleccionarMecanismo,
    seleccionarEvolucion,
    seleccionarConducta,
    actualizarMinuta,
    registrarPreguntaEntrevista,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGameManager, import.meta.hot))
}

export type CategoriaProgreso = SistemaCorporal | ResultadoAprendizaje
