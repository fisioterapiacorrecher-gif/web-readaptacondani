/* RCD · formulario pre-sesión del paciente (consentimientos + 5 bloques de preguntas).
   Se muestra la primera vez que entra, antes de su plan. Guarda un borrador en el móvil por si cierra a medias. */
(() => {
  const { $, $$, esc, toast, guardado } = window.RCDUI;

  function mostrar(cont, Y, api, alTerminar) {
    const F = window.RCD.presesion;
    const claveBorrador = 'rcd_presesion_' + Y.paciente.id;
    let borrador = {};
    try { borrador = JSON.parse(guardado.get(claveBorrador) || '{}'); } catch { borrador = {}; }
    const R = Object.assign({ nombre: Y.paciente.nombre, telefono: Y.paciente.telefono || '' }, borrador.respuestas || {});
    const C = Object.assign({}, borrador.consentimientos || {});
    let paso = borrador.paso || 0;                   // 0 = consentimientos, 1..n = bloques
    const total = F.bloques.length + 1;
    const guardar = () => guardado.set(claveBorrador, JSON.stringify({ respuestas: R, consentimientos: C, paso }));

    const visible = q => !q.si || R[q.si.id] === q.si.valor;
    const faltan = b => b.preguntas.filter(q => q.req && visible(q) && !String(R[q.id] ?? '').trim());

    function campo(q) {
      const v = R[q.id] ?? '';
      const ayuda = q.ayuda ? `<p class="mute">${esc(q.ayuda)}</p>` : '';
      const lab = `<label class="label" for="pq-${q.id}">${esc(q.q)}${q.req ? '' : ' <span class="mute">(opcional)</span>'}</label>`;
      if (q.tipo === 'largo') return `${lab}${ayuda}<textarea id="pq-${q.id}" data-id="${q.id}" rows="3">${esc(v)}</textarea>`;
      if (q.tipo === 'texto' || q.tipo === 'numero') return `${lab}${ayuda}<input id="pq-${q.id}" data-id="${q.id}" type="${q.tipo === 'numero' ? 'number' : 'text'}" ${q.tipo === 'numero' ? 'inputmode="numeric" min="0"' : ''} value="${esc(v)}">`;
      const ops = q.tipo === 'sino' ? ['Sí', 'No'] : q.opts;
      if (q.tipo === 'escala') return `<p class="label">${esc(q.q)}</p>${ayuda}<div class="scale" data-id="${q.id}">${Array.from({ length: 11 }, (_, n) => `<button type="button" class="neutral" aria-pressed="${String(v) === String(n)}">${n}</button>`).join('')}</div><div class="scale-legend"><span>0</span><span>10</span></div>`;
      return `<p class="label">${esc(q.q)}${q.req ? '' : ' <span class="mute">(opcional)</span>'}</p>${ayuda}<div class="chips" data-id="${q.id}">${ops.map(o => `<button class="chip" type="button" aria-pressed="${v === o}">${esc(o)}</button>`).join('')}</div>`;
    }

    function pintar() {
      guardar();
      const esConsent = paso === 0, b = F.bloques[paso - 1];
      cont.innerHTML = `
        <div class="app pre">
          <header class="top"><svg class="spark"><use href="#spark"></use></svg><div class="brand">RCD CLINIC<small>Readapta con Dani</small></div></header>
          <div class="view">
            <div><p class="eyebrow">Antes de tu valoración · paso ${paso + 1} de ${total}</p><h1>${esConsent ? `Hola, ${esc(Y.paciente.nombre.split(' ')[0])}` : esc(b.titulo)}</h1>
              <p class="soft" style="margin-top:8px">${esConsent ? 'Antes de empezar, Dani necesita conocerte y tu permiso para tratar tus datos de salud. Te lleva unos 10 minutos y lo que escribas se guarda aunque cierres la app.' : esc(b.intro || '')}</p></div>
            <div class="bar" aria-hidden="true"><i style="transform:scaleX(${(paso + 1) / total})"></i></div>
            <div id="pre-body" style="display:grid;gap:14px"></div>
            <p class="login-error" id="pre-err" role="alert"></p>
            <div class="pre-nav">${paso > 0 ? '<button class="btn btn-ghost" type="button" id="pre-back">Atrás</button>' : '<span></span>'}
              <button class="btn btn-primary" type="button" id="pre-next">${paso === total - 1 ? 'Enviar a Dani' : 'Siguiente'}</button></div>
          </div>
        </div>`;
      const body = $('#pre-body', cont);
      if (esConsent) {
        const doc = d => `<a href="${esc(F.legal[d])}" target="_blank" rel="noopener">leer</a>`;
        body.innerHTML = `
          <div class="card q"><p class="label">Para continuar necesitamos tu aceptación</p>
            ${F.obligatorios.map(o => `<label class="check"><input type="checkbox" data-c="${o.id}" ${C[o.id] ? 'checked' : ''}><span>${esc(o.texto)} (${doc(o.doc)})</span></label>`).join('')}</div>
          <div class="card q"><p class="label">Consentimientos opcionales</p><p class="mute">No son necesarios para tu tratamiento y puedes retirarlos cuando quieras escribiendo a Dani.</p>
            ${F.opcionales.map(o => `<label class="check"><input type="checkbox" data-c="${o.id}" ${C[o.id] ? 'checked' : ''}><span>${esc(o.texto)}</span></label>`).join('')}</div>`;
        $$('[data-c]', body).forEach(i => i.addEventListener('change', () => { C[i.dataset.c] = i.checked; guardar(); }));
      } else {
        b.preguntas.filter(visible).forEach(q => { const d = document.createElement('div'); d.className = 'card q'; d.dataset.q = q.id; d.innerHTML = campo(q); body.appendChild(d); });
        $$('input[data-id], textarea[data-id]', body).forEach(i => i.addEventListener('input', () => { R[i.dataset.id] = i.value; guardar(); }));
        $$('.chips[data-id], .scale[data-id]', body).forEach(g => $$('button', g).forEach(btn => btn.addEventListener('click', () => {
          $$('button', g).forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
          const antes = R[g.dataset.id]; R[g.dataset.id] = btn.textContent; guardar();
          // Si esta respuesta muestra u oculta otra pregunta, repinta conservando la posición
          if (b.preguntas.some(q => q.si?.id === g.dataset.id) && antes !== btn.textContent) { const y = window.scrollY; pintar(); window.scrollTo(0, y); }
        })));
      }
      $('#pre-back', cont)?.addEventListener('click', () => { paso--; pintar(); window.scrollTo(0, 0); });
      $('#pre-next', cont).addEventListener('click', siguiente);
    }

    async function siguiente() {
      const err = $('#pre-err', cont); err.textContent = '';
      if (paso === 0) {
        const no = F.obligatorios.filter(o => !C[o.id]);
        if (no.length) { err.textContent = 'Para continuar tienes que marcar las tres casillas de arriba.'; return; }
      } else {
        const f = faltan(F.bloques[paso - 1]);
        if (f.length) {
          err.textContent = f.length === 1 ? 'Falta una respuesta (marcada en rojo).' : `Faltan ${f.length} respuestas (marcadas en rojo).`;
          $$('.card.q', cont).forEach(c => c.classList.toggle('falta', f.some(q => q.id === c.dataset.q)));
          $(`.card.q[data-q="${f[0].id}"]`, cont)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      if (paso < total - 1) { paso++; pintar(); window.scrollTo(0, 0); return; }
      const btn = $('#pre-next', cont); btn.disabled = true; btn.textContent = 'Enviando…';
      try {
        const respuestas = {};
        F.bloques.forEach(b => b.preguntas.filter(visible).forEach(q => { if (R[q.id] !== undefined && R[q.id] !== '') respuestas[q.id] = String(R[q.id]); }));
        await api('guardarPresesion', { version: F.version, respuestas, consentimientos: C });
        guardado.del(claveBorrador);
        toast('¡Gracias! Dani ya tiene tus respuestas');
        alTerminar();
      } catch (x) { err.textContent = x.message; btn.disabled = false; btn.textContent = 'Enviar a Dani'; }
    }

    pintar();
  }

  window.RCDPresesion = { mostrar };
})();
