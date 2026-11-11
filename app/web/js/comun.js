/* RCD · piezas comunes de las dos apps: conexión con el motor, acceso por código, avisos y gráficas. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = v => String(v).replace('.', ',');

  /* ---------- Almacenamiento local (puede fallar en modo privado) ---------- */
  const guardado = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento: la sesión dura lo que la pestaña */ } },
    del(k) { try { localStorage.removeItem(k); } catch { } },
  };

  /* ---------- Conexión con el motor ---------- */
  function crearApi(claveToken) {
    let token = guardado.get(claveToken);
    const api = async (action, datos = {}) => {
      let res;
      try {
        res = await fetch(window.RCD_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token, ...datos }) });
      } catch {
        throw Object.assign(new Error('Sin conexión. Comprueba tu internet y vuelve a intentarlo.'), { codigo: 'red' });
      }
      let j;
      try { j = await res.json(); } catch { throw Object.assign(new Error('El servidor no ha respondido bien. Prueba en un momento.'), { codigo: 'servidor' }); }
      if (!j.ok) {
        if (j.codigo === 'sesion') { token = null; guardado.del(claveToken); api.onSesion?.(); }
        throw Object.assign(new Error(j.error || 'Algo ha fallado.'), { codigo: j.codigo });
      }
      return j;
    };
    api.conToken = () => !!token;
    api.setToken = t => { token = t; t ? guardado.set(claveToken, t) : guardado.del(claveToken); };
    return api;
  }

  /* ---------- Pantalla de acceso: email → código de 6 cifras ---------- */
  function pantallaAcceso(cont, api, { titulo, subtitulo, rolEsperado, alEntrar }) {
    cont.innerHTML = `
      <div class="login">
        <div class="login-brand"><svg class="spark"><use href="#spark"></use></svg><div><b>RCD CLINIC</b><small>Readapta con Dani</small></div></div>
        <h1>${esc(titulo)}</h1>
        <p class="soft">${esc(subtitulo)}</p>
        <form id="f-email" class="login-form" novalidate>
          <label for="l-email">Tu email</label>
          <input id="l-email" type="email" inputmode="email" autocomplete="email" placeholder="nombre@ejemplo.com" required>
          <button class="btn btn-primary btn-block" type="submit">Enviarme el código</button>
          <button class="btn btn-ghost btn-block" type="button" id="l-have">Ya tengo un código de Dani</button>
        </form>
        <form id="f-code" class="login-form" novalidate hidden>
          <label for="l-code">Código de 6 cifras</label>
          <input id="l-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······" required>
          <p class="mute" id="l-sent"></p>
          <button class="btn btn-primary btn-block" type="submit">Entrar</button>
          <button class="btn btn-ghost btn-block" type="button" id="l-back">Usar otro email</button>
        </form>
        <p class="login-error" id="l-err" role="alert"></p>
      </div>`;
    const err = m => { $('#l-err', cont).textContent = m || ''; };
    let email = '';
    const ocupado = (form, on) => { const b = $('button[type="submit"]', form); b.disabled = on; b.dataset.t = b.dataset.t || b.textContent; b.textContent = on ? 'Un momento…' : b.dataset.t; };
    $('#f-email', cont).addEventListener('submit', async e => {
      e.preventDefault(); err();
      email = $('#l-email', cont).value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Escribe un email válido.');
      ocupado(e.target, true);
      try {
        await api('pedirCodigo', { email });
        $('#f-email', cont).hidden = true; $('#f-code', cont).hidden = false;
        $('#l-sent', cont).textContent = `Si ${email} tiene acceso, te acaba de llegar un código. Mira también en «Spam» o «Promociones».`;
        $('#l-code', cont).focus();
      } catch (x) { err(x.message); } finally { ocupado(e.target, false); }
    });
    $('#f-code', cont).addEventListener('submit', async e => {
      e.preventDefault(); err();
      const codigo = $('#l-code', cont).value.replace(/\D/g, '');
      if (codigo.length !== 6) return err('El código tiene 6 cifras.');
      ocupado(e.target, true);
      try {
        const r = await api('verificarCodigo', { email, codigo });
        if (rolEsperado && r.rol !== rolEsperado) {
          err(rolEsperado === 'admin' ? 'Este panel es solo para Dani. Tu app está en la página principal.' : 'Esta es la app de pacientes. Tu panel está en /panel.');
          return;
        }
        api.setToken(r.token); alEntrar(r);
      } catch (x) { err(x.message); } finally { ocupado(e.target, false); }
    });
    $('#l-have', cont).addEventListener('click', () => {
      err(); email = $('#l-email', cont).value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Escribe primero tu email.');
      $('#f-email', cont).hidden = true; $('#f-code', cont).hidden = false;
      $('#l-sent', cont).textContent = 'Escribe el código de 6 cifras que te ha mandado Dani por WhatsApp.';
      $('#l-code', cont).focus();
    });
    $('#l-back', cont).addEventListener('click', () => { $('#f-code', cont).hidden = true; $('#f-email', cont).hidden = false; err(); });
    setTimeout(() => $('#l-email', cont)?.focus(), 50);
  }

  /* ---------- Aviso breve ---------- */
  let tt;
  function toast(m) { const t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }

  /* ---------- Gráficas SVG (misma escala para marcas, rejilla y etiquetas) ---------- */
  const W = 340, H = 150, L = 34, R = 12, T = 16, B = 24;
  function marco(max, ticks, yFmt = fmt) {
    const y = v => T + (1 - v / max) * (H - T - B);
    return { y, g: ticks.map(t => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${yFmt(t)}</text>`).join('') };
  }
  function vacio(svg, texto = 'Aún no hay datos') {
    svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle">${esc(texto)}</text>`;
  }
  function lineas(svg, valores, { max, etiquetas, limite, unidad = '', ticks, yFmt }) {
    const v = valores.map(Number).filter(n => isFinite(n));
    if (!v.length) return vacio(svg);
    const { y, g: rej } = marco(max, ticks, yFmt);
    const x = i => L + (v.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (v.length - 1));
    let g = rej;
    if (limite !== undefined) g += `<line class="lim" x1="${L}" x2="${W - R}" y1="${y(limite)}" y2="${y(limite)}"/>`;
    const pts = v.map((n, i) => `${x(i)},${y(n)}`).join(' ');
    if (v.length > 1) g += `<polygon points="${x(0)},${y(0)} ${pts} ${x(v.length - 1)},${y(0)}" fill="rgba(255,52,52,.12)"/>`;
    g += `<polyline points="${pts}" fill="none" stroke="#FF3434" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    v.forEach((n, i) => { const u = i === v.length - 1; g += `<circle cx="${x(i)}" cy="${y(n)}" r="${u ? 4.5 : 2.5}" fill="${u ? '#FFFBE8' : '#FF3434'}" ${u ? 'stroke="#FF3434" stroke-width="2"' : ''}/>`; });
    (etiquetas || []).forEach((l, i) => { if (l) g += `<text x="${x(i)}" y="${H - 6}" text-anchor="${v.length > 1 && i === 0 ? 'start' : v.length > 1 && i === v.length - 1 ? 'end' : 'middle'}">${esc(l)}</text>`; });
    const u = v[v.length - 1];
    g += `<text x="${W - R - 2}" y="${Math.max(y(u) - 10, 11)}" text-anchor="end" class="val">${fmt(u)}${unidad}</text>`;
    svg.innerHTML = g;
  }
  function barras(svg, valores, { max, etiquetas, ticks, yFmt, valFmt = fmt }) {
    const v = valores.map(Number);
    if (!v.length) return vacio(svg);
    const { y, g: rej } = marco(max, ticks, yFmt);
    const slot = (W - L - R) / v.length, bw = Math.min(46, slot * 0.5), x = i => L + slot * i + slot / 2;
    let g = rej;
    v.forEach((n, i) => { const u = i === v.length - 1;
      g += `<rect x="${x(i) - bw / 2}" y="${y(n)}" width="${bw}" height="${y(0) - y(n)}" rx="4" fill="${u ? '#FF3434' : 'rgba(255,52,52,.45)'}"/><text x="${x(i)}" y="${y(n) - 6}" text-anchor="middle" class="${u ? 'val' : ''}">${valFmt(n)}</text>`; });
    g += (etiquetas || []).map((l, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>`).join('');
    svg.innerHTML = g;
  }
  /* Escala bonita para el eje: 0, mitad y máximo redondeado */
  function escala(valores, minimo = 10) {
    const m = Math.max(minimo, ...valores.map(Number).filter(isFinite));
    const paso = Math.pow(10, Math.floor(Math.log10(m)));
    const max = Math.ceil(m / paso) * paso;
    return { max, ticks: [0, max / 2, max] };
  }

  const nivel = n => n <= 4 ? 'ok' : n <= 5 ? 'mid' : 'high'; // regla de Dani: hasta 4 se progresa
  const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;

  window.RCDUI = { $, $$, esc, fmt, guardado, crearApi, pantallaAcceso, toast, lineas, barras, escala, vacio, nivel, media };
})();
