/* RCD Clinic · formulario pre-sesión (las preguntas del formulario de PhysiOne de Dani, ordenadas por bloques)
   y la estructura de la historia clínica del panel (exploración objetiva de sus guiones de valoración).
   Tipos: texto · largo · numero · opciones · escala (0-10) · sino.  req = obligatoria.  si = solo si otra respuesta vale X. */
(() => {
  const SINO = ['Sí', 'No'];
  const HABITO = ['No, nunca', 'Sí, ocasionalmente', 'Sí, habitualmente'];

  const presesion = {
    version: 'v2026-11',
    legal: {
      // Versión 2 (nov 2026), en PDF, en el Drive de info@rcdclinic.com; compartidos como «Cualquier persona con el enlace»
      privacidad: 'https://drive.google.com/file/d/1oeCA977fPqLAp4iwIDqlxUzhGBp2TfmM/view',
      consentimiento: 'https://drive.google.com/file/d/1f6RnK_Aizp5HdV-9mTLnmHcwj_lZ-WiI/view',
      condiciones: 'https://drive.google.com/file/d/1D6aeT96IM6_PmsvMPajqBZIJ9JeOc0z4/view',
    },
    obligatorios: [
      { id: 'privacidad', texto: 'He leído y acepto la Política de Privacidad y el tratamiento de mis datos de salud para mi atención.', doc: 'privacidad' },
      { id: 'informado', texto: 'He leído y acepto el Consentimiento Informado para telerehabilitación (fisioterapia online).', doc: 'consentimiento' },
      { id: 'condiciones', texto: 'He leído y acepto las Condiciones Generales de Contratación.', doc: 'condiciones' },
    ],
    opcionales: [
      { id: 'grabacion', texto: 'Grabación de fragmentos de la videollamada con fines clínicos (p. ej., reevaluar la técnica).' },
      { id: 'docencia', texto: 'Uso docente o científico de materiales anonimizados (sin cara ni voz identificables).' },
      { id: 'rrss', texto: 'Uso de mi testimonio en redes sociales.' },
      { id: 'comerciales', texto: 'Recibir comunicaciones sobre servicios o formación de RCD Clinic.' },
    ],
    bloques: [
      {
        id: 'datos', titulo: 'Tus datos', intro: 'Para tu ficha y por si hubiera que contactar con alguien en una urgencia.',
        preguntas: [
          { id: 'nombre', q: '¿Cómo te llamas?', tipo: 'texto', req: true },
          { id: 'edad', q: '¿Cuántos años tienes?', tipo: 'numero', req: true },
          { id: 'sexo', q: 'Biológicamente eres', tipo: 'opciones', opts: ['Mujer', 'Hombre'], req: true },
          { id: 'dni', q: 'Número de identificación (DNI/NIE)', tipo: 'texto', req: true, ayuda: 'Lo necesitamos para tu historia clínica y las facturas.' },
          { id: 'telefono', q: 'Número de teléfono', tipo: 'texto', req: true },
          { id: 'emergencia', q: 'Teléfono de contacto de emergencia', tipo: 'texto', req: true },
          { id: 'direccion', q: '¿En qué dirección vas a realizar la sesión de valoración?', tipo: 'texto', req: true, ayuda: 'Solo se usaría si hubiera una urgencia durante la videollamada.' },
          { id: 'conocido', q: '¿Cómo nos has conocido?', tipo: 'opciones', opts: ['Instagram', 'Recomendación', 'Google', 'Otro'] },
        ],
      },
      {
        id: 'dolor', titulo: 'Tu dolor', intro: 'Cuéntalo con tus palabras: no hay respuestas buenas ni malas.',
        preguntas: [
          { id: 'motivo', q: '¿Cuál es el motivo de tu consulta?', tipo: 'largo', req: true },
          { id: 'zona', q: '¿En qué tendón o zona localizas el dolor?', tipo: 'opciones', opts: ['Tendón de Aquiles', 'Tendón rotuliano', 'Parte de atrás del muslo / glúteo (isquiotibiales)', 'Lateral de la rodilla (cintilla)', 'Otra zona'], req: true },
          { id: 'zonaOtra', q: '¿Qué zona?', tipo: 'texto', si: { id: 'zona', valor: 'Otra zona' } },
          { id: 'limita', q: '¿En qué limita esto tu día a día? ¿Qué no puedes hacer igual que antes?', tipo: 'largo', req: true },
          { id: 'inicio', q: '¿Cuándo empezó el dolor?', tipo: 'texto', req: true },
          { id: 'describe', q: '¿Cómo describirías tu dolor?', tipo: 'texto', req: true },
          { id: 'comoEmpezo', q: '¿Cómo empezaron los síntomas?', tipo: 'largo', req: true },
          { id: 'evolucion', q: '¿Cómo ha sido la evolución?', tipo: 'opciones', opts: ['Va a mejor', 'Igual', 'Va a peor', 'Con altibajos'], req: true },
          { id: 'intensidad', q: '¿Con qué intensidad te duele normalmente?', tipo: 'escala', req: true },
          { id: 'reposo', q: '¿Te duele en reposo, ya sea tumbado/a, sentado/a o de pie?', tipo: 'opciones', opts: ['Sí', 'No', 'A veces'], req: true },
          { id: 'empeora', q: '¿Qué gestos, actividades o situaciones empeoran tu dolor?', tipo: 'largo', req: true },
          { id: 'alivia', q: '¿Qué gestos, actividades o situaciones alivian tu dolor?', tipo: 'largo', req: true },
          { id: 'diario', q: '¿Cómo se comporta el dolor a lo largo del día?', tipo: 'largo', req: true },
          { id: 'rigidez', q: '¿Notas rigidez o «agarrotamiento» en la zona al levantarte o tras estar mucho tiempo quieto/a? ¿Cuánto dura?', tipo: 'texto', req: true },
          { id: 'calentar', q: '¿El dolor mejora según vas calentando y luego empeora al terminar o al día siguiente?', tipo: 'opciones', opts: ['Sí', 'No', 'No lo sé'], req: true },
          { id: 'arranque', q: '¿El dolor aparece sobre todo al empezar a moverte tras un rato de reposo («dolor de arranque»)?', tipo: 'sino', req: true },
          { id: 'otrosSintomas', q: '¿Tienes algún otro síntoma (hormigueo, inflamación, fiebre…)?', tipo: 'sino', req: true },
          { id: 'otrosSintomasCual', q: '¿Cuál?', tipo: 'texto', si: { id: 'otrosSintomas', valor: 'Sí' } },
        ],
      },
      {
        id: 'carga', titulo: 'Entrenamiento y descanso',
        preguntas: [
          { id: 'cambios', q: 'En las 4-6 semanas antes de que empezara el dolor, ¿hubo algún cambio en tu entrenamiento o actividad (más kilómetros, series, cuestas, otro deporte…)?', tipo: 'largo', req: true },
          { id: 'material', q: '¿Has cambiado recientemente de calzado, material deportivo o superficie de entrenamiento?', tipo: 'texto', req: true },
          { id: 'deporte', q: '¿Practicas algún deporte? ¿Cuál o cuáles y con qué frecuencia?', tipo: 'largo', req: true },
          { id: 'entrenador', q: '¿Tienes entrenador/a?', tipo: 'sino', req: true },
          { id: 'trabajo', q: '¿A qué te dedicas?', tipo: 'texto', req: true },
          { id: 'sueno', q: '¿Cuántas horas duermes de media y cómo valorarías la calidad de tu sueño?', tipo: 'texto', req: true },
          { id: 'ciclo', q: 'Si eres mujer: ¿tienes ciclo menstrual regular, tomas anticonceptivos hormonales o estás en la menopausia?', tipo: 'texto', si: { id: 'sexo', valor: 'Mujer' } },
        ],
      },
      {
        id: 'salud', titulo: 'Antecedentes y salud', intro: 'Importante para tu seguridad: contesta con calma.',
        preguntas: [
          { id: 'previo', q: '¿Habías tenido antes este dolor?', tipo: 'sino', req: true },
          { id: 'otroLado', q: '¿Has tenido molestias o lesiones similares en el otro lado?', tipo: 'opciones', opts: ['Sí', 'No', 'Alguna vez'], req: true },
          { id: 'familia', q: '¿Tienes antecedentes familiares de un dolor similar?', tipo: 'opciones', opts: ['Sí', 'No', 'No lo sé'] },
          { id: 'profesionales', q: '¿Has visitado ya a otros profesionales por este dolor? Si es así, ¿qué te dijeron?', tipo: 'largo', req: true },
          { id: 'imagen', q: '¿Te has hecho alguna prueba de imagen (radiografía, resonancia, ecografía)? ¿Cuál y cuándo?', tipo: 'texto', req: true, ayuda: 'Si tienes informes o imágenes, mándaselos a Dani por WhatsApp.' },
          { id: 'tratamientos', q: '¿Qué tratamientos has recibido para este problema?', tipo: 'largo', req: true },
          { id: 'farmacos', q: '¿Tomas actualmente algún fármaco? ¿Cuál y desde cuándo?', tipo: 'texto', req: true, ayuda: 'Incluye antibióticos o corticoides de los últimos meses. Si no tomas nada, escribe «No».' },
          { id: 'cirugia', q: '¿Te han hecho alguna operación? ¿Cuál?', tipo: 'texto', req: true, ayuda: 'Si no, escribe «No».' },
          { id: 'patologias', q: '¿Padeces hipertensión, diabetes u otra enfermedad? ¿Cuál?', tipo: 'texto', req: true, ayuda: 'Si no, escribe «No».' },
          { id: 'cancer', q: '¿Tienes antecedentes personales o familiares de cáncer o enfermedad grave?', tipo: 'sino', req: true },
          { id: 'cancerCual', q: 'Cuéntanos cuál y quién', tipo: 'texto', si: { id: 'cancer', valor: 'Sí' } },
          { id: 'sobrepeso', q: '¿Tienes antecedentes de sobrepeso u obesidad?', tipo: 'sino', req: true },
          { id: 'fuma', q: '¿Fumas?', tipo: 'opciones', opts: HABITO, req: true },
          { id: 'alcohol', q: '¿Bebes alcohol?', tipo: 'opciones', opts: HABITO, req: true },
        ],
      },
      {
        id: 'creencias', titulo: 'Lo que piensas y lo que quieres conseguir',
        preguntas: [
          { id: 'creeOcurre', q: '¿Qué crees que te ocurre?', tipo: 'largo', req: true },
          { id: 'creePorque', q: '¿Por qué crees que te ha ocurrido?', tipo: 'largo', req: true },
          { id: 'noMejora', q: '¿Por qué crees que no mejoras?', tipo: 'largo', req: true },
          { id: 'moverEmpeora', q: '¿Crees que moverte puede empeorar tu lesión?', tipo: 'opciones', opts: ['Sí', 'No', 'No lo sé'], req: true },
          { id: 'miedo', q: '¿Te da miedo moverte o hacer ciertas actividades? ¿Cuáles?', tipo: 'largo', req: true },
          { id: 'dejado', q: '¿Qué has dejado de hacer por miedo a empeorar?', tipo: 'largo', req: true },
          { id: 'motivacion', q: '¿Qué tan motivado/a te sientes para trabajar en ello, aunque sea difícil?', tipo: 'escala', req: true },
          { id: 'sinLesion', q: '¿Qué harías si no tuvieras esta lesión?', tipo: 'largo', req: true },
          { id: 'objetivo', q: 'Si no tuvieras estas limitaciones, ¿te plantearías algún objetivo (una carrera, una distancia…)?', tipo: 'largo', req: true },
          { id: 'dispuesto', q: '¿Qué estarías dispuesto/a a hacer para recuperarte?', tipo: 'largo', req: true },
        ],
      },
    ],
  };

  /* Historia clínica (panel de Dani). Exploración objetiva de sus guiones «Valoración tendinopatía aquílea/rotuliana». */
  const comunes = ['Movilidad: lunge test', 'Activación del dedo gordo', 'Posición estática', 'Marcha dinámica'];
  const calidad = ['Calidad de movimiento: bisagra de cadera', 'Calidad de movimiento: patrón de sentadilla'];
  const historia = {
    objetiva: {
      aquiles: [...comunes, 'Sentadilla unipodal', 'Test de fuerza: puntillas comparado con el otro lado', 'Test isométrico (provocación de dolor)', ...calidad],
      rotuliana: [...comunes, 'Sentadilla normal: punto de dolor y calidad', 'Sentadilla unipodal', 'Test isométrico (provocación de dolor: toalla o sentadilla isométrica)', ...calidad],
      isquio: [...comunes, 'Puente a una pierna (comparado con el otro lado)', 'Test de estiramiento con rodilla flexionada', 'Test isométrico de isquios (provocación de dolor)', ...calidad],
      cintilla: [...comunes, 'Step down a una pierna (control de rodilla)', 'Plancha lateral (comparada con el otro lado)', 'Test de Ober / Noble (provocación de dolor)', ...calidad],
    },
    rojas: ['Traumatismo previo', 'Pérdida de peso sin explicación', 'Dolor nocturno que no cede con la postura', 'Fiebre o malestar general', 'Antecedentes de cáncer', 'Fluoroquinolonas (antibióticos) en los últimos 6 meses', 'Corticoides recientes (orales o infiltración)', 'Síntomas neurológicos (hormigueo, pérdida de fuerza)'],
    general: [
      { id: 'dias', q: 'Días disponibles para entrenar', ayuda: '5 con cardio o 3 solo fuerza' },
      { id: 'tiempo', q: 'Tiempo disponible por sesión' },
      { id: 'fuerza', q: 'Fuerza actual (pesos que mueve)' },
      { id: 'cuestionarioDia', q: 'Día para el cuestionario de seguimiento', ayuda: 'Domingo por la tarde o lunes' },
      { id: 'organizacion', q: 'Organización de la semana' },
      { id: 'objetivo', q: 'Objetivo del tratamiento' },
    ],
  };

  window.RCD = Object.assign(window.RCD || {}, { presesion, historia });
})();
