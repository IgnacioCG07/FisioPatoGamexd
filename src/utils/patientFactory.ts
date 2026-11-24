// src/utils/patientFactory.ts
/**
 * Motor procedural de generación de pacientes para Práctica Clínica (modo Nutricionista).
 *
 * Genera un paciente completo con:
 * - Documentos clínicos (carnet, anamnesis, laboratorio, receta)
 * - Opciones de diagnóstico (4 opciones: 1 correcta + 3 distractores)
 * - Opciones de plan nutricional (3 opciones: 1 correcta + 2 incorrectas)
 * - Opciones de riesgo farmacológico (3 opciones: 1 correcta + 2 incorrectas)
 *
 * @module patientFactory
 */

import type {
  PatologiaClinica,
  Paciente,
  GrupoEtario,
  EstadoNutricional,
  DocumentoCarnet,
  DocumentoAnamnesis,
  DocumentoLaboratorio,
  DocumentoReceta,
  OpcionPlan,
  OpcionRiesgo,
  OpcionMecanismo,
  PreguntaEntrevista,
  ConfigMinutaPatologia,
  RangoMetaNutriente,
  NutrienteClave,
  ItemMinuta,
} from '../types/models'
import entrevistasRaw from '../data/entrevistas.json'
import objetivosMinutaRaw from '../data/objetivosMinuta.json'

interface EntrevistasData {
  genericas: PreguntaEntrevista[]
  porPatologia: Record<string, PreguntaEntrevista[]>
}

interface ReglaMinutaJSON {
  nutriente: NutrienteClave
  label: string
  unidad: string
  min?: number
  max?: number
  minPerKg?: number
  maxPerKg?: number
  esCritico: boolean
  razonClinica: string
}

interface ConfigMinutaJSON {
  instruccionClinica: string
  erroresSembradosDescripcion: string[]
  itemsBase: ItemMinuta[]
  reglas: ReglaMinutaJSON[]
}

const entrevistasData = entrevistasRaw as unknown as EntrevistasData
const objetivosMinutaMap = objetivosMinutaRaw as unknown as Record<string, ConfigMinutaJSON>

// ─── Tablas de datos auxiliares ──────────────────────────────────────────────

/** Rangos de edad (en años) por grupo etario. */
const RANGOS_EDAD: Record<GrupoEtario, [number, number]> = {
  infante: [0, 2],
  nino: [2, 11],
  adolescente: [12, 18],
  adulto_joven: [18, 30],
  adulto: [30, 64],
  adulto_mayor: [65, 90],
}

/** Nombres masculinos y femeninos para generación aleatoria. */
const NOMBRES_M = [
  'Rodrigo', 'Matías', 'Sebastián', 'Diego', 'Felipe', 'Nicolás',
  'Ignacio', 'Tomás', 'Alejandro', 'Héctor', 'Raúl', 'Ernesto',
  'Lucas', 'Marco', 'Andrés', 'Pablo', 'Cristóbal', 'Agustín',
]
const NOMBRES_F = [
  'Valentina', 'Camila', 'Fernanda', 'Javiera', 'Daniela', 'Constanza',
  'Isadora', 'Catalina', 'Sofía', 'Gabriela', 'Lorena', 'Patricia',
  'Luz', 'María', 'Rosa', 'Cecilia', 'Andrea', 'Francisca',
]
const APELLIDOS = [
  'González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto',
  'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez',
  'López', 'Fuentes', 'Hernández', 'Torres', 'Ramírez', 'Flores',
]
const MEDICOS = [
  { nombre: 'Dr. Patricio Riquelme', rut: '8.234.567-K' },
  { nombre: 'Dra. Carmen Valdivia', rut: '9.876.543-2' },
  { nombre: 'Dr. Esteban Mujica', rut: '12.345.678-9' },
  { nombre: 'Dra. Ximena Cárdenas', rut: '14.567.890-3' },
  { nombre: 'Dr. Roberto Iturra', rut: '7.890.123-6' },
]

// ─── Utilidades numéricas ─────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randElem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randFloat(min: number, max: number, decimales = 1): number {
  const factor = Math.pow(10, decimales)
  return Math.round((Math.random() * (max - min) + min) * factor) / factor
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Generación de RUT chileno ────────────────────────────────────────────────

function generarRut(base?: number): string {
  const num = base ?? randInt(5_000_000, 25_000_000)
  const dv = calcularDV(num)
  const str = num.toLocaleString('es-CL').replace(/\./g, '.')
  return `${str}-${dv}`
}

function calcularDV(rut: number): string {
  let m = 2
  let sum = 0
  let r = rut
  while (r > 0) {
    sum += (r % 10) * m
    r = Math.floor(r / 10)
    m = m === 7 ? 2 : m + 1
  }
  const res = 11 - (sum % 11)
  if (res === 11) return '0'
  if (res === 10) return 'K'
  return String(res)
}

// ─── Generación de fechas ─────────────────────────────────────────────────────

function formatFecha(d: Date): string {
  return d.toISOString().substring(0, 10)
}

function sumarAnos(d: Date, anos: number): Date {
  const r = new Date(d)
  r.setFullYear(r.getFullYear() + anos)
  return r
}

function restarAnos(d: Date, anos: number): Date {
  return sumarAnos(d, -anos)
}

function fechaNacimientoDesdEdad(edadAnos: number, fechaActual: Date): Date {
  return restarAnos(fechaActual, edadAnos)
}

// ─── Generación de antropometría ──────────────────────────────────────────────

interface Antropometria {
  pesoKg: number
  tallaCm: number
  estadoNutricional: EstadoNutricional
  valorIndice: string
  estandarUsado: string
}

function generarAntropometria(
  grupo: GrupoEtario,
  edadAnos: number,
  sexo: 'M' | 'F',
): Antropometria {
  switch (grupo) {
    case 'infante': return generarAntropometriaInfante(edadAnos, sexo)
    case 'nino': return generarAntropometriaNino(edadAnos, sexo)
    case 'adolescente': return generarAntropometriaAdolescente(edadAnos, sexo)
    case 'adulto_joven': return generarAntropometriaAdulto(edadAnos, sexo, [18.5, 25, 30])
    case 'adulto': return generarAntropometriaAdulto(edadAnos, sexo, [18.5, 25, 30])
    case 'adulto_mayor': return generarAntropometriaAdultoMayor(edadAnos, sexo)
  }
}

function generarAntropometriaInfante(edadAnos: number, _sexo: 'M' | 'F'): Antropometria {
  const estados: EstadoNutricional[] = ['desnutricion_aguda', 'eutrofia', 'riesgo_sobrepeso', 'desnutricion_cronica']
  const estado = randElem(estados)
  const meses = Math.round(edadAnos * 12)
  const tallaBase = 49 + meses * 0.8
  let talla: number, peso: number, zScore: number

  switch (estado) {
    case 'desnutricion_aguda':
      talla = Math.round(tallaBase + randFloat(-1, 0))
      zScore = randFloat(-3.5, -2.1, 1)
      peso = Math.round(((talla - 50) * 0.09 + 3.3) * (1 + zScore * 0.1) * 10) / 10
      peso = Math.max(peso, 2.5)
      return { pesoKg: peso, tallaCm: talla, estadoNutricional: estado, valorIndice: `Z P/T: ${zScore}`, estandarUsado: 'OMS Peso/Talla (Z-score)' }
    case 'desnutricion_cronica':
      zScore = randFloat(-3.0, -2.1, 1)
      talla = Math.round(tallaBase + zScore * 2)
      peso = Math.round(((talla - 50) * 0.09 + 3.3) * 10) / 10
      return { pesoKg: peso, tallaCm: talla, estadoNutricional: estado, valorIndice: `Z T/E: ${zScore}`, estandarUsado: 'OMS Talla/Edad (Z-score)' }
    case 'riesgo_sobrepeso':
      talla = Math.round(tallaBase)
      zScore = randFloat(1.1, 2.0, 1)
      peso = Math.round(((talla - 50) * 0.09 + 3.3) * (1 + zScore * 0.1) * 10) / 10
      return { pesoKg: peso, tallaCm: talla, estadoNutricional: estado, valorIndice: `Z P/T: +${zScore}`, estandarUsado: 'OMS Peso/Talla (Z-score)' }
    default:
      talla = Math.round(tallaBase)
      zScore = randFloat(-1.0, 1.0, 1)
      peso = Math.round(((talla - 50) * 0.09 + 3.3) * 10) / 10
      return { pesoKg: peso, tallaCm: talla, estadoNutricional: 'eutrofia', valorIndice: `Z P/T: ${zScore > 0 ? '+' : ''}${zScore}`, estandarUsado: 'OMS Peso/Talla (Z-score)' }
  }
}

function generarAntropometriaNino(edadAnos: number, sexo: 'M' | 'F'): Antropometria {
  const tallaBase = sexo === 'M'
    ? 85 + (edadAnos - 2) * 6.5
    : 84 + (edadAnos - 2) * 6.3

  const estados: EstadoNutricional[] = ['bajo_peso', 'eutrofia', 'sobrepeso', 'obesidad']
  const estado = randElem(estados)
  let imc: number, peso: number
  const talla = Math.round(tallaBase + randFloat(-2, 2))
  const tallaMt = talla / 100

  switch (estado) {
    case 'bajo_peso': imc = randFloat(12.0, 14.5, 1); break
    case 'sobrepeso': imc = randFloat(18.5, 21.9, 1); break
    case 'obesidad': imc = randFloat(22.0, 27.0, 1); break
    default: imc = randFloat(15.0, 18.4, 1)
  }

  peso = Math.round(imc * tallaMt * tallaMt * 10) / 10
  const puntajeZ = estado === 'bajo_peso' ? randFloat(-2.5, -1.1, 1)
    : estado === 'sobrepeso' ? randFloat(1.1, 2.0, 1)
    : estado === 'obesidad' ? randFloat(2.1, 3.5, 1)
    : randFloat(-1.0, 1.0, 1)

  return {
    pesoKg: peso, tallaCm: talla, estadoNutricional: estado,
    valorIndice: `IMC/edad: ${imc} (Z: ${puntajeZ > 0 ? '+' : ''}${puntajeZ})`,
    estandarUsado: 'OMS IMC/Edad (Z-score)',
  }
}

function generarAntropometriaAdolescente(edadAnos: number, sexo: 'M' | 'F'): Antropometria {
  const tallaBase = sexo === 'M'
    ? 155 + (edadAnos - 12) * 2.5
    : 152 + (edadAnos - 12) * 1.0

  const estados: EstadoNutricional[] = ['bajo_peso', 'eutrofia', 'sobrepeso', 'obesidad']
  const estado = randElem(estados)
  const talla = Math.round(tallaBase + randFloat(-3, 3))
  const tallaMt = talla / 100
  let imc: number

  switch (estado) {
    case 'bajo_peso': imc = randFloat(14.0, 17.4, 1); break
    case 'sobrepeso': imc = randFloat(22.0, 24.9, 1); break
    case 'obesidad': imc = randFloat(25.0, 32.0, 1); break
    default: imc = randFloat(17.5, 21.9, 1)
  }

  const peso = Math.round(imc * tallaMt * tallaMt * 10) / 10
  const pZ = estado === 'bajo_peso' ? randFloat(-2.5, -1.1, 1)
    : estado === 'sobrepeso' ? randFloat(1.1, 2.0, 1)
    : estado === 'obesidad' ? randFloat(2.1, 3.5, 1)
    : randFloat(-1.0, 1.0, 1)

  return {
    pesoKg: peso, tallaCm: talla, estadoNutricional: estado,
    valorIndice: `IMC/edad: ${imc} (Z: ${pZ > 0 ? '+' : ''}${pZ})`,
    estandarUsado: 'OMS IMC/Edad adolescentes',
  }
}

function generarAntropometriaAdulto(edadAnos: number, sexo: 'M' | 'F', limites: [number, number, number]): Antropometria {
  const [limBajoPeso, limSobrepeso, limObesidad] = limites
  const tallaBase = sexo === 'M' ? randFloat(165, 180, 0) : randFloat(155, 168, 0)
  const talla = Math.round(tallaBase)
  const tallaMt = talla / 100

  const estados: EstadoNutricional[] = ['bajo_peso', 'eutrofia', 'sobrepeso', 'obesidad']
  const estado = randElem(estados)
  let imc: number

  switch (estado) {
    case 'bajo_peso': imc = randFloat(15.0, limBajoPeso - 0.1, 1); break
    case 'sobrepeso': imc = randFloat(limSobrepeso, limObesidad - 0.1, 1); break
    case 'obesidad': imc = randFloat(limObesidad, 40.0, 1); break
    default: imc = randFloat(limBajoPeso, limSobrepeso - 0.1, 1)
  }

  const peso = Math.round(imc * tallaMt * tallaMt * 10) / 10
  const cintura = estado === 'obesidad' || estado === 'sobrepeso'
    ? (sexo === 'M' ? randFloat(92, 115, 0) : randFloat(82, 105, 0))
    : (sexo === 'M' ? randFloat(75, 89, 0) : randFloat(65, 79, 0))

  void edadAnos

  return {
    pesoKg: peso, tallaCm: talla, estadoNutricional: estado,
    valorIndice: `IMC: ${imc} | Cintura: ${cintura} cm`,
    estandarUsado: 'IMC clásico OMS adultos',
  }
}

function generarAntropometriaAdultoMayor(edadAnos: number, sexo: 'M' | 'F'): Antropometria {
  const tallaBase = sexo === 'M'
    ? randFloat(158, 172, 0) - (edadAnos - 65) * 0.1
    : randFloat(148, 162, 0) - (edadAnos - 65) * 0.1
  const talla = Math.max(Math.round(tallaBase), 140)
  const tallaMt = talla / 100

  const estados: EstadoNutricional[] = ['bajo_peso', 'eutrofia', 'sobrepeso', 'obesidad_sarcopenica']
  const estado = randElem(estados)
  let imc: number

  switch (estado) {
    case 'bajo_peso': imc = randFloat(16.0, 21.9, 1); break
    case 'sobrepeso': imc = randFloat(27.1, 30.0, 1); break
    case 'obesidad_sarcopenica': imc = randFloat(30.1, 38.0, 1); break
    default: imc = randFloat(22.0, 27.0, 1)
  }

  const peso = Math.round(imc * tallaMt * tallaMt * 10) / 10
  const pantorrilla = estado === 'bajo_peso' || estado === 'obesidad_sarcopenica'
    ? (sexo === 'M' ? randFloat(27, 30, 1) : randFloat(26, 30, 1))
    : (sexo === 'M' ? randFloat(31, 38, 1) : randFloat(31, 36, 1))
  const fuerza = estado === 'bajo_peso' || estado === 'obesidad_sarcopenica'
    ? (sexo === 'M' ? randFloat(18, 26, 1) : randFloat(12, 15, 1))
    : (sexo === 'M' ? randFloat(27, 38, 1) : randFloat(16, 24, 1))

  return {
    pesoKg: peso, tallaCm: talla, estadoNutricional: estado,
    valorIndice: `IMC: ${imc} | Pantorrilla: ${pantorrilla} cm | Prensión: ${fuerza} kg`,
    estandarUsado: 'IMC ampliado adulto mayor + tamizaje sarcopenia',
  }
}

// ─── Generación de laboratorio ────────────────────────────────────────────────

function generarLaboratorio(patologia: PatologiaClinica, fechaActual: Date): DocumentoLaboratorio {
  const labMap = patologia.valoresLabEsperados
  const resultados: DocumentoLaboratorio['resultados'] = {}

  const definiciones: Record<string, {
    label: string; unidad: string; refMin: number; refMax: number
    valorNormal: [number, number]; valorAlto: [number, number]; valorBajo: [number, number]
  }> = {
    glucosa_ayuno: { label: 'Glucosa en ayuno', unidad: 'mg/dL', refMin: 70, refMax: 99, valorNormal: [80, 99], valorAlto: [100, 180], valorBajo: [55, 69] },
    trigliceridos: { label: 'Triglicéridos', unidad: 'mg/dL', refMin: 50, refMax: 149, valorNormal: [80, 149], valorAlto: [150, 350], valorBajo: [40, 79] },
    hdl: { label: 'HDL-Colesterol', unidad: 'mg/dL', refMin: 40, refMax: 80, valorNormal: [41, 80], valorAlto: [81, 100], valorBajo: [25, 39] },
    ldl: { label: 'LDL-Colesterol', unidad: 'mg/dL', refMin: 60, refMax: 129, valorNormal: [70, 129], valorAlto: [130, 220], valorBajo: [40, 69] },
    hba1c: { label: 'Hemoglobina Glicosilada (HbA1c)', unidad: '%', refMin: 4.0, refMax: 5.6, valorNormal: [4.0, 5.6], valorAlto: [5.7, 12.0], valorBajo: [3.0, 3.9] },
    presion_arterial: { label: 'Presión Arterial Sistólica', unidad: 'mmHg', refMin: 90, refMax: 129, valorNormal: [100, 129], valorAlto: [130, 180], valorBajo: [80, 89] },
    tsh: { label: 'TSH', unidad: 'mUI/L', refMin: 0.4, refMax: 4.0, valorNormal: [0.5, 4.0], valorAlto: [4.1, 30.0], valorBajo: [0.1, 0.3] },
    t4_libre: { label: 'T4 Libre', unidad: 'ng/dL', refMin: 0.8, refMax: 1.8, valorNormal: [0.8, 1.8], valorAlto: [1.9, 3.0], valorBajo: [0.3, 0.7] },
    colesterol_total: { label: 'Colesterol Total', unidad: 'mg/dL', refMin: 100, refMax: 199, valorNormal: [130, 199], valorAlto: [200, 320], valorBajo: [80, 129] },
    bnp_probnp: { label: 'NT-proBNP', unidad: 'pg/mL', refMin: 0, refMax: 125, valorNormal: [0, 125], valorAlto: [126, 5000], valorBajo: [0, 0] },
    sodio: { label: 'Sodio', unidad: 'mEq/L', refMin: 136, refMax: 145, valorNormal: [136, 145], valorAlto: [146, 155], valorBajo: [125, 135] },
    potasio: { label: 'Potasio', unidad: 'mEq/L', refMin: 3.5, refMax: 5.0, valorNormal: [3.5, 5.0], valorAlto: [5.1, 6.5], valorBajo: [2.5, 3.4] },
    creatinina: { label: 'Creatinina', unidad: 'mg/dL', refMin: 0.6, refMax: 1.2, valorNormal: [0.6, 1.2], valorAlto: [1.3, 3.5], valorBajo: [0.3, 0.5] },
    albumina: { label: 'Albúmina sérica', unidad: 'g/dL', refMin: 3.5, refMax: 5.0, valorNormal: [3.5, 5.0], valorAlto: [5.1, 5.8], valorBajo: [1.8, 3.4] },
    hemoglobina: { label: 'Hemoglobina', unidad: 'g/dL', refMin: 12.0, refMax: 17.5, valorNormal: [12.5, 17.5], valorAlto: [17.6, 20.0], valorBajo: [7.0, 12.4] },
    cpeptido: { label: 'Péptido C', unidad: 'ng/mL', refMin: 0.5, refMax: 2.0, valorNormal: [0.5, 2.0], valorAlto: [2.1, 4.0], valorBajo: [0.01, 0.49] },
    cetonas_orina: { label: 'Cuerpos cetónicos (orina)', unidad: '', refMin: 0, refMax: 0, valorNormal: [0, 0], valorAlto: [1, 3], valorBajo: [0, 0] },
    anticuerpos_anti_gad: { label: 'Anticuerpos Anti-GAD', unidad: 'UI/mL', refMin: 0, refMax: 5, valorNormal: [0, 5], valorAlto: [6, 200], valorBajo: [0, 0] },
    igf1: { label: 'IGF-1 (factor de crecimiento)', unidad: 'ng/mL', refMin: 88, refMax: 360, valorNormal: [88, 360], valorAlto: [361, 600], valorBajo: [30, 87] },
    zinc_serico: { label: 'Zinc sérico', unidad: 'mcg/dL', refMin: 70, refMax: 120, valorNormal: [70, 120], valorAlto: [121, 180], valorBajo: [30, 69] },
    fosforo: { label: 'Fósforo', unidad: 'mg/dL', refMin: 2.5, refMax: 4.5, valorNormal: [2.5, 4.5], valorAlto: [4.6, 7.0], valorBajo: [1.0, 2.4] },
    vitamina_d: { label: 'Vitamina D (25-OH)', unidad: 'ng/mL', refMin: 30, refMax: 80, valorNormal: [30, 80], valorAlto: [81, 120], valorBajo: [8, 29] },
    pcr: { label: 'Proteína C Reactiva', unidad: 'mg/L', refMin: 0, refMax: 5, valorNormal: [0, 5], valorAlto: [6, 80], valorBajo: [0, 0] },
    insulina_basal: { label: 'Insulina basal', unidad: 'μUI/mL', refMin: 2, refMax: 15, valorNormal: [2, 15], valorAlto: [16, 50], valorBajo: [0.5, 1.9] },
    homa_ir: { label: 'HOMA-IR', unidad: '', refMin: 0, refMax: 2.5, valorNormal: [0, 2.5], valorAlto: [2.6, 8.0], valorBajo: [0, 0] },
    hematocrito: { label: 'Hematocrito', unidad: '%', refMin: 36, refMax: 52, valorNormal: [36, 52], valorAlto: [53, 60], valorBajo: [22, 35] },
    proteinas_totales: { label: 'Proteínas totales', unidad: 'g/dL', refMin: 6.0, refMax: 8.5, valorNormal: [6.0, 8.5], valorAlto: [8.6, 10.0], valorBajo: [3.0, 5.9] },
    ldl_normal_alto: { label: 'LDL-Colesterol', unidad: 'mg/dL', refMin: 60, refMax: 129, valorNormal: [110, 129], valorAlto: [130, 160], valorBajo: [60, 69] },
    saturacion_o2: { label: 'Saturación de O₂', unidad: '%', refMin: 95, refMax: 100, valorNormal: [95, 100], valorAlto: [100, 100], valorBajo: [85, 94] },
    espirometria_vef1_cvf: { label: 'Espirometría VEF1/CVF', unidad: '', refMin: 0.70, refMax: 1.0, valorNormal: [0.70, 1.0], valorAlto: [0.75, 0.90], valorBajo: [0.35, 0.69] },
    urea: { label: 'Urea sérica', unidad: 'mg/dL', refMin: 15, refMax: 40, valorNormal: [18, 38], valorAlto: [45, 110], valorBajo: [8, 14] },
    tfg_estimada: { label: 'TFG estimada', unidad: 'mL/min/1,73m²', refMin: 90, refMax: 120, valorNormal: [90, 115], valorAlto: [121, 135], valorBajo: [18, 58] },
    bicarbonato: { label: 'Bicarbonato (HCO₃⁻)', unidad: 'mEq/L', refMin: 22, refMax: 29, valorNormal: [22, 28], valorAlto: [30, 36], valorBajo: [14, 21] },
    ferritina: { label: 'Ferritina sérica', unidad: 'ng/mL', refMin: 30, refMax: 200, valorNormal: [45, 160], valorAlto: [210, 500], valorBajo: [4, 18] },
    inr: { label: 'INR (T. Protrombina)', unidad: '', refMin: 2.0, refMax: 3.0, valorNormal: [2.1, 2.9], valorAlto: [3.6, 5.4], valorBajo: [1.1, 1.7] },
    pao2: { label: 'PaO₂ arterial', unidad: 'mmHg', refMin: 80, refMax: 100, valorNormal: [82, 98], valorAlto: [101, 110], valorBajo: [52, 74] },
    paco2: { label: 'PaCO₂ arterial', unidad: 'mmHg', refMin: 35, refMax: 45, valorNormal: [36, 44], valorAlto: [48, 65], valorBajo: [26, 34] },
    elastasa_fecal: { label: 'Elastasa pancreática fecal', unidad: 'mcg/g', refMin: 200, refMax: 500, valorNormal: [250, 480], valorAlto: [501, 600], valorBajo: [40, 140] },
    anticuerpos_antitransglutaminasa: { label: 'Ac. Anti-transglutaminasa IgA', unidad: 'U/mL', refMin: 0, refMax: 10, valorNormal: [1, 8], valorAlto: [45, 180], valorBajo: [0, 0] },
    bilirrubina_total: { label: 'Bilirrubina total', unidad: 'mg/dL', refMin: 0.2, refMax: 1.2, valorNormal: [0.3, 1.1], valorAlto: [1.8, 4.8], valorBajo: [0.1, 0.2] },
  }

  for (const [clave, estado] of Object.entries(labMap)) {
    const def = definiciones[clave] ?? definiciones['glucosa_ayuno']
    let valor: number
    let estadoReal: 'normal' | 'alto' | 'bajo'

    if (estado.includes('alto') || estado === 'positivo' || estado === 'elevado_exacerbacion' || estado === 'elevada_exacerbacion' || estado === 'elevado') {
      valor = randFloat(def.valorAlto[0], def.valorAlto[1], 1)
      estadoReal = 'alto'
    } else if (estado.includes('bajo') || estado === 'muy_bajo' || estado === 'baja' || estado === 'bajas') {
      valor = randFloat(def.valorBajo[0], def.valorBajo[1], 1)
      estadoReal = 'bajo'
    } else {
      valor = randFloat(def.valorNormal[0], def.valorNormal[1], 1)
      estadoReal = 'normal'
    }

    if (clave === 'cetonas_orina') {
      resultados[clave] = { valor: estadoReal === 'alto' ? 'Positivo (++/+++)' : 'Negativo', referencia: 'Negativo', estado: estadoReal }
    } else if (clave === 'anticuerpos_anti_gad') {
      resultados[clave] = { valor: estadoReal === 'alto' ? `${valor} UI/mL (Positivo)` : `${valor} UI/mL (Negativo)`, referencia: `< 5 UI/mL (Negativo)`, estado: estadoReal }
    } else if (clave === 'anticuerpos_antitransglutaminasa') {
      resultados[clave] = { valor: estadoReal === 'alto' ? `${valor} U/mL (Positivo)` : `${valor} U/mL (Negativo)`, referencia: `< 10 U/mL (Negativo)`, estado: estadoReal }
    } else if (clave === 'espirometria_vef1_cvf') {
      resultados[clave] = { valor: String(valor), referencia: `≥ 0.70 (normal)`, estado: estadoReal }
    } else if (clave === 'inr') {
      resultados[clave] = { valor: String(valor), referencia: `2.0–3.0 (rango terapéutico)`, estado: estadoReal }
    } else {
      resultados[clave] = { valor: `${valor} ${def.unidad}`, referencia: `${def.refMin}–${def.refMax} ${def.unidad}`, estado: estadoReal }
    }
  }

  const fechaLab = new Date(fechaActual)
  fechaLab.setDate(fechaLab.getDate() - randInt(1, 14))

  return { fecha: formatFecha(fechaLab), resultados }
}

// ─── Generación de documentos ─────────────────────────────────────────────────

function generarCarnet(
  nombre: string, apellido: string, rut: string,
  fechaNacimiento: Date, fechaActual: Date,
): DocumentoCarnet {
  const emision = restarAnos(fechaActual, randInt(1, 5))
  const vencimiento = sumarAnos(emision, 10)

  return {
    rut, nombre, apellido,
    fechaNacimiento: formatFecha(fechaNacimiento),
    fechaEmision: formatFecha(emision),
    fechaVencimiento: formatFecha(vencimiento),
    numeroDocumento: String(randInt(10_000_000, 99_999_999)),
  }
}

function generarReceta(
  nombrePaciente: string, rutPaciente: string, diagnostico: string,
  medicamentos: string[], indicaciones: string[], fechaActual: Date,
): DocumentoReceta {
  const medico = randElem(MEDICOS)
  const fechaReceta = new Date(fechaActual)
  fechaReceta.setDate(fechaReceta.getDate() - randInt(0, 7))

  return {
    medicoNombre: medico.nombre,
    medicoRut: medico.rut,
    pacienteNombre: nombrePaciente,
    pacienteRut: rutPaciente,
    diagnostico,
    medicamentos: [...medicamentos],
    indicacionesNutricionales: [...indicaciones],
    fechaEmision: formatFecha(fechaReceta),
    numeroReceta: `REC-${randInt(100_000, 999_999)}`,
  }
}

// ─── Generación de opciones clínicas ─────────────────────────────────────────

/**
 * Genera 4 opciones de diagnóstico: 1 correcta + 3 distractores de la base de datos.
 */
function generarOpcionesDiagnostico(
  patologiaCorrecta: PatologiaClinica,
  todasLasPatologias: PatologiaClinica[],
): string[] {
  const distractores = todasLasPatologias
    .filter(p => p.id !== patologiaCorrecta.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(p => p.nombre)

  return shuffle([patologiaCorrecta.nombre, ...distractores])
}

/**
 * Genera 3 opciones de plan nutricional: 1 correcta + 2 incorrectas.
 * La correcta es la primera indicación nutricional real.
 * Las incorrectas son variantes plausibles pero erróneas.
 */
function generarOpcionesPlanNutricional(patologia: PatologiaClinica): OpcionPlan[] {
  const indicacionesNutricionales = patologia.tratamientoCorrecto.filter(t =>
    t.toLowerCase().includes('dieta') ||
    t.toLowerCase().includes('nutr') ||
    t.toLowerCase().includes('aliment') ||
    t.toLowerCase().includes('restrict') ||
    t.toLowerCase().includes('textura') ||
    t.toLowerCase().includes('espesante') ||
    t.toLowerCase().includes('proteín') ||
    t.toLowerCase().includes('suplement') ||
    t.toLowerCase().includes('kcal')
  )

  const planCorrecto = indicacionesNutricionales[0] ?? patologia.tratamientoCorrecto[0]

  // Contraindicaciones como distractores incorrectos
  const distractor1 = patologia.contraindicaciones[0]?.split('—')[0].trim()
    ?? 'Dieta hipercalórica sin restricciones'
  const distractor2 = patologia.contraindicaciones[1]?.split('—')[0].trim()
    ?? 'Ayuno intermitente 24h sin supervisión'

  return shuffle<OpcionPlan>([
    { texto: planCorrecto, esCorrecta: true },
    { texto: distractor1, esCorrecta: false },
    { texto: distractor2, esCorrecta: false },
  ])
}

/**
 * Genera 3 opciones de riesgo farmacológico / interacción con formato homogéneo.
 * 1 correcta (del cuadro clínico actual) y 2 distractores plausibles de otras patologías.
 */
function generarOpcionesRiesgoFarmacologico(
  patologia: PatologiaClinica,
  todasLasPatologias: PatologiaClinica[],
): OpcionRiesgo[] {
  const extraerResumenRiesgo = (p: PatologiaClinica): { titulo: string; razon: string } => {
    const raw = p.contraindicaciones[0] ?? 'Automedicación sin control — riesgo de descompensación'
    const partes = raw.split('—')
    const farmaco = partes[0].trim().split('(')[0].trim()
    const razon = partes[1]?.trim() ?? 'Contraindicado en esta patología'
    return { titulo: farmaco, razon }
  }

  const real = extraerResumenRiesgo(patologia)
  const otras = shuffle(
    todasLasPatologias.filter(p => p.id !== patologia.id && p.contraindicaciones.length > 0),
  )

  const distractores: OpcionRiesgo[] = []
  for (const cand of otras) {
    const d = extraerResumenRiesgo(cand)
    if (d.titulo.toLowerCase() !== real.titulo.toLowerCase() && !distractores.some(x => x.texto === d.titulo)) {
      distractores.push({
        texto: d.titulo,
        esCorrecta: false,
        justificacion: `No corresponde al riesgo principal de este cuadro: el riesgo crítico aquí es ${real.titulo} (${real.razon}).`,
      })
    }
    if (distractores.length >= 2) break
  }

  return shuffle<OpcionRiesgo>([
    {
      texto: real.titulo,
      esCorrecta: true,
      justificacion: real.razon,
    },
    ...distractores,
  ])
}

/**
 * Genera 3 opciones de mecanismo fisiopatológico (4ta dimensión).
 * Solo aplica en casos con `opcionesMecanismo` definidas en la base de datos.
 * Devuelve null si el caso no tiene esta dimensión.
 */
function generarOpcionesMecanismo(patologia: PatologiaClinica): OpcionMecanismo[] | null {
  if (!patologia.opcionesMecanismo || patologia.opcionesMecanismo.length === 0) return null
  return shuffle<OpcionMecanismo>([...patologia.opcionesMecanismo])
}

/**
 * Genera las 8 preguntas de entrevista para el caso (5 específicas de la patología + 3 genéricas).
 */
export function generarPreguntasEntrevista(patologiaId: string): PreguntaEntrevista[] {
  const especificas = entrevistasData.porPatologia[patologiaId] ?? []
  const genericas = shuffle(entrevistasData.genericas).slice(0, Math.max(0, 8 - especificas.length))
  return shuffle([...especificas, ...genericas]).slice(0, 8)
}

/**
 * Construye la configuración de minuta y metas escaladas al peso del paciente.
 */
export function generarConfigMinuta(
  patologiaId: string,
  pesoKg: number,
): ConfigMinutaPatologia {
  const cfg =
    objetivosMinutaMap[patologiaId] ?? objetivosMinutaMap['sindrome_metabolico']

  const pesoEfectivo = Math.max(8, pesoKg)

  const metasCalculadas: RangoMetaNutriente[] = cfg.reglas.map(r => {
    const min =
      r.minPerKg !== undefined
        ? Math.round(r.minPerKg * pesoEfectivo)
        : (r.min ?? 0)
    const max =
      r.maxPerKg !== undefined
        ? Math.round(r.maxPerKg * pesoEfectivo)
        : (r.max ?? 9999)
    return {
      nutriente: r.nutriente,
      label: r.label,
      unidad: r.unidad,
      min,
      max,
      esCritico: r.esCritico,
      razonClinica: r.razonClinica,
    }
  })

  return {
    patologiaId,
    instruccionClinica: cfg.instruccionClinica,
    erroresSembradosDescripcion: [...cfg.erroresSembradosDescripcion],
    itemsBase: cfg.itemsBase.map(i => ({ ...i })),
    metasCalculadas,
  }
}

// ─── Función principal exportada ──────────────────────────────────────────────


/** Antecedentes clínicos realistas por patología (sin revelar el diagnóstico ni la respuesta). */
const ANTECEDENTES_CLINICOS: Record<string, string[]> = {
  sindrome_metabolico: [
    'Sedentarismo prolongado (trabajo de oficina > 8 h/día) y dieta habitual alta en ultraprocesados.',
    'Antecedente familiar de primer grado con patología cardiovascular y alteraciones de la glicemia.',
  ],
  epoc: [
    'Historial de tabaquismo crónico (> 25 paquetes-año) y exposición prolongada a humo ambiental.',
    'Dos consultas en urgencia durante el último invierno por descompensación respiratoria.',
  ],
  hipotiroidismo: [
    'Refiere aumento ponderal progresivo, intolerancia al frío y fatiga matutina de 8 meses de evolución.',
    'Acostumbra tomar su medicación matutina junto con el desayuno y suplementos minerales.',
  ],
  insuficiencia_cardiaca: [
    'Antecedente de hipertensión arterial de larga data con disnea al subir un piso de escaleras.',
    'Refiere que el calzado le aprieta al final de la tarde y necesita dormir con dos o tres almohadas.',
  ],
  desnutricion_infantil_aguda: [
    'Cuadro de diarrea recurrente e ingesta alimentaria muy reducida durante las últimas 3 semanas.',
    'Madre refiere decaimiento marcado, irritabilidad y pérdida visible de tejido subcutáneo.',
  ],
  desnutricion_cronica_infantil: [
    'Alimentación complementaria con bajo aporte de proteínas de alto valor biológico y micronutrientes.',
    'Curva ponderoestatural con desaceleración sostenida en los últimos controles pediátricos.',
  ],
  obesidad_infantil: [
    'Tiempo frente a pantallas > 4 horas diarias y consumo frecuente de bebidas azucaradas en colaciones.',
    'Ambos padres con exceso ponderal; derivado desde control pediátrico para manejo integral.',
  ],
  diabetes_mellitus_t1: [
    'Cuadro de 3 semanas de sed intensa, micción frecuente nocturna y pérdida de peso involuntaria.',
    'Sin enfermedades crónicas previas diagnosticadas; derivado tras exámenes de urgencia.',
  ],
  sarcopenia_disfagia: [
    'Adulto mayor con pérdida involuntaria de peso y prolongación del tiempo de cada comida (> 45 min).',
    'Familiares notan carraspeo frecuente y cambio en la voz después de beber agua o caldos líquidos.',
  ],
  lesion_por_presion_sacra: [
    'Hospitalización prolongada con movilidad reducida en cama durante las últimas 3 semanas.',
    'Ingesta oral inferior al 60% de la bandeja hospitalaria por inapetencia persistente.',
  ],
  neumonia_bacteriana_aguda: [
    'Cuadro agudo de 5 días de evolución con fiebre alta, escalofríos y dolor torácico al inspirar.',
    'Ingesta oral disminuida por fatiga y sensación de falta de aire al alimentarse.',
  ],
  dehiscencia_herida_quirurgica: [
    'Postoperatorio abdominal día 10 con evolución tórpida en los bordes de la herida operatoria.',
    'Control glicémico irregular previo a la cirugía y bajo consumo proteico en domicilio.',
  ],
  deshidratacion_homeostenosis: [
    'Adulto mayor que vive solo; baja ingesta de agua durante episodio de calor ambiental reciente.',
    'Uso crónico de fármacos para la presión y analgésicos de venta libre por dolor articular.',
  ],
  sarcopenia_fragilidad_inflammaging: [
    'Dos caídas a nivel en los últimos 6 meses y dificultad progresiva para levantarse de la silla.',
    'Baja exposición solar y dieta monótona basada principalmente en té, pan blanco y sopas claras.',
  ],
  sindrome_geriatrico_complejo: [
    'Polifarmacia de larga data (≥ 5 fármacos diarios) y pérdida de piezas dentales posteriores.',
    'Cuidador reporta somnolencia diurna, lentitud en la marcha y menor interés por las comidas.',
  ],
  anemia_ferropenica: [
    'Fatiga progresiva de 4 meses, cefalea vespertina y menor tolerancia a las actividades diarias.',
    'Alto consumo de té negro, café y lácteos inmediatamente junto con las comidas principales.',
  ],
  trombosis_warfarina: [
    'En tratamiento médico oral de mantenimiento tras evento vascular venoso reciente.',
    'Modificó drásticamente su alimentación hace 2 semanas incorporando grandes porciones de hojas verdes.',
  ],
  hipertension_eje_raas: [
    'Cifras tensionales persistentemente elevadas en controles seriados de atención primaria.',
    'Uso habitual de salero en la mesa y consumo frecuente de embutidos, quesos maduros y conservas.',
  ],
  aterosclerosis_cardiopatia_isquemica: [
    'Antecedente de molestia opresiva en el pecho desencadenada por esfuerzos físicos moderados.',
    'En tratamiento farmacológico nocturno para el colesterol; desayuna jugo de pomelo diariamente.',
  ],
  erc_hiperpotasemia: [
    'Deterioro crónico y progresivo de la función excretora con controles médicos irregulares.',
    'Consumo frecuente de sustitutos de sal, frutos secos y legumbres en su pauta habitual.',
  ],
  lra_intrarrenal_nefrotoxicos: [
    'Disminución brusca del volumen urinario en las últimas 48 horas tras automedicación analgésica alta.',
    'Ingresado para estabilización clínica y ajuste de soporte hidroelectrolítico y nutricional.',
  ],
  asma_bronquial: [
    'Episodios recurrentes de opresión torácica nocturna y sibilancias desencadenados por frío o polvo.',
    'Utiliza terapia inhalatoria diaria pero refiere molestias faríngeas por no enjuagar la boca.',
  ],
  fibrosis_restriccion_respiratoria: [
    'Falta de aire progresiva al esfuerzo de más de 1 año de evolución con expansión torácica limitada.',
    'Refiere saciedad precoz marcada cuando intenta consumir platos de volumen normal.',
  ],
  enfermedad_celiaca_malabsorcion: [
    'Distensión abdominal postprandial crónica, diarrea intermitente y pérdida de peso no intencional.',
    'Las molestias digestivas se acentúan tras consumir pastas, pan tradicional y productos de trigo.',
  ],
  cirrosis_ascitis_masld: [
    'Antecedente hepático metabólico de larga data con aumento progresivo del volumen abdominal.',
    'Presenta saciedad precoz por tensión abdominal y pérdida de masa muscular en brazos y piernas.',
  ],
  insuficiencia_pancreatica_exocrina: [
    'Deposiciones voluminosas, brillantes y difíciles de evacuar acompañadas de molestia epigástrica.',
    'Baja de peso progresiva pese a conservar el apetito; toma sus cápsulas lejos del horario de comida.',
  ],
}

export interface OpcionesGenerarPaciente {
  patologiaForzada?: PatologiaClinica
  esRepaso?: boolean
}

/**
 * Genera un paciente completo para el modo Nutricionista.
 *
 * @param baseDeDatos — Array de patologías clínicas ya filtradas
 * @param todasLasPatologias — Array completo para generar distractores de diagnóstico
 * @param fechaActual — Fecha simulada del sistema
 * @param opcionesExtra — Patología específica seleccionada y marca de repaso
 */
export function generarPaciente(
  baseDeDatos: PatologiaClinica[],
  todasLasPatologias: PatologiaClinica[],
  fechaActual: Date,
  opcionesExtra?: OpcionesGenerarPaciente,
): Paciente {
  // 1. Patología seleccionada por selectorCasos o aleatoria
  const patologia = opcionesExtra?.patologiaForzada ?? randElem(baseDeDatos)

  // 2. Grupo etario y edad
  const grupo = randElem(patologia.grupoEtarioTipico)
  const [edadMin, edadMax] = RANGOS_EDAD[grupo]
  const edadAnos = grupo === 'infante'
    ? randFloat(0.1, edadMax, 1)
    : randInt(edadMin, edadMax)

  const sexo: 'M' | 'F' = Math.random() < 0.5 ? 'M' : 'F'
  const nombre = sexo === 'M' ? randElem(NOMBRES_M) : randElem(NOMBRES_F)
  const apellido = randElem(APELLIDOS)
  const apellido2 = randElem(APELLIDOS)
  const nombreCompleto = `${nombre} ${apellido} ${apellido2}`
  const rut = generarRut(randInt(5_000_000, 25_000_000))
  const fechaNacimiento = fechaNacimientoDesdEdad(
    typeof edadAnos === 'number' ? Math.floor(edadAnos) : edadAnos,
    fechaActual,
  )

  // 3. Antropometría
  const antro = generarAntropometria(grupo, typeof edadAnos === 'number' ? Math.floor(edadAnos) : edadAnos, sexo)

  // 4. Documentos
  const carnet = generarCarnet(nombre, `${apellido} ${apellido2}`, rut, fechaNacimiento, fechaActual)

  const antecedentesCaso = ANTECEDENTES_CLINICOS[patologia.id] ?? [
    'Sin antecedentes quirúrgicos recientes; derivado desde medicina general para evaluación nutricional.',
    'Hábitos alimentarios irregulares en horarios y selección de alimentos durante el último trimestre.',
  ]

  const anamnesis: DocumentoAnamnesis = {
    diagnostico: '—',  // Oculto: el estudiante debe diagnosticar
    sintomas: patologia.sintomasValidos.slice(0, randInt(3, Math.min(5, patologia.sintomasValidos.length))),
    antecedentes: antecedentesCaso,
    pesoKg: antro.pesoKg,
    tallaCm: antro.tallaCm,
    edadAnos: typeof edadAnos === 'number' ? edadAnos : parseFloat(edadAnos as unknown as string),
    estadoNutricional: antro.estadoNutricional,
    estandarUsado: antro.estandarUsado,
    valorIndice: antro.valorIndice,
    observaciones: `Paciente de ${Math.floor(typeof edadAnos === 'number' ? edadAnos : parseFloat(edadAnos as unknown as string))} años, sexo ${sexo === 'M' ? 'masculino' : 'femenino'}. Consulta derivada por médico tratante para evaluación nutricional.`,
  }

  const laboratorio = generarLaboratorio(patologia, fechaActual)

  const indicacionesNutricionales = patologia.tratamientoCorrecto.filter(t =>
    t.toLowerCase().includes('dieta') ||
    t.toLowerCase().includes('nutr') ||
    t.toLowerCase().includes('aliment') ||
    t.toLowerCase().includes('restrict') ||
    t.toLowerCase().includes('textura') ||
    t.toLowerCase().includes('espesante'),
  )
  const medicamentos = patologia.tratamientoCorrecto.filter(t =>
    !indicacionesNutricionales.includes(t),
  )

  const receta = generarReceta(
    nombreCompleto, rut, '(Diagnóstico pendiente de evaluación)',
    medicamentos.slice(0, 3),
    [
      'Derivación a Nutricionista Clínico para definir plan dietoterapéutico según cuadro actual.',
      'Evaluar posibles interacciones fármaco-nutriente con el esquema farmacológico prescrito.',
    ],
    fechaActual,
  )

  // 5. Opciones para la evaluación clínica
  const opcionesDiagnostico = generarOpcionesDiagnostico(patologia, todasLasPatologias)
  const opcionesPlanNutricional = generarOpcionesPlanNutricional(patologia)
  const opcionesRiesgoFarmacologico = generarOpcionesRiesgoFarmacologico(patologia, todasLasPatologias)
  const opcionesMecanismo = generarOpcionesMecanismo(patologia)
  const preguntasEntrevista = generarPreguntasEntrevista(patologia.id)
  const configMinuta = generarConfigMinuta(patologia.id, antro.pesoKg)

  return {
    id: `pac-${Date.now()}-${randInt(1000, 9999)}`,
    carnet,
    anamnesis,
    laboratorio,
    receta,
    patologiaRef: patologia,
    dificultad: patologia.dificultad,
    opcionesDiagnostico,
    opcionesPlanNutricional,
    opcionesRiesgoFarmacologico,
    opcionesMecanismo: opcionesMecanismo ?? undefined,
    esRepaso: opcionesExtra?.esRepaso ?? false,
    preguntasEntrevista,
    configMinuta,
  }
}
