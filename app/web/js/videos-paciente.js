/* RCD · vídeos en la app del paciente: lo que Dani le pide (con instrucciones y subida directa a Drive),
   las correcciones de técnica y sus resultados de valoración y alta. */
(() => {
  const { $, $$, esc, toast } = window.RCDUI;
  const V = () => window.RCD.videos;
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 });
  const valorTxt = v => v.resultado === '' || v.resultado == null ? '' : v.unidad === 'RSI' ? 'RSI ' + fmt1(v.resultado) : fmt1(v.resultado) + (v.unidad === '°' ? '°' : ' ' + (v.unidad || ''));
  const ordenMomento = m => m === 'inicial' ? -1 : m === 'final' ? 999 : Number(String(m).slice(7)) || 0;
  const CACHE = 'rcd-videos';   // copia local del vídeo subido, para volver a verlo sin descargarlo
  const esIphone = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let ctx = null;   // { Y, api, alCambiar }

  /* ================= «Hoy»: lo que Dani te pide y sus correcciones ================= */
  function pintarHoy(cont, Y, api, alCambiar) {
    ctx = { Y, api, alCambiar };
    const vs = Y.videos || [];
    const pedidos = vs.filter(v => v.estado === 'pedido');
    const nuevas = vs.filter(v => v.apartado === 'tecnica' && v.estado === 'analizado' && v.comentario && !v.visto);
    cont.innerHTML = `${pedidos.length ? `<div class="card vids-pide">
        <p class="label">Dani te pide ${pedidos.length === 1 ? 'un vídeo' : pedidos.length + ' vídeos'}</p>
        <p class="mute">Toca cada uno: te explico cómo grabarlo y lo subes desde aquí.</p>
        <div class="vids-lista">${pedidos.map(v => `<button class="vid" type="button" data-pedido="${v.id}"><span class="vid-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 10.5l5-3v9l-5-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
          <span><b>${esc(nombre(v))}</b><span class="mute">${esc(v.momento ? V().MOMENTOS(v.momento) : v.apartado === 'alta' ? 'Prueba de alta' : 'Revisión de técnica')}</span></span><span class="vid-flecha" aria-hidden="true">›</span></button>`).join('')}</div></div>` : ''}
      ${nuevas.map(v => `<button class="card vid-tec" type="button" data-tecnica="${v.id}"><span class="dav" aria-hidden="true"><svg><use href="#spark"></use></svg></span>
        <span><span class="eyebrow">Dani ha revisado tu técnica</span><b>${esc(v.nombre)}</b><span class="mute">${esc(v.comentario.slice(0, 90))}${v.comentario.length > 90 ? '…' : ''}</span></span></button>`).join('')}`;
    cont.hidden = !pedidos.length && !nuevas.length;
    $$('[data-pedido]', cont).forEach(b => b.addEventListener('click', () => abrirSubida(vs.find(v => v.id === b.dataset.pedido))));
    $$('[data-tecnica]', cont).forEach(b => b.addEventListener('click', () => verCorreccion(vs.find(v => v.id === b.dataset.tecnica))));
  }
  const nombre = v => v.nombre + (v.lado ? ` · pierna ${v.lado}` : '');

  /* ================= Hoja a pantalla completa ================= */
  function hoja() {
    let h = $('#vsheet');
    if (!h) {
      h = document.createElement('div'); h.className = 'qsheet vsheet'; h.id = 'vsheet';
      h.setAttribute('role', 'dialog'); h.setAttribute('aria-modal', 'true'); h.setAttribute('aria-labelledby', 'vs-title');
      document.body.appendChild(h);
    }
    return h;
  }
  function abrirHoja(html) {
    const h = hoja(); h.innerHTML = html; h.scrollTop = 0;
    requestAnimationFrame(() => h.classList.add('open'));
    $('#vs-close', h).addEventListener('click', cerrarHoja);
    return h;
  }
  let subiendo = false;
  function cerrarHoja() {
    if (subiendo && !confirm('Se está subiendo el vídeo. ¿Seguro que quieres salir? Se cancelará.')) return;
    subiendo = false; const h = $('#vsheet'); if (!h) return;
    h.classList.remove('open'); $$('video', h).forEach(x => { x.pause(); if (x.src.startsWith('blob:')) URL.revokeObjectURL(x.src); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#vsheet')?.classList.contains('open')) cerrarHoja(); });

  /* ---------- Subir un vídeo pedido ---------- */
  function abrirSubida(v) {
    const p = V().prueba(v.prueba) || V().TECNICA;
    const lenta = p.lenta;
    const sistema = esIphone ? 'iphone' : 'android';
    const h = abrirHoja(`
      <div class="qhead"><div><p class="eyebrow">${esc(V().APARTADOS[v.apartado])}${v.momento ? ' · ' + esc(V().MOMENTOS(v.momento)) : ''}</p><h3 id="vs-title">${esc(nombre(v))}</h3></div><button class="close" type="button" id="vs-close" aria-label="Cerrar">✕</button></div>
      ${v.instrucciones ? `<div class="card spec"><p class="mini-title">Dani te dice</p><p>${esc(v.instrucciones)}</p></div>` : ''}
      ${v.lado ? `<div class="notice warn show"><svg><use href="#i-alert"></use></svg><p>Esta prueba es con la <b>pierna ${esc(v.lado)}</b>.</p></div>` : ''}
      <div class="card"><p class="mini-title">Qué tienes que hacer</p><ol class="vs-pasos">${p.pasos.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
      <div class="card"><p class="mini-title">Cómo colocar el móvil</p><ul class="vs-lista">${V().colocacion(p).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      ${lenta ? `<div class="card"><p class="mini-title">Grábalo a cámara lenta</p><p class="soft">Así Dani puede medir tu salto al milímetro.</p>
        <div class="chips" role="group" aria-label="Tu móvil"><button class="chip" type="button" data-sis="iphone" aria-pressed="${sistema === 'iphone'}">iPhone</button><button class="chip" type="button" data-sis="android" aria-pressed="${sistema === 'android'}">Android</button></div>
        <ul class="vs-lista" id="vs-lenta"></ul></div>` : ''}
      <div class="card vs-subir">
        <p class="mini-title">Sube el vídeo</p>
        ${lenta ? `<p class="label">¿Cómo lo grabaste?</p><div class="chips" role="group" aria-label="Cómo lo grabaste">${[['240', 'Cámara lenta 240'], ['120', 'Cámara lenta 120'], ['', 'Normal / no lo sé']].map(([f, t]) => `<button class="chip" type="button" data-fps="${f}" aria-pressed="${f === '240' && esIphone}">${t}</button>`).join('')}</div>` : ''}
        <input type="file" id="vs-file" accept="video/*" hidden>
        <button class="btn btn-primary btn-block" type="button" id="vs-elegir">Elegir el vídeo</button>
        <p class="mute">Recórtalo para que solo salga la prueba: pesa menos y sube antes. Mejor con wifi.</p>
        <div id="vs-prog" hidden><div class="bar" aria-hidden="true"><i id="vs-bar"></i></div><p class="soft" id="vs-txt" role="status"></p></div>
      </div>`);
    const lentaTxt = s => { const ul = $('#vs-lenta', h); if (ul) ul.innerHTML = V().CAMARA_LENTA[s].map(x => `<li>${esc(x)}</li>`).join(''); };
    lentaTxt(sistema);
    $$('[data-sis]', h).forEach(b => b.addEventListener('click', () => { $$('[data-sis]', h).forEach(x => x.setAttribute('aria-pressed', String(x === b))); lentaTxt(b.dataset.sis); }));
    $$('[data-fps]', h).forEach(b => b.addEventListener('click', () => $$('[data-fps]', h).forEach(x => x.setAttribute('aria-pressed', String(x === b)))));
    $('#vs-elegir', h).addEventListener('click', () => $('#vs-file', h).click());
    $('#vs-file', h).addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      const fps = $('[data-fps][aria-pressed="true"]', h)?.dataset.fps || '';
      await subir(v, f, fps, h);
      e.target.value = '';
    });
  }

  async function subir(v, file, fps, h) {
    const prog = $('#vs-prog', h), bar = $('#vs-bar', h), txt = $('#vs-txt', h), btn = $('#vs-elegir', h);
    const mb = n => (n / 1048576).toLocaleString('es-ES', { maximumFractionDigits: 1 });
    const avance = n => { bar.style.transform = `scaleX(${n / file.size})`; txt.textContent = `Subiendo… ${Math.round(n / file.size * 100)} % (${mb(n)} de ${mb(file.size)} MB)`; };
    prog.hidden = false; btn.disabled = true; subiendo = true; avance(0);
    try {
      const ini = await ctx.api('iniciarSubida', { videoId: v.id, tamano: file.size, tipo: file.type || 'video/mp4', nombre: file.name, fps, origen: location.origin });
      let pos = 0, fileId = null, directo = true;
      while (fileId == null) {
        if (!subiendo) throw new Error('Subida cancelada.');
        if (directo) {
          const fin = Math.min(file.size, pos + ini.trozo);
          let r = null;
          for (let intento = 0; intento < 3 && !r; intento++) {
            try { r = await fetch(ini.url, { method: 'PUT', headers: { 'Content-Range': `bytes ${pos}-${fin - 1}/${file.size}` }, body: file.slice(pos, fin) }); }
            catch (err) { if (intento === 2) { directo = false; } else await new Promise(res => setTimeout(res, 1500 * (intento + 1))); }
          }
          if (!directo) continue;   // el navegador no deja subir directo: seguimos a trozos por el motor desde donde íbamos
          if (r.status === 308) { const rango = r.headers.get('Range'); pos = rango ? Number(rango.split('-')[1]) + 1 : fin; avance(pos); continue; }
          if (r.ok) { fileId = (await r.json()).id; break; }
          throw new Error('Drive ha rechazado el vídeo (' + r.status + '). Prueba otra vez.');
        } else {
          const fin = Math.min(file.size, pos + 4 * 1048576);
          const datos = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = rej; fr.readAsDataURL(file.slice(pos, fin)); });
          const r = await ctx.api('subirTrozo', { videoId: v.id, inicio: pos, datos });
          pos = fin; avance(pos);
          if (r.hecho) fileId = r.fileId;
        }
      }
      avance(file.size); txt.textContent = 'Comprobando…';
      const r = await ctx.api('videoSubido', { videoId: v.id, fileId });
      try { const c = await caches.open(CACHE); await c.put(new Request('/__mis-videos/' + v.id), new Response(file, { headers: { 'Content-Type': file.type || 'video/mp4' } })); } catch { /* sin copia local: se puede ver desde Drive */ }
      subiendo = false;
      ctx.Y.videos = r.videos; ctx.alCambiar?.();
      $('.vs-subir', h).innerHTML = `<div class="notice good show"><svg><use href="#i-check"></use></svg><p><b>¡Vídeo enviado!</b> Dani lo analizará y verás el resultado en «Progreso».</p></div>
        <button class="btn btn-ghost btn-block" type="button" id="vs-ok">Volver</button>`;
      $('#vs-ok', h).addEventListener('click', cerrarHoja);
      toast('Vídeo enviado a Dani');
    } catch (e) {
      subiendo = false; btn.disabled = false; txt.textContent = e.message || 'No se ha podido subir. Prueba otra vez.'; bar.style.transform = 'scaleX(0)';
    }
  }

  /* ---------- Ver la corrección de técnica ---------- */
  async function verCorreccion(v) {
    const h = abrirHoja(`<div class="qhead"><div><p class="eyebrow">Corrección de técnica · ${esc(v.analizado ? new Date(v.analizado + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : '')}</p><h3 id="vs-title">${esc(v.nombre)}</h3></div><button class="close" type="button" id="vs-close" aria-label="Cerrar">✕</button></div>
      <div class="card dani-msg"><span class="dav" aria-hidden="true"><svg><use href="#spark"></use></svg></span><div><p class="eyebrow">Dani te dice</p><p>${esc(v.comentario || '')}</p></div></div>
      ${v.texto ? `<div class="card"><p class="mini-title">Medida</p><p><b>${esc(v.texto)}</b></p></div>` : ''}
      ${v.imagen ? '<div class="card vs-img"><p class="mini-title">Tu fotograma con las marcas</p><p class="mute" id="vs-img-txt">Cargando…</p></div>' : ''}
      <button class="btn btn-ghost btn-block" type="button" id="vs-ver">Ver mi vídeo</button><div id="vs-video"></div>`);
    $('#vs-ver', h).addEventListener('click', () => verVideo(v, $('#vs-video', h), $('#vs-ver', h)));
    if (!v.visto) { ctx.api('videoVisto', { videoId: v.id }).then(() => { v.visto = true; ctx.alCambiar?.(); }).catch(() => {}); }
    if (v.imagen) cargarImagen(v, $('.vs-img', h));
  }
  async function cargarImagen(v, cont) {
    try { const r = await ctx.api('imagenVideo', { videoId: v.id }); cont.innerHTML = `<p class="mini-title">Tu fotograma con las marcas</p><img src="${r.datos}" alt="Fotograma de tu vídeo con las marcas de Dani">`; }
    catch (e) { cont.innerHTML = `<p class="mute">${esc(e.message)}</p>`; }
  }
  /** Reproduce el vídeo: primero la copia del móvil; si no está, lo pide (solo si es pequeño). */
  async function verVideo(v, cont, btn) {
    btn.disabled = true; btn.textContent = 'Cargando…';
    try {
      let blob = null;
      try { const c = await caches.open(CACHE); const r = await c.match('/__mis-videos/' + v.id); if (r) blob = await r.blob(); } catch { }
      if (!blob) { const r = await ctx.api('verVideo', { videoId: v.id }); const bin = atob(r.datos), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); blob = new Blob([a], { type: r.tipo }); }
      cont.innerHTML = `<video class="vs-player" controls playsinline src="${URL.createObjectURL(blob)}"></video>`; btn.hidden = true;
    } catch (e) { btn.disabled = false; btn.textContent = 'Ver mi vídeo'; toast(e.message); }
  }

  /* ================= «Progreso»: resultados de valoración, alta y técnica ================= */
  function pintarProgreso(cont, Y) {
    const vs = Y.videos || [];
    const val = vs.filter(v => v.apartado === 'valoracion' && v.estado === 'analizado' && v.resultado !== '');
    const grupos = {};
    val.forEach(v => { const k = v.prueba + '|' + (v.lado || ''); (grupos[k] = grupos[k] || []).push(v); });
    const filas = Object.values(grupos).map(g => {
      g.sort((a, b) => ordenMomento(a.momento) - ordenMomento(b.momento));
      const p = V().prueba(g[0].prueba), primero = g[0], ultimo = g[g.length - 1], dif = g.length > 1 ? ultimo.resultado - primero.resultado : null;
      const mejora = dif == null ? null : (ultimo.unidad === '°' ? null : dif);
      return `<div class="vp-res"><div><b>${esc(p?.corto || primero.nombre)}${primero.lado ? ' · ' + esc(primero.lado) : ''}</b>
        <p class="mute">${g.map(x => `${esc(V().MOMENTOS(x.momento).replace('Valoración ', '').replace('Revisión ', ''))}: ${esc(valorTxt(x))}`).join(' → ')}</p></div>
        ${mejora != null && Math.abs(mejora) >= 0.05 ? `<em class="${mejora > 0 ? 'lvl-ok' : 'lvl-high'}">${mejora > 0 ? '+' : '−'}${fmt1(Math.abs(mejora))}${ultimo.unidad === 'cm' ? ' cm' : ''}</em>` : `<em>${esc(valorTxt(ultimo))}</em>`}</div>`;
    });
    const subidos = vs.filter(v => v.estado !== 'pedido');
    cont.innerHTML = `${filas.length ? `<div class="card vp-resultados">${filas.join('')}</div>` : '<p class="mute">Cuando Dani analice tus vídeos de valoración verás aquí tus saltos y medidas, y cuánto mejoras.</p>'}
      ${subidos.length ? `<p class="mini-title" style="margin-top:6px">Tus vídeos</p><div class="card vids-lista">${subidos.map(v => `<button class="vid" type="button" data-mio="${v.id}">
        <span class="vid-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>
        <span><b>${esc(nombre(v))}</b><span class="mute">${esc(V().APARTADOS[v.apartado])} · ${v.estado === 'analizado' ? esc(v.texto || 'revisado por Dani') : 'pendiente de que Dani lo analice'}</span></span><span class="vid-flecha" aria-hidden="true">›</span></button>`).join('')}</div>` : ''}`;
    $$('[data-mio]', cont).forEach(b => b.addEventListener('click', () => {
      const v = vs.find(x => x.id === b.dataset.mio);
      if (v.apartado === 'tecnica' && v.comentario) return verCorreccion(v);
      const h = abrirHoja(`<div class="qhead"><div><p class="eyebrow">${esc(V().APARTADOS[v.apartado])}${v.momento ? ' · ' + esc(V().MOMENTOS(v.momento)) : ''}</p><h3 id="vs-title">${esc(nombre(v))}</h3></div><button class="close" type="button" id="vs-close" aria-label="Cerrar">✕</button></div>
        ${v.texto ? `<div class="card"><p class="mini-title">Resultado</p><p class="plan-total num">${esc(valorTxt(v))}</p><p class="soft">${esc(v.texto)}</p></div>` : ''}
        ${v.comentario ? `<div class="card dani-msg"><span class="dav" aria-hidden="true"><svg><use href="#spark"></use></svg></span><div><p class="eyebrow">Dani te dice</p><p>${esc(v.comentario)}</p></div></div>` : ''}
        ${v.imagen ? '<div class="card vs-img"><p class="mute">Cargando imagen…</p></div>' : ''}
        <button class="btn btn-ghost btn-block" type="button" id="vs-ver">Ver mi vídeo</button><div id="vs-video"></div>`);
      $('#vs-ver', h).addEventListener('click', () => verVideo(v, $('#vs-video', h), $('#vs-ver', h)));
      if (v.imagen) cargarImagen(v, $('.vs-img', h));
    }));
  }

  /** Corrección de técnica de un ejercicio (para la ficha del ejercicio). */
  function correccionDe(Y, e) {
    return (Y.videos || []).filter(v => v.apartado === 'tecnica' && v.estado === 'analizado' && v.comentario && (v.prescripcionId === e.id || v.nombre === e.ejercicio)).sort((a, b) => a.analizado < b.analizado ? 1 : -1)[0] || null;
  }

  window.RCDVideosPaciente = { pintarHoy, pintarProgreso, correccionDe, verCorreccion: v => verCorreccion(v), activar: (Y, api, alCambiar) => { ctx = { Y, api, alCambiar }; } };
})();
