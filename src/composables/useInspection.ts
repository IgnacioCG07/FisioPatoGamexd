// src/composables/useInspection.ts
/**
 * Composable para el Modo Inspección ("la lupa").
 *
 * Gestiona el estado del modo de inspección de documentos:
 * el jugador activa la lupa, hace clic en dos datos de distintos documentos
 * y el sistema valida si esa combinación constituye la discrepancia inyectada.
 *
 * Se implementa como composable (no store Pinia) porque su estado es efímero
 * por paciente: se resetea con cada nuevo caso. No necesita persistir entre
 * componentes en capas profundas; App.vue lo instancia y lo pasa por provide/inject
 * o props a los hijos que lo necesitan.
 *
 * @module useInspection
 */

import { ref, computed } from 'vue'

/**
 * Crea y retorna las utilidades del Modo Inspección.
 * Debe instanciarse una sola vez en App.vue y compartirse vía provide/inject.
 */
export function useInspection() {
  // ── Estado ─────────────────────────────────────────────────────────────────

  /** Si el modo inspección (lupa) está activo. */
  const isInspectionModeActive = ref<boolean>(false)

  /**
   * Las dos claves de datos actualmente seleccionadas por el jugador.
   * Máximo 2 elementos. Identificadas por su clave de ruta, ej. "carnet.rut".
   */
  const selectedElements = ref<string[]>([])

  /**
   * Si la discrepancia ha sido formalmente confirmada por el jugador
   * (los dos elementos seleccionados coinciden con los nodos conflictivos del paciente).
   */
  const discrepanciaConfirmada = ref<boolean>(false)

  // ── Acciones ───────────────────────────────────────────────────────────────

  /**
   * Activa o desactiva el Modo Inspección.
   * Al desactivar, limpia la selección y resetea la confirmación.
   */
  function toggleInspectionMode(): void {
    isInspectionModeActive.value = !isInspectionModeActive.value
    if (!isInspectionModeActive.value) {
      resetInspection()
    }
  }

  /**
   * Selecciona un elemento para inspección.
   * Comportamiento cola FIFO de tamaño 2:
   * - Si la clave ya está seleccionada, no hace nada (evita duplicados).
   * - Si hay < 2 elementos, agrega.
   * - Si ya hay 2 elementos, reemplaza el más antiguo (índice 0) con el nuevo.
   *
   * @param clave — Identificador del dato, ej. "receta.medicamentos" o "carnet.fechaVencimiento"
   * @param nodosConflictivos — Nodos conflictivos del paciente actual (para validación inmediata)
   */
  function seleccionarElemento(
    clave: string,
    nodosConflictivos: [string, string] | null,
  ): void {
    if (!isInspectionModeActive.value) return

    // Evitar duplicados
    if (selectedElements.value.includes(clave)) return

    // Cola FIFO tamaño 2
    if (selectedElements.value.length >= 2) {
      selectedElements.value.shift()
    }
    selectedElements.value.push(clave)

    // Validar inmediatamente si ya hay 2 seleccionados
    if (selectedElements.value.length === 2) {
      discrepanciaConfirmada.value = validarDiscrepancia(nodosConflictivos)
    } else {
      discrepanciaConfirmada.value = false
    }
  }

  /**
   * Valida si los dos elementos actualmente seleccionados coinciden
   * (en cualquier orden) con los nodos conflictivos del paciente.
   *
   * @param nodosConflictivos — Tupla [claveA, claveB] del paciente, o null si no hay anomalía
   * @returns `true` si la discrepancia fue correctamente identificada
   */
  function validarDiscrepancia(
    nodosConflictivos: [string, string] | null,
  ): boolean {
    if (!nodosConflictivos || selectedElements.value.length < 2) return false

    const [a, b] = selectedElements.value
    const [ca, cb] = nodosConflictivos

    // Coincidencia independiente del orden
    return (a === ca && b === cb) || (a === cb && b === ca)
  }

  /**
   * Computed que indica si una clave específica está dentro de la selección activa.
   * Útil para que `InspectableText` aplique estilos de resaltado.
   *
   * @param clave — Clave a consultar
   */
  function estaSeleccionado(clave: string): boolean {
    return selectedElements.value.includes(clave)
  }

  /**
   * Resetea el estado de inspección: limpia selección y confirmación.
   * Se debe llamar al cargar un nuevo paciente.
   */
  function resetInspection(): void {
    selectedElements.value = []
    discrepanciaConfirmada.value = false
  }

  // ── Computeds de conveniencia ──────────────────────────────────────────────

  /** Número de elementos seleccionados actualmente (0, 1 o 2). */
  const numSeleccionados = computed(() => selectedElements.value.length)

  /** Si hay exactamente 2 elementos seleccionados pero la discrepancia no coincide. */
  const seleccionIncorrecta = computed(
    () => selectedElements.value.length === 2 && !discrepanciaConfirmada.value,
  )

  return {
    isInspectionModeActive,
    selectedElements,
    discrepanciaConfirmada,
    numSeleccionados,
    seleccionIncorrecta,
    toggleInspectionMode,
    seleccionarElemento,
    validarDiscrepancia,
    estaSeleccionado,
    resetInspection,
  }
}

/** Tipo exportado para uso con provide/inject. */
export type InspectionContext = ReturnType<typeof useInspection>
