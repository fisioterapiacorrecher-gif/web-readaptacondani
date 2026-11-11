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

- `prototipo.html` — app del paciente (prototipo visual, datos de ejemplo).
- `panel.html` — panel de Dani (prototipo): bandeja «Para hoy», lista de pacientes, revisión semanal con
  botones de decisión por ejercicio (mantener / + reps / + tiempo bajo tensión / + peso / bajar), historia clínica y registros.
- Ambos son el cuerpo de un Artifact, por eso no llevan `<!doctype>`.
- Colores del dolor en las dos apps: ≤ 4 menta (se progresa), 5 ámbar, ≥ 6 coral.

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

## Plantillas, alta, revisión mensual y mensajes (11/11/2026)

Todo en `data/rcd-datos.js` (lo usan las dos apps y lo usará la app real):
- **Plantillas de 12 semanas**: rotuliana y Aquiles salen de los protocolos de Dani (Drive › ANAMNESIS).
  En Aquiles, las semanas 8 y 10–12 estaban vacías: van como *propuesta*. Isquiotibiales (tendinopatía
  proximal) y cintilla iliotibial son *propuestas* enteras de Claude para que Dani las revise.
  Solo llevan ejercicios por nombre; las dosis las pone Dani al usarlas.
- **Pruebas de alta** por plantilla (todas *propuesta*, Dani las tiene que diseñar o confirmar).
  El paciente las ve desde el día 1 en «Progreso › Camino al alta». Dani las marca en la pestaña «Alta».
- **Revisión mensual**: cuestionario validado (VISA-P / VISA-A / VISA-H / LEFS; el texto en castellano
  lo aporta Dani) y botón para pedir videollamada por WhatsApp (sin opciones que elegir). Cuando Dani active las citas de Google Calendar, se pone el enlace en `config.reservaCalendario` y aparece un segundo botón.
- **Recordatorios**: dolor diario 21:00 si falta · encuesta domingo 18:00 y lunes 12:00 si falta · revisión mensual.
- **Mensajes de ánimo**: semanal (inicio / mitad / tramo final), mensual y última semana, con variables {nombre}…
- **Biblioteca**: por nombre (como trabaja Dani), sacada de las plantillas. Falta importar su
  «Listado de ejercicios» de Drive con los vídeos.
- **Alta de paciente nuevo**: datos → enlace (formulario pre-sesión + consentimiento RGPD) → seguimiento.

## Motor (backend) · `backend/`

- `Code.gs`: Google Apps Script en la cuenta de Workspace (info@rcdclinic.com). API JSON (POST {action, token}),
  datos en la hoja «RCD App · Datos» (una pestaña por tabla), acceso con código de 6 cifras por email
  (sesiones de 90 días; en la hoja solo se guarda la huella SHA-256), recordatorios por email cada hora.
- `pruebas.js`: simula Google y prueba el flujo completo → `node app/backend/pruebas.js` (19 pruebas).
- `INSTALAR.md`: guía paso a paso para Dani.
- Dominio: `rcdclinic.com` = landing; `app.rcdclinic.com` = app del paciente; `app.rcdclinic.com/panel` = panel.

## Apps reales · `web/` (lo que se publica en app.rcdclinic.com)

- `web/index.html` + `js/paciente.js`: app del paciente (acceso con código por email).
- `web/panel/index.html` + `js/panel.js`: panel de Dani (solo entra info@rcdclinic.com).
- `js/config.js`: dirección del motor. `js/comun.js`: conexión, acceso, avisos y gráficas.
- `data/`: plantillas, encuesta, mensajes y cuestionarios (fuente de verdad para las apps reales;
  `app/data/` solo la usan los prototipos).
- PWA: `manifest.webmanifest`, `sw.js`, iconos en `img/`. Cabeceras de seguridad en `_headers` (Netlify).
- Probar en local sin tocar datos reales: `node app/backend/servidor-pruebas.js` → http://localhost:8787
  (el código de acceso se ve en `/__codigo?email=…`).
- Publicación: `web/PUBLICAR.md` (Netlify + CNAME `app` en IONOS).

## Pendiente de Dani

- Confirmado: «Recuperación tras fuerza» y «Cansancio general» existen. «Malestar asociado a la lesión» se quita (decisión de Dani).
- Panel: cada botón de decisión propone el cambio y Dani puede retocarlo a mano. Se guardan la propuesta automática y el ajuste final (sirve para aprender su criterio).
- La sección 3 del formulario solo tiene campos técnicos ocultos (ID del cuaderno y semana): en la app no hacen falta.
- Workspace: plan **Business Standard** en **info@rcdclinic.com**. Los datos actuales de PhysiOne están en la
  cuenta personal de Gmail. La app nueva irá en la cuenta de Workspace (contrato de tratamiento de datos para el RGPD).
- Revisar las plantillas de isquios y cintilla, las semanas propuestas de Aquiles y todas las pruebas de alta.
- Cuestionarios en `data/rcd-cuestionarios.js`, con puntuación automática (VISA 0–100, LEFS 0–80).
  VISA-H: preguntas de la versión española validada (Medina-Porqueres 2022). VISA-A, VISA-P y LEFS:
  traducción provisional de RCD desde el inglés. Si Dani consigue los artículos validados (JOSPT 2011 y 2018,
  Disabil Rehabil 2014), se sustituye el texto; la puntuación no cambia.
- Plantillas de tratamiento y de alta: se quedan así de momento. Cuando Dani deje en Drive su documento
  nuevo, se actualizan desde ahí.
