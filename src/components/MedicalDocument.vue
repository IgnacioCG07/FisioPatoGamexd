<template>
  <div
    class="medical-document"
    :class="[`doc-${tipoDocumento}`, { 'drop-zone-active': isDragOver, 'has-stamp': stampApplied }]"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @dragenter.prevent="onDragEnter"
  >
    <!-- Encabezado del documento — sin badge repetitivo, sin subtítulo -->
    <div class="doc-header">
      <span class="doc-icon">{{ DOC_ICONS[tipoDocumento] }}</span>
      <h3 class="doc-title">{{ DOC_TITLES[tipoDocumento] }}</h3>
    </div>

    <!-- Separador ornamental -->
    <div class="doc-divider" />

    <!-- Contenido específico por tipo de documento -->
    <div class="doc-body">

      <!-- ── CARNET DE IDENTIDAD ── -->
      <template v-if="tipoDocumento === 'carnet'">
        <!-- Foto + datos de identidad en fila -->
        <div class="carnet-top-row">
          <PatientPhoto
            :nombre="paciente.carnet.nombre + ' ' + paciente.carnet.apellido"
            :rut="paciente.carnet.rut"
          />
          <div class="field-grid carnet-fields">
            <div class="field-row">
              <span class="field-label">RUT</span>
              <InspectableText
                clave="carnet.rut"
                :valor="paciente.carnet.rut"
                :nodos-conflictivos="paciente.nodosConflictivos"
                class="field-value mono"
              />
            </div>
            <div class="field-row">
              <span class="field-label">Nombres</span>
              <InspectableText
                clave="carnet.nombre"
                :valor="paciente.carnet.nombre"
                :nodos-conflictivos="paciente.nodosConflictivos"
                class="field-value"
              />
            </div>
            <div class="field-row">
              <span class="field-label">Apellidos</span>
              <InspectableText
                clave="carnet.apellido"
                :valor="paciente.carnet.apellido"
                :nodos-conflictivos="paciente.nodosConflictivos"
                class="field-value"
              />
            </div>
            <div class="field-row">
              <span class="field-label">Nacimiento</span>
              <InspectableText
                clave="carnet.fechaNacimiento"
                :valor="paciente.carnet.fechaNacimiento"
                :nodos-conflictivos="paciente.nodosConflictivos"
                class="field-value mono"
              />
            </div>
          </div>
        </div>

        <div class="field-grid">
          <div class="field-row">
            <span class="field-label">N° Documento</span>
            <InspectableText
              clave="carnet.numeroDocumento"
              :valor="paciente.carnet.numeroDocumento"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono"
            />
          </div>
          <div class="field-row">
            <span class="field-label">Emisión</span>
            <InspectableText
              clave="carnet.fechaEmision"
              :valor="paciente.carnet.fechaEmision"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono"
            />
          </div>
          <div class="field-row" :class="{ 'field-alert': isCarnetVencido }">
            <span class="field-label">Vencimiento</span>
            <div class="field-value-row">
              <InspectableText
                clave="carnet.fechaVencimiento"
                :valor="paciente.carnet.fechaVencimiento"
                :nodos-conflictivos="paciente.nodosConflictivos"
                class="field-value mono"
              />
              <span v-if="isCarnetVencido" class="alert-badge">VENCIDO</span>
            </div>
          </div>
        </div>

        <!-- Footer del carnet con bandera -->
        <div class="carnet-footer">
          <div class="carnet-flag">
            <span class="flag-stripe red" />
            <span class="flag-stripe white" />
            <span class="flag-stripe blue" />
          </div>
          <span class="carnet-issuer">REPUBLICA DE CHILE · REGISTRO CIVIL</span>
        </div>
      </template>

      <!-- ── ANAMNESIS ── -->
      <template v-else-if="tipoDocumento === 'anamnesis'">
        <div class="field-grid">
          <div class="field-row full-width">
            <span class="field-label">Diagnóstico</span>
            <InspectableText
              clave="anamnesis.diagnostico"
              :valor="paciente.anamnesis.diagnostico"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value emphasis"
            />
          </div>
          <div class="field-row">
            <span class="field-label">Edad</span>
            <InspectableText
              clave="anamnesis.edad"
              :valor="`${paciente.anamnesis.edadAnos} años`"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono"
            />
          </div>
          <div class="field-row">
            <span class="field-label">Peso / Talla</span>
            <InspectableText
              clave="anamnesis.antropometria"
              :valor="`${paciente.anamnesis.pesoKg} kg / ${paciente.anamnesis.tallaCm} cm`"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono"
            />
          </div>
          <div class="field-row full-width">
            <span class="field-label">Estado Nutricional</span>
            <InspectableText
              clave="anamnesis.estadoNutricional"
              :valor="ESTADOS_LABEL[paciente.anamnesis.estadoNutricional] ?? paciente.anamnesis.estadoNutricional"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value"
            />
          </div>
          <div class="field-row full-width">
            <span class="field-label">Índice / Estándar</span>
            <InspectableText
              clave="anamnesis.valorIndice"
              :valor="paciente.anamnesis.valorIndice"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono small"
            />
          </div>
        </div>

        <div class="symptom-section">
          <span class="section-title">SÍNTOMAS REPORTADOS</span>
          <ul class="symptom-list">
            <li v-for="(sintoma, idx) in paciente.anamnesis.sintomas" :key="idx">
              <InspectableText
                :clave="`anamnesis.sintoma_${idx}`"
                :valor="sintoma"
                :nodos-conflictivos="paciente.nodosConflictivos"
              />
            </li>
          </ul>
        </div>

        <div class="obs-section">
          <span class="section-title">OBSERVACIONES</span>
          <p class="obs-text">
            <InspectableText
              clave="anamnesis.observaciones"
              :valor="paciente.anamnesis.observaciones"
              :nodos-conflictivos="paciente.nodosConflictivos"
            />
          </p>
        </div>
      </template>

      <!-- ── LABORATORIO ── -->
      <template v-else-if="tipoDocumento === 'laboratorio'">
        <div class="lab-header-row">
          <span class="lab-date">Fecha análisis: <strong>{{ paciente.laboratorio.fecha }}</strong></span>
        </div>
        <table class="lab-table">
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>Resultado</th>
              <th>Referencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(resultado, clave) in paciente.laboratorio.resultados"
              :key="clave"
            >
              <td class="lab-param">{{ LAB_LABELS[clave] ?? clave }}</td>
              <td class="lab-value">
                <InspectableText
                  :clave="`laboratorio.${clave}`"
                  :valor="resultado.valor"
                  :nodos-conflictivos="paciente.nodosConflictivos"
                  class="mono"
                />
              </td>
              <td class="lab-ref">{{ resultado.referencia }}</td>
              <td class="lab-status">
                <!-- Color SOLO en badges de estado de laboratorio -->
                <span :class="`status-badge status-${resultado.estado}`">
                  {{ ESTADO_LAB[resultado.estado] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="lab-footer">
          <span class="lab-footer-text">Laboratorio Clínico Central · Acreditado por ISP</span>
        </div>
      </template>

      <!-- ── RECETA MÉDICA (zona de drop) ── -->
      <template v-else-if="tipoDocumento === 'receta'">
        <div class="receta-meta">
          <div class="field-row">
            <span class="field-label">Médico</span>
            <InspectableText
              clave="receta.medicoNombre"
              :valor="paciente.receta.medicoNombre"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value"
            />
          </div>
          <div class="field-row">
            <span class="field-label">RUT Médico</span>
            <InspectableText
              clave="receta.medicoRut"
              :valor="paciente.receta.medicoRut"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono"
            />
          </div>
          <div class="field-row">
            <span class="field-label">Paciente</span>
            <InspectableText
              clave="receta.pacienteNombre"
              :valor="paciente.receta.pacienteNombre"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value"
            />
          </div>
          <div class="field-row">
            <span class="field-label">RUT Paciente</span>
            <InspectableText
              clave="receta.pacienteRut"
              :valor="paciente.receta.pacienteRut"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono"
            />
          </div>
          <div class="field-row full-width">
            <span class="field-label">Diagnóstico</span>
            <InspectableText
              clave="receta.diagnostico"
              :valor="paciente.receta.diagnostico"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value emphasis"
            />
          </div>
          <div class="field-row">
            <span class="field-label">N° Receta</span>
            <InspectableText
              clave="receta.numeroReceta"
              :valor="paciente.receta.numeroReceta"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono"
            />
          </div>
          <div class="field-row">
            <span class="field-label">Fecha Emisión</span>
            <InspectableText
              clave="receta.fechaEmision"
              :valor="paciente.receta.fechaEmision"
              :nodos-conflictivos="paciente.nodosConflictivos"
              class="field-value mono"
            />
          </div>
        </div>

        <div class="receta-meds">
          <span class="section-title">MEDICAMENTOS PRESCRITOS</span>
          <ul class="med-list">
            <li v-for="(med, idx) in paciente.receta.medicamentos" :key="idx">
              <InspectableText
                :clave="`receta.medicamentos`"
                :valor="med"
                :nodos-conflictivos="paciente.nodosConflictivos"
              />
            </li>
          </ul>
        </div>

        <div v-if="paciente.receta.indicacionesNutricionales.length > 0" class="receta-nutr">
          <span class="section-title">INDICACIONES NUTRICIONALES</span>
          <ul class="nutr-list">
            <li v-for="(ind, idx) in paciente.receta.indicacionesNutricionales" :key="idx">
              <InspectableText
                :clave="`receta.indicacion_${idx}`"
                :valor="ind"
                :nodos-conflictivos="paciente.nodosConflictivos"
              />
            </li>
          </ul>
        </div>

        <!-- Zona de drop del veredicto — iluminada solo cuando hay drag encima -->
        <div
          class="stamp-drop-zone"
          :class="{ active: isDragOver }"
          aria-label="Zona de veredicto: suelta el sello aquí"
        >
          <span v-if="!stampApplied" class="drop-zone-text">
            <span class="drop-icon">⬇</span>
            Suelte el sello aquí para emitir veredicto
          </span>

          <Transition name="stamp-appear">
            <div
              v-if="stampApplied"
              class="stamp-mark"
              :class="`stamp-mark-${stampApplied}`"
              :style="stampStyle"
            >
              <span class="stamp-mark-text">{{ stampApplied === 'aprobado' ? 'APROBADO' : 'RECHAZADO' }}</span>
              <span class="stamp-mark-sub">AUDITORÍA CLÍNICA</span>
            </div>
          </Transition>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * MedicalDocument — Renderiza uno de los cuatro documentos del expediente.
 *
 * Cambios de UI respecto a v1:
 * - Sin subtítulo descriptivo bajo el título de tarjeta
 * - Sin badge de esquina que repite el tipo de documento
 * - Borde superior unificado (neutro gris-azulado) en todos los tipos
 * - PatientPhoto integrado en el carnet
 * - Drop zone de la receta reacciona a dragenter/dragleave (glow)
 * - Sin hover en drop zones que no son la receta
 * - Color reservado solo para alertas reales (laboratorio, carnet vencido, sello)
 */
import { ref, computed } from 'vue'
import InspectableText from './InspectableText.vue'
import PatientPhoto from './PatientPhoto.vue'
import type { Paciente, EstadoNutricional } from '../types/models'
import { useGameManager } from '../composables/useGameManager'

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  tipoDocumento: 'carnet' | 'anamnesis' | 'laboratorio' | 'receta'
  paciente: Paciente
}

const props = defineProps<Props>()

// ─── Store ───────────────────────────────────────────────────────────────────

const gameManager = useGameManager()

// ─── Estado local ────────────────────────────────────────────────────────────

const isDragOver = ref(false)
const stampApplied = ref<'aprobado' | 'rechazado' | null>(null)
const stampStyle = ref<Record<string, string>>({})

// ─── Tablas de etiquetas ──────────────────────────────────────────────────────

const DOC_ICONS: Record<Props['tipoDocumento'], string> = {
  carnet: '🪪',
  anamnesis: '📋',
  laboratorio: '🔬',
  receta: '📄',
}

const DOC_TITLES: Record<Props['tipoDocumento'], string> = {
  carnet: 'Carnet de Identidad',
  anamnesis: 'Ficha Clínica',
  laboratorio: 'Resultados de Laboratorio',
  receta: 'Receta Médica',
}

const ESTADOS_LABEL: Partial<Record<EstadoNutricional, string>> = {
  desnutricion_aguda: 'Desnutrición Aguda',
  desnutricion_cronica: 'Desnutrición Crónica',
  bajo_peso: 'Bajo Peso',
  eutrofia: 'Eutrofia',
  riesgo_sobrepeso: 'Riesgo de Sobrepeso',
  sobrepeso: 'Sobrepeso',
  obesidad: 'Obesidad',
  obesidad_sarcopenica: 'Obesidad Sarcopénica',
}

const LAB_LABELS: Record<string, string> = {
  glucosa_ayuno: 'Glucosa en ayuno',
  trigliceridos: 'Triglicéridos',
  hdl: 'HDL-Colesterol',
  ldl: 'LDL-Colesterol',
  hba1c: 'HbA1c',
  presion_arterial: 'P.A. Sistólica',
  tsh: 'TSH',
  t4_libre: 'T4 Libre',
  colesterol_total: 'Colesterol Total',
  bnp_probnp: 'NT-proBNP',
  sodio: 'Sodio',
  potasio: 'Potasio',
  creatinina: 'Creatinina',
  albumina: 'Albúmina sérica',
  hemoglobina: 'Hemoglobina',
  cpeptido: 'Péptido C',
  cetonas_orina: 'Cetonas (orina)',
  anticuerpos_anti_gad: 'Anti-GAD',
  igf1: 'IGF-1',
  zinc_serico: 'Zinc sérico',
  fosforo: 'Fósforo',
  vitamina_d: 'Vitamina D (25-OH)',
  pcr: 'PCR',
  insulina_basal: 'Insulina basal',
  homa_ir: 'HOMA-IR',
  hematocrito: 'Hematocrito',
  proteinas_totales: 'Proteínas totales',
  saturacion_o2: 'Saturación O₂',
  espirometria_vef1_cvf: 'VEF1/CVF',
  urea: 'Urea sérica',
  tfg_estimada: 'TFG estimada',
  bicarbonato: 'Bicarbonato (HCO₃⁻)',
  ferritina: 'Ferritina sérica',
  inr: 'INR (Protrombina)',
  pao2: 'PaO₂ arterial',
  paco2: 'PaCO₂ arterial',
  elastasa_fecal: 'Elastasa fecal',
  anticuerpos_antitransglutaminasa: 'Anti-transglutaminasa IgA',
  bilirrubina_total: 'Bilirrubina total',
}

const ESTADO_LAB: Record<'normal' | 'alto' | 'bajo', string> = {
  normal: 'NORMAL',
  alto: 'ELEVADO',
  bajo: 'BAJO',
}

// ─── Computed ─────────────────────────────────────────────────────────────────

const isCarnetVencido = computed(() => {
  if (props.tipoDocumento !== 'carnet') return false
  const venc = new Date(props.paciente.carnet.fechaVencimiento)
  return venc < gameManager.fechaSimulada
})

// ─── Drag & Drop ─────────────────────────────────────────────────────────────

/**
 * dragenter: activa el glow de la zona de drop (solo en receta).
 * Más responsivo que dragover solo.
 */
function onDragEnter(event: DragEvent): void {
  if (props.tipoDocumento !== 'receta') return
  event.preventDefault()
  isDragOver.value = true
}

function onDragOver(event: DragEvent): void {
  if (props.tipoDocumento !== 'receta') return
  isDragOver.value = true
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

function onDragLeave(event: DragEvent): void {
  // Evitar flickering cuando el cursor entra a un elemento hijo
  if (props.tipoDocumento !== 'receta') return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const { clientX, clientY } = event
  if (
    clientX >= rect.left && clientX <= rect.right &&
    clientY >= rect.top && clientY <= rect.bottom
  ) return
  isDragOver.value = false
}

/**
 * Procesa el sello soltado sobre la receta.
 * Ignora drops sobre cualquier otro tipo de documento.
 */
function onDrop(event: DragEvent): void {
  isDragOver.value = false
  if (props.tipoDocumento !== 'receta') return
  if (!event.dataTransfer) return

  const sello = event.dataTransfer.getData('sello') as 'aprobado' | 'rechazado' | ''
  if (sello !== 'aprobado' && sello !== 'rechazado') return
  if (stampApplied.value) return

  const rotation = (Math.random() * 14 - 7).toFixed(1)
  stampStyle.value = { transform: `rotate(${rotation}deg)` }
  stampApplied.value = sello

  setTimeout(() => {
    gameManager.evaluarVeredicto(sello)
    setTimeout(() => { stampApplied.value = null }, 1000)
  }, 400)
}
</script>

<style scoped>
/* ── Base del documento ─────────────────────────────────────────────────── */

.medical-document {
  background: linear-gradient(160deg, #1a1f2e, #141822);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  /* Borde superior unificado gris-azulado para todos los tipos */
  border-top: 3px solid #334155;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* La receta se ilumina cuando hay un drag encima (y solo ella) */
.doc-receta.drop-zone-active {
  border-color: rgba(251, 191, 36, 0.6);
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.15), inset 0 0 30px rgba(251, 191, 36, 0.03);
}

/* ── Encabezado — sin subtítulo, sin badge ─────────────────────────────── */

.doc-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-icon { font-size: 1.1rem; }

.doc-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #cbd5e1;
  margin: 0;
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
}

/* ── Separador ──────────────────────────────────────────────────────────── */

.doc-divider {
  height: 1px;
  background: #1e293b;
  flex-shrink: 0;
}

/* ── Carnet — foto + datos en fila ─────────────────────────────────────── */

.carnet-top-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.carnet-fields {
  flex: 1;
}

.carnet-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #1e293b;
}

.carnet-flag {
  display: flex;
  flex-direction: column;
  width: 22px;
  height: 14px;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
}

.flag-stripe { flex: 1; }
.flag-stripe.red   { background: #dc2626; }
.flag-stripe.white { background: #f1f5f9; }
.flag-stripe.blue  { background: #1d4ed8; }

.carnet-issuer {
  font-size: 0.48rem;
  letter-spacing: 0.12em;
  color: #334155;
  font-family: var(--font-mono);
}

/* ── Campos ─────────────────────────────────────────────────────────────── */

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 10px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-row.full-width { grid-column: 1 / -1; }

.field-label {
  font-size: 0.5rem;
  color: #475569;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.field-value {
  color: #cbd5e1;
  font-size: 0.79rem;
}

.field-value.mono { font-family: var(--font-mono); }
.field-value.emphasis { color: #e2e8f0; font-weight: 600; }
.field-value.small { font-size: 0.7rem; }

.field-value-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Alerta de campo — SOLO para vencimiento de carnet (rojo reservado para alertas) */
.field-row.field-alert .field-label { color: #ef4444; }
.field-row.field-alert .field-value { color: #f87171 !important; }

.alert-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
  border: 1px solid rgba(220, 38, 38, 0.5);
  border-radius: 3px;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

/* ── Secciones de texto ──────────────────────────────────────────────────── */

.section-title {
  display: block;
  font-size: 0.5rem;
  color: #475569;
  letter-spacing: 0.15em;
  margin-bottom: 5px;
  padding-bottom: 3px;
  border-bottom: 1px solid #1e293b;
}

.symptom-list, .med-list, .nutr-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.symptom-list li, .med-list li, .nutr-list li {
  color: #94a3b8;
  font-size: 0.74rem;
  line-height: 1.4;
}

.symptom-list li::before { content: '▸ '; color: #475569; }
.med-list li::before     { content: '⬡ '; color: #475569; font-size: 0.7rem; }
.nutr-list li::before    { content: '◈ '; color: #475569; font-size: 0.7rem; }

.symptom-section, .obs-section, .receta-meds, .receta-nutr {
  display: flex;
  flex-direction: column;
}

.obs-text {
  color: #64748b;
  font-size: 0.71rem;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

/* ── Laboratorio ─────────────────────────────────────────────────────────── */

.lab-header-row {
  color: #64748b;
  font-size: 0.68rem;
  padding-bottom: 4px;
  border-bottom: 1px solid #1e293b;
}

.lab-date strong { color: #94a3b8; }

.lab-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.68rem;
}

.lab-table th {
  text-align: left;
  padding: 4px 6px;
  color: #475569;
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  border-bottom: 1px solid #1e293b;
}

.lab-table td {
  padding: 3px 6px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
  vertical-align: middle;
}

.lab-param { color: #cbd5e1; }
.lab-value { font-family: var(--font-mono); }
.lab-ref   { color: #475569; font-size: 0.63rem; }

/* Color SOLO en los badges de estado del laboratorio */
.status-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  font-weight: bold;
}

.status-normal { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.status-alto   { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.status-bajo   { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }

.lab-footer {
  text-align: center;
  padding-top: 5px;
  border-top: 1px solid #1e293b;
}

.lab-footer-text {
  font-size: 0.53rem;
  color: #334155;
  letter-spacing: 0.06em;
}

/* ── Receta meta ─────────────────────────────────────────────────────────── */

.receta-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 10px;
}

/* ── Zona de Drop (solo la receta es drop target) ────────────────────────── */

.stamp-drop-zone {
  margin-top: 8px;
  border: 2px dashed #2d3748;
  border-radius: 4px;
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

/* Glow cuando hay drag encima — única zona que reacciona visualmente */
.stamp-drop-zone.active {
  border-color: #d97706;
  border-style: solid;
  background: rgba(217, 119, 6, 0.05);
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
}

.drop-zone-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6rem;
  color: #334155;
  letter-spacing: 0.08em;
  text-align: center;
  padding: 10px;
  font-family: var(--font-mono);
  transition: color 0.2s ease;
}

.stamp-drop-zone.active .drop-zone-text {
  color: #78716c;
}

.drop-icon {
  font-size: 0.9rem;
  animation: bounce-down 1.5s ease-in-out infinite;
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(3px); }
}

/* ── Marca del sello aplicado ────────────────────────────────────────────── */

.stamp-mark {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-width: 3px;
  border-style: solid;
  border-radius: 4px;
}

.stamp-mark-aprobado {
  border-color: rgba(34, 197, 94, 0.8);
  background: rgba(20, 83, 45, 0.55);
  color: #4ade80;
}

.stamp-mark-rechazado {
  border-color: rgba(239, 68, 68, 0.8);
  background: rgba(69, 10, 10, 0.55);
  color: #f87171;
}

.stamp-mark-text {
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  font-family: var(--font-mono);
  text-shadow: 0 0 15px currentColor;
}

.stamp-mark-sub {
  font-size: 0.44rem;
  letter-spacing: 0.2em;
  opacity: 0.7;
  font-family: var(--font-mono);
}

/* ── Transición del sello ────────────────────────────────────────────────── */

.stamp-appear-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stamp-appear-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.stamp-appear-enter-to {
  opacity: 1;
}

/* ── Mono utility ────────────────────────────────────────────────────────── */
.mono { font-family: var(--font-mono); }
</style>
