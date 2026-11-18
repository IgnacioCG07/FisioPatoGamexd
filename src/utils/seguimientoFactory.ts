// src/utils/seguimientoFactory.ts
/**
 * Generador de casos de Seguimiento ("CONTROL · 4 semanas después").
 *
 * Recibe un RegistroControlAgendado de un turno previo y construye el nuevo
 * expediente evolutivo según las decisiones que tomó el estudiante en la 1ª consulta:
 * - Plan correcto + Riesgo detectado → Valores de laboratorio se acercan a lo normal, paciente mejora.
 * - Plan incorrecto → Valores alterados empeoran y aparece un síntoma nuevo de descompensación.
 * - Riesgo no detectado → Aparece el evento adverso fármaco-nutriente (ej. hiperkalemia, edema agudo, etc.).
 *
 * @module seguimientoFactory
 */

import type {
  Paciente,
  PatologiaClinica,
  RegistroControlAgendado,
  DocumentoLaboratorio,
  DocumentoAnamnesis,
  OpcionEvolucion,
  OpcionConducta,
  OpcionRiesgo,
  OpcionPlan,
} from '../types/models'
import { generarPreguntasEntrevista } from './patientFactory'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatFecha(d: Date): string {
  return d.toISOString().substring(0, 10)
}

/**
 * Eventos adversos específicos por patología cuando no se detectó el riesgo farmacológico.
 */
const EVENTOS_ADVERSOS_POR_PATOLOGIA: Record<
  string,
  {
    evento: string
    sintomaAdverso: string
    parametroLabClave: string
    valorLabAdverso: string
    referenciaLab: string
    estadoLab: 'alto' | 'bajo'
  }
> = {
  sindrome_metabolico: {
    evento: 'Hiperpotasemia e hiperglicemia inducida por interacción medicamentosa (Losartán + K⁺ / Corticoide)',
    sintomaAdverso: 'Parestesias peribucales y debilidad muscular por hiperkalemia leve-moderada',
    parametroLabClave: 'potasio',
    valorLabAdverso: '5.8 mEq/L',
    referenciaLab: '3.5–5.0 mEq/L',
    estadoLab: 'alto',
  },
  epoc: {
    evento: 'Broncoespasmo inducido por betabloqueante no selectivo y retención de CO₂',
    sintomaAdverso: 'Aumento marcado de sibilancias y disnea en reposo tras uso de betabloqueante',
    parametroLabClave: 'saturacion_o2',
    valorLabAdverso: '87 %',
    referenciaLab: '95–100 %',
    estadoLab: 'bajo',
  },
  hipotiroidismo: {
    evento: 'Malabsorción severa de Levotiroxina por quelación intestinal con calcio/hierro simultáneo',
    sintomaAdverso: 'Empeoramiento del mixedema matutino y somnolencia diurna pese a tomar la dosis',
    parametroLabClave: 'tsh',
    valorLabAdverso: '19.4 mUI/L',
    referenciaLab: '0.4–4.0 mUI/L',
    estadoLab: 'alto',
  },
  insuficiencia_cardiaca: {
    evento: 'Descompensación congestiva e injuria renal por uso concomitante de AINEs con Furosemida',
    sintomaAdverso: 'Aumento de 3,5 kg por edema de extremidades inferiores y ortopnea de 3 almohadas',
    parametroLabClave: 'bnp_probnp',
    valorLabAdverso: '3420 pg/mL',
    referenciaLab: '0–125 pg/mL',
    estadoLab: 'alto',
  },
  desnutricion_infantil_aguda: {
    evento: 'Síndrome de Realimentación incipiente con hipofosfatemia por sobrecarga calórica precoz',
    sintomaAdverso: 'Taquicardia, letargia y edema periférico tras realimentación acelerada',
    parametroLabClave: 'fosforo',
    valorLabAdverso: '1.6 mg/dL',
    referenciaLab: '2.5–4.5 mg/dL',
    estadoLab: 'bajo',
  },
  desnutricion_cronica_infantil: {
    evento: 'Falla en la recuperación de zinc sérico por competencia intestinal con hierro simultáneo',
    sintomaAdverso: 'Persistencia de hiporexia y estancamiento ponderoestatural',
    parametroLabClave: 'zinc_serico',
    valorLabAdverso: '52 mcg/dL',
    referenciaLab: '70–120 mcg/dL',
    estadoLab: 'bajo',
  },
  obesidad_infantil: {
    evento: 'Compromiso de velocidad de crecimiento y conductas restrictivas por dieta hipocalórica extrema',
    sintomaAdverso: 'Mareos matutinos, irritabilidad y rechazo a comer en presencia de la familia',
    parametroLabClave: 'glucosa_ayuno',
    valorLabAdverso: '66 mg/dL',
    referenciaLab: '70–99 mg/dL',
    estadoLab: 'bajo',
  },
  diabetes_mellitus_t1: {
    evento: 'Episodios de hipoglicemia severa nocturna por falta de ajuste de insulina',
    sintomaAdverso: 'Sudoración fría nocturna, confusión al despertar y glucemias capilares < 54 mg/dL',
    parametroLabClave: 'glucosa_ayuno',
    valorLabAdverso: '54 mg/dL',
    referenciaLab: '70–99 mg/dL',
    estadoLab: 'bajo',
  },
  sarcopenia_disfagia: {
    evento: 'Microaspiración bronquial por indicación de líquidos finos y sólidos duros sin adaptar',
    sintomaAdverso: 'Tos húmeda persistente durante las comidas y febrícula vespertina',
    parametroLabClave: 'pcr',
    valorLabAdverso: '34.5 mg/L',
    referenciaLab: '0–5 mg/L',
    estadoLab: 'alto',
  },
  lesion_por_presion_sacra: {
    evento: 'Retraso de granulación y deshidratación tisular por diurético sin reposición hídrica',
    sintomaAdverso: 'Lecho ulceroso pálido sin tejido de granulación y mucosas secas',
    parametroLabClave: 'albumina',
    valorLabAdverso: '2.6 g/dL',
    referenciaLab: '3.5–5.0 g/dL',
    estadoLab: 'bajo',
  },
  neumonia_bacteriana_aguda: {
    evento: 'Retención de secreciones bronquiales y catabolismo muscular por antitusígeno/AINE',
    sintomaAdverso: 'Expectoración espesa difícil de eliminar y debilidad muscular generalizada',
    parametroLabClave: 'pcr',
    valorLabAdverso: '48.0 mg/L',
    referenciaLab: '0–5 mg/L',
    estadoLab: 'alto',
  },
  dehiscencia_herida_quirurgica: {
    evento: 'Persistencia de dehiscencia e infección local por mal control glicémico y corticoide',
    sintomaAdverso: 'Bordes quirúrgicos friables con exudado persistente y glicemias > 200 mg/dL',
    parametroLabClave: 'glucosa_ayuno',
    valorLabAdverso: '218 mg/dL',
    referenciaLab: '70–99 mg/dL',
    estadoLab: 'alto',
  },
  deshidratacion_homeostenosis: {
    evento: 'Injuria renal aguda prerrenal por continuidad de Furosemida/AINE en deshidratación',
    sintomaAdverso: 'Oliguria, hipotensión ortostática marcada y somnolencia',
    parametroLabClave: 'creatinina',
    valorLabAdverso: '2.4 mg/dL',
    referenciaLab: '0.6–1.2 mg/dL',
    estadoLab: 'alto',
  },
  sarcopenia_fragilidad_inflammaging: {
    evento: 'Nueva caída domiciliaria asociada a sedación matutina por benzodiacepina',
    sintomaAdverso: 'Hematoma en cadera tras caída matutina y mayor temor a deambular',
    parametroLabClave: 'vitamina_d',
    valorLabAdverso: '14.2 ng/mL',
    referenciaLab: '30–80 ng/mL',
    estadoLab: 'bajo',
  },
  sindrome_geriatrico_complejo: {
    evento: 'Delirium hipoactivo e hiporexia agravada por polifarmacia sedante no corregida',
    sintomaAdverso: 'Somnolencia diurna excesiva y rechazo a sólidos por dolor masticatorio',
    parametroLabClave: 'albumina',
    valorLabAdverso: '2.7 g/dL',
    referenciaLab: '3.5–5.0 g/dL',
    estadoLab: 'bajo',
  },
  anemia_ferropenica: {
    evento: 'Falla terapéutica del Sulfato Ferroso por quelación con café y lácteos simultáneos',
    sintomaAdverso: 'Persistencia de fatiga intensa, palidez, mareos y taquicardia de esfuerzo',
    parametroLabClave: 'hemoglobina',
    valorLabAdverso: '9.4 g/dL',
    referenciaLab: '12.0–17.5 g/dL',
    estadoLab: 'bajo',
  },
  trombosis_warfarina: {
    evento: 'Desestabilización del INR por cambios bruscos en ingesta de vitamina K y suplementos herbales',
    sintomaAdverso: 'Gingivorragia, equimosis espontáneas y alteración marcada de la coagulación',
    parametroLabClave: 'inr',
    valorLabAdverso: '4.6',
    referenciaLab: '2.0–3.0 (rango terapéutico)',
    estadoLab: 'alto',
  },
  hipertension_eje_raas: {
    evento: 'Hiperpotasemia inducida por combinación de Losartán (ARA II) con sustituto de sal rico en KCl',
    sintomaAdverso: 'Debilidad muscular, parestesias y presión arterial no controlada (158/96 mmHg)',
    parametroLabClave: 'potasio',
    valorLabAdverso: '5.9 mEq/L',
    referenciaLab: '3.5–5.0 mEq/L',
    estadoLab: 'alto',
  },
  aterosclerosis_cardiopatia_isquemica: {
    evento: 'Toxicidad muscular (miopatía) por inhibición del CYP3A4 intestinal debido al consumo de pomelo con Atorvastatina',
    sintomaAdverso: 'Mialgias intensas en extremidades inferiores y debilidad proximal',
    parametroLabClave: 'ldl',
    valorLabAdverso: '162 mg/dL',
    referenciaLab: '60–129 mg/dL',
    estadoLab: 'alto',
  },
  erc_hiperpotasemia: {
    evento: 'Hiperpotasemia crítica y sobrecarga de volumen por exceso de K+/Na+ dietario con ARA II y Espironolactona',
    sintomaAdverso: 'Palpitaciones con alteración del ritmo cardíaco y aumento del edema maleolar',
    parametroLabClave: 'potasio',
    valorLabAdverso: '6.3 mEq/L',
    referenciaLab: '3.5–5.0 mEq/L',
    estadoLab: 'alto',
  },
  lra_intrarrenal_nefrotoxicos: {
    evento: 'Agravamiento de la Lesión Tubular Aguda por continuidad de AINEs/nefrotóxicos y catabolismo proteico',
    sintomaAdverso: 'Oliguria persistente, náuseas urémicas y pérdida acelerada de masa muscular',
    parametroLabClave: 'creatinina',
    valorLabAdverso: '3.2 mg/dL',
    referenciaLab: '0.6–1.2 mg/dL',
    estadoLab: 'alto',
  },
  asma_bronquial: {
    evento: 'Candidiasis orofaríngea extensa por falta de enjuague bucal tras ICS e hipopotasemia por abuso de Salbutamol',
    sintomaAdverso: 'Odinofagia por placas blanquecinas orales, temblor distal y taquicardia',
    parametroLabClave: 'potasio',
    valorLabAdverso: '3.1 mEq/L',
    referenciaLab: '3.5–5.0 mEq/L',
    estadoLab: 'bajo',
  },
  fibrosis_restriccion_respiratoria: {
    evento: 'Mayor restricción ventilatoria e hiperglucemia inducida por corticoide sistémico y comidas copiosas',
    sintomaAdverso: 'Aumento de la disnea postprandial, debilidad muscular e hipoxemia',
    parametroLabClave: 'pao2',
    valorLabAdverso: '58 mmHg',
    referenciaLab: '80–100 mmHg',
    estadoLab: 'bajo',
  },
  enfermedad_celiaca_malabsorcion: {
    evento: 'Persistencia de atrofia vellositaria y anemia por contaminación cruzada con gluten e interacción Fe + Ca',
    sintomaAdverso: 'Diarrea crónica persistente, distensión abdominal y fatiga',
    parametroLabClave: 'ferritina',
    valorLabAdverso: '7.5 ng/mL',
    referenciaLab: '30–200 ng/mL',
    estadoLab: 'bajo',
  },
  cirrosis_ascitis_masld: {
    evento: 'Empeoramiento de la ascitis, sarcopenia y disfunción renal por uso de AINEs y restricción proteica errónea',
    sintomaAdverso: 'Ascitis a tensión, consumo muscular marcado y confusión leve',
    parametroLabClave: 'albumina',
    valorLabAdverso: '2.4 g/dL',
    referenciaLab: '3.5–5.0 g/dL',
    estadoLab: 'bajo',
  },
  insuficiencia_pancreatica_exocrina: {
    evento: 'Persistencia de esteatorrea y desnutrición por tomar la Pancrelipasa en ayunas lejos de las comidas',
    sintomaAdverso: 'Deposiciones grasosas constantes, baja de 2,5 kg adicionales y déficit de vitamina D',
    parametroLabClave: 'vitamina_d',
    valorLabAdverso: '11.8 ng/mL',
    referenciaLab: '30–80 ng/mL',
    estadoLab: 'bajo',
  },
}

/**
 * Modifica un valor numérico de laboratorio (ej. "145.2 mg/dL") acercándolo o alejándolo de la normalidad.
 */
function evolucionarValorLab(
  entrada: { valor: string; referencia: string; estado: 'normal' | 'alto' | 'bajo' },
  mejora: boolean,
): { valor: string; referencia: string; estado: 'normal' | 'alto' | 'bajo'; valorAnterior: string } {
  const valorAnterior = entrada.valor
  const match = entrada.valor.match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/)

  if (!match) {
    // Valores cualitativos (ej. Positivo / Negativo)
    if (mejora && entrada.estado !== 'normal') {
      return {
        valor: 'Negativo (Normalizado)',
        referencia: entrada.referencia,
        estado: 'normal',
        valorAnterior,
      }
    }
    return { ...entrada, valorAnterior }
  }

  const num = parseFloat(match[1])
  const unidad = match[2]

  // Extraer rango de referencia si existe (ej. "70–99 mg/dL")
  const refMatch = entrada.referencia.match(/(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)/)

  if (mejora) {
    if (entrada.estado === 'normal') {
      return { ...entrada, valorAnterior }
    }
    if (refMatch) {
      const refMin = parseFloat(refMatch[1])
      const refMax = parseFloat(refMatch[2])
      const puntoMedio = Math.round(((refMin + refMax) / 2) * 10) / 10
      return {
        valor: `${puntoMedio}${unidad ? ' ' + unidad : ''}`,
        referencia: entrada.referencia,
        estado: 'normal',
        valorAnterior,
      }
    }
    const ajustado =
      entrada.estado === 'alto'
        ? Math.round(num * 0.78 * 10) / 10
        : Math.round(num * 1.22 * 10) / 10
    return {
      valor: `${ajustado}${unidad ? ' ' + unidad : ''}`,
      referencia: entrada.referencia,
      estado: 'normal',
      valorAnterior,
    }
  } else {
    // Empeora
    if (entrada.estado === 'alto') {
      const peor = Math.round(num * 1.18 * 10) / 10
      return {
        valor: `${peor}${unidad ? ' ' + unidad : ''}`,
        referencia: entrada.referencia,
        estado: 'alto',
        valorAnterior,
      }
    }
    if (entrada.estado === 'bajo') {
      const peor = Math.max(0.1, Math.round(num * 0.85 * 10) / 10)
      return {
        valor: `${peor}${unidad ? ' ' + unidad : ''}`,
        referencia: entrada.referencia,
        estado: 'bajo',
        valorAnterior,
      }
    }
    return { ...entrada, valorAnterior }
  }
}

/**
 * Construye el paciente de control evolutivo ("CONTROL · 4 semanas después").
 */
export function generarPacienteControl(
  registro: RegistroControlAgendado,
  patologia: PatologiaClinica,
  todasLasPatologias: PatologiaClinica[],
  fechaActual: Date,
): Paciente {
  const { planFueCorrecto, riesgoFueCorrecto } = registro
  const evolucionFavorable = planFueCorrecto && riesgoFueCorrecto

  // 1. Generar nuevo laboratorio según la decisión anterior
  const nuevosResultados: DocumentoLaboratorio['resultados'] = {}
  for (const [clave, resPrevio] of Object.entries(registro.laboratorioBase.resultados)) {
    nuevosResultados[clave] = evolucionarValorLab(resPrevio, planFueCorrecto)
  }

  let eventoAdversoOcurrido: string | undefined
  let sintomaNuevo: string | undefined

  const infoAdverso =
    EVENTOS_ADVERSOS_POR_PATOLOGIA[patologia.id] ??
    EVENTOS_ADVERSOS_POR_PATOLOGIA['sindrome_metabolico']

  if (!riesgoFueCorrecto) {
    eventoAdversoOcurrido = infoAdverso.evento
    sintomaNuevo = `⚠️ EVENTO ADVERSO: ${infoAdverso.sintomaAdverso}`
    const prevVal = nuevosResultados[infoAdverso.parametroLabClave]?.valorAnterior
      ?? registro.laboratorioBase.resultados[infoAdverso.parametroLabClave]?.valor
    nuevosResultados[infoAdverso.parametroLabClave] = {
      valor: infoAdverso.valorLabAdverso,
      referencia: infoAdverso.referenciaLab,
      estado: infoAdverso.estadoLab,
      valorAnterior: prevVal,
    }
  } else if (!planFueCorrecto) {
    sintomaNuevo = '⚠️ Nuevo síntoma: fatiga progresiva y descompensación metabólica por plan nutricional inadecuado'
  }

  const fechaControl = new Date(fechaActual)
  fechaControl.setDate(fechaControl.getDate() + 28)

  const nuevoLaboratorio: DocumentoLaboratorio = {
    fecha: `${formatFecha(fechaControl)} (Control 4 sem.)`,
    resultados: nuevosResultados,
  }

  // 2. Actualizar Anamnesis con el diagnóstico ya conocido y la evolución
  const sintomasControl = evolucionFavorable
    ? [
        'Disminución significativa de los síntomas iniciales tras 4 semanas de adherencia',
        'Mejor tolerancia alimentaria y estabilidad clínica',
      ]
    : [
        ...registro.anamnesisBase.sintomas.slice(0, 3),
        ...(sintomaNuevo ? [sintomaNuevo] : []),
      ]

  const resumenConsultaPrevia = evolucionFavorable
    ? 'En el control anterior se indicó el plan nutricional adecuado y se previno el riesgo farmacológico.'
    : !planFueCorrecto && !riesgoFueCorrecto
      ? 'En el control anterior se indicó un plan nutricional inadecuado y no se advirtió el riesgo farmacológico.'
      : !planFueCorrecto
        ? 'En el control anterior se detectó el riesgo farmacológico, pero el plan nutricional fue inadecuado.'
        : 'En el control anterior el plan nutricional fue apropiado, pero no se corrigió la interacción/riesgo farmacológico.'

  const nuevaAnamnesis: DocumentoAnamnesis = {
    ...registro.anamnesisBase,
    diagnostico: patologia.nombre,
    sintomas: sintomasControl,
    antecedentes: [
      `📅 CONTROL EVOLUTIVO (4 semanas después del Turno ${registro.turnoAtendido})`,
      `Diagnóstico confirmado en 1ª consulta: ${patologia.nombre}`,
      resumenConsultaPrevia,
    ],
    observaciones: `Paciente ${registro.carnet.nombre} ${registro.carnet.apellido} acude a control nutricional a las 4 semanas. ${
      evolucionFavorable
        ? 'Refiere sentirse con más ánimo y haber cumplido las indicaciones.'
        : 'Consulta por persistencia o empeoramiento de molestias clínicas.'
    }`,
  }

  // 3. Opciones de Evolución (Sección 1 en controles)
  const opcionesEvolucion: OpcionEvolucion[] = shuffle<OpcionEvolucion>([
    {
      texto: '📈 Mejoró: normalización progresiva de parámetros gracias al plan nutricional y control farmacológico',
      estado: 'mejoro',
      esCorrecta: evolucionFavorable,
      explicacion: evolucionFavorable
        ? 'Correcto: al acertar tanto el plan como el riesgo farmacológico en la 1ª consulta, los parámetros evolucionaron hacia el rango normal.'
        : 'Incorrecto: revisa el laboratorio actual comparado con el anterior; hay parámetros descompensados o eventos adversos.',
    },
    {
      texto: '📉 Empeoró por plan nutricional inadecuado: descompensación metabólica/clínica sin evento adverso farmacológico primario',
      estado: 'empeoro',
      esCorrecta: !planFueCorrecto && riesgoFueCorrecto,
      explicacion:
        !planFueCorrecto && riesgoFueCorrecto
          ? 'Correcto: el plan nutricional previo no respetó las metas fisiopatológicas, empeorando el laboratorio.'
          : 'Incorrecto: verifica si la causa del estado actual fue el plan nutricional o un evento adverso farmacológico.',
    },
    {
      texto: `⚠️ Empeoró con evento adverso farmacológico: ${infoAdverso.evento}`,
      estado: 'empeoro',
      esCorrecta: !riesgoFueCorrecto,
      explicacion: !riesgoFueCorrecto
        ? `Correcto: al no corregirse el riesgo farmacológico en la 1ª consulta, el paciente desarrolló ${infoAdverso.evento.toLowerCase()}.`
        : 'Incorrecto: en la primera consulta sí se previno el riesgo farmacológico.',
    },
  ])

  // 4. Opciones de Conducta (Sección 2 en controles)
  const opcionesConducta: OpcionConducta[] = shuffle<OpcionConducta>([
    {
      texto: '✅ Mantener el plan nutricional actual y reforzar adherencia para próximo control',
      accion: 'mantener',
      esCorrecta: evolucionFavorable,
      explicacion: evolucionFavorable
        ? 'Correcto: ante una evolución clínica y bioquímica favorable, se mantiene la prescripción dietoterapéutica.'
        : 'Incorrecto: no se debe mantener un manejo cuando el paciente presenta empeoramiento clínico o evento adverso.',
    },
    {
      texto: `🔄 Ajustar de inmediato el plan nutricional (${patologia.tratamientoCorrecto[0]}) y reeducar al paciente`,
      accion: 'ajustar',
      esCorrecta: !planFueCorrecto && riesgoFueCorrecto,
      explicacion:
        !planFueCorrecto && riesgoFueCorrecto
          ? 'Correcto: el deterioro proviene de una prescripción nutricional inadecuada que debe corregirse ahora.'
          : 'Incorrecto: evalúa si el paciente solo requería mantener su plan exitoso o derivación médica por evento adverso.',
    },
    {
      texto: '🏥 Derivar a médico tratante para ajuste farmacológico urgente + corregir pauta nutricional',
      accion: 'derivar',
      esCorrecta: !riesgoFueCorrecto,
      explicacion: !riesgoFueCorrecto
        ? 'Correcto: ante un evento adverso medicamentoso activo en el laboratorio, es indispensable coordinar la modificación farmacológica con el médico además de ajustar la dieta.'
        : 'Incorrecto: no hay un evento adverso farmacológico activo que obligue a derivación urgente.',
    },
  ])

  // 5. Opciones de Riesgo Farmacológico (Sección 3)
  const contraindicacionReal = patologia.contraindicaciones[0]
  const partes = contraindicacionReal.split('—')
  const farmaco = partes[0].trim().split('(')[0].trim()
  const razon = partes[1]?.trim() ?? 'Contraindicado en esta patología'

  const opcionesRiesgoFarmacologico: OpcionRiesgo[] = shuffle<OpcionRiesgo>([
    {
      texto: `⚠️ Riesgo: ${farmaco}`,
      esCorrecta: true,
      justificacion: razon,
    },
    {
      texto: 'Sin riesgos detectados — indicación segura',
      esCorrecta: false,
      justificacion: `Incorrecto: ${farmaco} está contraindicado`,
    },
    {
      texto: 'Requiere monitoreo de laboratorio, pero no hay contraindicación',
      esCorrecta: false,
      justificacion: 'Incorrecto: hay una contraindicación real',
    },
  ])

  // Mantener opciones base por compatibilidad de tipos
  const opcionesPlanNutricional: OpcionPlan[] = [
    { texto: patologia.tratamientoCorrecto[0], esCorrecta: true },
  ]
  const opcionesDiagnostico = [
    patologia.nombre,
    ...todasLasPatologias
      .filter(p => p.id !== patologia.id)
      .slice(0, 3)
      .map(p => p.nombre),
  ]

  return {
    id: `pac-ctrl-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    carnet: registro.carnet,
    anamnesis: nuevaAnamnesis,
    laboratorio: nuevoLaboratorio,
    receta: {
      ...registro.recetaBase,
      diagnostico: patologia.nombre,
    },
    patologiaRef: patologia,
    dificultad: patologia.dificultad,
    opcionesDiagnostico,
    opcionesPlanNutricional,
    opcionesRiesgoFarmacologico,
    esControl: true,
    preguntasEntrevista: generarPreguntasEntrevista(patologia.id),
    datosControl: {
      turnoOriginal: registro.turnoAtendido,
      semanasTranscurridas: 4,
      planAnteriorCorrecto: planFueCorrecto,
      riesgoAnteriorCorrecto: riesgoFueCorrecto,
      resumenConsultaPrevia,
      eventoAdversoOcurrido,
      sintomaNuevo,
      opcionesEvolucion,
      opcionesConducta,
    },
  }
}
