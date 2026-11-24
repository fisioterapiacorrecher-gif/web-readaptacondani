/* RCD · catálogo de pruebas en vídeo (valoración, técnica y alta), baterías por lesión e instrucciones de grabación.
   tipo: 'salto' (altura por tiempo de vuelo), 'drop' (drop jump: contacto + vuelo → RSI), 'distancia' (con referencia
   en el suelo), 'angulo' (goniómetro sobre el fotograma) o 'tecnica' (revisión de un ejercicio).
   Las baterías son una propuesta de RCD: Dani las ajusta al pedir cada valoración. */
(() => {
  const PRUEBAS = [
    { id: 'cmj', nombre: 'Salto con contramovimiento (CMJ)', corto: 'CMJ', tipo: 'salto', unilateral: false, vista: 'perfil', lenta: true,
      pasos: ['Manos en la cintura todo el salto.', 'Baja rápido a tu profundidad natural y salta lo más alto que puedas.', 'Cae con las piernas estiradas y no encojas las rodillas en el aire.', 'Haz 3 saltos, descansando 30 segundos entre ellos.'] },
    { id: 'sj', nombre: 'Squat jump (SJ)', corto: 'SJ', tipo: 'salto', unilateral: false, vista: 'perfil', lenta: true,
      pasos: ['Manos en la cintura.', 'Baja a media sentadilla (rodillas a 90°) y quédate quieto 3 segundos.', 'Salta lo más alto que puedas sin bajar antes (sin rebote).', 'Cae con las piernas estiradas. Haz 3 saltos.'] },
    { id: 'slcmj', nombre: 'CMJ a una pierna', corto: 'CMJ 1 pierna', tipo: 'salto', unilateral: true, vista: 'perfil', lenta: true,
      pasos: ['Apoyado solo en la pierna que se indica, manos en la cintura.', 'Baja un poco y salta lo más alto que puedas.', 'Cae con la misma pierna y estírala en el aire.', 'Haz 3 saltos.'] },
    { id: 'dj', nombre: 'Drop jump (caja de 30 cm)', corto: 'Drop jump', tipo: 'drop', unilateral: false, vista: 'perfil', lenta: true,
      pasos: ['Súbete a un escalón o caja de unos 30 cm. Manos en la cintura.', 'Déjate caer (no saltes hacia arriba al bajar).', 'Nada más tocar el suelo, salta lo más alto y rápido que puedas: el menor tiempo posible en el suelo.', 'Haz 3 saltos.'] },
    { id: 'hop', nombre: 'Single leg hop (salto horizontal a una pierna)', corto: 'Single hop', tipo: 'distancia', unilateral: true, vista: 'perfil', lenta: false, referencia: true,
      pasos: ['Pega en el suelo una tira de cinta de 1 metro justo en la línea del salto (o deja un metro de medir abierto).', 'Ponte con la punta del pie al principio de la cinta.', 'Salta hacia delante lo más lejos que puedas con la misma pierna y aguanta el aterrizaje 2 segundos sin apoyar la otra.', 'Haz 3 saltos.'] },
    { id: 'triplehop', nombre: 'Triple hop (tres saltos seguidos a una pierna)', corto: 'Triple hop', tipo: 'distancia', unilateral: true, vista: 'perfil', lenta: false, referencia: true, lejos: true,
      pasos: ['Pega en el suelo una tira de cinta de 1 metro en la línea del salto.', 'Desde el principio de la cinta, da tres saltos seguidos hacia delante con la misma pierna.', 'Aguanta el último aterrizaje 2 segundos.', 'Ponte lo bastante lejos para que salgan los tres saltos enteros. Haz 2 intentos.'] },
    { id: 'broad', nombre: 'Salto horizontal a dos piernas', corto: 'Salto horizontal', tipo: 'distancia', unilateral: false, vista: 'perfil', lenta: false, referencia: true,
      pasos: ['Pega en el suelo una tira de cinta de 1 metro en la línea del salto.', 'Con las puntas de los pies al principio de la cinta, salta hacia delante lo más lejos que puedas.', 'Aguanta el aterrizaje sin dar pasos. Haz 3 saltos.'] },
    { id: 'slsquat', nombre: 'Sentadilla a una pierna (de frente)', corto: 'Sentadilla 1 pierna', tipo: 'angulo', unilateral: true, vista: 'frente', lenta: false, angulo: 'valgo',
      pasos: ['Pantalón corto: que se vean bien las rodillas.', 'Apoyado en la pierna que se indica, baja despacio todo lo que puedas controlando y vuelve a subir.', 'Haz 5 repeticiones seguidas.'] },
    { id: 'lunge', nombre: 'Dorsiflexión en carga (rodilla a la pared)', corto: 'Dorsiflexión', tipo: 'angulo', unilateral: true, vista: 'perfil', lenta: false, angulo: 'tibia',
      pasos: ['Pie de la pierna indicada mirando a una pared, el otro detrás.', 'Lleva la rodilla a tocar la pared sin levantar el talón.', 'Aleja el pie poco a poco hasta la distancia máxima a la que aún tocas sin levantar el talón y quédate 3 segundos ahí.'] },
    { id: 'sentadilla', nombre: 'Sentadilla profunda (de perfil)', corto: 'Sentadilla', tipo: 'angulo', unilateral: false, vista: 'perfil', lenta: false, angulo: 'rodilla',
      pasos: ['Pies a la anchura de las caderas, brazos al frente.', 'Baja todo lo que puedas sin levantar los talones y aguanta 2 segundos abajo.', 'Haz 3 repeticiones.'] },
    { id: 'otra', nombre: 'Otra prueba', corto: 'Otra', tipo: 'angulo', unilateral: false, vista: 'perfil', lenta: false, angulo: 'rodilla', libre: true,
      pasos: ['Sigue las indicaciones de Dani.'] },
  ];
  const BATERIAS = {
    rotuliana: ['cmj', 'sj', 'slcmj', 'hop', 'slsquat'],
    aquiles: ['cmj', 'dj', 'slcmj', 'hop', 'lunge'],
    isquio: ['cmj', 'broad', 'hop', 'triplehop'],
    cintilla: ['cmj', 'slsquat', 'hop', 'triplehop'],
  };
  const TECNICA = { id: 'tecnica', nombre: 'Técnica', corto: 'Técnica', tipo: 'tecnica', unilateral: false, vista: 'perfil', lenta: false,
    pasos: ['Haz 3 repeticiones como las haces normalmente en tu sesión.', 'Graba la serie entera, sin cortar el principio.'] };

  /** Cómo colocar el móvil, según la prueba. */
  function colocacion(p) {
    const lista = [
      'Apoya el móvil en algo fijo (un trípode, unos libros, una silla): no lo sujetes con la mano.',
      p.vista === 'frente' ? 'Ponlo de frente a ti, a la altura de tus rodillas.' : 'Ponlo de perfil, mirándote de lado, a la altura de tus rodillas.',
      p.lejos ? 'Aléjalo unos 4 metros, en horizontal, para que salga todo el recorrido.' : 'Aléjalo 2–3 metros, para que salgas entero, con los pies, durante toda la prueba.',
      'Busca buena luz y ropa ajustada o pantalón corto.',
      'Empieza a grabar 2 segundos antes de moverte y para 2 segundos después.',
    ];
    if (p.referencia) lista.splice(3, 0, 'La cinta de 1 metro tiene que verse entera, en el suelo y en la misma línea del salto.');
    return lista;
  }
  /** Cómo grabar a cámara lenta en cada móvil (solo para los saltos: hace falta para medir el tiempo de vuelo). */
  const CAMARA_LENTA = {
    iphone: ['Abre la Cámara y desliza hasta «Cámara lenta».', 'Mejor a 240 fps: Ajustes › Cámara › Grabar a cámara lenta › 1080p a 240 fps.', 'Al subirlo, elige el vídeo desde Fotos tal cual, sin editarlo.'],
    android: ['Abre la Cámara y busca «Cámara lenta» (en algunos móviles está en «Más»). Si tiene «Súper lenta», no la uses: corta el vídeo.', 'Elige la opción de más fps (120 o 240) si te deja.', 'Si tu móvil no tiene cámara lenta, grábalo normal: también vale.'],
  };
  const MOMENTOS = m => m === 'inicial' ? 'Valoración inicial' : m === 'final' ? 'Valoración final' : /^semana-(\d+)$/.test(m || '') ? 'Revisión semana ' + m.slice(7) : '';

  window.RCD = window.RCD || {};
  window.RCD.videos = {
    PRUEBAS, BATERIAS, TECNICA, colocacion, CAMARA_LENTA, MOMENTOS,
    prueba: id => PRUEBAS.find(p => p.id === id) || (id === 'tecnica' ? TECNICA : null),
    APARTADOS: { valoracion: 'Valoración', tecnica: 'Técnica', alta: 'Alta' },
  };
})();
