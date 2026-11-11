/* RCD Clinic · datos base de la app (plantillas, pruebas de alta, mensajes y recordatorios).
   - Rotuliana y Aquiles salen de los protocolos de Dani en Drive (carpeta ANAMNESIS).
   - Lo marcado con origen 'propuesta' lo ha redactado Claude y Dani tiene que revisarlo.
   - Las dosis (series, reps, kg) no van aquí: Dani las pone a mano al usar la plantilla.
   - Los cuestionarios (VISA-A, VISA-P, VISA-H, LEFS) se citan por nombre; su texto validado
     en castellano lo aporta Dani. */
window.RCD = (() => {
  const W = (n, fase, dias, extra = {}) => ({ n, fase, dias, ...extra });
  const P = (n, fase, nota, extra = {}) => ({ n, fase, progresar: nota, ...extra });

  const plantillas = [
    {
      id: 'rotuliana', nombre: 'Tendinopatía rotuliana', corto: 'Rotuliana', origen: 'dani', semanas: 12, cuestionario: 'VISA-P',
      nota: 'Tu protocolo base de Drive. 3 días de fuerza + 1 de cardio.',
      fases: [
        { de: 1, a: 2, nombre: 'Control del dolor' }, { de: 3, a: 5, nombre: 'Fuerza' },
        { de: 6, a: 9, nombre: 'Fuerza y energía' }, { de: 10, a: 11, nombre: 'Pliometría' }, { de: 12, a: 12, nombre: 'Alta' },
      ],
      plan: [
        W(1, 'Control del dolor', [
          ['Sentadilla isométrica 1', 'Extensión en máquina de cuádriceps (subir, aguantar y bajar lento)', 'Flexión en máquina de isquio', 'Flexión de cadera con goma en los pies', 'Puente glúteo', 'Isométrico de glúteo medio en pared'],
          ['Sentadilla isométrica 1', 'Zancada isométrica', 'Patada lateral', 'Peso muerto', 'Flexión en máquina de isquio'],
          ['Sentadilla isométrica 1', 'Sentadilla libre sin peso (hasta punto de dolor / 1/4)', 'Puente glúteo', 'Patada lateral', 'Excéntrico en máquina de isquio'],
        ], { cardio: '1 día de cardio' }),
        P(2, 'Control del dolor', 'Progresar en pesos y repeticiones.', { cambios: 'Día 2: añadir sentadilla libre sin peso.' }),
        W(3, 'Fuerza', [
          ['Sentadilla isométrica 2', 'Zancada sin peso', 'Patada lateral', 'Peso muerto', 'Subidas a step'],
          ['Sentadilla libre con peso', 'Zancada isométrica', 'Puente glúteo', 'Flexión en máquina de isquio', 'Máquina de aductores'],
          ['Sentadilla isométrica 2', 'Sentadilla libre con peso', 'Puente glúteo', 'Patada de isquio', 'Máquina de aductores', 'Bicho muerto'],
        ]),
        P(4, 'Fuerza', 'Progresar en carga.'),
        W(5, 'Fuerza', [
          ['Zancada isométrica 2', 'Sentadilla libre con peso', 'Core foot: flexor del dedo gordo', 'Flexión en máquina de isquio', 'Puente glúteo / hip thrust', 'Máquina de aductores'],
          ['Sentadilla libre con peso', 'Subidas al cajón', 'Peso muerto', 'Patada lateral', 'Extensión en máquina de cuádriceps', 'Bicho muerto isométrico'],
          ['Sentadilla libre con pausa', 'Step down', 'Puente glúteo', 'Zancada con peso', 'Máquina de aductores', 'Core foot: flexor del dedo gordo'],
        ]),
        P(6, 'Fuerza y energía', 'Progresar en carga y peso. Introducir absorción y liberación de energía.'),
        W(7, 'Fuerza y energía', [
          ['Sentadilla búlgara con peso', 'Sentadilla libre con peso y pausa', 'Hip thrust', 'Flexión en máquina de isquio', 'Patada lateral manteniendo 5″', 'Step down (grande o con peso)'],
          ['Sentadilla libre con peso', 'Subidas al cajón (medio-alto)', 'Peso muerto', 'Patada lateral', 'Sentadilla de velocidad', 'Absorción de sentadilla con peso (aguantar 3″)'],
          ['Zercher squat', 'Step down potente', 'Puente glúteo', 'Excéntrico con rodillas dobladas', 'Máquina de aductores', 'Core foot: flexor del dedo gordo', 'Zancada en movimiento (frenada)'],
        ], { cardio: 'Introducir trote el día de cardio si va bien' }),
        W(8, 'Fuerza y energía', [
          ['Sentadilla búlgara con peso', 'Sentadilla libre con peso y pausa', 'Hip thrust', 'Sentadilla de velocidad con peso', 'Excéntrico con rodillas dobladas', 'Step down (grande o con peso)'],
          ['Sentadilla isométrica', 'Sentadilla libre con peso', 'Saltos con goma (rebotes)', 'Aterrizajes desde cajón medio', 'Patada lateral', 'Patada de isquio en velocidad'],
          ['Zercher squat', 'Step down potente', 'Puente glúteo', 'Excéntrico con rodillas dobladas', 'Máquina de aductores', 'Core foot: flexor del dedo gordo', 'Zancada en movimiento (frenada)'],
        ]),
        P(9, 'Fuerza y energía', 'Progresar en peso y repeticiones. Semana de consolidación.'),
        W(10, 'Pliometría', [
          ['Sentadilla búlgara con peso', 'Sentadilla libre con peso y pausa', 'Hip thrust', 'Excéntrico de sentadilla monopodal', 'Excéntrico con rodillas dobladas con peso', 'Step down con peso'],
          ['Sentadilla libre con peso', 'Sentadilla de velocidad con peso', 'Multisaltos con ambas piernas', 'Pogos unilaterales', 'Aterrizajes desde cajón alto', 'Patada de isquio en velocidad'],
          ['Zercher squat subiendo rápido', 'Step down con peso', 'Peso muerto', 'Sentadilla de velocidad (absorción)', 'Máquina de aductores', 'Core foot: flexor del dedo gordo', 'Zancada en movimiento (frenada)'],
        ], { titulos: ['Fuerza pura', 'Pliometría', 'Fuerza-velocidad'] }),
        W(11, 'Pliometría', [
          ['Sentadilla búlgara con peso', 'Sentadilla libre con peso y pausa', 'Hip thrust', 'Excéntrico de sentadilla monopodal', 'Excéntrico con rodillas dobladas con peso', 'Step down con peso'],
          ['Sentadilla libre con peso', 'Multisaltos con ambas piernas', 'Pogos unilaterales', 'Aterrizajes desde cajón alto y rebote hacia delante', 'Saltos laterales', 'Desplazamientos: frenadas y aceleraciones', 'Desplazamientos laterales'],
          ['Zercher squat subiendo rápido', 'Step down con peso', 'Peso muerto', 'Sentadilla de velocidad (absorción)', 'Máquina de aductores', 'Core foot: flexor del dedo gordo', 'Saltos en zancada'],
        ], { titulos: ['Fuerza pura', 'Pliometría', 'Fuerza-velocidad'] }),
        P(12, 'Alta', 'Progresar en peso y repeticiones. Semana de consolidación y pruebas de alta.'),
      ],
      alta: [
        { prueba: 'Cuestionario VISA-P', criterio: '≥ 80 puntos', origen: 'propuesta' },
        { prueba: 'Sentadilla monopodal en plano inclinado', criterio: 'Dolor ≤ 2/10 en 10 repeticiones', origen: 'propuesta' },
        { prueba: 'Salto monopodal a distancia (pierna afectada vs sana)', criterio: '≥ 90 % de la pierna sana', origen: 'propuesta' },
        { prueba: 'Aterrizajes desde cajón alto + rebote', criterio: 'Dolor ≤ 2/10 y sin empeorar a las 24 h', origen: 'propuesta' },
        { prueba: 'Carrera continua de 30 min', criterio: 'Dolor ≤ 2/10 durante y a las 24 h', origen: 'propuesta' },
      ],
    },
    {
      id: 'aquiles', nombre: 'Tendinopatía aquílea', corto: 'Aquiles', origen: 'dani', semanas: 12, cuestionario: 'VISA-A',
      nota: 'Tu protocolo de Drive hasta la semana 9. Las semanas 10–12 son una propuesta para completarlo.',
      fases: [
        { de: 1, a: 2, nombre: 'Isométricos' }, { de: 3, a: 6, nombre: 'Isotónicos' },
        { de: 7, a: 9, nombre: 'Fuerza unilateral' }, { de: 10, a: 11, nombre: 'Pliometría y carrera' }, { de: 12, a: 12, nombre: 'Alta' },
      ],
      plan: [
        W(1, 'Isométricos', [
          ['Isométrico de gemelo', 'Isométrico de sóleo', 'Patada lateral', 'Peso muerto', 'Puente glúteo'],
          ['Hip thrust en máquina', 'Isométrico de gemelo', 'Puntillas aguantando 2″', 'Isométrico de sóleo', 'Flexión de tobillo con kettlebell'],
          ['Peso muerto', 'Puente glúteo unipodal', 'Isotónico de sóleo sin peso', 'Puntillas aguantando 2″', 'Patada lateral'],
        ]),
        P(2, 'Isométricos', 'Progresar en tiempo y repeticiones. Si el dolor está controlado, progresar en trabajo isotónico.'),
        W(3, 'Isotónicos', [
          ['Isométrico de gemelo', 'Isotónico de sóleo sin peso', 'Puntillas aguantando 2″', 'Excéntrico de gemelo sin carga', 'Flexión en máquina de isquio'],
          ['Hip thrust en máquina', 'Isotónico de sóleo sin peso', 'Puntillas aguantando 2″ con peso', 'Flexión de tobillo con kettlebell'],
          ['Peso muerto', 'Puente glúteo unipodal', 'Isotónico de sóleo sin peso (aguantando arriba)', 'Puntillas aguantando 2″ con peso', 'Patada lateral', 'Excéntrico de gemelo'],
        ]),
        P(4, 'Isotónicos', 'Progresar en carga y tiempo bajo tensión.'),
        W(5, 'Isotónicos', [
          ['Isotónico de gemelo con peso', 'Isotónico de sóleo aguantando arriba', 'Puente glúteo unipodal', 'Flexión de tobillo con kettlebell', 'Excéntrico de gemelo en step'],
          ['Peso muerto', 'Patada lateral', 'Isotónico de gemelo en step', 'Puente glúteo con activación de gemelos', 'Puntillas aguantando arriba'],
          ['Isotónico de gemelo en step', 'Isotónico de gemelo con peso', 'Flexión en máquina de isquio', 'Sentadilla hasta punto de molestia', 'Excéntrico de gemelo en step'],
        ]),
        P(6, 'Isotónicos', 'Progresar en carga y tiempo bajo tensión.'),
        W(7, 'Fuerza unilateral', [
          ['Isotónico de gemelo con peso', 'Isotónico de sóleo aguantando arriba', 'Isotónico de gemelo unipodal en suelo', 'Puente glúteo unipodal', 'Flexión de tobillo con kettlebell', 'Excéntrico de gemelo en step con tempo'],
          ['Peso muerto', 'Patada lateral', 'Isotónico de gemelo en step', 'Isotónico de gemelo en step con peso', 'Excéntrico de gemelo en step', 'Isotónico de sóleo unilateral con peso'],
          ['Isotónico de gemelo en step con tempo', 'Isotónico de gemelo con peso', 'Flexión en máquina de isquio', 'Isotónico de gemelo unipodal en suelo', 'Excéntrico de gemelo en step con tempo'],
        ]),
        P(8, 'Fuerza unilateral', 'Progresar en carga y tiempo bajo tensión.', { origen: 'propuesta' }),
        W(9, 'Fuerza unilateral', [
          ['Isotónico de gemelo con peso', 'Isotónico de sóleo unilateral con peso', 'Isotónico de gemelo unipodal en suelo', 'Puente glúteo unipodal', 'Flexión de tobillo con kettlebell', 'Excéntrico de gemelo en step con tempo'],
          ['Peso muerto', 'Patada lateral', 'Isotónico de gemelo en step', 'Excéntrico de gemelo en step', 'Excéntrico de sóleo en step', 'Isotónico de sóleo unilateral con peso', 'Alcances al suelo a una pierna'],
          ['Excéntrico de sóleo en step con tempo', 'Isotónico de gemelo con peso', 'Flexión en máquina de isquio', 'Peso muerto unipodal', 'Isotónico de gemelo unilateral en step', 'Excéntrico de gemelo en step con tempo'],
        ]),
        W(10, 'Pliometría y carrera', [
          ['Isotónico de gemelo unilateral en step con peso', 'Isotónico de sóleo unilateral con peso', 'Peso muerto unipodal', 'Puente glúteo unipodal', 'Excéntrico de gemelo en step con tempo'],
          ['Saltos a la comba', 'Pogos bilaterales', 'Pogos unilaterales', 'Isotónico de gemelo en step', 'Patada lateral'],
          ['Isotónico de gemelo con peso', 'Alcances al suelo a una pierna', 'Saltos en zancada', 'Flexión en máquina de isquio', 'Excéntrico de sóleo en step con tempo'],
        ], { origen: 'propuesta', titulos: ['Fuerza', 'Pliometría', 'Fuerza-velocidad'], cardio: 'Protocolo correr-caminar si los pogos no dan dolor > 2/10 a las 24 h' }),
        W(11, 'Pliometría y carrera', [
          ['Isotónico de gemelo unilateral en step con peso', 'Isotónico de sóleo unilateral con peso', 'Peso muerto unipodal', 'Excéntrico de gemelo en step con tempo'],
          ['Pogos unilaterales', 'Multisaltos con ambas piernas', 'Saltos laterales', 'Skipping', 'Aceleraciones progresivas'],
          ['Isotónico de gemelo con peso', 'Saltos en zancada', 'Desplazamientos: frenadas y aceleraciones', 'Excéntrico de sóleo en step con tempo'],
        ], { origen: 'propuesta', titulos: ['Fuerza', 'Pliometría', 'Fuerza-velocidad'], cardio: 'Carrera continua progresiva' }),
        P(12, 'Alta', 'Consolidación y pruebas de alta.', { origen: 'propuesta' }),
      ],
      alta: [
        { prueba: 'Cuestionario VISA-A', criterio: '≥ 90 puntos', origen: 'propuesta' },
        { prueba: 'Elevaciones de talón a una pierna (hasta el fallo)', criterio: '≥ 25 repeticiones y ≥ 90 % de la pierna sana', origen: 'propuesta' },
        { prueba: '20 pogos a una pierna', criterio: 'Dolor ≤ 2/10 durante y a las 24 h', origen: 'propuesta' },
        { prueba: 'Salto monopodal a distancia', criterio: '≥ 90 % de la pierna sana', origen: 'propuesta' },
        { prueba: 'Carrera continua de 30 min', criterio: 'Dolor ≤ 2/10 y sin más rigidez al día siguiente', origen: 'propuesta' },
      ],
    },
    {
      id: 'isquio', nombre: 'Tendinopatía proximal de isquiotibiales', corto: 'Isquios', origen: 'propuesta', semanas: 12, cuestionario: 'VISA-H',
      nota: 'Propuesta de partida. Al principio evita la flexión de cadera profunda con carga (compresión del tendón).',
      fases: [
        { de: 1, a: 2, nombre: 'Isométricos sin compresión' }, { de: 3, a: 5, nombre: 'Isotónicos en rango medio' },
        { de: 6, a: 8, nombre: 'Rango largo y excéntricos' }, { de: 9, a: 11, nombre: 'Velocidad y sprint' }, { de: 12, a: 12, nombre: 'Alta' },
      ],
      plan: [
        W(1, 'Isométricos sin compresión', [
          ['Isométrico de isquio en puente (pies en banco)', 'Puente glúteo', 'Patada lateral', 'Isométrico de gemelo', 'Bicho muerto'],
          ['Flexión en máquina de isquio (isométrico)', 'Hip thrust en máquina', 'Sentadilla isométrica 1', 'Patada lateral'],
          ['Puente glúteo con pies elevados (isométrico)', 'Peso muerto en rango corto', 'Isométrico de glúteo medio en pared', 'Plancha lateral'],
        ]),
        P(2, 'Isométricos sin compresión', 'Progresar en tiempo de isométrico y en ángulo de cadera si el dolor está controlado.'),
        W(3, 'Isotónicos en rango medio', [
          ['Flexión en máquina de isquio', 'Puente glúteo unipodal', 'Peso muerto en rango medio', 'Patada lateral', 'Plancha lateral'],
          ['Hip thrust', 'Patada de isquio', 'Sentadilla libre con peso', 'Zancada sin peso'],
          ['Curl de isquio con fitball', 'Peso muerto', 'Máquina de aductores', 'Bicho muerto'],
        ]),
        P(4, 'Isotónicos en rango medio', 'Progresar en carga.'),
        P(5, 'Isotónicos en rango medio', 'Progresar en carga y empezar a ganar rango de cadera.'),
        W(6, 'Rango largo y excéntricos', [
          ['Peso muerto rumano', 'Nórdico asistido', 'Hip thrust', 'Sentadilla búlgara con peso', 'Patada lateral'],
          ['Peso muerto unipodal', 'Curl de isquio con fitball unipodal', 'Zancada con peso', 'Máquina de aductores'],
          ['Puente glúteo unipodal con peso', 'Excéntrico en máquina de isquio', 'Subidas al cajón', 'Plancha lateral con abducción'],
        ]),
        P(7, 'Rango largo y excéntricos', 'Progresar en carga y tiempo bajo tensión.'),
        P(8, 'Rango largo y excéntricos', 'Progresar en carga. Introducir trote suave si va bien.'),
        W(9, 'Velocidad y sprint', [
          ['Peso muerto rumano con peso', 'Nórdico', 'Hip thrust', 'Sentadilla búlgara con peso'],
          ['Patada de isquio en velocidad', 'Skipping', 'Pogos bilaterales', 'Zancada en movimiento (frenada)', 'Aceleraciones progresivas'],
          ['Peso muerto unipodal con peso', 'Excéntrico en máquina de isquio', 'Saltos en zancada', 'Desplazamientos: frenadas y aceleraciones'],
        ], { titulos: ['Fuerza', 'Velocidad', 'Fuerza-velocidad'] }),
        P(10, 'Velocidad y sprint', 'Progresar en velocidad (cuestas y sprints al 80–90 %).'),
        P(11, 'Velocidad y sprint', 'Sprints al 100 % si no hay dolor a las 24 h.'),
        P(12, 'Alta', 'Consolidación y pruebas de alta.'),
      ],
      alta: [
        { prueba: 'Cuestionario VISA-H', criterio: '≥ 80 puntos', origen: 'propuesta' },
        { prueba: 'Puente a una pierna con pie elevado (hasta el fallo)', criterio: '≥ 90 % de la pierna sana', origen: 'propuesta' },
        { prueba: 'Test de estiramiento con rodilla flexionada', criterio: 'Dolor ≤ 2/10', origen: 'propuesta' },
        { prueba: 'Sprint de 30 m al 100 %', criterio: 'Sin dolor durante ni a las 24 h', origen: 'propuesta' },
        { prueba: 'Carrera continua de 30 min con cuestas', criterio: 'Dolor ≤ 2/10', origen: 'propuesta' },
      ],
    },
    {
      id: 'cintilla', nombre: 'Síndrome de la cintilla iliotibial', corto: 'Cintilla', origen: 'propuesta', semanas: 12, cuestionario: 'LEFS',
      nota: 'Propuesta de partida. Fuerza de abductores, control monopodal y vuelta a correr dejando las bajadas para el final.',
      fases: [
        { de: 1, a: 2, nombre: 'Control de carga' }, { de: 3, a: 5, nombre: 'Fuerza de cadera' },
        { de: 6, a: 8, nombre: 'Unilateral y vuelta a correr' }, { de: 9, a: 11, nombre: 'Pliometría lateral' }, { de: 12, a: 12, nombre: 'Alta' },
      ],
      plan: [
        W(1, 'Control de carga', [
          ['Isométrico de glúteo medio en pared', 'Puente glúteo', 'Patada lateral', 'Plancha lateral', 'Sentadilla isométrica 1'],
          ['Hip thrust', 'Almeja con goma', 'Peso muerto', 'Bicho muerto'],
          ['Puente glúteo unipodal', 'Patada lateral', 'Step down (bajo)', 'Core foot: flexor del dedo gordo'],
        ]),
        P(2, 'Control de carga', 'Progresar en repeticiones y tiempo.'),
        W(3, 'Fuerza de cadera', [
          ['Plancha lateral con abducción', 'Sentadilla búlgara sin peso', 'Step down', 'Hip thrust', 'Patada lateral manteniendo 5″'],
          ['Peso muerto unipodal', 'Subidas al cajón', 'Monster walk con goma', 'Máquina de aductores'],
          ['Sentadilla libre con peso', 'Puente glúteo unipodal', 'Zancada lateral', 'Plancha lateral'],
        ]),
        P(4, 'Fuerza de cadera', 'Progresar en carga.'),
        P(5, 'Fuerza de cadera', 'Progresar en carga. Correr-caminar en llano si no hay dolor.'),
        W(6, 'Unilateral y vuelta a correr', [
          ['Sentadilla búlgara con peso', 'Step down con peso', 'Hip thrust', 'Plancha lateral con abducción'],
          ['Peso muerto unipodal con peso', 'Subidas al cajón (medio-alto)', 'Zancada lateral con peso', 'Monster walk con goma'],
          ['Sentadilla libre con peso y pausa', 'Step down potente', 'Puente glúteo unipodal con peso', 'Core foot: flexor del dedo gordo'],
        ], { cardio: 'Carrera continua en llano, sin bajadas' }),
        P(7, 'Unilateral y vuelta a correr', 'Progresar en carga y minutos de carrera.'),
        P(8, 'Unilateral y vuelta a correr', 'Introducir bajadas suaves si no hay dolor.'),
        W(9, 'Pliometría lateral', [
          ['Sentadilla búlgara con peso', 'Peso muerto unipodal con peso', 'Hip thrust'],
          ['Saltos laterales', 'Pogos unilaterales', 'Aterrizajes desde cajón medio', 'Desplazamientos laterales'],
          ['Step down con peso', 'Zancada en movimiento (frenada)', 'Saltos en zancada', 'Plancha lateral con abducción'],
        ], { titulos: ['Fuerza', 'Pliometría', 'Fuerza-velocidad'] }),
        P(10, 'Pliometría lateral', 'Progresar en saltos y en volumen de carrera.'),
        P(11, 'Pliometría lateral', 'Tiradas largas con bajadas.'),
        P(12, 'Alta', 'Consolidación y pruebas de alta.'),
      ],
      alta: [
        { prueba: 'Escala funcional LEFS', criterio: '≥ 72 de 80', origen: 'propuesta' },
        { prueba: 'Step down a una pierna (10 repeticiones)', criterio: 'Sin dolor y sin que la rodilla se vaya hacia dentro', origen: 'propuesta' },
        { prueba: 'Plancha lateral (afectada vs sana)', criterio: '≥ 90 % del tiempo de la pierna sana', origen: 'propuesta' },
        { prueba: 'Carrera de 45 min con bajadas', criterio: 'Sin dolor durante ni a las 24 h', origen: 'propuesta' },
      ],
    },
  ];

  /* Mensajes automáticos. Variables: {nombre} {semana} {semana_siguiente} {semanas_restantes} {dolor_medio} {meses} {cuestionario} */
  const mensajes = [
    { id: 'semanal-inicio', cuando: 'Cada domingo · semanas 1 a 4', texto: '¡Semana {semana} hecha, {nombre}! Ahora lo importante es la constancia, no la carga. Rellena tu encuesta y te preparo la semana {semana_siguiente}.' },
    { id: 'semanal-medio', cuando: 'Cada domingo · desde la semana 5 hasta 4 semanas antes del final', texto: 'Semana {semana} completada. Tu dolor medio ha sido {dolor_medio}/10. Seguimos sumando: rellena la encuesta y te preparo la siguiente.' },
    { id: 'semanal-final', cuando: 'Cada domingo · últimas 3 semanas', texto: 'Quedan {semanas_restantes} semanas, {nombre}. Ya puedes ver tus pruebas de alta en Progreso: vamos a por ellas.' },
    { id: 'mensual', cuando: 'Cada 4 semanas', texto: 'Hoy cumples {meses} en RCD. Toca tu revisión mensual: el cuestionario {cuestionario} (5 minutos). Si quieres una videollamada de seguimiento, escríbeme por WhatsApp.' },
    { id: 'ultima', cuando: 'Al empezar la última semana', texto: 'Última semana, {nombre}. Esta semana hacemos juntos las pruebas de alta. Si salen bien, ¡a correr sin dolor!' },
  ];

  const recordatorios = [
    { id: 'dolor', que: 'Diario de dolor', cuando: 'Cada día a las 21:00 si no lo ha rellenado' },
    { id: 'encuesta', que: 'Encuesta semanal', cuando: 'Domingo a las 18:00 · repite el lunes a las 12:00 si falta' },
    { id: 'mensual', que: 'Revisión mensual', cuando: 'El día que cumple cada 4 semanas, a las 18:00' },
  ];

  /* Biblioteca: todos los nombres de ejercicio usados en las plantillas, sin repetir */
  const biblioteca = (() => {
    const map = new Map();
    plantillas.forEach(p => p.plan.forEach(w => (w.dias || []).forEach((d, di) => d.forEach(name => {
      if (!map.has(name)) map.set(name, new Set());
      map.get(name).add(p.corto);
    }))));
    return [...map.entries()].map(([nombre, s]) => ({ nombre, en: [...s] })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  })();

  /* Encuesta semanal (preguntas del formulario de seguimiento de PhysiOne, sin «malestar»).
     bien: 'alto' = un número alto es bueno; 'bajo' = un número bajo es bueno. */
  const encuesta = [
    { section: 'Aspectos relacionados con la lesión' },
    { id: 'pautas', q: 'Seguimiento de las pautas generales del tratamiento', lo: 'No las he seguido nada', hi: 'No he fallado ningún día', bien: 'alto' },
    { id: 'arranque', q: 'Dolor de arranque', hint: 'Dolor en los primeros pasos después de estar un rato sin moverte', lo: 'Nada de molestias', hi: 'Súper dolorido', bien: 'bajo' },
    { id: 'rigidez', q: 'Rigidez matutina', lo: 'Nada de rigidez', hi: 'Me levanto hecho un tronco', bien: 'bajo' },
    { id: 'recfuerza', q: 'Recuperación entre sesiones de fuerza', lo: 'Me siento nada cansado', hi: 'Me siento muy cansado', bien: 'bajo' },
    { id: 'reccardio', q: 'Recuperación entre sesiones de cardio', lo: 'Me siento nada cansado', hi: 'Me siento muy cansado', bien: 'bajo' },
    { section: 'Aspectos relacionados con el contexto', intro: 'Cómo de ajetreada ha sido tu semana, qué tal has descansado y todo lo que pasa en paralelo a la lesión.' },
    { id: 'miedo', q: '¿Cuánto miedo has tenido durante la semana?', lo: 'No he pensado nada en la lesión', hi: 'No me lo he quitado de la cabeza', bien: 'bajo' },
    { id: 'pasos', q: 'Actividad física (media diaria de pasos)', num: true, placeholder: '8000', step: 100, bien: 'alto' },
    { id: 'motivacion', q: 'Grado de motivación para seguir el tratamiento', lo: 'Nada motivado', hi: 'A tope con el tratamiento', bien: 'alto' },
    { id: 'sueno', q: 'Horas de sueño (media diaria)', num: true, placeholder: '7,5', step: 0.5, bien: 'alto' },
    { id: 'descanso', q: 'Calidad del descanso', lo: 'No he descansado nada', hi: 'Nunca he dormido tan bien', bien: 'alto' },
    { id: 'cansancio', q: 'Cansancio general', lo: 'Nada cansado', hi: 'Agotado', bien: 'bajo' },
    { id: 'estres', q: 'Nivel de estrés', lo: 'Nada de estrés', hi: 'Necesito unas vacaciones', bien: 'bajo' },
    { id: 'cambios', q: '¿Notas cambios en la lesión respecto a la semana pasada?', opts: ['Nada', 'Ligeramente mejor', 'Cambio notable', 'Muy buen cambio'] },
  ];

  /* Ajustes. reservaCalendario: pon aquí el enlace de citas de Google Calendar cuando lo actives;
     mientras esté vacío, el paciente solo ve el botón de WhatsApp. */
  const config = { whatsapp: '34684780066', reservaCalendario: '' };

  return { plantillas, mensajes, recordatorios, biblioteca, config, encuesta };
})();
