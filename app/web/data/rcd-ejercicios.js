/* RCD Clinic · «Cómo se hace» de cada ejercicio (texto redactado con IA a partir del nombre; revisable por Dani).
   Cada entrada cubre un ejercicio base; las variantes («con peso», «con tempo», «a una pierna», «isométrico»…)
   añaden su indicación automáticamente. Si Dani escribe una descripción propia en la Biblioteca, manda la suya. */
(() => {
  const B = [
    // ---------- Gemelo y sóleo (tendón de Aquiles) ----------
    [/isom[eé]trico de gemelo|puntillas aguantando|isot[oó]nico de gemelo.*aguant/i, 'Ponte de puntillas con las rodillas estiradas, a media altura, y aguanta sin rebotar. Apóyate en una pared o barandilla solo para mantener el equilibrio.', ['Rodillas estiradas: así trabaja el gemelo', 'Peso repartido en el dedo gordo y el segundo dedo', 'Respira normal mientras aguantas']],
    [/isom[eé]trico de s[oó]leo/i, 'Sentado o con las rodillas dobladas (en sentadilla parcial o contra la pared), sube los talones a media altura y aguanta. Al doblar la rodilla el trabajo se va al sóleo, el músculo profundo de la pantorrilla.', ['Rodillas dobladas durante todo el ejercicio', 'Talones a media altura, sin llegar al máximo', 'Si es sentado, el peso va sobre las rodillas']],
    [/isot[oó]nico de s[oó]leo|elevaci[oó]n de talones sentado/i, 'Sentado, con los pies apoyados y las rodillas dobladas a 90°, sube los talones lo más alto que puedas y bájalos despacio. Si lleva peso, colócalo sobre las rodillas.', ['Sube en 2 segundos y baja en 3', 'Aprieta arriba un instante', 'No despegues los dedos del suelo']],
    [/exc[eé]ntrico de s[oó]leo/i, 'Sobre un escalón con las rodillas ligeramente dobladas, sube con las dos piernas y baja despacio solo con la pierna afectada hasta que el talón quede por debajo del escalón.', ['Rodilla un poco doblada todo el rato', 'La bajada es la parte importante: lenta', 'Sube siempre ayudándote de la otra pierna']],
    [/exc[eé]ntrico de gemelo/i, 'De pie en el borde de un escalón, sube de puntillas con las dos piernas y baja muy despacio solo con la afectada hasta que el talón quede por debajo del escalón. Vuelve a subir con las dos.', ['Rodilla estirada', 'Bajada lenta (3-4 segundos)', 'Sin rebotar abajo']],
    [/isot[oó]nico de gemelo|puntillas|elevaci[oó]n(es)? de tal[oó]n/i, 'De puntillas con las rodillas estiradas: sube los talones lo más alto que puedas y bájalos de forma controlada. En escalón, baja hasta que el talón pase por debajo del borde para trabajar todo el recorrido.', ['Sube recto, sin que el tobillo se vaya hacia fuera', 'Controla la bajada', 'Apoyo solo para el equilibrio']],
    [/flexi[oó]n de tobillo con kettlebell/i, 'Con un pie adelantado y la rodilla por delante de los dedos (posición de zancada), lleva la rodilla hacia delante sin despegar el talón. La kettlebell sobre la rodilla añade carga y ayuda a ganar movilidad de tobillo.', ['El talón no se despega del suelo', 'La rodilla va en la línea del segundo dedo', 'Movimiento lento y controlado']],
    [/core foot|dedo gordo/i, 'Sentado o de pie, aprieta el dedo gordo contra el suelo sin encoger los demás dedos ni levantar el arco. Mantén unos segundos y relaja.', ['Solo trabaja el dedo gordo', 'El arco del pie se mantiene', 'Ayuda a la estabilidad al correr']],

    // ---------- Sentadilla y variantes ----------
    [/sentadilla isom[eé]trica/i, 'Espalda apoyada en la pared o con los brazos al frente, baja a la profundidad que indique Dani y aguanta sin moverte. La versión 2 suele ser más profunda o con más tiempo.', ['Rodillas en la línea de los pies', 'Peso repartido en todo el pie', 'Un poco de molestia es aceptable si no pasa de 4/10']],
    [/sentadilla de velocidad|absorci[oó]n de sentadilla/i, 'Baja controlado a sentadilla parcial y sube lo más rápido posible. En la versión «absorción», baja rápido y frena en seco abajo, aguantando la posición.', ['Calidad antes que velocidad', 'Rodillas alineadas con los pies al frenar', 'Para si duele más de 4/10']],
    [/sentadilla hasta punto|sentadilla libre sin peso/i, 'Sentadilla con el peso de tu cuerpo bajando solo hasta donde empieza la molestia (o un cuarto de sentadilla). Sube empujando el suelo.', ['No pases del punto de molestia', 'Pecho alto, espalda neutra', 'Rodillas en la línea de los pies']],
    [/sentadilla b[uú]lgara/i, 'Con el pie de atrás apoyado en un banco, baja la rodilla de atrás hacia el suelo controlando y sube empujando con el talón de la pierna de delante.', ['El peso va en la pierna de delante', 'Rodilla de delante alineada con el pie', 'Tronco ligeramente inclinado hacia delante']],
    [/zercher/i, 'Sentadilla con la barra sujeta en el pliegue de los codos, pegada al cuerpo. Baja controlado y sube; en la variante «subiendo rápido», la subida es explosiva.', ['Codos altos y barra pegada', 'Espalda recta durante todo el movimiento', 'Empuja el suelo con todo el pie']],
    [/sentadilla libre|sentadilla (con pausa|con peso)/i, 'Pies a la anchura de los hombros: baja como si te sentaras atrás, con el pecho alto, hasta la profundidad indicada, y sube empujando el suelo.', ['Rodillas en la línea de los pies', 'Talones apoyados', 'Con pausa: aguanta abajo sin rebotar']],
    [/exc[eé]ntrico de sentadilla monopodal/i, 'A una pierna, baja muy despacio a una sentadilla parcial (por ejemplo, hasta sentarte en un banco) y sube ayudándote de las dos piernas.', ['La bajada lenta a una pierna es el ejercicio', 'Rodilla alineada con el pie, sin irse hacia dentro', 'Sube con apoyo de la otra pierna']],

    // ---------- Zancadas y step ----------
    [/zancada isom[eé]trica/i, 'Posición de zancada con las dos rodillas dobladas a unos 90° y aguanta. Tronco recto y peso repartido entre las dos piernas.', ['Rodilla de delante sobre el tobillo', 'Rodilla de atrás cerca del suelo', 'Aguanta sin moverte']],
    [/zancada lateral/i, 'Da un paso amplio hacia un lado y baja doblando esa rodilla mientras la otra pierna queda estirada. Vuelve empujando con la pierna que flexionas.', ['El pie de la pierna doblada mira al frente', 'Cadera atrás, como en una sentadilla', 'Rodilla alineada con el pie']],
    [/zancada en movimiento/i, 'Camina dando zancadas y frena cada paso de forma controlada, absorbiendo el peso con la pierna de delante antes de continuar.', ['Frenada suave, sin golpe', 'Rodilla de delante estable', 'Ritmo constante']],
    [/saltos en zancada/i, 'Desde posición de zancada, salta y cambia de pierna en el aire, aterrizando suave en zancada.', ['Aterriza blando', 'Rodilla de delante alineada', 'Para si el dolor pasa de 4/10']],
    [/zancada/i, 'Da un paso al frente y baja hasta que las dos rodillas estén dobladas a unos 90°. Vuelve empujando con el talón de delante.', ['Tronco recto', 'Rodilla de delante sobre el tobillo', 'Controla la bajada']],
    [/step down/i, 'De pie sobre un escalón, baja lentamente el talón de la otra pierna hasta rozar el suelo, controlando con la pierna de apoyo, y vuelve a subir. «Potente» significa subir rápido.', ['Rodilla de apoyo alineada con el pie, sin irse hacia dentro', 'Cadera nivelada', 'Bajada lenta']],
    [/subidas? (a|al) (step|caj[oó]n)/i, 'Apoya un pie entero en el step o cajón y sube empujando con esa pierna hasta estirarla. Baja controlando.', ['Empuja con la pierna de arriba, no te impulses con la de abajo', 'Rodilla alineada con el pie', 'Tronco ligeramente adelantado']],

    // ---------- Cadera, glúteo e isquios ----------
    [/puente gl[uú]teo con pies elevados/i, 'Tumbado boca arriba con los talones sobre un banco, sube la cadera y aguanta arriba, notando el trabajo en glúteos e isquios.', ['Cadera alta, sin arquear la zona lumbar', 'Aprieta glúteos', 'Respira mientras aguantas']],
    [/isom[eé]trico de isquio en puente/i, 'Tumbado boca arriba con los talones en un banco y las rodillas algo dobladas, empuja los talones hacia abajo y hacia ti para elevar la cadera, y aguanta.', ['Tensión en la parte de atrás del muslo', 'Cadera estable', 'Sin dolor en la inserción del glúteo']],
    [/puente gl[uú]teo con activaci[oó]n de gemelos/i, 'Puente de glúteo con los talones levantados (de puntillas): sube la cadera manteniendo los talones arriba para trabajar a la vez glúteo y gemelo.', ['Talones arriba todo el rato', 'Cadera alta', 'Movimiento controlado']],
    [/puente gl[uú]teo|hip thrust/i, 'Espalda apoyada (en el suelo en el puente, en un banco en el hip thrust), pies apoyados y rodillas dobladas: sube la cadera apretando glúteos hasta alinear rodillas, cadera y hombros, y baja controlado.', ['Aprieta glúteos arriba', 'Barbilla recogida, sin arquear la espalda', 'Empuja con los talones']],
    [/peso muerto unipodal|alcances al suelo a una pierna/i, 'Sobre una pierna, con la rodilla ligeramente doblada, inclina el tronco hacia delante llevando la otra pierna hacia atrás hasta notar estiramiento en la parte de atrás del muslo, y vuelve.', ['Espalda recta en todo momento', 'Cadera nivelada, sin abrirla', 'Busca el equilibrio antes que la amplitud']],
    [/peso muerto rumano/i, 'De pie, con las rodillas ligeramente dobladas, lleva la cadera hacia atrás bajando el peso pegado a las piernas hasta notar estiramiento en los isquios, y vuelve apretando glúteos.', ['Espalda recta', 'Las rodillas apenas se doblan', 'El peso pegado a las piernas']],
    [/peso muerto/i, 'Pies a la anchura de la cadera: lleva la cadera atrás, baja el peso pegado a las piernas con la espalda recta y sube empujando el suelo y apretando glúteos. «Rango corto/medio» limita hasta dónde bajas.', ['Espalda neutra siempre', 'El peso cerca del cuerpo', 'Respeta el rango que indique Dani']],
    [/n[oó]rdico/i, 'De rodillas con los tobillos sujetos, deja caer el cuerpo hacia delante lo más lento posible, frenando con los isquios. En la versión asistida, ayúdate con una goma o con las manos.', ['Cuerpo recto de rodillas a cabeza', 'La bajada lenta es el ejercicio', 'Apoya las manos al final y vuelve']],
    [/curl de isquio con fitball/i, 'Tumbado boca arriba con los talones sobre el fitball, sube la cadera y acerca la pelota hacia ti doblando las rodillas; vuelve a estirarlas despacio.', ['Cadera arriba todo el rato', 'Movimiento lento', 'Unipodal: solo una pierna en la pelota']],
    [/exc[eé]ntrico en m[aá]quina de isquio|exc[eé]ntrico con rodillas dobladas/i, 'En la máquina de isquios, sube el peso con las dos piernas y bájalo muy despacio con una sola (o frena la bajada en la variante con rodillas dobladas).', ['Bajada en 3-4 segundos', 'Sin tirones', 'Cadera pegada al banco']],
    [/flexi[oó]n en m[aá]quina de isquio/i, 'En la máquina de isquios, dobla las rodillas llevando el rodillo hacia los glúteos y vuelve despacio. En la versión isométrica, aguanta a mitad de recorrido.', ['Cadera pegada al banco', 'Vuelta controlada', 'Sin dolor en el tendón']],
    [/patada de isquio/i, 'De pie o en cuadrupedia, lleva la pierna hacia atrás y arriba doblando la rodilla, notando el trabajo en glúteo e isquio. En velocidad, el gesto es rápido y la vuelta controlada.', ['Zona lumbar estable', 'Movimiento desde la cadera', 'Velocidad sin perder el control']],
    [/patada lateral/i, 'Tumbado de lado o de pie, eleva la pierna hacia un lado con la punta del pie mirando al frente y bájala despacio. Si indica «manteniendo», aguanta arriba esos segundos.', ['Punta del pie al frente, no hacia arriba', 'Cadera quieta', 'Notas el trabajo en el lateral del glúteo']],
    [/isom[eé]trico de gl[uú]teo medio en pared/i, 'De pie de lado a una pared, empuja con la rodilla más cercana (doblada) contra la pared, apoyado sobre la otra pierna, y aguanta.', ['La pierna de apoyo trabaja más de lo que parece', 'Cadera nivelada', 'Tronco recto']],
    [/almeja/i, 'Tumbado de lado con las rodillas dobladas y una goma por encima de ellas, abre la rodilla de arriba sin separar los pies y ciérrala despacio.', ['Los pies siempre juntos', 'La cadera no rota hacia atrás', 'Movimiento lento']],
    [/monster walk/i, 'Con una goma alrededor de las piernas, en semisentadilla, camina hacia los lados o en diagonal manteniendo la tensión de la goma.', ['La goma siempre tensa', 'Rodillas hacia fuera', 'Pasos cortos y controlados']],
    [/m[aá]quina de aductores/i, 'En la máquina de aductores, junta las piernas de forma controlada y vuelve despacio.', ['Sin tirones', 'Vuelta lenta', 'Espalda apoyada']],
    [/flexi[oó]n de cadera con goma/i, 'Tumbado boca arriba o de pie, con una goma en los pies, sube la rodilla hacia el pecho contra la resistencia y vuelve despacio.', ['Zona lumbar pegada (si es tumbado)', 'Movimiento controlado', 'La otra pierna quieta']],
    [/extensi[oó]n en m[aá]quina de cu[aá]driceps/i, 'En la máquina de cuádriceps, estira las rodillas, aguanta un instante arriba y baja muy despacio.', ['Sube en 1-2 s, aguanta, baja en 3-4 s', 'Espalda apoyada', 'Molestia máxima 4/10']],

    // ---------- Core ----------
    [/bicho muerto/i, 'Tumbado boca arriba con brazos y piernas arriba, estira a la vez el brazo y la pierna contrarios sin despegar la zona lumbar del suelo. En la versión isométrica, aguanta con la pierna y el brazo estirados.', ['Zona lumbar pegada al suelo', 'Movimiento lento', 'Respira mientras estiras']],
    [/plancha lateral/i, 'De lado, apoyado en el antebrazo y el borde del pie, levanta la cadera hasta formar una línea recta y aguanta. Con abducción, sube y baja la pierna de arriba.', ['Cuerpo en línea recta', 'La cadera no cae', 'El hombro sobre el codo']],

    // ---------- Saltos y pliometría ----------
    [/pogos/i, 'Saltitos rápidos y cortos sobre la punta de los pies, con las rodillas casi estiradas, como un muelle. Unilaterales: sobre una sola pierna.', ['Contacto con el suelo muy corto', 'Poca altura, mucho ritmo', 'Para si el tendón duele más de 4/10']],
    [/saltos a la comba/i, 'Salta a la comba con saltos bajos y rítmicos, aterrizando sobre la parte delantera del pie.', ['Saltos bajos', 'Aterrizaje silencioso', 'Ritmo constante']],
    [/saltos con goma/i, 'Con una goma que te ayude o te resista, haz rebotes cortos y elásticos en el sitio.', ['Rebote ligero, sin hundirte', 'Rodillas alineadas', 'Calidad antes que cantidad']],
    [/aterrizajes desde caj[oó]n/i, 'Déjate caer desde el cajón (no saltes hacia arriba) y aterriza con las dos piernas absorbiendo el impacto en semisentadilla. «Y rebote»: nada más tocar el suelo, salta hacia delante.', ['Aterrizaje suave y silencioso', 'Rodillas alineadas con los pies', 'Aguanta un segundo abajo antes de levantarte']],
    [/multisaltos/i, 'Encadena saltos con las dos piernas (hacia delante o en el sitio), aterrizando suave y saliendo de nuevo sin pausa.', ['Aterrizaje blando', 'Brazos ayudan al impulso', 'Para si duele más de 4/10']],
    [/saltos laterales/i, 'Salta de lado a lado (sobre una línea o un pequeño obstáculo), aterrizando suave y controlando la rodilla.', ['Rodilla estable al aterrizar', 'Contactos cortos', 'Mira al frente']],
    [/skipping/i, 'Carrera en el sitio o avanzando poco, subiendo las rodillas y apoyando la parte delantera del pie con ritmo rápido.', ['Apoyo bajo la cadera', 'Brazos coordinados', 'Tronco recto']],
    [/aceleraciones|frenadas|desplazamientos/i, 'Carreras cortas acelerando de forma progresiva y frenando de forma controlada (o desplazamientos laterales), sin llegar al máximo hasta que Dani lo indique.', ['Empieza al 60-70 % y sube', 'Frena en varios pasos', 'Para si el dolor pasa de 4/10']],
  ];

  function variantes(n) {
    const v = [];
    if (/con peso|kettlebell/i.test(n)) v.push('Añade el peso que indique Dani (mancuerna, kettlebell, disco o mochila).');
    if (/tempo/i.test(n)) v.push('Respeta el tempo indicado: por ejemplo, 3-0-3 = 3 s subiendo, sin pausa, 3 s bajando.');
    if (/unilateral|unipodal|monopodal|a una pierna/i.test(n)) v.push('Se hace a una pierna: empieza por la pierna sana para comparar.');
    if (/sin peso|sin carga/i.test(n)) v.push('Sin peso añadido: solo con el de tu cuerpo.');
    if (/(\d)″/.test(n)) v.push(`Aguanta ${n.match(/(\d)″/)[1]} segundos en la posición indicada.`);
    return v;
  }

  /** Devuelve { como, claves[] } para un nombre de ejercicio, o null si no hay descripción. */
  function comoSeHace(nombre) {
    const n = String(nombre || '');
    const e = B.find(([re]) => re.test(n));
    if (!e) return null;
    return { como: [e[1], ...variantes(n)].join(' '), claves: e[2] };
  }

  window.RCD = Object.assign(window.RCD || {}, { comoSeHace });
})();
