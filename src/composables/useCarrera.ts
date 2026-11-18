// src/composables/useCarrera.ts
/**
 * Composable de Carrera y Rangos por Dominio Reciente.
 *
 * Calcula el rango actual del estudiante usando la ventana de los últimos 10 intentos
 * de cada Resultado de Aprendizaje (RA) y Sistema Corporal, de modo que un mal
 * comienzo no deje estancado al estudiante.
 *
 * Rangos:
 * 1. 🩺 Interno (Inicio) -> Juego base y repaso de errores
 * 2. 📋 Nutricionista en práctica (≥ 10 casos · ≥ 60% en RA1, RA2 y RA3) -> Entrevista al paciente
 * 3. 🏥 Nutricionista clínico (≥ 25 casos · ≥ 70% en cada RA · ≥ 60% en 4 sistemas) -> Seguimiento de pacientes
 * 4. ⭐ Especialista (≥ 45 casos · ≥ 80% en cada RA · ≥ 70% en todos los sistemas jugados) -> Minuta (modo Difícil)
 * 5. 👑 Jefe de servicio (≥ 70 casos · ≥ 85% en todo) -> Insignia y título
 *
 * Modo docente: abriendo con `?docente=1` desbloquea todas las herramientas.
 *
 * @module useCarrera
 */

import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { useProgressTracker } from './useProgressTracker'
import type { RangoId, ResultadoAprendizaje, SistemaCorporal } from '../types/models'

export interface InfoRango {
  id: RangoId
  orden: number
  icono: string
  titulo: string
  desbloquea: string
  descripcionCorta: string
}

export interface RequisitoItem {
  id: string
  texto: string
  cumplido: boolean
  detalleActual: string
}

export const RANGOS_DEFINICION: InfoRango[] = [
  {
    id: 'interno',
    orden: 1,
    icono: '🩺',
    titulo: 'Interno',
    desbloquea: 'Juego base y repaso de errores',
    descripcionCorta: 'Rotación inicial de auditoría nutricional',
  },
  {
    id: 'practicante',
    orden: 2,
    icono: '📋',
    titulo: 'Nutricionista en práctica',
    desbloquea: 'Entrevista al paciente',
    descripcionCorta: 'Habilitado para anamnesis directa con el paciente',
  },
  {
    id: 'clinico',
    orden: 3,
    icono: '🏥',
    titulo: 'Nutricionista clínico',
    desbloquea: 'Seguimiento de pacientes',
    descripcionCorta: 'Responsable de controles evolutivos a las 4 semanas',
  },
  {
    id: 'especialista',
    orden: 4,
    icono: '⭐',
    titulo: 'Especialista',
    desbloquea: 'Minuta (modo Difícil)',
    descripcionCorta: 'Prescripción dietoterapéutica cuantitativa por porciones',
  },
  {
    id: 'jefe',
    orden: 5,
    icono: '👑',
    titulo: 'Jefe de servicio',
    desbloquea: 'Insignia y título de excelencia clínica',
    descripcionCorta: 'Máximo dominio clínico y farmacológico hospitalario',
  },
]

const RAS: ResultadoAprendizaje[] = ['RA1', 'RA2', 'RA3']
const SISTEMAS: SistemaCorporal[] = [
  'Cardiovascular',
  'Renal',
  'Respiratorio',
  'Digestivo',
  'Endocrino_Metabolico',
  'Musculoesqueletico',
]

function detectarModoDocenteURL(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('docente') === '1'
}

export const useCarrera = defineStore('carrera', () => {
  const tracker = useProgressTracker()

  /** Si se abrió con ?docente=1 (o se activó manualmente), desbloquea todo. */
  const modoDocente = ref<boolean>(detectarModoDocenteURL())

  /** Modal de ascenso pendiente de mostrar al terminar un turno. */
  const rangoAscensoPendiente = ref<InfoRango | null>(null)

  // ── Helpers de evaluación de dominio reciente ──────────────────────────────

  function dominioRecienteRA(ra: ResultadoAprendizaje): number {
    const reg = tracker.progreso.porResultadoAprendizaje[ra]
    if (!reg || reg.ultimosIntentos.length === 0) return 0
    return reg.porcentajeReciente
  }

  function intentosRA(ra: ResultadoAprendizaje): number {
    const reg = tracker.progreso.porResultadoAprendizaje[ra]
    return reg ? reg.correctos + reg.incorrectos : 0
  }

  function todosRACumplen(minPorcentaje: number): boolean {
    return RAS.every(ra => intentosRA(ra) > 0 && dominioRecienteRA(ra) >= minPorcentaje)
  }

  function sistemasJugados(): SistemaCorporal[] {
    return SISTEMAS.filter(sc => {
      const reg = tracker.progreso.porSistemaCorporal[sc]
      return reg && reg.correctos + reg.incorrectos > 0
    })
  }

  function cantidadSistemasConDominio(minPorcentaje: number): number {
    return sistemasJugados().filter(
      sc => tracker.progreso.porSistemaCorporal[sc].porcentajeReciente >= minPorcentaje,
    ).length
  }

  function todosSistemasJugadosCumplen(minPorcentaje: number, minSistemasJugados = 4): boolean {
    const jugados = sistemasJugados()
    if (jugados.length < minSistemasJugados) return false
    return jugados.every(
      sc => tracker.progreso.porSistemaCorporal[sc].porcentajeReciente >= minPorcentaje,
    )
  }

  // ── Evaluación de requisitos por rango ─────────────────────────────────────

  function evaluarRequisitosRango(rangoId: RangoId): RequisitoItem[] {
    const casos = tracker.progreso.casosCompletadosTotal
    const minRA = Math.min(...RAS.map(ra => dominioRecienteRA(ra)))
    const jugados = sistemasJugados()

    switch (rangoId) {
      case 'interno':
        return [
          {
            id: 'inicio',
            texto: 'Iniciar rotación hospitalaria',
            cumplido: true,
            detalleActual: 'Activo',
          },
        ]

      case 'practicante': {
        const cumpleCasos = casos >= 10
        const cumpleRA = todosRACumplen(60)
        return [
          {
            id: 'casos_10',
            texto: '≥ 10 casos completados',
            cumplido: cumpleCasos,
            detalleActual: `${casos}/10 casos`,
          },
          {
            id: 'ra_60',
            texto: '≥ 60 % reciente en RA1, RA2 y RA3',
            cumplido: cumpleRA,
            detalleActual: `RA1: ${dominioRecienteRA('RA1')}% · RA2: ${dominioRecienteRA('RA2')}% · RA3: ${dominioRecienteRA('RA3')}%`,
          },
        ]
      }

      case 'clinico': {
        const cumpleCasos = casos >= 25
        const cumpleRA = todosRACumplen(70)
        const nSist = cantidadSistemasConDominio(60)
        const cumpleSist = nSist >= 4
        return [
          {
            id: 'casos_25',
            texto: '≥ 25 casos completados',
            cumplido: cumpleCasos,
            detalleActual: `${casos}/25 casos`,
          },
          {
            id: 'ra_70',
            texto: '≥ 70 % reciente en cada RA',
            cumplido: cumpleRA,
            detalleActual: `Mínimo RA actual: ${minRA}%`,
          },
          {
            id: 'sist_4_60',
            texto: '≥ 60 % reciente en al menos 4 sistemas',
            cumplido: cumpleSist,
            detalleActual: `${nSist}/4 sistemas`,
          },
        ]
      }

      case 'especialista': {
        const cumpleCasos = casos >= 45
        const cumpleRA = todosRACumplen(80)
        const cumpleSist = todosSistemasJugadosCumplen(70, 4)
        const nCumplen = cantidadSistemasConDominio(70)
        return [
          {
            id: 'casos_45',
            texto: '≥ 45 casos completados',
            cumplido: cumpleCasos,
            detalleActual: `${casos}/45 casos`,
          },
          {
            id: 'ra_80',
            texto: '≥ 80 % reciente en cada RA',
            cumplido: cumpleRA,
            detalleActual: `Mínimo RA actual: ${minRA}%`,
          },
          {
            id: 'sist_todos_70',
            texto: '≥ 70 % en todos los sistemas jugados (mín. 4)',
            cumplido: cumpleSist,
            detalleActual: `${nCumplen}/${Math.max(4, jugados.length)} sistemas`,
          },
        ]
      }

      case 'jefe': {
        const cumpleCasos = casos >= 70
        const cumpleRA = todosRACumplen(85)
        const cumpleSist = todosSistemasJugadosCumplen(85, 4)
        const nCumplen = cantidadSistemasConDominio(85)
        return [
          {
            id: 'casos_70',
            texto: '≥ 70 casos completados',
            cumplido: cumpleCasos,
            detalleActual: `${casos}/70 casos`,
          },
          {
            id: 'ra_85',
            texto: '≥ 85 % reciente en cada RA',
            cumplido: cumpleRA,
            detalleActual: `Mínimo RA actual: ${minRA}%`,
          },
          {
            id: 'sist_todos_85',
            texto: '≥ 85 % en todos los sistemas jugados (mín. 4)',
            cumplido: cumpleSist,
            detalleActual: `${nCumplen}/${Math.max(4, jugados.length)} sistemas`,
          },
        ]
      }
    }
  }

  /** Rango calculado según el progreso actual. */
  const rangoActual = computed<InfoRango>(() => {
    let alcanzado = RANGOS_DEFINICION[0]
    for (const r of RANGOS_DEFINICION) {
      const reqs = evaluarRequisitosRango(r.id)
      if (reqs.every(req => req.cumplido)) {
        alcanzado = r
      } else {
        break
      }
    }
    return alcanzado
  })

  /** Siguiente rango por desbloquear (o null si ya es Jefe de servicio). */
  const proximoRango = computed<InfoRango | null>(() => {
    const idx = RANGOS_DEFINICION.findIndex(r => r.id === rangoActual.value.id)
    if (idx < 0 || idx >= RANGOS_DEFINICION.length - 1) return null
    return RANGOS_DEFINICION[idx + 1]
  })

  /** Requisitos detallados del próximo rango (con ✓ en los cumplidos). */
  const requisitosProximoRango = computed<RequisitoItem[]>(() => {
    if (!proximoRango.value) return []
    return evaluarRequisitosRango(proximoRango.value.id)
  })

  // ── Desbloqueos de herramientas ────────────────────────────────────────────

  /** Rango 2+ (Nutricionista en práctica) o modo docente */
  const entrevistaDesbloqueada = computed<boolean>(
    () => modoDocente.value || rangoActual.value.orden >= 2,
  )

  /** Rango 3+ (Nutricionista clínico) o modo docente */
  const seguimientoDesbloqueado = computed<boolean>(
    () => modoDocente.value || rangoActual.value.orden >= 3,
  )

  /** Rango 4+ (Especialista) o modo docente */
  const minutaDesbloqueada = computed<boolean>(
    () => modoDocente.value || rangoActual.value.orden >= 4,
  )

  // ── Verificación de ascenso al final del turno ─────────────────────────────

  function verificarAscensoFinDeTurno(): void {
    const guardadoId = tracker.progreso.rangoActualId ?? 'interno'
    const guardadoInfo = RANGOS_DEFINICION.find(r => r.id === guardadoId) ?? RANGOS_DEFINICION[0]
    const nuevoInfo = rangoActual.value

    if (nuevoInfo.orden > guardadoInfo.orden) {
      rangoAscensoPendiente.value = nuevoInfo
      tracker.actualizarRangoGuardado(nuevoInfo.id)
    } else if (nuevoInfo.id !== guardadoId) {
      tracker.actualizarRangoGuardado(nuevoInfo.id)
    }
  }

  function cerrarModalAscenso(): void {
    rangoAscensoPendiente.value = null
  }

  return {
    modoDocente,
    rangoActual,
    proximoRango,
    requisitosProximoRango,
    rangoAscensoPendiente,
    entrevistaDesbloqueada,
    seguimientoDesbloqueado,
    minutaDesbloqueada,
    evaluarRequisitosRango,
    verificarAscensoFinDeTurno,
    cerrarModalAscenso,
    todosLosRangos: RANGOS_DEFINICION,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCarrera, import.meta.hot))
}
