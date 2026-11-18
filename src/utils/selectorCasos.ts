// src/utils/selectorCasos.ts
/**
 * Motor de selección ponderada de casos clínicos y modo Repaso de Errores.
 *
 * Reglas:
 * - En turno normal: evita repetir la misma patología dentro del turno.
 *   Las patologías pendientes de repaso (falladas y con < 2 aciertos seguidos)
 *   tienen mayor peso de selección, especialmente en el mismo turno o los 2 siguientes.
 * - En modo repaso: selecciona exclusivamente patologías pendientes de repaso
 *   (permitiendo repeticiones dentro del turno para poder lograr los 2 aciertos seguidos).
 *
 * @module selectorCasos
 */

import type { PatologiaClinica, HistorialPatologia } from '../types/models'

export interface OpcionesSeleccionCaso {
  /** Base de patologías candidatas (ya filtradas si hay filtro de sistema/RA). */
  candidatas: PatologiaClinica[]
  /** Historial por patología guardado en useProgressTracker. */
  historialPorPatologia: Record<string, HistorialPatologia>
  /** IDs de patologías que ya salieron en el turno actual. */
  usadasEnTurno: string[]
  /** Número del turno actual. */
  turnoActual: number
  /** Si el turno fue iniciado con el botón 🔁 REPASAR ERRORES. */
  modoRepaso: boolean
}

export interface ResultadoSeleccionCaso {
  patologia: PatologiaClinica
  esRepaso: boolean
}

/**
 * Elige un elemento al azar según sus pesos relativos.
 */
function elegirPonderado<T>(items: T[], pesos: number[]): T {
  const totalPeso = pesos.reduce((acc, w) => acc + w, 0)
  if (totalPeso <= 0) {
    return items[Math.floor(Math.random() * items.length)]
  }
  let umbral = Math.random() * totalPeso
  for (let i = 0; i < items.length; i++) {
    umbral -= pesos[i]
    if (umbral <= 0) {
      return items[i]
    }
  }
  return items[items.length - 1]
}

/**
 * Selecciona la siguiente patología para el turno según el historial de errores y modo activo.
 */
export function seleccionarSiguientePatologia(
  opciones: OpcionesSeleccionCaso,
): ResultadoSeleccionCaso {
  const {
    candidatas,
    historialPorPatologia,
    usadasEnTurno,
    turnoActual,
    modoRepaso,
  } = opciones

  if (candidatas.length === 0) {
    throw new Error('No hay patologías candidatas disponibles para seleccionar.')
  }

  // ── MODO REPASO EXCLUSIVO ──────────────────────────────────────────────────
  if (modoRepaso) {
    const pendientes = candidatas.filter(
      p => historialPorPatologia[p.id]?.pendienteRepaso,
    )

    // Si aún quedan errores pendientes, elegir entre ellos (permitiendo repetición en el turno)
    if (pendientes.length > 0) {
      const ultimaUsada = usadasEnTurno[usadasEnTurno.length - 1]
      const pesos = pendientes.map(p => {
        const hist = historialPorPatologia[p.id]
        // Evitar que salga exactamente la misma dos veces seguidas si hay más de 1 pendiente
        if (pendientes.length > 1 && p.id === ultimaUsada) {
          return 0.35
        }
        // Priorizar las que aún tienen 0 aciertos consecutivos
        return hist && hist.aciertosConsecutivos === 0 ? 3.0 : 2.0
      })

      const elegida = elegirPonderado(pendientes, pesos)
      return {
        patologia: elegida,
        esRepaso: true,
      }
    }
    // Si ya superó todos los errores a mitad del turno de repaso, continúa con selección normal
  }

  // ── TURNO NORMAL (sin repetir patología en el mismo turno) ─────────────────
  const noUsadas = candidatas.filter(p => !usadasEnTurno.includes(p.id))
  const pool = noUsadas.length > 0 ? noUsadas : candidatas

  const pesos = pool.map(p => {
    const hist = historialPorPatologia[p.id]
    if (!hist) {
      // Patología aún no vista: ligero impulso para descubrir casos nuevos
      return 1.4
    }
    if (hist.pendienteRepaso) {
      const turnosDesdeFallo = Math.max(0, turnoActual - hist.ultimoTurnoFallo)
      // Mayor probabilidad si falló en este turno o en los 2 turnos anteriores
      if (turnosDesdeFallo <= 2) {
        return 4.5
      }
      return 3.0
    }
    // Ya dominada
    return 1.0
  })

  const elegida = elegirPonderado(pool, pesos)
  const esRepaso = Boolean(historialPorPatologia[elegida.id]?.pendienteRepaso)

  return {
    patologia: elegida,
    esRepaso,
  }
}
