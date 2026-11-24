/* RCD · analizador de vídeos del panel: reproductor fotograma a fotograma, salto vertical por tiempo de vuelo
   (h = g·t²/8, el método de MyJump), drop jump (RSI), distancia con referencia en el suelo, goniómetro manual
   y con IA de pose (MediaPipe, en el propio navegador), y comparación de dos vídeos sincronizados. */
(() => {
  const { $, $$, esc, toast } = window.RCDUI;
  const G = 9.81;
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt2 = n => (Math.round(n * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt3 = n => (Math.round(n * 1000) / 1000).toLocaleString('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const grados = n => Math.round(n) + '°';
  const ICO = {
    atras10: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 6l-6 6 6 6M19 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    atras: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    pausa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
    adelante: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    adelante10: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6l6 6-6 6M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  /* ================= Vídeo: descarga desde Drive y fps reales del archivo ================= */
  const cacheVideos = new Map();   // videoId → { url, fps, frames } (dura mientras el panel está abierto)
  async function cargarVideo(api, v, alProgreso) {
    if (cacheVideos.has(v.id)) return cacheVideos.get(v.id);
    const a = await api('accesoVideo', { videoId: v.id });
    const r = await fetch(a.url, a.token ? { headers: { Authorization: 'Bearer ' + a.token } } : {});
    if (!r.ok) throw new Error(r.status === 404 ? 'El vídeo ya no está en Drive (¿se borró?).' : 'No se ha podido descargar el vídeo de Drive (' + r.status + ').');
    const total = Number(r.headers.get('Content-Length')) || v.tamano || 0, partes = []; let llevo = 0;
    const lector = r.body.getReader();
    for (;;) { const { done, value } = await lector.read(); if (done) break; partes.push(value); llevo += value.length; alProgreso?.(total ? llevo / total : 0); }
    const blob = new Blob(partes, { type: a.tipo || v.mime || 'video/mp4' });
    const info = await leerFps(blob).catch(() => null);
    const res = { url: URL.createObjectURL(blob), fps: info?.fps || 30, frames: info?.frames || 0, fpsGrabacion: a.fpsGrabacion || v.fpsGrabacion || '', detectado: !!info };
    cacheVideos.set(v.id, res);
    return res;
  }

  /** Lee los fps del vídeo en el propio archivo (MP4/MOV: cajas moov › trak › mdhd y stts). */
  async function leerFps(blob) {
    const leer = async (ini, n) => new DataView(await blob.slice(ini, ini + n).arrayBuffer());
    let pos = 0, moov = null;
    while (pos + 8 <= blob.size) {   // cajas de primer nivel: buscamos «moov» (puede estar al principio o al final)
      const h = await leer(pos, 16);
      let tam = h.getUint32(0); const tipo = String.fromCharCode(h.getUint8(4), h.getUint8(5), h.getUint8(6), h.getUint8(7));
      if (tam === 1) tam = Number(h.getBigUint64(8)); else if (tam === 0) tam = blob.size - pos;
      if (tam < 8) break;
      if (tipo === 'moov') { moov = await leer(pos, Math.min(tam, 50 * 1048576)); break; }
      pos += tam;
    }
    if (!moov) return null;
    const hijos = (dv, ini, fin) => { const out = []; let p = ini; while (p + 8 <= fin) { let t = dv.getUint32(p); const tipo = String.fromCharCode(dv.getUint8(p + 4), dv.getUint8(p + 5), dv.getUint8(p + 6), dv.getUint8(p + 7)); let cab = 8; if (t === 1) { t = Number(dv.getBigUint64(p + 8)); cab = 16; } if (t < 8 || p + t > fin) break; out.push({ tipo, ini: p + cab, fin: p + t }); p += t; } return out; };
    const caja = (lista, tipo) => lista.find(b => b.tipo === tipo);
    for (const trak of hijos(moov, 8, moov.byteLength).filter(b => b.tipo === 'trak')) {
      const mdia = caja(hijos(moov, trak.ini, trak.fin), 'mdia'); if (!mdia) continue;
      const enMdia = hijos(moov, mdia.ini, mdia.fin), hdlr = caja(enMdia, 'hdlr'), mdhd = caja(enMdia, 'mdhd');
      if (!hdlr || !mdhd) continue;
      const manejador = String.fromCharCode(...[0, 1, 2, 3].map(i => moov.getUint8(hdlr.ini + 8 + i)));
      if (manejador !== 'vide') continue;
      const ver = moov.getUint8(mdhd.ini), escala = moov.getUint32(mdhd.ini + (ver === 1 ? 20 : 12));
      const minf = caja(enMdia, 'minf'), stbl = minf && caja(hijos(moov, minf.ini, minf.fin), 'stbl'), stts = stbl && caja(hijos(moov, stbl.ini, stbl.fin), 'stts');
      if (!stts || !escala) continue;
      const n = moov.getUint32(stts.ini + 4); let frames = 0, dur = 0, comun = 0, mayor = 0;
      for (let i = 0; i < n; i++) { const c = moov.getUint32(stts.ini + 8 + i * 8), d = moov.getUint32(stts.ini + 12 + i * 8); frames += c; dur += c * d; if (c > mayor) { mayor = c; comun = d; } }
      if (!frames || !comun) continue;
      return { fps: Math.round(escala / comun * 100) / 100, frames, media: frames / (dur / escala) };
    }
    return null;
  }

  /* ================= Reproductor fotograma a fotograma ================= */
  class Reproductor {
    constructor(cont, fuente, { alCambiar, dibujar, alTocar, etiqueta } = {}) {
      this.cont = cont; this.fps = fuente.fps; this.frames = fuente.frames; this.alCambiar = alCambiar; this.dibujar = dibujar; this.alTocar = alTocar;
      cont.innerHTML = `${etiqueta ? `<p class="az-etq">${esc(etiqueta)}</p>` : ''}<div class="az-escena"><video playsinline muted preload="auto" src="${fuente.url}"></video><canvas class="az-capa"></canvas></div>
        <div class="az-controles">
          <button class="az-b" type="button" data-p="-10" aria-label="Retroceder 10 fotogramas">${ICO.atras10}</button>
          <button class="az-b" type="button" data-p="-1" aria-label="Fotograma anterior">${ICO.atras}</button>
          <button class="az-b az-play" type="button" aria-label="Reproducir">${ICO.play}</button>
          <button class="az-b" type="button" data-p="1" aria-label="Fotograma siguiente">${ICO.adelante}</button>
          <button class="az-b" type="button" data-p="10" aria-label="Avanzar 10 fotogramas">${ICO.adelante10}</button>
          <label class="sr">Velocidad</label><select class="az-vel" aria-label="Velocidad de reproducción"><option value="0.1">0,1×</option><option value="0.25" selected>0,25×</option><option value="0.5">0,5×</option><option value="1">1×</option></select>
          <span class="az-pos num" aria-live="off"></span>
        </div>
        <input class="az-barra" type="range" min="0" max="1000" value="0" aria-label="Posición en el vídeo">`;
      this.v = $('video', cont); this.capa = $('.az-capa', cont); this.escena = $('.az-escena', cont);
      this.v.playbackRate = 0.25;
      this.listo = new Promise(res => this.v.addEventListener('loadedmetadata', () => { this.ajustar(); res(); }, { once: true }));
      this.v.addEventListener('seeked', () => this.refrescar());
      this.v.addEventListener('timeupdate', () => this.refrescar());
      this.v.addEventListener('play', () => { $('.az-play', cont).innerHTML = ICO.pausa; $('.az-play', cont).setAttribute('aria-label', 'Pausa'); this.bucle(); });
      this.v.addEventListener('pause', () => { $('.az-play', cont).innerHTML = ICO.play; $('.az-play', cont).setAttribute('aria-label', 'Reproducir'); this.irA(this.frame()); });
      $('.az-play', cont).addEventListener('click', () => this.v.paused ? this.v.play() : this.v.pause());
      $$('[data-p]', cont).forEach(b => b.addEventListener('click', () => this.paso(+b.dataset.p)));
      $('.az-vel', cont).addEventListener('change', e => { this.v.playbackRate = +e.target.value; });
      $('.az-barra', cont).addEventListener('input', e => { this.v.pause(); this.irA(Math.round(e.target.value / 1000 * (this.total() - 1))); });
      this.capa.addEventListener('pointerdown', e => this.tocar(e, 'inicio'));
      this.capa.addEventListener('pointermove', e => { if (this.arrastrando) this.tocar(e, 'mover'); });
      ['pointerup', 'pointercancel'].forEach(t => this.capa.addEventListener(t, () => { this.arrastrando = false; }));
      this.ro = new ResizeObserver(() => this.ajustar()); this.ro.observe(this.cont); window.addEventListener('resize', this.alRedim = () => this.ajustar());
    }
    total() { return this.frames || Math.max(1, Math.round((this.v.duration || 0) * this.fps)); }
    frame() { return Math.min(this.total() - 1, Math.max(0, Math.floor(this.v.currentTime * this.fps + 1e-4))); }
    irA(n) {
      n = Math.min(this.total() - 1, Math.max(0, n)); const t = (n + 0.5) / this.fps;
      if (Math.abs(this.v.currentTime - t) < 1e-6) return Promise.resolve();
      const listo = new Promise(res => { const to = setTimeout(res, 1500); this.v.addEventListener('seeked', () => { clearTimeout(to); res(); }, { once: true }); });
      this.v.currentTime = t; return listo;
    }
    paso(n) { this.v.pause(); this.irA(this.frame() + n); }
    bucle() { if (this.v.paused) return; this.refrescar(); (this.v.requestVideoFrameCallback ? cb => this.v.requestVideoFrameCallback(cb) : requestAnimationFrame)(() => this.bucle()); }
    ajustar() {
      if (!this.v.videoWidth) return;
      // La escena toma exactamente la proporción del vídeo (vertical u horizontal) para que las marcas cuadren
      const ratio = this.v.videoWidth / this.v.videoHeight, ancho = this.cont.clientWidth || 600;
      const alto = Math.min(Math.max(240, window.innerHeight - (this.cont.closest('.az-comp') ? 320 : 230)), ancho / ratio);
      this.escena.style.width = Math.round(alto * ratio) + 'px'; this.escena.style.height = Math.round(alto) + 'px';
      const r = this.escena.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      this.capa.width = Math.round(r.width * dpr); this.capa.height = Math.round(r.height * dpr);
      this.refrescar();
    }
    /** De píxeles de pantalla a píxeles del vídeo (las marcas se guardan en píxeles del vídeo). */
    aVideo(e) { const r = this.capa.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * this.v.videoWidth, y: (e.clientY - r.top) / r.height * this.v.videoHeight }; }
    escala() { return this.capa.width / (this.v.videoWidth || 1); }
    tocar(e, fase) {
      if (!this.alTocar) return;
      e.preventDefault();
      const p = this.aVideo(e), radio = 22 / this.escala() * (window.devicePixelRatio || 1);
      if (fase === 'inicio') { this.capa.setPointerCapture(e.pointerId); this.arrastrando = true; }
      this.alTocar(p, fase, radio);
    }
    refrescar() {
      const n = this.frame(), t = n / this.fps;
      $('.az-pos', this.cont).textContent = `Fotograma ${n} / ${this.total() - 1} · ${fmt3(t)} s`;
      if (document.activeElement !== $('.az-barra', this.cont)) $('.az-barra', this.cont).value = Math.round(n / Math.max(1, this.total() - 1) * 1000);
      const c = this.capa.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.capa.width, this.capa.height);
      c.setTransform(this.escala(), 0, 0, this.escala(), 0, 0);
      this.dibujar?.(c, 1 / this.escala(), n);
      this.alCambiar?.(n);
    }
    /** Fotograma actual con las marcas, como imagen JPEG (para guardar la corrección o la medición). */
    foto(maxAncho = 1280) {
      const k = Math.min(1, maxAncho / this.v.videoWidth), cv = document.createElement('canvas');
      cv.width = Math.round(this.v.videoWidth * k); cv.height = Math.round(this.v.videoHeight * k);
      const c = cv.getContext('2d'); c.drawImage(this.v, 0, 0, cv.width, cv.height); c.setTransform(k, 0, 0, k, 0, 0);
      this.dibujar?.(c, 1 / k * Math.max(1, this.v.videoWidth / 900), this.frame());
      return cv.toDataURL('image/jpeg', 0.85);
    }
    cerrar() { this.v.pause(); this.ro.disconnect(); window.removeEventListener('resize', this.alRedim); }
  }

  /* ================= Dibujo de marcas ================= */
  const COLOR = '#FF3434', HUESO = '#FFFBE8', MENTA = '#E9FFB9';
  function punto(c, p, u, color = COLOR, texto) {
    c.beginPath(); c.arc(p.x, p.y, 7 * u, 0, Math.PI * 2); c.fillStyle = color; c.fill();
    c.lineWidth = 2 * u; c.strokeStyle = '#000'; c.stroke();
    if (texto) etiqueta(c, texto, p.x + 12 * u, p.y - 12 * u, u);
  }
  function linea(c, a, b, u, color = COLOR, discontinua) {
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineWidth = 3 * u; c.strokeStyle = color; c.setLineDash(discontinua ? [8 * u, 6 * u] : []); c.stroke(); c.setLineDash([]);
  }
  function etiqueta(c, texto, x, y, u) {
    c.font = `600 ${15 * u}px Geist, system-ui, sans-serif`; const w = c.measureText(texto).width;
    c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(x - 6 * u, y - 16 * u, w + 12 * u, 23 * u); c.fillStyle = HUESO; c.fillText(texto, x, y);
  }
  function arco(c, a, v, b, u) {
    const a1 = Math.atan2(a.y - v.y, a.x - v.x), a2 = Math.atan2(b.y - v.y, b.x - v.x);
    let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    c.beginPath(); c.arc(v.x, v.y, 34 * u, a1, a1 + d, d < 0); c.lineWidth = 2 * u; c.strokeStyle = MENTA; c.stroke();
  }
  /** Ángulo interior en el vértice b (0–180°). */
  const angulo3 = (a, b, c) => { const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y }; return Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1)))) * 180 / Math.PI; };
  /** Inclinación del segmento a→b respecto a la vertical (0° = vertical). */
  const anguloVertical = (a, b) => Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 180 / Math.PI;

  /* ================= IA de pose (MediaPipe, cargada solo al usarla) ================= */
  let poseCargando = null;
  function cargarPose() {
    if (poseCargando) return poseCargando;
    const base = new URL('../vendor/mediapipe/', document.baseURI).href;
    poseCargando = import(base + 'vision_bundle.mjs').then(async m => {
      const files = await m.FilesetResolver.forVisionTasks(base + 'wasm');
      // En procesador (CPU): ~0,1 s por fotograma en cualquier ordenador; la gráfica (GPU) va peor en muchos portátiles
      return m.PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: base + 'pose_landmarker_full.task', delegate: 'CPU' }, runningMode: 'IMAGE', numPoses: 1 });
    }).catch(e => { poseCargando = null; throw e; });
    return poseCargando;
  }
  // Índices de MediaPipe: hombro 11/12, cadera 23/24, rodilla 25/26, tobillo 27/28, talón 29/30, punta 31/32 (izquierda/derecha del paciente)
  const CADENAS = {
    rodilla: { nombre: 'Flexión de rodilla', i: [23, 25, 27], tipo: 3, mostrar: a => 180 - a },
    cadera: { nombre: 'Flexión de cadera', i: [11, 23, 25], tipo: 3, mostrar: a => 180 - a },
    tobillo: { nombre: 'Ángulo de tobillo', i: [25, 27, 31], tipo: 3, mostrar: a => a },
    valgo: { nombre: 'Valgo de rodilla (plano frontal)', i: [23, 25, 27], tipo: 3, mostrar: a => 180 - a },
    tibia: { nombre: 'Inclinación de la tibia', i: [25, 27], tipo: 2, mostrar: a => a },
    tronco: { nombre: 'Inclinación del tronco', i: [11, 23], tipo: 2, mostrar: a => a },
  };
  const indicesLado = (cadena, lado) => CADENAS[cadena].i.map(i => lado === 'derecha' ? i + 1 : i);
  /** Detecta la pose en un fotograma y devuelve los puntos de la cadena en píxeles del vídeo (o null). */
  async function detectar(rep, cadena, lado) {
    const lm = await cargarPose();
    const cv = document.createElement('canvas'); cv.width = rep.v.videoWidth; cv.height = rep.v.videoHeight;
    cv.getContext('2d').drawImage(rep.v, 0, 0);
    const r = lm.detect(cv), pose = r.landmarks?.[0];
    if (!pose) return null;
    const pts = indicesLado(cadena, lado).map(i => ({ x: pose[i].x * cv.width, y: pose[i].y * cv.height, v: pose[i].visibility ?? 1 }));
    return pts;
  }

  /* ================= Ventana del analizador ================= */
  let abierta = null;
  function cerrar() {
    if (!abierta) return;
    abierta.reps.forEach(r => r.cerrar()); abierta.el.remove(); document.body.classList.remove('az-abierto');
    document.removeEventListener('keydown', abierta.teclas); abierta = null;
  }

  /**
   * Abre el analizador para un vídeo.
   * opts: { api, video, paciente, prueba (del catálogo), otros: [vídeos para comparar], textoResultado(valor, medidas) → texto, alGuardar(videos) }
   */
  async function abrir(opts) {
    cerrar();
    const { api, video: v, prueba } = opts;
    const el = document.createElement('div');
    el.className = 'az'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Analizar vídeo');
    const titulo = [prueba?.corto || v.nombre, v.lado, window.RCD.videos.MOMENTOS(v.momento)].filter(Boolean).join(' · ');
    el.innerHTML = `<div class="az-cab"><div><p class="eyebrow">${esc(opts.paciente?.nombre || '')} · ${esc(window.RCD.videos.APARTADOS[v.apartado] || '')}</p><h2>${esc(titulo)}</h2></div>
      <div class="az-cab-acts"><button class="btn btn-ghost" type="button" id="az-comparar">Comparar con otro vídeo</button><button class="x" type="button" id="az-cerrar" aria-label="Cerrar">✕</button></div></div>
      <div class="az-cuerpo"><p class="mute" id="az-carga">Descargando el vídeo de Drive…</p></div>`;
    document.body.appendChild(el); document.body.classList.add('az-abierto');
    const teclas = e => {
      if (!abierta || /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'Escape') cerrar();
      const rep = abierta.reps[abierta.activo || 0]; if (!rep) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); rep.paso(e.shiftKey ? -10 : -1); abierta.sync?.(-1 * (e.shiftKey ? 10 : 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); rep.paso(e.shiftKey ? 10 : 1); abierta.sync?.(e.shiftKey ? 10 : 1); }
      if (e.key === ' ') { e.preventDefault(); rep.v.paused ? rep.v.play() : rep.v.pause(); }
    };
    document.addEventListener('keydown', teclas);
    abierta = { el, reps: [], teclas };
    $('#az-cerrar', el).addEventListener('click', cerrar);
    $('#az-comparar', el).addEventListener('click', () => comparar(opts));

    let fuente;
    try { fuente = await cargarVideo(api, v, p => { const c = $('#az-carga', el); if (c) c.textContent = `Descargando el vídeo de Drive… ${Math.round(p * 100)} %`; }); }
    catch (e) { $('.az-cuerpo', el).innerHTML = `<p class="vacio">${esc(e.message)}</p>`; return; }
    if (abierta?.el !== el) return;
    montarAnalisis(el, fuente, opts);
  }

  function montarAnalisis(el, fuente, opts) {
    const { api, video: v, prueba } = opts;
    const tipo = prueba?.tipo || 'angulo';
    const prev = v.medidas || {};
    const M = {   // estado de la medición (se guarda tal cual en «medidas»)
      tipo, fpsArchivo: fuente.fps, fpsReal: prev.fpsReal || fuente.fpsGrabacion || fuente.fps,
      intentos: prev.intentos || [], calib: prev.calib || null, angulos: prev.angulos || [], principal: prev.principal ?? 0, criterio: prev.criterio || 'mejor',
    };
    // Marcas en curso (antes de «Guardar intento» / «Guardar ángulo»)
    let marca = { contacto: null, despegue: null, aterrizaje: null, p1: null, p2: null };
    let calibrando = null, herramienta = tipo === 'distancia' ? 'calibrar' : (tipo === 'angulo' || tipo === 'tecnica') ? 'tres' : null;
    let pts = [], arrastre = -1, cadena = prueba?.angulo || 'rodilla', curva = null, origenIA = false, ladoIA = v.lado || 'izquierda';
    const estado = { comentario: v.comentario || '', foto: v.apartado === 'tecnica' };

    $('.az-cuerpo', el).innerHTML = `<div class="az-grid"><div class="az-izq" id="az-rep"></div><div class="az-der" id="az-panel"></div></div>`;
    const rep = new Reproductor($('#az-rep', el), fuente, {
      dibujar: (c, u, n) => dibujar(c, u, n),
      alTocar: (p, fase, radio) => tocar(p, fase, radio),
    });
    abierta.reps = [rep]; abierta.activo = 0;

    /* --- cálculos --- */
    const dtFrames = (a, b) => (b - a) / M.fpsReal;   // segundos reales entre dos fotogramas
    const alturaCm = tv => G * tv * tv / 8 * 100;
    const escalaCal = () => M.calib ? Math.hypot(M.calib.b.x - M.calib.a.x, M.calib.b.y - M.calib.a.y) / M.calib.cm : 0;   // px por cm
    const distanciaCm = (p1, p2) => {
      const k = escalaCal(); if (!k) return null;
      const ux = (M.calib.b.x - M.calib.a.x), uy = (M.calib.b.y - M.calib.a.y), n = Math.hypot(ux, uy);
      return Math.abs(((p2.x - p1.x) * ux + (p2.y - p1.y) * uy) / n) / k;   // proyectado sobre la línea de la cinta
    };
    function intentoActual() {
      if (tipo === 'salto' && marca.despegue != null && marca.aterrizaje != null && marca.aterrizaje > marca.despegue) {
        const vuelo = dtFrames(marca.despegue, marca.aterrizaje); return { despegue: marca.despegue, aterrizaje: marca.aterrizaje, vuelo, altura: alturaCm(vuelo) };
      }
      if (tipo === 'drop' && marca.contacto != null && marca.despegue != null && marca.aterrizaje != null && marca.contacto < marca.despegue && marca.despegue < marca.aterrizaje) {
        const contacto = dtFrames(marca.contacto, marca.despegue), vuelo = dtFrames(marca.despegue, marca.aterrizaje), altura = alturaCm(vuelo);
        return { contactoFrame: marca.contacto, despegue: marca.despegue, aterrizaje: marca.aterrizaje, contacto, vuelo, altura, rsi: altura / 100 / contacto };
      }
      if (tipo === 'distancia' && marca.p1 && marca.p2) { const d = distanciaCm(marca.p1, marca.p2); if (d != null) return { p1: marca.p1, p2: marca.p2, despegue: marca.despegue, aterrizaje: marca.aterrizaje, distancia: d }; }
      return null;
    }
    // Los intentos guardados se recalculan con los fps reales (por si Dani los corrige después)
    function recalcular() {
      M.intentos = M.intentos.map(x => {
        if (tipo === 'salto') { const vuelo = dtFrames(x.despegue, x.aterrizaje); return { ...x, vuelo, altura: alturaCm(vuelo) }; }
        if (tipo === 'drop') { const contacto = dtFrames(x.contactoFrame, x.despegue), vuelo = dtFrames(x.despegue, x.aterrizaje), altura = alturaCm(vuelo); return { ...x, contacto, vuelo, altura, rsi: altura / 100 / contacto }; }
        if (tipo === 'distancia') { const d = distanciaCm(x.p1, x.p2); return { ...x, distancia: d ?? x.distancia }; }
        return x;
      });
    }
    const clave = x => tipo === 'drop' ? x.rsi : tipo === 'distancia' ? x.distancia : x.altura;
    function resultado() {
      if (tipo === 'tecnica') { const a = M.angulos[M.principal]; return { valor: '', unidad: '', texto: a ? `${a.nombre}: ${grados(a.mostrado)}` : '' }; }
      if (tipo === 'angulo') { const a = M.angulos[M.principal]; return a ? { valor: Math.round(a.mostrado * 10) / 10, unidad: '°', texto: `${a.nombre}: ${grados(a.mostrado)}` } : null; }
      if (!M.intentos.length) return null;
      const vals = M.intentos.map(clave), val = M.criterio === 'media' ? vals.reduce((a, b) => a + b, 0) / vals.length : Math.max(...vals);
      const quien = [prueba?.corto || v.nombre, v.lado].filter(Boolean).join(' ');
      if (tipo === 'drop') { const m = M.intentos.reduce((a, b) => b.rsi > a.rsi ? b : a); return { valor: Math.round(val * 100) / 100, unidad: 'RSI', texto: `${quien}: RSI ${fmt2(val)} · ${fmt1(m.altura)} cm · contacto ${fmt3(m.contacto)} s` }; }
      return { valor: Math.round(val * 10) / 10, unidad: 'cm', texto: `${quien}: ${fmt1(val)} cm${M.criterio === 'media' ? ' (media)' : ''}` };
    }

    /* --- dibujo sobre el vídeo --- */
    function dibujar(c, u, n) {
      if (tipo === 'distancia') {
        const cal = calibrando || M.calib;
        if (cal?.a) punto(c, cal.a, u, MENTA, cal.b ? '' : 'Inicio de la cinta');
        if (cal?.a && cal?.b) { linea(c, cal.a, cal.b, u, MENTA); punto(c, cal.b, u, MENTA); etiqueta(c, `${cal.cm || '?'} cm`, (cal.a.x + cal.b.x) / 2, (cal.a.y + cal.b.y) / 2 - 14 * u, u); }
        if (marca.p1) punto(c, marca.p1, u, COLOR, 'Despegue');
        if (marca.p2) punto(c, marca.p2, u, COLOR, 'Aterrizaje');
        if (marca.p1 && marca.p2) { linea(c, marca.p1, marca.p2, u, COLOR, true); const d = distanciaCm(marca.p1, marca.p2); if (d != null) etiqueta(c, `${fmt1(d)} cm`, (marca.p1.x + marca.p2.x) / 2, Math.min(marca.p1.y, marca.p2.y) - 24 * u, u); }
      }
      if (tipo === 'angulo' || tipo === 'tecnica') {
        pts.forEach((p, i) => { if (i > 0) linea(c, pts[i - 1], p, u, COLOR); });
        if (herramienta === 'vertical' && pts.length >= 1) linea(c, pts[0], { x: pts[0].x, y: pts[0].y + 9999 }, u, HUESO, true);
        pts.forEach((p, i) => punto(c, p, u, i === 1 && herramienta === 'tres' ? MENTA : COLOR));
        const a = anguloActual();
        if (a != null) { if (herramienta === 'tres') arco(c, pts[0], pts[1], pts[2], u); const ref = herramienta === 'tres' ? pts[1] : pts[0]; etiqueta(c, grados(a.mostrado), ref.x + 40 * u, ref.y - 10 * u, u); }
      }
      if (tipo === 'salto' || tipo === 'drop') {
        const t = [['contacto', 'Contacto'], ['despegue', 'Despegue'], ['aterrizaje', 'Aterrizaje']].filter(([k]) => marca[k] === n).map(([, t]) => t);
        if (t.length) etiqueta(c, t.join(' · '), 16 * u, 30 * u, u);
      }
    }
    function anguloActual() {
      if (herramienta === 'tres' && pts.length === 3) { const a = angulo3(pts[0], pts[1], pts[2]); const cad = CADENAS[cadena]; return { bruto: a, mostrado: cad && cad.tipo === 3 && origenIA ? cad.mostrar(a) : a }; }
      if (herramienta === 'vertical' && pts.length === 2) { const a = anguloVertical(pts[0], pts[1]); return { bruto: a, mostrado: a }; }
      return null;
    }

    /* --- toques sobre el vídeo --- */
    function tocar(p, fase, radio) {
      if (fase === 'inicio') {
        // ¿está tocando una marca existente? → arrastrarla
        // En distancia, mientras se marca el despegue o el aterrizaje cada toque pone un punto nuevo
        // (la punta del pie suele estar justo encima del extremo de la cinta)
        const lista = tipo !== 'distancia' ? pts : herramienta === 'calibrar' ? [calibrando?.a, calibrando?.b] : herramienta ? [] : [M.calib?.a, M.calib?.b, marca.p1, marca.p2];
        arrastre = lista.findIndex(q => q && Math.hypot(q.x - p.x, q.y - p.y) < radio);
        if (arrastre >= 0) return;
        if (tipo === 'distancia') {
          if (herramienta === 'calibrar') { calibrando = calibrando && !calibrando.b ? { ...calibrando, b: p } : { a: p, b: null, cm: Number($('#az-cm', el)?.value) || 100 }; if (calibrando.b) fijarCalibracion(); }
          else if (herramienta === 'p1') { marca.p1 = p; marca.despegue = rep.frame(); herramienta = 'p2'; }
          else if (herramienta === 'p2') { marca.p2 = p; marca.aterrizaje = rep.frame(); herramienta = null; }
          pintarPanel(); rep.refrescar(); return;
        }
        if (tipo === 'angulo' || tipo === 'tecnica') {
          const max = herramienta === 'vertical' ? 2 : 3;
          if (pts.length >= max) { pts = []; origenIA = false; }
          pts.push(p); pintarPanel(); rep.refrescar();
        }
        return;
      }
      if (fase === 'mover' && arrastre >= 0) {
        if (tipo === 'distancia') {
          if (arrastre <= 1) {
            const c = herramienta === 'calibrar' ? calibrando : M.calib; if (!c) return;
            if (arrastre === 0) c.a = p; else c.b = p;
            if (c.b) { M.calib = { ...c, cm: Number($('#az-cm', el).value) || c.cm }; calibrando = herramienta === 'calibrar' ? c : null; recalcular(); }
          }
          if (arrastre === 2) marca.p1 = p; if (arrastre === 3) marca.p2 = p;
        } else pts[arrastre] = p;
        rep.refrescar(); pintarResumen();
      }
    }
    function fijarCalibracion() { const cm = Number($('#az-cm', el).value); if (!(cm > 0)) { toast('Escribe cuánto mide la referencia'); return; } calibrando.cm = cm; M.calib = { ...calibrando }; herramienta = 'p1'; recalcular(); }

    /* --- panel de herramientas --- */
    const btn = (id, txt, on, extra = '') => `<button class="chip${on ? ' on' : ''}" type="button" id="${id}" aria-pressed="${!!on}" ${extra}>${txt}</button>`;
    function pintarPanel() {
      const p = $('#az-panel', el);
      const fpsAviso = fuente.detectado ? `El archivo va a <b>${fmt1(M.fpsArchivo)} fps</b>.` : 'No he podido leer los fps del archivo: revisa el dato.';
      let html = `<div class="card az-fps"><label>Fotogramas por segundo reales de la grabación<input type="number" id="az-fps" min="1" max="2000" step="1" value="${M.fpsReal}"></label>
        <p class="mute">${fpsAviso} ${v.fpsGrabacion ? `El paciente dijo que grabó a <b>${v.fpsGrabacion} fps</b>.` : ''} Si lo grabó a cámara lenta y el archivo va más lento (pasa con el iPhone), pon aquí los fps de la cámara lenta (120 o 240).</p></div>`;
      if (tipo === 'salto' || tipo === 'drop') {
        const pasos = tipo === 'drop' ? [['contacto', 'Contacto', 'Primer fotograma con el pie en el suelo al caer de la caja'], ['despegue', 'Despegue', 'Primer fotograma sin el pie en el suelo'], ['aterrizaje', 'Aterrizaje', 'Primer fotograma con el pie en el suelo otra vez']]
          : [['despegue', 'Despegue', 'Primer fotograma con los pies en el aire'], ['aterrizaje', 'Aterrizaje', 'Primer fotograma con un pie tocando el suelo']];
        html += `<div class="card az-herr"><p class="sec-title">Marca el salto</p><p class="mute">Avanza fotograma a fotograma (flechas del teclado) y pulsa cada botón en su fotograma.</p>
          ${pasos.map(([k, t, ayuda]) => `<div class="az-marca"><button class="btn ${marca[k] != null ? 'btn-ghost' : 'btn-primary'}" type="button" data-marcar="${k}">${t}</button><span class="mute">${marca[k] != null ? `fotograma ${marca[k]} <button class="az-ir" type="button" data-ir="${marca[k]}">ir</button>` : esc(ayuda)}</span></div>`).join('')}
          <div id="az-actual" class="az-actual"></div>
          <button class="btn btn-primary btn-block" type="button" id="az-guardar-int" disabled>Guardar este salto</button></div>`;
      }
      if (tipo === 'distancia') {
        html += `<div class="card az-herr"><p class="sec-title">1 · Referencia</p>
          <div class="two"><label>Mide (cm)<input type="number" id="az-cm" min="1" step="1" value="${M.calib?.cm || calibrando?.cm || 100}"></label><div>${btn('az-calibrar', M.calib ? 'Volver a marcar' : 'Marcar la cinta', herramienta === 'calibrar')}</div></div>
          <p class="mute">${herramienta === 'calibrar' ? 'Toca los dos extremos de la cinta del suelo.' : M.calib ? `Referencia lista: ${fmt1(escalaCal())} píxeles por cm.` : ''}</p>
          <p class="sec-title">2 · Salto</p>
          ${btn('az-p1', marca.p1 ? `Despegue · fot. ${marca.despegue}` : 'Despegue: toca la punta del pie', herramienta === 'p1', M.calib ? '' : 'disabled')}
          ${btn('az-p2', marca.p2 ? `Aterrizaje · fot. ${marca.aterrizaje}` : 'Aterrizaje: toca el talón', herramienta === 'p2', M.calib ? '' : 'disabled')}
          <p class="mute">Ve al fotograma del despegue, pulsa el botón y toca la punta del pie. Luego ve al aterrizaje y toca el talón. Puedes arrastrar los puntos para afinar.</p>
          <div id="az-actual" class="az-actual"></div>
          <button class="btn btn-primary btn-block" type="button" id="az-guardar-int" disabled>Guardar este salto</button></div>`;
      }
      if (tipo === 'angulo' || tipo === 'tecnica') {
        html += `<div class="card az-herr"><p class="sec-title">Goniómetro</p>
          <div class="chipline">${btn('az-tres', 'Ángulo de 3 puntos', herramienta === 'tres')}${btn('az-vert', 'Respecto a la vertical', herramienta === 'vertical')}</div>
          <p class="mute">${herramienta === 'tres' ? 'Toca 3 puntos; el del medio es el vértice (p. ej. cadera, rodilla, tobillo).' : 'Toca 2 puntos de un segmento (p. ej. rodilla y tobillo): da su inclinación respecto a la vertical.'} Arrastra los puntos para afinar.</p>
          <p class="sec-title">Con IA</p>
          <div class="two"><label>Articulación<select id="az-cadena">${Object.entries(CADENAS).map(([k, c]) => `<option value="${k}" ${k === cadena ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select></label>
            <label>Lado<select id="az-lado"><option value="izquierda" ${ladoIA === 'izquierda' ? 'selected' : ''}>Izquierda</option><option value="derecha" ${ladoIA === 'derecha' ? 'selected' : ''}>Derecha</option></select></label></div>
          <div class="chipline"><button class="btn btn-ghost" type="button" id="az-ia">Detectar en este fotograma</button><button class="btn btn-ghost" type="button" id="az-curva">Seguir en todo el vídeo</button></div>
          <p class="mute" id="az-ia-estado">La IA coloca los puntos sola; revísalos y corrígelos si hace falta. Funciona mejor con ropa ajustada y buena luz.</p>
          <div id="az-curva-box" hidden><svg class="chart" id="az-curva-svg" viewBox="0 0 340 120" role="img" aria-label="Ángulo a lo largo del vídeo"></svg><p class="mute" id="az-curva-txt"></p></div>
          <div id="az-actual" class="az-actual"></div>
          <div class="two"><label>Nombre de la medida<input type="text" id="az-nombre" maxlength="60" value="${esc(CADENAS[cadena]?.nombre + ' ' + ladoIA)}"></label><div><button class="btn btn-primary btn-block" type="button" id="az-guardar-ang" disabled>Guardar ángulo</button></div></div></div>`;
      }
      // Lista de intentos o medidas guardadas
      if (tipo === 'salto' || tipo === 'drop' || tipo === 'distancia') {
        html += `<div class="card az-lista"><p class="sec-title">Saltos guardados</p>${M.intentos.length ? M.intentos.map((x, i) => `<div class="az-fila"><span class="num">${i + 1}.</span><span>${
          tipo === 'drop' ? `RSI <b>${fmt2(x.rsi)}</b> · ${fmt1(x.altura)} cm · contacto ${fmt3(x.contacto)} s` : tipo === 'distancia' ? `<b>${fmt1(x.distancia)} cm</b>` : `<b>${fmt1(x.altura)} cm</b> · vuelo ${fmt3(x.vuelo)} s`}</span>
          <button class="az-ir" type="button" data-ir="${x.despegue ?? 0}">ver</button><button class="quitar" type="button" data-quitar="${i}">Quitar</button></div>`).join('') : '<p class="mute">Aún ninguno. Lo normal es medir los 3 intentos.</p>'}
          ${M.intentos.length > 1 ? `<div class="chipline">${btn('az-mejor', 'Usar el mejor', M.criterio === 'mejor')}${btn('az-media', 'Usar la media', M.criterio === 'media')}</div>` : ''}</div>`;
      } else {
        html += `<div class="card az-lista"><p class="sec-title">Ángulos guardados</p>${M.angulos.length ? M.angulos.map((a, i) => `<div class="az-fila"><input type="radio" name="az-principal" value="${i}" ${i === M.principal ? 'checked' : ''} aria-label="Resultado principal"><span>${esc(a.nombre)}: <b>${grados(a.mostrado)}</b> <span class="mute">· fot. ${a.frame}</span></span>
          <button class="az-ir" type="button" data-irang="${i}">ver</button><button class="quitar" type="button" data-quitar="${i}">Quitar</button></div>`).join('') : '<p class="mute">Aún ninguno.</p>'}
          ${M.angulos.length > 1 ? '<p class="mute">El marcado es el resultado principal.</p>' : ''}</div>`;
      }
      html += `<div class="card az-guardar"><div id="az-resultado" class="az-resultado"></div>
        <label class="hc-lab" for="az-coment">${v.apartado === 'tecnica' ? 'Corrección para el paciente' : 'Comentario (opcional)'}<textarea class="hc-in" id="az-coment" rows="3" maxlength="2000" placeholder="${v.apartado === 'tecnica' ? 'Lo que tiene que cambiar y por qué…' : ''}">${esc(estado.comentario)}</textarea></label>
        <label class="check"><input type="checkbox" id="az-foto" ${estado.foto ? 'checked' : ''}><span>Guardar también este fotograma con las marcas${v.apartado === 'tecnica' ? ' (lo verá el paciente)' : ''}</span></label>
        <button class="btn btn-primary btn-block" type="button" id="az-guardar">Guardar análisis</button></div>`;
      p.innerHTML = html;
      enganchar();
      pintarResumen();
    }

    function pintarResumen() {
      const act = intentoActual(), box = $('#az-actual', el);
      if (box) {
        if (tipo === 'salto') box.innerHTML = act ? `Vuelo <b>${fmt3(act.vuelo)} s</b> (${act.aterrizaje - act.despegue} fotogramas) → altura <b>${fmt1(act.altura)} cm</b>` : '';
        if (tipo === 'drop') box.innerHTML = act ? `Contacto <b>${fmt3(act.contacto)} s</b> · vuelo ${fmt3(act.vuelo)} s → <b>${fmt1(act.altura)} cm</b> · RSI <b>${fmt2(act.rsi)}</b>` : '';
        if (tipo === 'distancia') box.innerHTML = act ? `Distancia <b>${fmt1(act.distancia)} cm</b>` : '';
        if (tipo === 'angulo' || tipo === 'tecnica') { const a = anguloActual(); box.innerHTML = a ? `Ángulo <b>${grados(a.mostrado)}</b>${a.mostrado !== a.bruto ? ` <span class="mute">(interior ${grados(a.bruto)})</span>` : ''}` : ''; }
      }
      const g1 = $('#az-guardar-int', el); if (g1) g1.disabled = !act;
      const g2 = $('#az-guardar-ang', el); if (g2) g2.disabled = !anguloActual();
      const r = resultado();
      $('#az-resultado', el).innerHTML = r && r.texto ? `<p class="mute">Resultado que se guarda</p><b>${esc(opts.textoResultado ? opts.textoResultado(r.valor, r.texto) : r.texto)}</b>` : `<p class="mute">${tipo === 'tecnica' ? 'Escribe la corrección y, si quieres, marca ángulos o guarda el fotograma.' : 'Mide al menos un intento para tener resultado.'}</p>`;
    }

    function enganchar() {
      const p = $('#az-panel', el);
      $('#az-fps', p).addEventListener('change', e => { const f = Number(e.target.value); if (f > 0) { M.fpsReal = f; recalcular(); pintarPanel(); rep.refrescar(); } });
      $$('[data-marcar]', p).forEach(b => b.addEventListener('click', () => { marca[b.dataset.marcar] = rep.frame(); pintarPanel(); rep.refrescar(); }));
      $$('[data-ir]', p).forEach(b => b.addEventListener('click', () => { rep.v.pause(); rep.irA(+b.dataset.ir); }));
      $('#az-guardar-int', p)?.addEventListener('click', () => {
        const a = intentoActual(); if (!a) return;
        M.intentos.push(a); marca = { contacto: null, despegue: null, aterrizaje: null, p1: null, p2: null };
        if (tipo === 'distancia') herramienta = 'p1';
        toast(`Intento ${M.intentos.length} guardado`); pintarPanel(); rep.refrescar();
      });
      $$('[data-quitar]', p).forEach(b => b.addEventListener('click', () => { (tipo === 'angulo' || tipo === 'tecnica' ? M.angulos : M.intentos).splice(+b.dataset.quitar, 1); M.principal = 0; pintarPanel(); }));
      $('#az-mejor', p)?.addEventListener('click', () => { M.criterio = 'mejor'; pintarPanel(); });
      $('#az-media', p)?.addEventListener('click', () => { M.criterio = 'media'; pintarPanel(); });
      // distancia
      $('#az-calibrar', p)?.addEventListener('click', () => { herramienta = 'calibrar'; calibrando = null; pintarPanel(); rep.refrescar(); });
      $('#az-cm', p)?.addEventListener('change', e => { const cm = Number(e.target.value); if (M.calib && cm > 0) { M.calib.cm = cm; if (calibrando) calibrando.cm = cm; recalcular(); pintarPanel(); rep.refrescar(); } });
      $('#az-p1', p)?.addEventListener('click', () => { herramienta = 'p1'; pintarPanel(); });
      $('#az-p2', p)?.addEventListener('click', () => { herramienta = 'p2'; pintarPanel(); });
      // ángulos
      $('#az-tres', p)?.addEventListener('click', () => { herramienta = 'tres'; pts = []; origenIA = false; pintarPanel(); rep.refrescar(); });
      $('#az-vert', p)?.addEventListener('click', () => { herramienta = 'vertical'; pts = []; origenIA = false; pintarPanel(); rep.refrescar(); });
      $('#az-cadena', p)?.addEventListener('change', e => { cadena = e.target.value; $('#az-nombre', p).value = CADENAS[cadena].nombre + ' ' + $('#az-lado', p).value; });
      $('#az-lado', p)?.addEventListener('change', e => { ladoIA = e.target.value; $('#az-nombre', p).value = CADENAS[cadena].nombre + ' ' + e.target.value; });
      $('#az-ia', p)?.addEventListener('click', async () => {
        const est = $('#az-ia-estado', p); est.textContent = 'Cargando la IA (solo la primera vez, unos segundos)…';
        try {
          const r = await detectar(rep, cadena, $('#az-lado', p).value);
          if (!r) { est.textContent = 'No he encontrado a nadie en este fotograma. Prueba con otro o marca los puntos a mano.'; return; }
          herramienta = CADENAS[cadena].tipo === 3 ? 'tres' : 'vertical'; pts = r.map(({ x, y }) => ({ x, y })); origenIA = true;
          const dudosa = r.some(q => q.v < 0.5);
          const nombre = $('#az-nombre', p).value; pintarPanel(); $('#az-nombre', el).value = nombre; rep.refrescar();
          $('#az-ia-estado', el).textContent = dudosa ? 'Ojo: alguna articulación se ve poco (ropa, luz o tapada). Revisa los puntos.' : 'Puntos colocados. Revísalos y corrige arrastrando si hace falta.';
        } catch (e) { est.textContent = 'No se ha podido cargar la IA en este navegador. Marca los puntos a mano.'; console.warn(e); }
      });
      $('#az-curva', p)?.addEventListener('click', () => seguir($('#az-lado', p).value));
      $('#az-guardar-ang', p)?.addEventListener('click', () => {
        const a = anguloActual(); if (!a) return;
        M.angulos.push({ nombre: $('#az-nombre', p).value.trim() || 'Ángulo', valor: Math.round(a.bruto * 10) / 10, mostrado: Math.round(a.mostrado * 10) / 10, frame: rep.frame(), puntos: pts.map(q => ({ x: Math.round(q.x), y: Math.round(q.y) })), modo: herramienta, ia: origenIA });
        if (M.angulos.length === 1) M.principal = 0;
        toast('Ángulo guardado'); pintarPanel();
      });
      $$('[name="az-principal"]', p).forEach(r => r.addEventListener('change', () => { M.principal = +r.value; pintarResumen(); }));
      $$('[data-irang]', p).forEach(b => b.addEventListener('click', () => { const a = M.angulos[+b.dataset.irang]; rep.v.pause(); rep.irA(a.frame); pts = a.puntos.map(q => ({ ...q })); herramienta = a.modo; origenIA = a.ia; rep.refrescar(); pintarResumen(); }));
      $('#az-coment', p).addEventListener('input', e => { estado.comentario = e.target.value; });
      $('#az-foto', p).addEventListener('change', e => { estado.foto = e.target.checked; });
      $('#az-guardar', p).addEventListener('click', guardar);
    }

    /** Sigue el ángulo con la IA a lo largo del vídeo (hasta ~120 muestras) y da el máximo y el mínimo. */
    async function seguir(ladoSel) {
      const est = $('#az-ia-estado', el), boton = $('#az-curva', el); boton.disabled = true; rep.v.pause();
      const desde = rep.frame(), total = rep.total(), paso = Math.max(1, Math.ceil((total - desde) / 90)), serie = [];
      try {
        await cargarPose();
        for (let n = desde; n < total; n += paso) {
          await rep.irA(n);
          const r = await detectar(rep, cadena, ladoSel);
          if (r && r.every(q => q.v >= 0.3)) { const cad = CADENAS[cadena], a = cad.tipo === 3 ? angulo3(...r) : anguloVertical(r[0], r[1]); serie.push({ n, a: cad.mostrar(a), pts: r }); }
          est.textContent = `Analizando… ${Math.round((n - desde) / Math.max(1, total - desde) * 100)} %`;
          if (!abierta) return;
        }
      } catch (e) { est.textContent = 'No se ha podido usar la IA en este navegador.'; boton.disabled = false; return; }
      boton.disabled = false;
      if (serie.length < 2) { est.textContent = 'No he podido seguir la articulación en este vídeo. Mídelo a mano.'; return; }
      curva = serie;
      const max = serie.reduce((a, b) => b.a > a.a ? b : a), min = serie.reduce((a, b) => b.a < a.a ? b : a);
      $('#az-curva-box', el).hidden = false;
      const esc_ = window.RCDUI.escala(serie.map(s => s.a), 10);
      window.RCDUI.lineas($('#az-curva-svg', el), serie.map(s => Math.round(s.a)), { max: esc_.max, ticks: esc_.ticks, etiquetas: serie.map(() => ''), unidad: '°' });
      $('#az-curva-txt', el).innerHTML = `Máximo <b>${grados(max.a)}</b> (fot. ${max.n}) · mínimo <b>${grados(min.a)}</b> (fot. ${min.n}). <button class="az-ir" type="button" id="az-irmax">ir al máximo</button>`;
      est.textContent = 'Listo. Ve al máximo, revisa los puntos y guarda el ángulo.';
      $('#az-irmax', el).addEventListener('click', async () => { await rep.irA(max.n); pts = max.pts.map(({ x, y }) => ({ x, y })); herramienta = CADENAS[cadena].tipo === 3 ? 'tres' : 'vertical'; origenIA = true; rep.refrescar(); pintarResumen(); });
    }

    async function guardar() {
      const r = resultado() || { valor: '', unidad: '', texto: '' };
      if (v.apartado !== 'tecnica' && r.valor === '' && !estado.comentario.trim()) { toast('Mide algo o escribe un comentario antes de guardar'); return; }
      if (v.apartado === 'tecnica' && !estado.comentario.trim()) { toast('Escribe la corrección para el paciente'); $('#az-coment', el).focus(); return; }
      const b = $('#az-guardar', el); b.disabled = true; b.textContent = 'Guardando…';
      try {
        const texto = opts.textoResultado && r.texto ? opts.textoResultado(r.valor, r.texto) : r.texto;
        const res = await api('guardarAnalisis', { videoId: v.id, valor: r.valor, unidad: r.unidad, texto, medidas: M, comentario: estado.comentario.trim(), fps: M.fpsReal, imagen: estado.foto ? rep.foto() : '' });
        toast('Análisis guardado'); opts.alGuardar?.(res.videos); cerrar();
      } catch (e) { toast(e.message); b.disabled = false; b.textContent = 'Guardar análisis'; }
    }

    rep.listo.then(() => { rep.irA(0); pintarPanel(); });
  }

  /* ================= Comparar dos vídeos lado a lado ================= */
  async function comparar(opts) {
    const otros = (opts.otros || []).filter(x => x.id !== opts.video.id && x.estado !== 'pedido');
    if (!otros.length) { toast('Este paciente no tiene otro vídeo subido para comparar'); return; }
    const el = abierta.el;
    const nombre = x => [x.nombre, x.lado, window.RCD.videos.MOMENTOS(x.momento), x.subido].filter(Boolean).join(' · ');
    const vv = opts.video;
    const sugerido = otros.find(x => x.prueba === vv.prueba && x.apartado === vv.apartado && x.momento === vv.momento && x.lado && x.lado !== vv.lado)   // la otra pierna, mismo día
      || otros.find(x => x.prueba === vv.prueba && x.apartado === vv.apartado && (x.lado || '') === (vv.lado || '')) || otros.find(x => x.prueba === vv.prueba) || otros[0];
    $('.az-cuerpo', el).innerHTML = `<div class="az-comp-cab"><label>Comparar con<select id="az-otro">${otros.map(x => `<option value="${x.id}" ${x === sugerido ? 'selected' : ''}>${esc(nombre(x))}</option>`).join('')}</select></label>
      <button class="btn btn-ghost" type="button" id="az-volver">← Volver a medir</button></div>
      <div class="az-comp"><div id="az-a"></div><div id="az-b"></div></div>
      <div class="card az-sync"><label class="check"><input type="checkbox" id="az-juntos" checked><span>Mover los dos a la vez</span></label>
        <button class="btn btn-ghost" type="button" id="az-sincro">Sincronizar en estos fotogramas</button>
        <p class="mute">Pon cada vídeo en el mismo momento (por ejemplo, el despegue) y pulsa «Sincronizar». Después las flechas, la barra y el play mueven los dos.</p></div>
      <div class="az-comp-res" id="az-res"></div>`;
    $('#az-volver', el).addEventListener('click', () => abrir(opts));
    const montar = async () => {
      const otro = otros.find(x => x.id === $('#az-otro', el).value);
      abierta.reps.forEach(r => r.cerrar()); abierta.reps = []; abierta.sync = null;
      $('#az-a', el).innerHTML = $('#az-b', el).innerHTML = '<p class="mute">Cargando…</p>';
      let fa, fb;
      try { [fa, fb] = await Promise.all([cargarVideo(opts.api, opts.video), cargarVideo(opts.api, otro)]); } catch (e) { $('#az-a', el).innerHTML = `<p class="vacio">${esc(e.message)}</p>`; return; }
      const ra = new Reproductor($('#az-a', el), fa, { etiqueta: nombre(opts.video) }), rb = new Reproductor($('#az-b', el), fb, { etiqueta: nombre(otro) });
      abierta.reps = [ra, rb]; abierta.activo = 0;
      let desfase = 0;   // fotograma de B cuando A está en 0 (en tiempo real)
      const juntos = () => $('#az-juntos', el).checked;
      const realA = () => ra.frame() / (fa.fpsGrabacion || fa.fps), aFrameB = t => Math.round(t * (fb.fpsGrabacion || fb.fps));
      const seguirB = () => { if (juntos()) rb.irA(aFrameB(realA()) + desfase); };
      abierta.sync = () => setTimeout(seguirB, 30);
      ra.v.addEventListener('seeked', seguirB);
      ra.v.addEventListener('play', () => { if (juntos()) { rb.v.playbackRate = Math.max(0.0625, Math.min(16, ra.v.playbackRate * (fa.fps / (fa.fpsGrabacion || fa.fps)) / (fb.fps / (fb.fpsGrabacion || fb.fps)))); seguirB(); rb.v.play(); } });
      ra.v.addEventListener('pause', () => { rb.v.pause(); seguirB(); });
      $('#az-sincro', el).onclick = () => { desfase = rb.frame() - aFrameB(realA()); toast('Sincronizados'); };
      $('#az-res', el).innerHTML = [opts.video, otro].map(x => `<div class="card"><p class="mute">${esc(nombre(x))}</p><b>${esc(x.texto || 'Sin medir')}</b></div>`).join('');
    };
    $('#az-otro', el).addEventListener('change', montar);
    montar();
  }

  window.RCDAnalizador = { abrir, cerrar, leerFps, angulo3, anguloVertical, alturaCm: tv => G * tv * tv / 8 * 100 };
})();
