// src/composables/useProgressTracker.ts
/**
 * Composable de Progreso Académico para Práctica Clínica.
 *
 * Persiste el avance del estudiante en localStorage bajo la clave
 * "practica-clinica-progreso", permitiendo que el progreso se mantenga
 * entre sesiones (hoy, mañana, antes de un examen).
 *
 * Incluye:
 * - Ventana móvil de los últimos 10 intentos por RA y Sistema Corporal (dominio reciente)
 * - Historial por patología para el motor de Repaso de Errores (superado con 2 aciertos seguidos)
 * - Migración automática de datos guardados de versiones anteriores
 * - Soporte HMR con acceptHMRUpdate
 *
 * @module useProgressTracker
 */

import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ProgresoAcademico,
  RegistroPorCategoria,
  ResultadoAprendizaje,
  SistemaCorporal,
  PatologiaClinica,
  DimensionEvaluacion,
  HistorialPatologia,
  RangoId,
} from '../types/models'

const STORAGE_KEY = 'practica-clinica-progreso'
const VENTANA_RECIENTE = 10
const ACIERTOS_PARA_SUPERAR = 2

// ─── Fábrica de registro vacío ────────────────────────────────────────────────

/** Crea un registro de dominio con valores iniciales en cero. */
function registroVacio(): RegistroPorCategoria {
  return {
    correctos: 0,
    incorrectos: 0,
    porcentajeDominio: 0,
    ultimosIntentos: [],
    porcentajeReciente: 0,
  }
}

/** Crea el estado de progreso académico completamente vacío. */
function progresoVacio(): ProgresoAcademico {
  return {
    porResultadoAprendizaje: {
      RA1: registroVacio(),
      RA2: registroVacio(),
      RA3: registroVacio(),
    },
    porSistemaCorporal: {
      Cardiovascular: registroVacio(),
      Renal: registroVacio(),
      Respiratorio: registroVacio(),
      Digestivo: registroVacio(),
      Endocrino_Metabolico: registroVacio(),
      Musculoesqueletico: registroVacio(),
    },
    casosCompletadosTotal: 0,
    rachaActual: 0,
    historialPorPatologia: {},
    historialCasos: [],
    rangoActualId: 'interno',
  }
}

// ─── Helpers de cálculo y migración ───────────────────────────────────────────

/**
 * Recalcula el porcentaje de dominio acumulado y reciente (últimos 10 intentos).
 * Devuelve 0 si no hay intentos para evitar NaN.
 */
function recalcularDominio(r: RegistroPorCategoria): void {
  const total = r.correctos + r.incorrectos
  r.porcentajeDominio = total === 0 ? 0 : Math.round((r.correctos / total) * 100)

  if (!Array.isArray(r.ultimosIntentos)) {
    r.ultimosIntentos = []
  }
  if (r.ultimosIntentos.length > VENTANA_RECIENTE) {
    r.ultimosIntentos = r.ultimosIntentos.slice(-VENTANA_RECIENTE)
  }
  const nRec = r.ultimosIntentos.length
  const aciertosRec = r.ultimosIntentos.filter(Boolean).length
  r.porcentajeReciente = nRec === 0 ? 0 : Math.round((aciertosRec / nRec) * 100)
}

/**
 * Migra un RegistroPorCategoria antiguo (sin ultimosIntentos) reconstruyendo
 * una ventana sintética proporcional a sus aciertos/errores previos.
 */
function migrarRegistroCategoria(reg?: Partial<RegistroPorCategoria>): RegistroPorCategoria {
  const base = registroVacio()
  if (!reg) return base

  base.correctos = typeof reg.correctos === 'number' ? reg.correctos : 0
  base.incorrectos = typeof reg.incorrectos === 'number' ? reg.incorrectos : 0

  if (Array.isArray(reg.ultimosIntentos) && reg.ultimosIntentos.length > 0) {
    base.ultimosIntentos = reg.ultimosIntentos.slice(-VENTANA_RECIENTE)
  } else {
    const total = base.correctos + base.incorrectos
    if (total > 0) {
      const muestra = Math.min(VENTANA_RECIENTE, total)
      const nCorrectos = Math.round((base.correctos / total) * muestra)
      const reconstruidos: boolean[] = []
      for (let i = 0; i < muestra; i++) {
        reconstruidos.push(i < nCorrectos)
      }
      base.ultimosIntentos = reconstruidos
    }
  }

  recalcularDominio(base)
  return base
}

/**
 * Migra cualquier estado previo en localStorage a la estructura actual sin perder datos.
 */
function migrarProgreso(rawObj: Partial<ProgresoAcademico>): ProgresoAcademico {
  const vacio = progresoVacio()

  const ras: ResultadoAprendizaje[] = ['RA1', 'RA2', 'RA3']
  for (const ra of ras) {
    vacio.porResultadoAprendizaje[ra] = migrarRegistroCategoria(
      rawObj.porResultadoAprendizaje?.[ra],
    )
  }

  const sistemas: SistemaCorporal[] = [
    'Cardiovascular',
    'Renal',
    'Respiratorio',
    'Digestivo',
    'Endocrino_Metabolico',
    'Musculoesqueletico',
  ]
  for (const sc of sistemas) {
    vacio.porSistemaCorporal[sc] = migrarRegistroCategoria(
      rawObj.porSistemaCorporal?.[sc],
    )
  }

  vacio.casosCompletadosTotal =
    typeof rawObj.casosCompletadosTotal === 'number' ? rawObj.casosCompletadosTotal : 0
  vacio.rachaActual =
    typeof rawObj.rachaActual === 'number' ? rawObj.rachaActual : 0
  vacio.historialPorPatologia =
    rawObj.historialPorPatologia && typeof rawObj.historialPorPatologia === 'object'
      ? rawObj.historialPorPatologia
      : {}
  vacio.historialCasos = Array.isArray(rawObj.historialCasos)
    ? rawObj.historialCasos.slice(-50)
    : []
  vacio.rangoActualId = rawObj.rangoActualId ?? 'interno'

  return vacio
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface OpcionesRegistroResultado {
  dimensionesFalladas?: DimensionEvaluacion[]
  turno?: number
  eraRepaso?: boolean
  eraControl?: boolean
}

export const useProgressTracker = defineStore('progressTracker', () => {
  // ── Estado ──────────────────────────────────────────────────────────────────

  function cargarDesdeStorage(): ProgresoAcademico {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return progresoVacio()
      const parsed = JSON.parse(raw) as Partial<ProgresoAcademico>
      if (!parsed.porResultadoAprendizaje || !parsed.porSistemaCorporal) {
        return progresoVacio()
      }
      return migrarProgreso(parsed)
    } catch {
      return progresoVacio()
    }
  }

  const progreso = ref<ProgresoAcademico>(cargarDesdeStorage())

  // ── Persistencia ────────────────────────────────────────────────────────────

  function persistir(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progreso.value))
  }

  // ── Acciones ────────────────────────────────────────────────────────────────

  /**
   * Registra el resultado de un caso y actualiza:
   * - Registros por RA y Sistema Corporal (incluyendo ventana de últimos 10 intentos)
   * - Historial por patología (repaso de errores: sale de la lista al acertar 2 veces seguidas)
   * - Racha y total de casos completados
   *
   * @returns `true` si la patología estaba pendiente de repaso y con este acierto quedó superada (2 seguidos).
   */
  function registrarResultado(
    caso: PatologiaClinica,
    fueCorrecto: boolean,
    opciones: OpcionesRegistroResultado = {},
  ): boolean {
    const { resultadoAprendizaje, sistemaCorporal } = caso
    const {
      dimensionesFalladas = [],
      turno = 1,
      eraRepaso = false,
      eraControl = false,
    } = opciones

    // 1. Actualizar registro por RA
    const porRA = progreso.value.porResultadoAprendizaje as Record<string, RegistroPorCategoria>
    const regRA = (porRA[resultadoAprendizaje] ??= registroVacio())
    if (fueCorrecto) regRA.correctos++
    else regRA.incorrectos++
    regRA.ultimosIntentos.push(fueCorrecto)
    recalcularDominio(regRA)

    // 2. Actualizar registro por sistema corporal
    const porSC = progreso.value.porSistemaCorporal as Record<string, RegistroPorCategoria>
    const regSC = (porSC[sistemaCorporal] ??= registroVacio())
    if (fueCorrecto) regSC.correctos++
    else regSC.incorrectos++
    regSC.ultimosIntentos.push(fueCorrecto)
    recalcularDominio(regSC)

    // 3. Actualizar historial por patología (Repaso de errores)
    const histMap = progreso.value.historialPorPatologia
    const hist: HistorialPatologia = histMap[caso.id] ?? {
      patologiaId: caso.id,
      nombrePatologia: caso.nombre,
      intentosTotales: 0,
      aciertosTotales: 0,
      fallosTotales: 0,
      aciertosConsecutivos: 0,
      pendienteRepaso: false,
      ultimasDimensionesFalladas: [],
      ultimoTurnoFallo: 0,
    }

    const estabaPendiente = hist.pendienteRepaso
    hist.intentosTotales++
    hist.nombrePatologia = caso.nombre

    let errorSuperadoAhora = false

    if (fueCorrecto) {
      hist.aciertosTotales++
      hist.aciertosConsecutivos++
      if (estabaPendiente && hist.aciertosConsecutivos >= ACIERTOS_PARA_SUPERAR) {
        hist.pendienteRepaso = false
        hist.ultimasDimensionesFalladas = []
        errorSuperadoAhora = true
      }
    } else {
      hist.fallosTotales++
      hist.aciertosConsecutivos = 0
      hist.pendienteRepaso = true
      hist.ultimasDimensionesFalladas =
        dimensionesFalladas.length > 0 ? [...dimensionesFalladas] : ['diagnostico']
      hist.ultimoTurnoFallo = turno
    }

    histMap[caso.id] = hist

    // 4. Guardar entrada en historial cronológico (máx 50)
    progreso.value.historialCasos.push({
      fechaISO: new Date().toISOString(),
      turno,
      patologiaId: caso.id,
      correcto: fueCorrecto,
      dimensionesFalladas,
      eraRepaso,
      eraControl,
    })
    if (progreso.value.historialCasos.length > 50) {
      progreso.value.historialCasos = progreso.value.historialCasos.slice(-50)
    }

    // 5. Racha motivacional y contador total
    progreso.value.rachaActual = fueCorrecto ? progreso.value.rachaActual + 1 : 0
    progreso.value.casosCompletadosTotal++

    persistir()
    return errorSuperadoAhora
  }

  function actualizarRangoGuardado(nuevoRango: RangoId): void {
    progreso.value.rangoActualId = nuevoRango
    persistir()
  }

  function obtenerProgreso(): ProgresoAcademico {
    return progreso.value
  }

  function obtenerAreasDebiles(umbral = 60, minIntentos = 3): string[] {
    const debiles: string[] = []

    for (const [ra, reg] of Object.entries(progreso.value.porResultadoAprendizaje)) {
      const total = reg.correctos + reg.incorrectos
      if (total >= minIntentos && reg.porcentajeDominio < umbral) {
        debiles.push(ra)
      }
    }

    for (const [sistema, reg] of Object.entries(progreso.value.porSistemaCorporal)) {
      const total = reg.correctos + reg.incorrectos
      if (total >= minIntentos && reg.porcentajeDominio < umbral) {
        debiles.push(sistema)
      }
    }

    return debiles
  }

  function reiniciarProgreso(): void {
    progreso.value = progresoVacio()
    persistir()
  }

  // ── Computeds de conveniencia ────────────────────────────────────────────────

  /** Lista de patologías que actualmente están pendientes de repaso (falladas y con < 2 aciertos seguidos). */
  const patologiasPendientesRepaso = computed<HistorialPatologia[]>(() =>
    Object.values(progreso.value.historialPorPatologia).filter(h => h.pendienteRepaso),
  )

  /** Cantidad de patologías pendientes de repaso para el botón 🔁 REPASAR ERRORES (N). */
  const cantidadErroresPendientes = computed<number>(() => patologiasPendientesRepaso.value.length)

  /** RA con al menos 1 intento registrado. */
  const raConDatos = computed<ResultadoAprendizaje[]>(() =>
    (Object.keys(progreso.value.porResultadoAprendizaje) as ResultadoAprendizaje[]).filter(
      ra =>
        progreso.value.porResultadoAprendizaje[ra].correctos +
          progreso.value.porResultadoAprendizaje[ra].incorrectos >
        0,
    ),
  )

  /** Sistemas con al menos 1 intento registrado. */
  const sistemasConDatos = computed<SistemaCorporal[]>(() =>
    (Object.keys(progreso.value.porSistemaCorporal) as SistemaCorporal[]).filter(
      sc =>
        progreso.value.porSistemaCorporal[sc].correctos +
          progreso.value.porSistemaCorporal[sc].incorrectos >
        0,
    ),
  )

  /** Dominio global acumulado. */
  const dominioGlobal = computed<number>(() => {
    const todos = [
      ...Object.values(progreso.value.porResultadoAprendizaje),
      ...Object.values(progreso.value.porSistemaCorporal),
    ].filter(r => r.correctos + r.incorrectos > 0)

    if (todos.length === 0) return 0
    return Math.round(todos.reduce((s, r) => s + r.porcentajeDominio, 0) / todos.length)
  })

  /** Dominio reciente global (basado en la ventana de los últimos 10 intentos). */
  const dominioRecienteGlobal = computed<number>(() => {
    const todos = [
      ...Object.values(progreso.value.porResultadoAprendizaje),
      ...Object.values(progreso.value.porSistemaCorporal),
    ].filter(r => r.ultimosIntentos.length > 0)

    if (todos.length === 0) return 0
    return Math.round(todos.reduce((s, r) => s + r.porcentajeReciente, 0) / todos.length)
  })

  // ── Expose ───────────────────────────────────────────────────────────────────

  return {
    progreso,
    registrarResultado,
    actualizarRangoGuardado,
    obtenerProgreso,
    obtenerAreasDebiles,
    reiniciarProgreso,
    patologiasPendientesRepaso,
    cantidadErroresPendientes,
    raConDatos,
    sistemasConDatos,
    dominioGlobal,
    dominioRecienteGlobal,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProgressTracker, import.meta.hot))
}
