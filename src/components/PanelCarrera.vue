<template>
  <!--
    PanelCarrera — Panel "Carrera" en el inicio con el rango actual,
    herramientas desbloqueadas/bloqueadas y los requisitos del próximo rango con ✓.
  -->
  <div class="panel-carrera">
    <div class="carrera-header">
      <div class="carrera-actual">
        <span class="carrera-icono">{{ carrera.rangoActual.icono }}</span>
        <div>
          <div class="carrera-eyebrow">
            CARRERA CLÍNICA · RANGO {{ carrera.rangoActual.orden }}/5
            <span v-if="carrera.modoDocente" class="badge-docente">MODO DOCENTE ACTIVO</span>
          </div>
          <h3 class="carrera-titulo">{{ carrera.rangoActual.titulo }}</h3>
        </div>
      </div>
      <div class="carrera-herramientas">
        <span
          class="tool-chip"
          :class="carrera.entrevistaDesbloqueada ? 'tool-unlocked' : 'tool-locked'"
          title="Se desbloquea en Nutricionista en práctica (Rango 2)"
        >
          {{ carrera.entrevistaDesbloqueada ? '💬 Entrevista' : '🔒 Entrevista (Rango 2)' }}
        </span>
        <span
          class="tool-chip"
          :class="carrera.seguimientoDesbloqueado ? 'tool-unlocked' : 'tool-locked'"
          title="Se desbloquea en Nutricionista clínico (Rango 3)"
        >
          {{ carrera.seguimientoDesbloqueado ? '📅 Seguimiento' : '🔒 Seguimiento (Rango 3)' }}
        </span>
        <span
          class="tool-chip"
          :class="carrera.minutaDesbloqueada ? 'tool-unlocked' : 'tool-locked'"
          title="Se desbloquea en Especialista (Rango 4)"
        >
          {{ carrera.minutaDesbloqueada ? '🍽️ Minuta' : '🔒 Minuta (Rango 4)' }}
        </span>
      </div>
    </div>

    <!-- Próximo rango y requisitos con ✓ -->
    <div v-if="carrera.proximoRango" class="carrera-proximo">
      <div class="proximo-head">
        <span class="proximo-label">
          Próximo ascenso:
          <strong>{{ carrera.proximoRango.icono }} {{ carrera.proximoRango.titulo }}</strong>
        </span>
        <span class="proximo-unlock">
          Desbloquea: <strong>{{ carrera.proximoRango.desbloquea }}</strong>
        </span>
      </div>

      <ul class="requisitos-lista">
        <li
          v-for="req in carrera.requisitosProximoRango"
          :key="req.id"
          class="requisito-item"
          :class="{ cumplido: req.cumplido }"
        >
          <span class="req-check">{{ req.cumplido ? '✓' : '○' }}</span>
          <span class="req-texto">{{ req.texto }}</span>
          <span class="req-detalle">{{ req.detalleActual }}</span>
        </li>
      </ul>
    </div>

    <div v-else class="carrera-maximo">
      👑 ¡Has alcanzado el rango máximo de <strong>Jefe de servicio</strong>! Todas las herramientas clínicas están desbloqueadas.
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCarrera } from '../composables/useCarrera'

const carrera = useCarrera()
</script>

<style scoped>
.panel-carrera {
  width: 100%;
  background: rgba(15, 20, 32, 0.88);
  border: 1px solid rgba(232, 193, 90, 0.3);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.carrera-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.carrera-actual {
  display: flex;
  align-items: center;
  gap: 10px;
}

.carrera-icono {
  font-size: 1.7rem;
  line-height: 1;
}

.carrera-eyebrow {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #94a3b8;
  font-family: var(--font-mono, monospace);
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-docente {
  background: #7c3aed;
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.58rem;
}

.carrera-titulo {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 2px 0 0;
}

.carrera-herramientas {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tool-chip {
  font-size: 0.65rem;
  font-family: var(--font-mono, monospace);
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.tool-unlocked {
  background: rgba(16, 185, 129, 0.16);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.tool-locked {
  background: rgba(51, 65, 85, 0.45);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.carrera-proximo {
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.proximo-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.72rem;
  color: #cbd5e1;
}

.proximo-unlock {
  font-size: 0.68rem;
  color: #fbbf24;
}

.requisitos-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.requisito-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: #94a3b8;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

.requisito-item.cumplido {
  color: #86efac;
  background: rgba(34, 197, 94, 0.1);
}

.req-check {
  font-weight: 800;
  width: 14px;
  text-align: center;
  color: #64748b;
}

.requisito-item.cumplido .req-check {
  color: #4ade80;
}

.req-texto {
  flex: 1;
}

.req-detalle {
  font-family: var(--font-mono, monospace);
  font-size: 0.64rem;
  color: #64748b;
}

.requisito-item.cumplido .req-detalle {
  color: #4ade80;
}

.carrera-maximo {
  font-size: 0.76rem;
  color: #fde047;
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.3);
  padding: 8px 10px;
  border-radius: 5px;
}
</style>
