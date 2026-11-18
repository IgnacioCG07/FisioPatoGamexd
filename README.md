# FisioPato: Auditor Clínico 🩺🍎

> **Juego serio de rol y simulación clínica para estudiantes de Nutrición y Dietética.**  
> 🔗 **Jugar online:** [https://fisiopatoxd.netlify.app](https://fisiopatoxd.netlify.app)

---

## 📌 ¿De qué trata el juego?

En **FisioPato: Auditor Clínico**, tomas el rol de un profesional de la salud en un hospital. Tu misión es revisar fichas clínicas, detectar posibles errores médicos o nutricionales (contraindicaciones, interacciones fármaco-alimento, diagnósticos mal enfocados) y tomar decisiones: **Aprobar**, **Rechazar** con justificativo o **Solicitar Interconsulta**.

Inspirado en la dinámica de revisión documental tipo *Papers, Please*, pero enfocado 100% en casos clínicos reales de **Fisiopatología** y **Dietoterapia**.

---

## 🎯 Objetivo Educativo y Público Objetivo

* **Público objetivo:** Estudiantes de Nutrición y Dietética y carreras de la salud que cursan asignaturas de Fisiopatología, Farmacología Básica y Evaluación del Estado Nutricional.
* **Propósito:** Entrenar el razonamiento clínico rápido para que el estudiante no memorice conceptos aislados, sino que aprenda a relacionar:
  1. La alteración fisiopatológica de base (metabólica, respiratoria, cardiovascular, renal o digestiva).
  2. Los medicamentos prescritos y sus posibles contraindicaciones o interacciones con alimentos.
  3. La prescripción dietoterapéutica y la selección correcta de alimentos para ese paciente.

---

## 🎮 Mecánica de Juego y Fases

El juego cuenta con varias etapas que simulan la atención completa de un paciente:

1. **Auditoría de Ficha Médica (Mecánica Principal):**
   - Lees la anamnesis, signos vitales, exámenes de laboratorio, diagnóstico y receta médica.
   - Contrastas si los fármacos indicados están contraindicados para esa patología o si hay riesgo de interacción fármaco-nutriente.
   - Puedes sellar la ficha con: **Aprobar**, **Rechazar** (indicando el motivo) o **Pedir Interconsulta**.

2. **Entrevista Clínica (Anamnesis Interactiva):**
   - Conversas directamente con el paciente haciéndole preguntas clave (síntomas actuales, adherencia al tratamiento, hábitos de consumo).
   - El paciente responde según su personalidad y cuadro clínico, revelando datos que a veces no estaban en la ficha.

3. **Minuta Dietoterapéutica:**
   - Seleccionas alimentos adecuados para el plan nutricional del paciente y evitas los que puedan perjudicarlo o interactuar con su tratamiento.

4. **Control y Seguimiento a 4 Semanas:**
   - Ves la evolución del paciente: si tomaste la decisión correcta, el paciente mejora sus parámetros; si hubo un error, muestra complicaciones que te explican en qué falló la prescripción.

5. **Progresión de Carrera y Repaso:**
   - Comienzas como **Interno** y vas ascendiendo a **Auditor Junior**, **Auditor Senior** y **Jefe de Servicio**.
   - Posee un panel de **Repaso de Errores** para revisar los casos donde te equivocaste con su explicación fisiopatológica detallada.

---

## 💻 Tecnologías Utilizadas

* **Framework:** Vue 3 (Composition API con `<script setup>`)
* **Lenguaje:** TypeScript (tipado estricto para casos, fármacos y decisiones)
* **Empaquetador:** Vite
* **Estilos:** Tailwind CSS (diseño limpio tipo expediente hospitalario, responsivo en móviles y PC)
* **Despliegue:** Netlify (CI/CD continuo)

---

## 🚀 Cómo correr el proyecto en local

Si quieres probar el código o correrlo en tu máquina:

```bash
# 1. Clonar el repositorio
git clone https://github.com/IgnacioCG07/FisioPatoGamexd.git

# 2. Entrar a la carpeta del proyecto
cd FisioPatoGamexd

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:5173` y listo.

Para generar la versión de producción:
```bash
npm run build
```

---

## 🧪 Pruebas con Usuarios y Validación

Durante el desarrollo pusimos a prueba el prototipo con 3 compañeros de carrera para evaluar qué tan intuitivo y útil resultaba:

* **Prueba 1 (Facilidad de uso):** Los compañeros entendieron rápido la mecánica de sellar y contrastar la ficha médica. Les gustó que tuviera tono de expediente real.
* **Prueba 2 (Tiempo por caso):** El tiempo promedio por caso fue de 2 a 3 minutos. Al principio se les pasaban por alto algunas interacciones fármaco-alimento por leer muy rápido.
* **Prueba 3 (Valor educativo):** Coincidieron en que el feedback inmediato al equivocarse fue la parte más útil para fijar el contenido antes de un certamen.

---

## 🛠️ Problemas Detectados y Mejoras Implementadas

A partir de las pruebas funcionales y el feedback de compañeros, corregimos varios puntos:

1. **Problema 1: Fichas con demasiado texto hacían perder de vista las contraindicaciones.**
   * *Solución:* Agregamos la herramienta de inspección interactiva y estructuramos la ficha en bloques visuales claros (Diagnóstico, Signos, Laboratorio y Tratamiento) para facilitar la lectura diagnóstica.
2. **Problema 2: Confusión en criterios antropométricos entre adultos y adultos mayores.**
   * *Solución:* Hicimos explícito en la ficha si se evalúa con estándar adulto (IMC clásico) o adulto mayor (rango ampliado + circunferencia de pantorrilla), reforzando la justificación en el feedback.
3. **Problema 3: Falta de claridad cuando una decisión era rechazada.**
   * *Solución:* Se integró un panel de retroalimentación académica que explica exactamente qué mecanismo fisiopatológico se violó (por ejemplo, indicar prednisona en síndrome metabólico o suspender bruscamente un fármaco sin justificación).

---

## 🗣️ Guía para la Defensa Oral (Preguntas Clave)

1. **¿Cómo se relaciona la mecánica principal con el objetivo educativo?**  
   Revisar y sellar fichas médicas obliga al estudiante a contrastar activamente datos (laboratorios, síntomas y recetas) en vez de solo memorizar. Si una receta tiene un fármaco contraindicado o que compite con un nutriente, el estudiante debe identificarlo antes de aprobar.
2. **¿Cómo se implementó la progresión entre desafíos?**  
   El jugador empieza como Interno viendo casos con errores evidentes y, a medida que acierta, sube de rango hacia casos más complejos con múltiples comorbilidades (ej. respiratorio con falla renal o interacciones fármaco-alimento sutiles).
3. **¿Qué información entrega el feedback cuando el jugador se equivoca?**  
   No solo avisa que falló: explica la razón fisiopatológica específica, el mecanismo del fármaco involucrado y la consecuencia clínica que tendría en el paciente real.
4. **¿Qué error detectaron en las pruebas y cómo lo corrigieron?**  
   Los usuarios pasaban por alto interacciones entre fármacos y comida en las recetas largas. Se solucionó agregando avisos de alerta en la inspección y un sistema de seguimiento a 4 semanas para ver el impacto de las decisiones.
5. **¿Qué cambios técnicos quedan pendientes hacia la versión final?**  
   Añadir sonido ambiente de hospital, ampliar el banco de casos con pacientes pediátricos adicionales y guardar el avance en LocalStorage o base de datos ligera para no perder el progreso entre sesiones.

---

## 👥 Equipo

* Proyecto Integrador de Juego Serio — Fisiopatología y Nutrición.
* Noviembre 2026.
