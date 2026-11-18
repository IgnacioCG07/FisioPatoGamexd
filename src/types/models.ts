// src/types/models.ts

/**
 * Grupo etario del paciente, determina qué estándar antropométrico
 * se aplica para calcular su estado nutricional.
 */
export type GrupoEtario =
  | 'infante'
  | 'nino'
  | 'adolescente'
  | 'adulto_joven'
  | 'adulto'
  | 'adulto_mayor'

/**
 * Estado nutricional del paciente, calculado con el estándar
 * apropiado para su grupo etario.
 */
export type EstadoNutricional =
  | 'desnutricion_aguda'
  | 'desnutricion_cronica'
  | 'bajo_peso'
  | 'eutrofia'
  | 'riesgo_sobrepeso'
  | 'sobrepeso'
  | 'obesidad'
  | 'obesidad_sarcopenica'

/**
 * Sistema corporal que evalúa el caso — clasifica el resultado de aprendizaje
 * en la dimensión anatómico-funcional para el seguimiento del progreso.
 */
export type SistemaCorporal =
  | 'Cardiovascular'
  | 'Renal'
  | 'Respiratorio'
  | 'Digestivo'
  | 'Endocrino_Metabolico'
  | 'Musculoesqueletico'

/**
 * Foco fisiopatológico del caso — clasifica el mecanismo principal evaluado.
 * Corresponde a los bloques temáticos de Fisiopatología y Farmacología.
 */
export type FocoFisiopatologico =
  | 'lesion_celular'                 // Clase 1.1: isquemia, ATP, bombas iónicas
  | 'inflamacion_aguda'              // Clase 1.1: mediadores, neutrófilos, respuesta sistémica
  | 'cicatrizacion'                  // Clase 1.1: fases, primera/segunda intención
  | 'homeostenosis'                  // Clase 1.2: reserva funcional, envejecimiento
  | 'sarcopenia_fragilidad'          // Clase 1.2: masa muscular, inflammaging
  | 'sindrome_geriatrico'            // Clase 1.2: envejecimiento patológico vs normal
  | 'anemia_transporte_o2'           // Doc 1 CV: eritrocito, Hb, hipoxia tisular, sulfato ferroso
  | 'hemostasia_trombosis'           // Doc 1 CV: cascada coagulación, warfarina, vitamina K
  | 'eje_raas_hta'                   // Doc 1 CV / Renal: PA = GC x RVP, SRAA, IECA, ARA II, diuréticos
  | 'aterosclerosis_isquemia'        // Doc 1 CV: LDL oxidado, células espumosas, estatinas + pomelo
  | 'insuficiencia_cardiaca'         // Doc 1 CV: congestión, RAAS, furosemida + espironolactona + losartán
  | 'filtracion_lra_erc'             // Doc 2 y 3 Renal: nefrona, LRA prerrenal/intrarrenal/postrenal, ERC, K+
  | 'malabsorcion_digestiva'         // Doc 4 Digestivo: ERGE, celiaquía, EII, gastroparesia
  | 'hepatobiliar_pancreatico'       // Doc 4 Digestivo: MASLD/cirrosis, colestasis, insuf. pancreática
  | 'eje_endocrino'                  // Doc 4 Endocrino: tiroides, Cushing, SOP, horarios fármacos
  | 'ventilacion_intercambio_gaseoso'// Doc 5 Respiratorio: obstructivo vs restrictivo, V/Q, IRA Tipo I y II
  | 'farmacologico'                  // Casos clásicos

/**
 * Una opción para el selector de Mecanismo Fisiopatológico (4ta dimensión, opcional).
 */
export interface OpcionMecanismo {
  texto: string
  esCorrecta: boolean
  /** Explicación del mecanismo correcto. */
  explicacion?: string
}

/**
 * Resultado de Aprendizaje evaluado por el caso:
 * - RA1: Manifestación clínica de la patología no respetada en la indicación.
 * - RA2: Factor de riesgo o blanco terapéutico ignorado.
 * - RA3: Interacción farmacocinética/farmacodinámica o reacción adversa fármaco-nutriente.
 */
export type ResultadoAprendizaje = 'RA1' | 'RA2' | 'RA3'

/**
 * Nivel de dificultad del caso: determina el tiempo disponible para revisarlo
 * (alta = 90 s, media = 120 s, baja = 150 s).
 */
export type Dificultad = 'baja' | 'media' | 'alta'

/**
 * Modo de dificultad del juego:
 * - facil: opciones múltiples con 4 tarjetas por pregunta
 * - dificil: lista desplegable / texto libre + Minuta (desde rango Especialista)
 */
export type ModoDificultad = 'facil' | 'dificil'

/**
 * Dimensiones evaluables en un caso clínico.
 */
export type DimensionEvaluacion = 'diagnostico' | 'plan' | 'riesgo' | 'mecanismo'

/**
 * Definición completa de una patología clínica en la base de datos.
 */
export interface PatologiaClinica {
  id: string
  nombre: string
  grupoEtarioTipico: GrupoEtario[]
  estandarAntropometrico: string
  sintomasValidos: string[]
  valoresLabEsperados: Record<string, string>
  tratamientoCorrecto: string[]
  contraindicaciones: string[]
  interaccionesFarmacoNutriente?: string[]
  /** Razonamiento clínico correcto — visible al estudiante en el feedback post-caso. */
  notasEducativas: string
  /** Sistema corporal que protagoniza el caso. */
  sistemaCorporal: SistemaCorporal
  /** RA que el caso evalúa. */
  resultadoAprendizaje: ResultadoAprendizaje
  /** Dificultad del caso: define el tiempo disponible. */
  dificultad: Dificultad
  /**
   * Foco fisiopatológico del caso (bloque temático del ramo).
   * Los casos de Clase 1.1 y 1.2 tienen foco específico; los farmacológicos usan 'farmacologico'.
   */
  focoFisiopatologico?: FocoFisiopatologico
  /**
   * Descripción breve del foco de análisis — se muestra en el expediente.
   * Ej: "Integración: homeostasis, patogenia, lesión celular y reparación"
   */
  focoClinico?: string
  /**
   * Conceptos clave del ramo que el caso pone en práctica.
   * Se muestran en el feedback para reforzar el aprendizaje.
   */
  conceptosClave?: string[]
  /**
   * Opciones de mecanismo fisiopatológico (4ta sección de evaluación, solo en casos fisiopatológicos).
   * 1 correcta + 2 incorrectas.
   */
  opcionesMecanismo?: OpcionMecanismo[]
}

/**
 * Documento de identidad del paciente.
 */
export interface DocumentoCarnet {
  rut: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  fechaEmision: string
  fechaVencimiento: string
  numeroDocumento: string
}

/**
 * Anamnesis clínica: historia del paciente.
 */
export interface DocumentoAnamnesis {
  diagnostico: string
  sintomas: string[]
  antecedentes: string[]
  pesoKg: number
  tallaCm: number
  edadAnos: number
  estadoNutricional: EstadoNutricional
  estandarUsado: string
  valorIndice: string
  observaciones: string
}

/**
 * Resultados de laboratorio.
 */
export interface DocumentoLaboratorio {
  fecha: string
  resultados: Record<string, { valor: string; referencia: string; estado: 'normal' | 'alto' | 'bajo'; valorAnterior?: string }>
}

/**
 * Receta médica / indicación nutricional emitida para el paciente.
 */
export interface DocumentoReceta {
  medicoNombre: string
  medicoRut: string
  pacienteNombre: string
  pacienteRut: string
  diagnostico: string
  medicamentos: string[]
  indicacionesNutricionales: string[]
  fechaEmision: string
  numeroReceta: string
}

// ─── Entrevista al paciente (Fase 3) ──────────────────────────────────────────

export interface PreguntaEntrevista {
  id: string
  pregunta: string
  respuesta: string
  /** Si esta pregunta revela una pista clave clínica o farmacológica. */
  esClave: boolean
  /** Explicación breve de por qué era importante preguntar esto. */
  importancia?: string
}

// ─── Seguimiento de pacientes (Fase 4) ────────────────────────────────────────

export interface OpcionEvolucion {
  texto: string
  estado: 'mejoro' | 'se_mantuvo' | 'empeoro'
  esCorrecta: boolean
  explicacion: string
}

export interface OpcionConducta {
  texto: string
  accion: 'mantener' | 'ajustar' | 'derivar'
  esCorrecta: boolean
  explicacion: string
}

export interface RegistroControlAgendado {
  id: string
  patologiaId: string
  carnet: DocumentoCarnet
  anamnesisBase: DocumentoAnamnesis
  laboratorioBase: DocumentoLaboratorio
  recetaBase: DocumentoReceta
  sexo: 'M' | 'F'
  turnoAtendido: number
  planFueCorrecto: boolean
  riesgoFueCorrecto: boolean
  diagnosticoFueCorrecto: boolean
}

export interface DatosControlSeguimiento {
  turnoOriginal: number
  semanasTranscurridas: number
  planAnteriorCorrecto: boolean
  riesgoAnteriorCorrecto: boolean
  resumenConsultaPrevia: string
  eventoAdversoOcurrido?: string
  sintomaNuevo?: string
  opcionesEvolucion: OpcionEvolucion[]
  opcionesConducta: OpcionConducta[]
}

// ─── Minuta nutricional (Fase 5) ──────────────────────────────────────────────

export type GrupoAlimento =
  | 'cereales_tuberculos'
  | 'verduras'
  | 'frutas'
  | 'lacteos'
  | 'carnes_huevos_legumbres'
  | 'aceites_grasas'
  | 'azucares_procesados'
  | 'bebidas_suplementos'

export interface AlimentoCatalogo {
  id: string
  nombre: string
  grupo: GrupoAlimento
  porcionTexto: string
  kcal: number
  proteinas: number
  carbohidratos: number
  grasas: number
  sodio: number       // mg
  potasio: number     // mg
  fosforo: number     // mg
  fibra: number       // g
  azucaresSimples: number // g
  tags?: string[]
}

export interface ItemMinuta {
  alimentoId: string
  porciones: number
}

export type NutrienteClave =
  | 'kcal'
  | 'proteinas'
  | 'carbohidratos'
  | 'grasas'
  | 'sodio'
  | 'potasio'
  | 'fosforo'
  | 'fibra'
  | 'azucaresSimples'

export interface RangoMetaNutriente {
  nutriente: NutrienteClave
  label: string
  unidad: string
  min: number
  max: number
  esCritico: boolean
  razonClinica: string
}

export interface ConfigMinutaPatologia {
  patologiaId: string
  instruccionClinica: string
  erroresSembradosDescripcion: string[]
  itemsBase: ItemMinuta[]
  /** Se calcula dinámicamente según el peso del paciente. */
  metasCalculadas: RangoMetaNutriente[]
}

export interface ResultadoEvaluacionMinuta {
  cumpleTodo: boolean
  cumpleCriticos: boolean
  nutrientesEvaluados: {
    nutriente: NutrienteClave
    label: string
    unidad: string
    valorActual: number
    min: number
    max: number
    esCritico: boolean
    estado: 'ok' | 'bajo' | 'alto'
    razonClinica: string
  }[]
}

/**
 * Objeto completo del paciente, generado por patientFactory.
 */
export interface Paciente {
  id: string
  carnet: DocumentoCarnet
  anamnesis: DocumentoAnamnesis
  laboratorio: DocumentoLaboratorio
  receta: DocumentoReceta
  /** Referencia completa a la patología, expuesta para FeedbackAcademico. */
  patologiaRef: PatologiaClinica
  /** Dificultad derivada de la patología: determina el tiempo disponible. */
  dificultad: Dificultad
  /**
   * Opciones de diagnóstico para el modo fácil (4 opciones: 1 correcta + 3 distractores).
   * También sirve como pool para el selector difícil.
   */
  opcionesDiagnostico: string[]
  /**
   * Opciones del plan nutricional: 1 correcto + 2 incorrectos.
   */
  opcionesPlanNutricional: OpcionPlan[]
  /**
   * Opciones de riesgo farmacológico: hay o no hay riesgo, con justificación.
   */
  opcionesRiesgoFarmacologico: OpcionRiesgo[]
  /**
   * Opciones de mecanismo fisiopatológico (4ta sección — solo en casos del ramo Fisiopatología).
   * Undefined en casos farmacológicos clásicos.
   */
  opcionesMecanismo?: OpcionMecanismo[]
  /** Indica si este caso aparece como parte del sistema de Repaso de Errores. */
  esRepaso?: boolean
  /** Preguntas disponibles en la pestaña de Entrevista para este paciente. */
  preguntasEntrevista?: PreguntaEntrevista[]
  /** Indica si es un paciente de seguimiento (Control · 4 semanas después). */
  esControl?: boolean
  /** Datos específicos de evolución y conducta cuando es un control de seguimiento. */
  datosControl?: DatosControlSeguimiento
  /** Configuración de minuta base con errores para corregir en modo Difícil (Rango 4+). */
  configMinuta?: ConfigMinutaPatologia
  /** Nodos conflictivos opcionales para compatibilidad con componentes de inspección. */
  nodosConflictivos?: [string, string] | null
}

/**
 * Una opción para el selector de Plan Nutricional.
 */
export interface OpcionPlan {
  texto: string
  esCorrecta: boolean
}

/**
 * Una opción para el selector de Riesgo Farmacológico.
 */
export interface OpcionRiesgo {
  texto: string
  esCorrecta: boolean
  /** Si es una opción incorrecta, explica por qué no hay riesgo real. */
  justificacion?: string
}

/**
 * Respuestas del estudiante nutricionista para el caso actual.
 */
export interface EvaluacionEstudiante {
  diagnosticoSeleccionado: string | null
  planSeleccionado: OpcionPlan | null
  riesgoSeleccionado: OpcionRiesgo | null
  /** Mecanismo fisiopatológico (4ta sección — solo en casos fisiopatológicos). */
  mecanismoSeleccionado: OpcionMecanismo | null
  /** En casos de Seguimiento (Control): Evolución seleccionada (reemplaza Diagnóstico). */
  evolucionSeleccionada?: OpcionEvolucion | null
  /** En casos de Seguimiento (Control): Conducta seleccionada (reemplaza Plan). */
  conductaSeleccionada?: OpcionConducta | null
  /** En modo Difícil con Minuta desbloqueada: ítems actuales de la minuta y su evaluación. */
  minutaItems?: ItemMinuta[]
  minutaEvaluacion?: ResultadoEvaluacionMinuta | null
  /** IDs de las preguntas realizadas durante la entrevista (máx 3). */
  preguntasRealizadasIds?: string[]
}

/**
 * Estadísticas de una sesión/turno.
 */
export interface EstadisticasTurno {
  correctos: number
  incorrectos: number
}

// ─── Sistema de progreso académico y repaso de errores ────────────────────────

/**
 * Registro de dominio para una categoría (RA o sistema corporal).
 */
export interface RegistroPorCategoria {
  correctos: number
  incorrectos: number
  /** correctos / (correctos + incorrectos) × 100; 0 si no hay intentos. */
  porcentajeDominio: number
  /** Ventana de los últimos 10 intentos (true = acierto, false = fallo) para cálculo de rango. */
  ultimosIntentos: boolean[]
  /** Porcentaje de aciertos en los últimos 10 intentos (dominio reciente). */
  porcentajeReciente: number
}

/**
 * Historial individual por patología para el sistema de Repaso de Errores.
 */
export interface HistorialPatologia {
  patologiaId: string
  nombrePatologia: string
  intentosTotales: number
  aciertosTotales: number
  fallosTotales: number
  /** Aciertos seguidos desde el último fallo. Al llegar a 2, sale de la lista de repaso. */
  aciertosConsecutivos: number
  /** Si está pendiente de repaso (falló alguna vez y aún no logra 2 aciertos seguidos). */
  pendienteRepaso: boolean
  /** Dimensiones en las que falló la última vez que se equivocó. */
  ultimasDimensionesFalladas: DimensionEvaluacion[]
  /** Número de turno en que ocurrió el último fallo. */
  ultimoTurnoFallo: number
}

/**
 * Entrada en el historial cronológico de casos jugados.
 */
export interface RegistroCasoHistorial {
  fechaISO: string
  turno: number
  patologiaId: string
  correcto: boolean
  dimensionesFalladas: DimensionEvaluacion[]
  eraRepaso: boolean
  eraControl?: boolean
}

/**
 * Identificadores de los 5 rangos de carrera clínica.
 */
export type RangoId =
  | 'interno'
  | 'practicante'
  | 'clinico'
  | 'especialista'
  | 'jefe'

/**
 * Estado completo del progreso académico del estudiante,
 * persistido en localStorage entre sesiones.
 */
export interface ProgresoAcademico {
  porResultadoAprendizaje: Record<ResultadoAprendizaje, RegistroPorCategoria>
  porSistemaCorporal: Record<SistemaCorporal, RegistroPorCategoria>
  casosCompletadosTotal: number
  /** Aciertos consecutivos — motivacional, sin penalización al cortarse. */
  rachaActual: number
  /** Historial por patología para el motor de repaso espaciado. */
  historialPorPatologia: Record<string, HistorialPatologia>
  /** Últimos casos jugados (máx 50) para trazabilidad. */
  historialCasos: RegistroCasoHistorial[]
  /** Último rango alcanzado (para detectar ascensos al terminar un turno). */
  rangoActualId: RangoId
}

/**
 * Resultado de la evaluación emitida por el estudiante (timbrado).
 * Consumido por FeedbackAcademico.vue para mostrar el panel post-caso.
 */
export interface ResultadoVeredicto {
  /** Si el estudiante acertó en el diagnóstico (o Evolución en caso de control). */
  diagnosticoCorrecto: boolean
  /** Si el estudiante acertó en el plan nutricional (o Conducta / Minuta). */
  planCorrecto: boolean
  /** Si el estudiante acertó en el riesgo farmacológico. */
  riesgoCorrecto: boolean
  /** Si el estudiante acertó en el mecanismo fisiopatológico (solo casos fisiopatológicos). */
  mecanismoCorrecto: boolean | null
  /** Si acertó en TODOS los aspectos evaluados. */
  correcto: boolean
  /** Patología del caso para mostrar notas educativas y badges. */
  patologia: PatologiaClinica
  /** Evaluación del estudiante para mostrar qué eligió. */
  evaluacion: EvaluacionEstudiante
  /** Si el caso terminó porque se agotó el tiempo. */
  tiempoAgotado?: boolean
  /** Si el caso era de repaso y con este acierto superó el error (2 aciertos seguidos). */
  errorSuperado?: boolean
  /** Si el caso era un control de seguimiento. */
  esControl?: boolean
  /** Datos del control para mostrar retroalimentación de evolución/conducta. */
  datosControl?: DatosControlSeguimiento
  /** Preguntas disponibles en la entrevista de este caso (para mostrar cuáles hizo y cuáles faltaron). */
  preguntasEntrevista?: PreguntaEntrevista[]
  /** Si se evaluó mediante el constructor de Minuta en modo Difícil. */
  usoMinuta?: boolean
  /** Mensaje opcional de resumen para notificaciones. */
  mensaje?: string
}
