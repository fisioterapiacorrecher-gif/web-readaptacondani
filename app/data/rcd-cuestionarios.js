/* RCD Clinic · cuestionarios de la revisión mensual.
   Puntuación de 0 a 100 en las VISA (100 = sin síntomas) y de 0 a 80 en la LEFS (80 = sin limitación).

   ORIGEN DEL TEXTO (importante):
   - VISA-H: preguntas tal cual de la versión española validada (Medina-Porqueres I, et al. Arch Bone Jt Surg.
     2022;10(8):683-694, aprobada por el autor original). Las etiquetas de los extremos de cada escala son
     nuestras: la figura con las respuestas no estaba accesible. Confirmar con el artículo.
   - VISA-A, VISA-P y LEFS: TRADUCCIÓN DE TRABAJO de RCD desde los originales en inglés, con la puntuación oficial.
     Sustituir por las versiones españolas validadas cuando Dani las tenga:
       VISA-A: Hernández-Sánchez S, et al. J Orthop Sports Phys Ther. 2018;48(2):111-120.
       VISA-P: Hernández-Sánchez S, et al. J Orthop Sports Phys Ther. 2011;41(8):581-591.
       LEFS:   Cruz-Díaz D, et al. Disabil Rehabil. 2014;36(23):2005-2011.
   - Originales: VISA-A Robinson 2001 (BJSM) · VISA-P Visentini 1998 (J Sci Med Sport) · VISA-H Cacchio 2014 (BJSM)
     · LEFS Binkley 1999 (Phys Ther). */
(() => {
  const dolor = (q, extra = {}) => ({ q, tipo: 'escala', lo: 'Dolor fuerte / intenso', hi: 'Sin dolor', ...extra });
  const deporte = {
    q: '¿Practica actualmente algún deporte u otra actividad física?', tipo: 'opciones',
    opciones: [['No, en absoluto', 0], ['Entrenamiento y/o competición modificados', 4],
      ['Entrenamiento completo y/o competición, pero no al mismo nivel que cuando empezaron los síntomas', 7],
      ['Compito al mismo nivel o más alto que cuando empezaron los síntomas', 10]],
  };
  const tiempos = ['Nada', '1–10 min', '11–20 min', '21–30 min', 'Más de 30 min'];
  const rama = (deporteTxt) => ({
    q: 'Responda solo a la opción (A, B o C) que describe su situación', tipo: 'rama',
    ramas: [
      { id: 'A', q: `No tengo dolor mientras hago ${deporteTxt}. ¿Cuánto tiempo puedo entrenar o practicar?`, puntos: [0, 7, 14, 21, 30] },
      { id: 'B', q: `Tengo algo de dolor mientras hago ${deporteTxt}, pero no me impide terminar el entrenamiento. ¿Cuánto tiempo puedo entrenar o practicar?`, puntos: [0, 4, 10, 14, 20] },
      { id: 'C', q: `Tengo un dolor que me impide terminar el entrenamiento de ${deporteTxt}. ¿Cuánto tiempo puedo entrenar o practicar?`, puntos: [0, 2, 5, 7, 10] },
    ],
    tiempos,
  });

  const cuestionarios = {
    'VISA-A': {
      nombre: 'VISA-A', lesion: 'Tendón de Aquiles', max: 100, texto: 'traduccion',
      intro: 'Las preguntas se refieren a los síntomas en el tendón de Aquiles durante la última semana.',
      items: [
        { q: '¿Durante cuántos minutos tiene rigidez en la zona del tendón de Aquiles al levantarse por la mañana?', tipo: 'escala', lo: '100 min o más', hi: '0 min', ayuda: 'Cada punto son 10 minutos menos: 0 = 100 min o más · 10 = sin rigidez.' },
        dolor('Una vez que ha entrado en calor durante el día, ¿tiene dolor al estirar del todo el tendón de Aquiles sobre el borde de un escalón, con la rodilla estirada?'),
        dolor('Después de caminar 30 minutos en llano, ¿tiene dolor en las 2 horas siguientes?', { ayuda: 'Si no puede caminar 30 minutos en llano por el dolor, marque 0.' }),
        dolor('¿Tiene dolor al bajar escaleras caminando con normalidad?'),
        dolor('¿Tiene dolor durante o justo después de hacer 10 elevaciones de talón a una pierna sobre suelo plano?'),
        { q: '¿Cuántos saltos a una pierna puede hacer sin dolor?', tipo: 'escala', lo: 'Ninguno', hi: '10 saltos', ayuda: 'Marque el número de saltos (de 0 a 10).' },
        deporte,
        rama('deporte que carga el tendón de Aquiles'),
      ],
    },
    'VISA-P': {
      nombre: 'VISA-P', lesion: 'Tendón rotuliano', max: 100, texto: 'traduccion',
      intro: 'Las preguntas se refieren a los síntomas en la rodilla durante la última semana.',
      items: [
        { q: '¿Durante cuántos minutos puede estar sentado sin dolor?', tipo: 'escala', lo: '0 min', hi: '100 min o más', ayuda: 'Cada punto son 10 minutos: 0 = nada · 10 = 100 min o más.' },
        dolor('¿Tiene dolor al bajar escaleras caminando con normalidad?'),
        dolor('¿Tiene dolor en la rodilla al estirarla del todo de forma activa, sin apoyar peso?'),
        dolor('¿Tiene dolor al hacer una zancada completa apoyando todo el peso?'),
        { q: '¿Tiene problemas para agacharse en cuclillas?', tipo: 'escala', lo: 'No puedo', hi: 'Sin problemas' },
        dolor('¿Tiene dolor durante o justo después de hacer 10 saltos a una pierna?', { lo: 'Dolor fuerte / no puedo' }),
        deporte,
        rama('deporte'),
      ],
    },
    'VISA-H': {
      nombre: 'VISA-H', lesion: 'Isquiotibiales (inserción proximal)', max: 100, texto: 'validado-preguntas',
      intro: 'Las preguntas se refieren a los síntomas en la parte posterior del muslo durante la última semana.',
      items: [
        { q: '¿Durante cuántos minutos puede sentarse o conducir el coche sin dolor?', tipo: 'escala', lo: '0 min', hi: '100 min o más', ayuda: 'Cada punto son 10 minutos.' },
        dolor('¿Cuánto dolor tiene durante o inmediatamente después de estirar la zona posterior del muslo/isquiotibiales (con la rodilla estirada)?'),
        dolor('¿Cuánto dolor tiene durante o inmediatamente después de una carrera normal?'),
        dolor('¿Cuánto dolor tiene durante o inmediatamente después de hacer un esprint?'),
        dolor('¿Cuánto dolor tiene durante o inmediatamente después de una zancada hacia delante a peso completo?'),
        dolor('¿Cuánto dolor tiene durante o inmediatamente después de levantar un objeto del suelo (con las rodillas estiradas)?'),
        { ...deporte, q: '¿Está realizando actualmente deporte u otra actividad física?' },
        {
          ...rama('deporte'), ramas: [
            { id: 'A', q: 'Si no tiene dolor mientras realiza deporte, ¿durante cuánto tiempo puede entrenar/practicar deporte?', puntos: [0, 7, 14, 21, 30] },
            { id: 'B', q: 'Si tiene dolor mientras realiza deporte pero no le impide completar el entrenamiento/la práctica deportiva, ¿durante cuánto tiempo puede entrenar/practicar deporte?', puntos: [0, 4, 10, 14, 20] },
            { id: 'C', q: 'Si tiene dolor que le impide completar el entrenamiento/la práctica deportiva, ¿durante cuánto tiempo puede entrenar/practicar deporte?', puntos: [0, 2, 5, 7, 10] },
          ],
        },
      ],
    },
    'LEFS': {
      nombre: 'LEFS', lesion: 'Miembro inferior (cintilla iliotibial)', max: 80, texto: 'traduccion',
      intro: 'Hoy, ¿tiene alguna dificultad para hacer estas actividades por su problema en la pierna?',
      items: [
        'Cualquiera de sus actividades habituales de trabajo, casa o estudios', 'Sus aficiones habituales, actividades recreativas o deportivas',
        'Entrar o salir de la bañera', 'Caminar de una habitación a otra', 'Ponerse los zapatos o los calcetines', 'Ponerse en cuclillas',
        'Levantar un objeto del suelo, como una bolsa de la compra', 'Hacer tareas ligeras en casa', 'Hacer tareas pesadas en casa',
        'Entrar o salir del coche', 'Caminar 2 manzanas', 'Caminar 1,5 km', 'Subir o bajar 10 escalones (un tramo de escalera)',
        'Estar de pie 1 hora', 'Estar sentado 1 hora', 'Correr en terreno llano', 'Correr en terreno irregular',
        'Hacer giros bruscos mientras corre rápido', 'Saltar a una pierna', 'Darse la vuelta en la cama',
      ].map(q => ({ q, tipo: 'opciones', opciones: [['Dificultad extrema o no puedo', 0], ['Bastante dificultad', 1], ['Dificultad moderada', 2], ['Un poco de dificultad', 3], ['Ninguna dificultad', 4]] })),
    },
  };

  /* Puntuación: respuestas = array por ítem (número para 'escala' y 'opciones'; {rama, i} para 'rama') */
  function puntuar(id, respuestas) {
    const c = cuestionarios[id];
    return c.items.reduce((t, it, i) => {
      const r = respuestas[i];
      if (r == null) return t;
      if (it.tipo === 'escala') return t + r;
      if (it.tipo === 'opciones') return t + it.opciones[r][1];
      if (it.tipo === 'rama') { const b = it.ramas.find(x => x.id === r.rama); return t + (b && r.i != null ? b.puntos[r.i] : 0); }
      return t;
    }, 0);
  }

  window.RCD = Object.assign(window.RCD || {}, { cuestionarios, puntuar });
})();
