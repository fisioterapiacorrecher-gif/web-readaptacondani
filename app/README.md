# RCD App (pacientes) — notas del proyecto

App propia de RCD Clinic que sustituirá al sistema de hojas de Google + formularios del curso
(carpeta **PhysiOne** en Drive). Se construye poco a poco, preguntando a Dani en cada paso.

## Cómo funciona el sistema actual (analizado el 11/11/2026)

- **Formulario pre-sesión** (Google Form, ~60 preguntas + 10 propias de tendinopatía) → respuestas en
  la hoja «Pacientes – Respuestas». El enlace lleva prellenado el ID de la plantilla de historia clínica.
- **Historia clínica** (hoja privada de Dani): exploración subjetiva (volcado / correcciones / asociaciones),
  objetiva, banderas rojas, diferencial, prescripción general, prescripción del ejercicio (por días,
  fuerza y cardio), interruptor de automatización y histórico de envíos.
- **Seguimiento del paciente** (hoja compartida): una pestaña por semana con el diario de ejercicio,
  diario de dolor, diario semanal, listado de ejercicios con vídeo (Drive) y gráficas de mejora
  (pestaña «Datos»: RM y tonelaje, dolor medio, adherencia, distancia y velocidad por protocolo).
- **Todo el código es cerrado.** Los scripts de cada hoja solo llaman a dos bibliotecas externas del curso:
  `IndomitalApp` (hojas) y `FisioterapiaOnline` (formularios). Hay 14 huecos `uiAction1..14` que el
  proveedor rellena a distancia, así que el comportamiento puede cambiar sin aviso. Por eso Dani no
  sabe de dónde vienen los fallos. No se copia ese código: la app se reescribe desde cero a partir
  del comportamiento observado.

## Decisiones tomadas con Dani

- Se empieza por **la parte del paciente**: sesión diaria con vídeos, dolor y encuesta semanal.
- **Coste cero:** backend en Google Apps Script propio, datos en su Google Workspace y vídeos en Drive.
  El frontend es una app web instalable alojada gratis. Objetivo: un mínimo de 10 pacientes a la vez.
- **Sin IA para progresar cargas.** Dani decide cada semana: si el dolor general es ≤ 4, sube reps,
  tiempo bajo tensión o peso. La app le facilita esa decisión y la registra, para deducir sus reglas más adelante.
- Las automatizaciones (enviar la encuesta, crear la semana nueva, volcar el dolor) usan reglas fijas.
  La IA, si se usa, solo para el diferencial, como sugerencia y con una API de pago (los datos de salud no van a una IA gratuita).

## Archivos

- `prototipo.html` — prototipo visual con datos de ejemplo. Es el cuerpo de un Artifact, por eso no lleva `<!doctype>`.

## Lo que registra el paciente (de las capturas de RICARDO, 11/11/2026)

- **Diario de ejercicio** (por día): molestia antes de entrenar · bloque de fuerza · bloque cardiovascular
  · molestia después · comentario · tiempo de la sesión.
- **Diario de dolor**: escala NRS + caras de Wong-Baker (sin dolor → dolor extremo), un valor por día de L a D,
  y anotaciones.
- **Encuesta semanal** (escalas 1–10 salvo donde se indica):
  - Lesión: seguimiento de pautas, dolor de arranque, rigidez matutina, malestar*, recuperación tras fuerza*,
    recuperación tras cardio.
  - Contexto: miedo, pasos/día (número), motivación, horas de sueño (número), calidad del descanso,
    cansancio general*, estrés, cambios respecto a la semana pasada (4 opciones).
  - *Deducidas de las filas del «Diario semanal» (una captura salió en blanco); hay que confirmarlas.
    No sabemos qué hay en la sección 3 de 3 del formulario.
- **Gráficas**: mejora del dolor, adherencia, actividad física (pasos), cardio (distancia y velocidad máxima
  por protocolo), tonelaje y RM estimado por ejercicio.

## Pendiente de Dani

- Confirmar las 3 preguntas deducidas y qué hay en la sección 3 del formulario semanal.
- Plan de Google Workspace (Starter/Standard…).
