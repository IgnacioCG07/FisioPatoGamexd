# FisioPato: Consulta Nutricional 🩺🍎

> **Juego serio de rol y simulación clínica para estudiantes de Nutrición y Dietética.**  
> 🔗 **Jugar online:** [https://fisiopatoxd.netlify.app](https://fisiopatoxd.netlify.app)

---

## 📌 ¿De qué trata el juego?

En **FisioPato**, tomas el rol de un **nutricionista profesional** en consulta clínica. 

A tu consulta llegan distintos pacientes con diferentes cuadros de salud. Tu trabajo consiste en evaluarlos de manera integral: revisar su anamnesis (signos vitales, exámenes de laboratorio, antecedentes y medicamentos que consumen), entrevistarlos directamente para conocer sus síntomas y hábitos, y diseñar una intervención nutricional adecuada mediante una minuta personalizada y su posterior control a las 4 semanas.

El juego conecta de forma práctica la **Fisiopatología**, la **Farmacología básica** y la **Dietoterapia**, simulando una atención nutricional real.

---

## 🎯 Objetivo Educativo y Público Objetivo

* **Público objetivo:** Estudiantes de Nutrición y Dietética y carreras de la salud que cursan ramos de Fisiopatología, Evaluación del Estado Nutricional y Dietoterapia.
* **Propósito educativo:** Ayudar a que el estudiante aprenda a razonar clínicamente en consulta. El objetivo es que logre integrar tres cosas fundamentales frente a cada paciente:
  1. Comprender la alteración fisiopatológica de base (metabólica, respiratoria, renal, digestiva o cardiovascular).
  2. Tomar en cuenta los medicamentos que toma el paciente para evitar interacciones fármaco-alimento perjudiciales.
  3. Indicar el plan de alimentación y los alimentos correctos según las necesidades reales del paciente.

---

## 🎮 Mecánica de Juego y Fases de la Consulta

El juego recrea el flujo de atención que realiza un nutricionista con cada paciente:

1. **Evaluación Clínica y Anamnesis (Mecánica Principal):**
   - El paciente entra a la consulta con su motivo de atención.
   - Revisas sus datos clínicos completos: signos vitales, parámetros antropométricos (IMC, circunferencia de cintura o pantorrilla), exámenes de laboratorio y los fármacos que tiene recetados.
   - Evalúas su condición fisiopatológica general para definir el diagnóstico nutricional y la conducta adecuada.

2. **Entrevista al Paciente (Anamnesis Interactiva):**
   - Conversas con el paciente eligiendo preguntas estratégicas sobre su día a día (apetito, síntomas digestivos o respiratorios, cómo toma sus remedios y qué suele comer).
   - El paciente responde según su caso, entregando detalles clave que ayudan a afinar el tratamiento.

3. **Prescripción Dietoterapéutica (Minuta de Alimentos):**
   - Como nutricionista, armas la pauta alimentaria seleccionando alimentos beneficiosos para su patología y descartando aquellos que estén contraindicados o que interfieran con sus medicamentos.

4. **Control y Seguimiento a 4 Semanas:**
   - El paciente vuelve a control un mes después. Aquí ves el impacto real de tu plan: si la indicación fue correcta, el paciente muestra mejoras objetivas en sus síntomas y exámenes; si hubo fallas, se muestran las complicaciones para aprender de ellas.

5. **Progresión Profesional y Repaso de Casos:**
   - Comienzas como **Interno en Práctica** y vas avanzando a **Nutricionista Clínico**, **Especialista** y **Jefe de Servicio**.
   - Incluye una sección de **Repaso** para volver a mirar casos anteriores y leer las explicaciones fisiopatológicas con calma.

---

## 💻 Tecnologías Utilizadas

* **Framework:** Vue 3 (Composition API con `<script setup>`)
* **Lenguaje:** TypeScript
* **Herramienta de desarrollo:** Vite
* **Estilos:** Tailwind CSS (interfaz limpia, simulando ficha clínica y consulta, adaptable a celular y PC)
* **Despliegue:** Netlify (despliegue continuo en la nube)

---

## 🚀 Cómo correr el proyecto en local

Para probar el proyecto en tu computador:

```bash
# 1. Clonar el repositorio
git clone https://github.com/IgnacioCG07/FisioPatoGamexd.git

# 2. Entrar a la carpeta
cd FisioPatoGamexd

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor
npm run dev
```

Luego abres tu navegador en `http://localhost:5173`.

Para compilar la versión final de producción:
```bash
npm run build
```

---

## 🧪 Pruebas con Usuarios y Validación

Probamos el juego con 3 compañeros de la carrera para ver cómo funcionaba la experiencia:

* **Prueba 1 (Comprensión del rol):** Los compañeros entendieron de inmediato la dinámica de estar en consulta atendiendo al paciente y revisando sus antecedentes.
* **Prueba 2 (Tiempos de consulta):** En promedio tardaban entre 2 y 4 minutos por paciente, dedicando buen tiempo a leer los exámenes de laboratorio y las respuestas de la entrevista.
* **Prueba 3 (Utilidad para estudiar):** Destacaron que tener que armar la minuta considerando los medicamentos del paciente les sirvió mucho para repasar interacciones fármaco-nutriente que suelen olvidarse en los certámenes.

---

## 🛠️ Problemas Detectados y Mejoras Implementadas

Durante las pruebas se detectaron detalles que corregimos para que la experiencia fuera más clara:

1. **Problema 1: Se pasaban por alto los fármacos al momento de armar la comida.**
   * *Solución:* Reorganizamos la anamnesis para que los medicamentos y sus advertencias queden visibles mientras seleccionas los alimentos de la minuta.
2. **Problema 2: Dudas con el criterio de evaluación en pacientes adultos mayores.**
   * *Solución:* Aclaramos en la anamnesis qué estándar se aplica (IMC clásico en adultos vs. rango ampliado y circunferencia de pantorrilla en adultos mayores), agregando la explicación en el feedback.
3. **Problema 3: Necesidad de entender claramente por qué un alimento no era adecuado.**
   * *Solución:* Añadimos una ventana de feedback clínico que explica en palabras sencillas el mecanismo biológico detrás de cada error (ej. por qué moderar carbohidratos en pacientes con dificultad respiratoria o regular ciertos vegetales con anticoagulantes).

---

## 🗣️ Guía para la Defensa Oral (Preguntas de la Pauta)

1. **¿Cómo se relaciona la mecánica principal con el objetivo educativo?**  
   Poner al estudiante en el rol del nutricionista frente a la anamnesis lo obliga a analizar activamente los datos del paciente (laboratorio, síntomas y fármacos) antes de tomar decisiones alimentarias, reforzando la aplicación práctica de la fisiopatología.
2. **¿Cómo se implementó la progresión entre desafíos?**  
   El jugador parte atendiendo casos clínicos más directos y con patologías aisladas. A medida que avanza y sube de rango, llegan pacientes más complejos, con múltiples enfermedades o adultos mayores con mayor riesgo nutricional.
3. **¿Qué información entrega el feedback cuando el jugador se equivoca?**  
   Entrega una explicación fisiopatológica concreta: qué alteración tiene el paciente, por qué la decisión tomada no era la indicada y qué consecuencia clínica tendría en la vida real.
4. **¿Qué error detectaron en las pruebas y cómo lo corrigieron?**  
   Notamos que los usuarios no relacionaban la receta médica con la dieta. Se corrigió haciendo más evidente la sección de fármacos en la anamnesis y sumando el control a 4 semanas para ver el resultado de la pauta.
5. **¿Qué cambios técnicos realizarían antes de la entrega final?**  
   Sumar más variedad de casos clínicos (por ejemplo pacientes pediátricos), guardar el historial de consultas en el almacenamiento local del navegador y agregar detalles sonoros para ambientar la consulta.

---

## 👥 Equipo

* Proyecto Integrador de Juego Serio — Fisiopatología y Nutrición.
* Noviembre 2026.
