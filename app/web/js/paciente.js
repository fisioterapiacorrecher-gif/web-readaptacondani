/* RCD · app del paciente conectada al motor (acciones: yo, guardarEjercicio, guardarSesion, guardarDolor,
   guardarEncuesta, guardarCuestionario, progreso). */
(() => {
  const { $, $$, esc, fmt, crearApi, pantallaAcceso, toast, lineas, barras, escala, vacio, nivel, media } = window.RCDUI;
  const D = window.RCD;
  const api = crearApi('rcd_paciente');
  const palabras = ['Sin dolor', 'Incómodo', 'Poco dolor', 'Poco dolor', 'Dolor moderado', 'Dolor moderado', 'Dolor fuerte', 'Dolor fuerte', 'Dolor muy fuerte', 'Dolor muy fuerte', 'Dolor extremo'];
  const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  let Y = null;            // datos de «yo»
  let dia = 1;             // día del plan que se está viendo
  let actual = null;       // ejercicio abierto en la hoja
  const escalas = {};      // valores elegidos en cada escala

  /* ---------- Arranque y acceso ---------- */
  api.onSesion = () => mostrarAcceso();
  function mostrarAcceso() {
    $('#app').hidden = true; $('#cargando').hidden = true; $('#acceso').hidden = false;
    pantallaAcceso($('#acceso'), api, {
      titulo: 'Entra en tu plan', subtitulo: 'Escribe el email que le diste a Dani y te enviaremos un código para entrar.', rolEsperado: 'paciente',
      alEntrar: () => { $('#acceso').hidden = true; cargar(); },
    });
  }
  async function cargar() {
    $('#cargando').hidden = false;
    try {
      Y = await api('yo');
      $('#cargando').hidden = true; $('#app').hidden = false;
      pintarTodo();
    } catch (e) {
      if (e.codigo === 'sesion' || e.codigo === 'permiso') return mostrarAcceso();
      $('#cargando').textContent = e.message;
    }
  }
  $('#avatar').addEventListener('click', async () => {
    if (!confirmarSalida()) return;
    try { await api('salir'); } catch { } api.setToken(null); mostrarAcceso();
  });
  let pidioSalir = 0;
  function confirmarSalida() { if (Date.now() - pidioSalir < 3000) return true; pidioSalir = Date.now(); toast('Toca otra vez para cerrar sesión'); return false; }

  /* ---------- Pestañas ---------- */
  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    $$('.view').forEach(v => v.hidden = v.id !== 'view-' + tab.dataset.view);
    window.scrollTo({ top: 0 });
    if (tab.dataset.view === 'progreso') pintarProgreso();
  }));

  /* ---------- Escalas ---------- */
  function escala010(el, { min = 0, max = 10, neutral = false, onPick }) {
    el.innerHTML = ''; el.style.gridTemplateColumns = `repeat(${max - min + 1}, minmax(0, 1fr))`;
    for (let n = min; n <= max; n++) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = n; b.className = neutral ? 'neutral' : nivel(n);
      b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', `${n} de ${max}`);
      b.addEventListener('click', () => { $$('button', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); onPick(n); });
      el.appendChild(b);
    }
  }
  function escalaDolor(nombre, despues) {
    escala010($(`[data-scale="${nombre}"]`), { onPick: n => {
      escalas[nombre] = n;
      const w = $('#' + nombre + '-word'); if (w) { w.textContent = `${n} · ${palabras[n]}`; w.dataset.level = nivel(n); }
      despues?.(n);
    } });
  }
  function limpiarEscala(nombre) {
    $$(`[data-scale="${nombre}"] button`).forEach(x => x.setAttribute('aria-pressed', 'false'));
    delete escalas[nombre];
    const w = $('#' + nombre + '-word'); if (w) { w.textContent = 'Toca un número de 0 a 10'; delete w.dataset.level; }
  }
  escalaDolor('before', n => { if (n > 4) toast('Más de 4 antes de empezar: haz solo la parte isométrica y avisa a Dani'); });
  escalaDolor('session', n => { $('#session-warn').classList.toggle('show', n > 4); $('#finish-btn').disabled = false; });
  escalaDolor('exercise');
  escalaDolor('daily', n => { $('#pain-good').classList.toggle('show', n <= 4); $('#pain-warn').classList.toggle('show', n > 4); $('#pain-save').disabled = false; });

  /* ---------- Pintar ---------- */
  function pintarTodo() {
    const p = Y.paciente;
    $('#avatar').textContent = (p.nombre || '·')[0].toUpperCase();
    $('#t-hoy').textContent = 'Hola, ' + p.nombre.split(' ')[0];
    $('#dani-card').hidden = !Y.mensaje; $('#dani-text').textContent = Y.mensaje; $('#dani-eyebrow').textContent = `Mensaje de Dani · semana ${Y.semana}`;
    const dias = [...new Set(Y.prescripcion.map(x => x.dia))].sort((a, b) => a - b);
    const hechos = new Set(Y.sesiones.map(s => s.dia));
    dia = dias.find(d => !hechos.has(d)) ?? dias[0] ?? 1;
    pintarDias(dias, hechos);
    pintarHoy();
    pintarDolor();
    pintarSemana();
    $('#dot-dolor').hidden = Y.dolor.some(d => d.fecha === Y.hoy);
    $('#dot-semana').hidden = Y.encuestaHecha && !(Y.revisionMensual && !Y.revisionMensual.hecha);
    pintarAvisos().catch(() => {});
  }

  function pintarDias(dias, hechos) {
    $('#dias').innerHTML = dias.map(d => `<button class="chip" type="button" data-d="${d}" aria-pressed="${d === dia}">Día ${d}${hechos.has(d) ? ' ✓' : ''}</button>`).join('');
    $$('#dias .chip').forEach(c => c.addEventListener('click', () => { dia = +c.dataset.d; $$('#dias .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); pintarHoy(); }));
    $('#dias').hidden = dias.length < 2;
  }

  const delDia = () => Y.prescripcion.filter(x => x.dia === dia);
  const hecho = id => Y.ejercicios.some(e => e.prescripcionId === id);
  const dosis = e => e.tipo === 'cardio' ? (e.indicacion ? e.indicacion.slice(0, 40) : 'Cardio')
    : [e.series && e.valor ? `${e.series} × ${e.valor}${e.unidad === 's' ? ' s' : ''}` : '', e.kg ? `+${fmt(e.kg)} kg` : '', e.tempo || ''].filter(Boolean).join(' · ');

  function pintarHoy() {
    const lista = delDia();
    const sesionHecha = Y.sesiones.some(s => s.dia === dia);
    $('#hoy-eyebrow').textContent = `Semana ${Y.semana} de ${Y.paciente.semanas} · Día ${dia}`;
    if (!Y.prescripcion.length) {
      $('#sesion-card').hidden = true; $('#before-card').hidden = true; $('#finish-card').hidden = true;
      $('#ex-list').innerHTML = `<p class="vacio">Dani está preparando tu plan. Te avisaremos por email cuando tu primera semana esté lista.</p>`;
      return;
    }
    $('#sesion-card').hidden = false;
    const tipos = new Set(lista.map(e => e.tipo));
    $('#sesion-eyebrow').textContent = sesionHecha ? 'Sesión completada' : 'Sesión de hoy';
    $('#sesion-title').textContent = tipos.size > 1 ? 'Fuerza + cardio' : tipos.has('cardio') ? 'Cardio' : 'Fuerza';
    $('#sesion-min').textContent = '';
    $('#ex-list').innerHTML = '';
    lista.forEach((e, i) => {
      const ok = hecho(e.id);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ex' + (ok ? ' done' : '') + (e.tipo === 'cardio' ? ' cardio' : '');
      b.innerHTML = `<span class="ix">${ok ? '<svg width="18" height="18"><use href="#i-check"></use></svg>' : i + 1}</span>
        <span><span class="tag">${e.tipo === 'cardio' ? 'Cardio' : 'Fuerza'}</span><span class="name">${esc(e.ejercicio)}</span><br><span class="dose">${esc(dosis(e))}</span></span>
        <span class="state" aria-hidden="true">${ok ? '<svg width="14" height="14"><use href="#i-check"></use></svg>' : ''}</span>`;
      b.setAttribute('aria-label', `${e.ejercicio}, ${dosis(e)}${ok ? ', hecho' : ''}`);
      b.addEventListener('click', () => abrirHoja(e, i, lista.length));
      $('#ex-list').appendChild(b);
    });
    const n = lista.filter(e => hecho(e.id)).length;
    $('#progress-bar').style.transform = `scaleX(${lista.length ? n / lista.length : 0})`;
    $('#progress-text').textContent = sesionHecha ? '¡Sesión completada!' : `${n} de ${lista.length} ejercicios`;
    $('#before-card').hidden = sesionHecha;
    $('#finish-card').hidden = sesionHecha || n < lista.length;
  }

  /* ---------- Hoja de ejercicio ---------- */
  let foco;
  function abrirHoja(e, i, total) {
    actual = e; foco = document.activeElement;
    $('#sheet-cat').textContent = `Ejercicio ${i + 1} de ${total} · ${e.tipo === 'cardio' ? 'Cardio' : 'Fuerza'}`;
    $('#sheet-title').textContent = e.ejercicio;
    const video = $('#video-btn');
    if (e.video) { video.href = e.video; video.classList.remove('off'); $('#video-note').textContent = 'Ver el vídeo de Dani'; video.removeAttribute('aria-disabled'); }
    else { video.removeAttribute('href'); video.classList.add('off'); $('#video-note').textContent = 'Dani aún no ha añadido el vídeo'; video.setAttribute('aria-disabled', 'true'); }
    const rx = e.tipo === 'cardio' ? [] : [[e.series || '—', 'Series'], [e.valor || '—', e.unidad === 's' ? 'Segundos' : 'Reps'], [e.tempo || '—', 'Tempo'], [e.descanso || '—', 'Descanso']];
    $('#sheet-rx').innerHTML = rx.map(([v, l]) => `<div><b>${esc(v)}</b><span>${l}</span></div>`).join('');
    $('#sheet-rx').hidden = !rx.length;
    $('#sheet-cue').textContent = e.indicacion || ''; $('#sheet-cue').hidden = !e.indicacion;
    const cardio = e.tipo === 'cardio';
    $('#strength-block').hidden = cardio; $('#cardio-block').hidden = !cardio;
    const previo = Y.ejercicios.find(x => x.prescripcionId === e.id);
    if (cardio) {
      $('#c-dist').value = previo?.distancia ?? ''; $('#c-time').value = previo?.tiempo ?? ''; $('#c-vel').value = previo?.velMax ?? '';
    } else {
      $('#col-a').textContent = e.unidad === 's' ? 'Segundos' : 'Reps';
      const guardadas = Y.series.filter(s => s.prescripcionId === e.id).sort((a, b) => a.serie - b.serie);
      const n = Math.max(Number(e.series) || 1, guardadas.length);
      const cont = $('#sheet-sets'); cont.innerHTML = '';
      for (let s = 1; s <= n; s++) {
        const g = guardadas[s - 1];
        const row = document.createElement('div'); row.className = 'set';
        row.innerHTML = `<span class="lbl">Serie ${s}</span>
          <input type="number" inputmode="numeric" class="s-val" value="${esc(g?.valor ?? (parseFloat(e.valor) || ''))}" aria-label="${e.unidad === 's' ? 'Segundos' : 'Repeticiones'} serie ${s}">
          <input type="number" inputmode="decimal" step="0.5" class="s-kg" value="${esc(g?.kg ?? (e.kg || 0))}" aria-label="Kilos extra serie ${s}">
          <button class="tick" type="button" aria-pressed="${g ? g.hecha : false}" aria-label="Serie ${s} hecha"><svg width="18" height="18"><use href="#i-check"></use></svg></button>`;
        const t = $('.tick', row); t.addEventListener('click', () => t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true')));
        cont.appendChild(row);
      }
    }
    limpiarEscala('exercise');
    if (previo && previo.dolor !== '') { const b = $$('[data-scale="exercise"] button')[previo.dolor]; b?.click(); }
    $('#sheet-done').textContent = previo ? 'Guardar cambios' : 'Marcar como hecho';
    $('#scrim').classList.add('open'); $('#sheet').classList.add('open'); $('#sheet').scrollTop = 0;
    setTimeout(() => $('#sheet-title').focus({ preventScroll: true }), 50);
  }
  function cerrarHoja() { $('#scrim').classList.remove('open'); $('#sheet').classList.remove('open'); foco?.focus?.(); }
  $('#scrim').addEventListener('click', cerrarHoja);
  $('#sheet-close').addEventListener('click', cerrarHoja);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarHoja(); cerrarQ(); } });
  $('#video-btn').addEventListener('click', ev => { if (!actual?.video) ev.preventDefault(); });

  $('#sheet-done').addEventListener('click', async () => {
    const e = actual, btn = $('#sheet-done');
    const datos = { prescripcionId: e.id, dolor: escalas.exercise ?? '' };
    if (e.tipo === 'cardio') Object.assign(datos, { distancia: $('#c-dist').value, tiempo: $('#c-time').value, velMax: $('#c-vel').value });
    else {
      $$('#sheet-sets .tick').forEach(t => { if (btn.textContent === 'Marcar como hecho') t.setAttribute('aria-pressed', 'true'); });
      datos.series = $$('#sheet-sets .set').map(r => ({ valor: $('.s-val', r).value, kg: $('.s-kg', r).value, hecha: $('.tick', r).getAttribute('aria-pressed') === 'true' }));
    }
    btn.disabled = true;
    try {
      await api('guardarEjercicio', datos);
      Y.ejercicios = Y.ejercicios.filter(x => x.prescripcionId !== e.id).concat([{ prescripcionId: e.id, dolor: datos.dolor, distancia: datos.distancia, tiempo: datos.tiempo, velMax: datos.velMax, fecha: Y.hoy }]);
      if (datos.series) Y.series = Y.series.filter(s => s.prescripcionId !== e.id).concat(datos.series.map((s, i) => ({ prescripcionId: e.id, serie: i + 1, valor: s.valor, kg: s.kg, hecha: s.hecha })));
      cerrarHoja(); pintarHoy();
      toast(datos.dolor !== '' && datos.dolor > 4 ? `Guardado · Dani verá que te dolió ${datos.dolor}/10` : 'Ejercicio guardado');
    } catch (x) { toast(x.message); } finally { btn.disabled = false; }
  });

  $('#finish-btn').addEventListener('click', async () => {
    const btn = $('#finish-btn'); btn.disabled = true;
    try {
      await api('guardarSesion', { dia, dolorAntes: escalas.before ?? '', dolorDespues: escalas.session, minutos: $('#session-min').value, comentario: $('#session-note').value });
      Y.sesiones.push({ dia, dolorAntes: escalas.before, dolorDespues: escalas.session, fecha: Y.hoy });
      limpiarEscala('before'); limpiarEscala('session'); $('#session-min').value = ''; $('#session-note').value = ''; $('#session-warn').classList.remove('show');
      const dias = [...new Set(Y.prescripcion.map(x => x.dia))].sort((a, b) => a - b);
      pintarDias(dias, new Set(Y.sesiones.map(s => s.dia))); pintarHoy();
      toast('Sesión guardada · ¡buen trabajo!');
    } catch (x) { toast(x.message); btn.disabled = false; }
  });

  /* ---------- Dolor ---------- */
  function lunes(fechaISO) { const d = new Date(fechaISO + 'T12:00:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; }
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function pintarDolor() {
    const porFecha = Object.fromEntries(Y.dolor.map(d => [d.fecha, d.dolor]));
    const l = lunes(Y.hoy);
    $('#weekpain').innerHTML = DIAS.map((n, i) => {
      const d = new Date(l); d.setDate(l.getDate() + i); const f = iso(d), v = porFecha[f];
      return `<div class="wp${f === Y.hoy ? ' today' : ''}"><b>${n}</b><span class="num" ${v !== undefined ? `data-level="${nivel(v)}"` : ''}>${v ?? '–'}</span></div>`;
    }).join('');
    const ult = Y.dolor.slice(-14);
    if (ult.length) lineas($('#chart-daily'), ult.map(d => d.dolor), { max: 10, limite: 4, ticks: [0, 5, 10], etiquetas: ult.map((d, i) => i === 0 || i === ult.length - 1 ? d.fecha.slice(8) + '/' + d.fecha.slice(5, 7) : '') });
    else vacio($('#chart-daily'), 'Aquí verás tu dolor de cada día');
  }
  $('#pain-save').addEventListener('click', async () => {
    const btn = $('#pain-save'); btn.disabled = true;
    try {
      await api('guardarDolor', { dolor: escalas.daily, nota: $('#daily-note').value });
      Y.dolor = Y.dolor.filter(d => d.fecha !== Y.hoy).concat([{ fecha: Y.hoy, dolor: escalas.daily }]);
      $('#daily-note').value = ''; pintarDolor(); $('#dot-dolor').hidden = true; toast('Dolor de hoy guardado');
    } catch (x) { toast(x.message); btn.disabled = false; }
  });

  /* ---------- Semana: encuesta y revisión mensual ---------- */
  const respuestas = {};
  function pintarSemana() {
    $('#semana-eyebrow').textContent = `Diario de progreso semanal · Semana ${Y.semana}`;
    $('#semana-sub').textContent = `Con esto Dani prepara tu semana ${Y.semana + 1}. Te lleva 2 minutos.`;
    $('#survey-done').hidden = !Y.encuestaHecha; $('#survey-wrap').hidden = Y.encuestaHecha;
    const rm = Y.revisionMensual;
    $('#month-card').hidden = !rm;
    if (rm) {
      const C = D.cuestionarios?.[rm.tipo];
      $('#month-eyebrow').textContent = `Revisión del mes ${rm.mes}${rm.hecha ? ' · hecha' : ' · toca esta semana'}`;
      $('#month-text').innerHTML = C ? `<b>Cuestionario ${esc(C.nombre)}</b> · 5 minutos. Sirve para medir tu mejora de forma objetiva.` : 'Revisión mensual.';
      $('#visa-start').hidden = !C || rm.hecha;
    }
    const wa = Y.contacto?.whatsapp || D.config.whatsapp;
    $('#call-wa').href = `https://wa.me/${wa}?text=` + encodeURIComponent(`Hola Dani, soy ${Y.paciente.nombre.split(' ')[0]}. Me gustaría hacer la videollamada de seguimiento${rm ? ' del mes ' + rm.mes : ''}.`);
    const cal = Y.contacto?.reservaCalendario; $('#call-cal').hidden = !cal; if (cal) $('#call-cal').href = cal;
    if (!Y.encuestaHecha) pintarEncuesta();
  }
  const preguntas = () => D.encuesta.filter(s => s.id);
  function contarEncuesta() {
    const n = preguntas().filter(s => respuestas[s.id] !== undefined && respuestas[s.id] !== '').length, t = preguntas().length;
    $('#survey-count').textContent = `${n} de ${t} respondidas`;
    $('#survey-bar').style.transform = `scaleX(${n / t})`;
    $('#week-send').disabled = n < t;
  }
  function pintarEncuesta() {
    const box = $('#survey'); box.innerHTML = ''; box.style.display = 'grid'; box.style.gap = '14px';
    D.encuesta.forEach(s => {
      if (s.section) { const h = document.createElement('div'); h.className = 'survey-section'; h.innerHTML = `<h2>${esc(s.section)}</h2>${s.intro ? `<p class="mute">${esc(s.intro)}</p>` : ''}`; box.appendChild(h); return; }
      const c = document.createElement('div'); c.className = 'card q';
      if (s.num) {
        c.innerHTML = `<label for="sv-${s.id}">${esc(s.q)}</label><input id="sv-${s.id}" type="number" inputmode="decimal" min="0" step="${s.step}" placeholder="${s.placeholder}">`;
        $('input', c).addEventListener('input', ev => { respuestas[s.id] = ev.target.value; contarEncuesta(); });
      } else if (s.opts) {
        c.innerHTML = `<p class="label">${esc(s.q)}</p><div class="chips">${s.opts.map(o => `<button class="chip" type="button" aria-pressed="false">${esc(o)}</button>`).join('')}</div>`;
        $$('.chip', c).forEach(ch => ch.addEventListener('click', () => { $$('.chip', c).forEach(x => x.setAttribute('aria-pressed', String(x === ch))); respuestas[s.id] = ch.textContent; contarEncuesta(); }));
      } else {
        c.innerHTML = `<p class="label">${esc(s.q)}</p>${s.hint ? `<p class="mute">${esc(s.hint)}</p>` : ''}<div class="scale"></div><div class="scale-legend"><span>1 · ${esc(s.lo)}</span><span>10 · ${esc(s.hi)}</span></div>`;
        escala010($('.scale', c), { min: 1, max: 10, neutral: true, onPick: n => { respuestas[s.id] = n; contarEncuesta(); } });
      }
      box.appendChild(c);
    });
    contarEncuesta();
  }
  $('#week-send').addEventListener('click', async () => {
    const btn = $('#week-send'); btn.disabled = true;
    try {
      const r = { ...respuestas }; ['pasos', 'sueno'].forEach(k => { if (r[k] !== undefined) r[k] = Number(String(r[k]).replace(',', '.')); });
      await api('guardarEncuesta', { respuestas: r });
      Y.encuestaHecha = true; pintarSemana(); $('#dot-semana').hidden = !(Y.revisionMensual && !Y.revisionMensual.hecha); window.scrollTo({ top: 0 });
      toast('Encuesta enviada a Dani');
    } catch (x) { toast(x.message); btn.disabled = false; }
  });

  /* ---------- Cuestionario mensual ---------- */
  let qTipo = null, qResp = [];
  function abrirQ(id) {
    const C = D.cuestionarios?.[id]; if (!C) return;
    qTipo = id; qResp = [];
    $('#q-eyebrow').textContent = `Revisión del mes ${Y.revisionMensual?.mes ?? ''}`;
    $('#q-title').textContent = 'Cuestionario ' + C.nombre; $('#q-intro').textContent = C.intro; $('#q-draft').hidden = C.texto !== 'traduccion';
    const box = $('#q-items'); box.innerHTML = '';
    const act = () => {
      const n = C.items.filter((it, i) => it.tipo === 'rama' ? qResp[i]?.i != null : qResp[i] != null).length;
      $('#q-score').textContent = D.puntuar(id, qResp); $('#q-left').textContent = `de ${C.max} · ${n}/${C.items.length} respondidas`; $('#q-send').disabled = n < C.items.length;
    };
    const lista = (ops, cb) => { const d = document.createElement('div'); d.className = 'optlist';
      ops.forEach((o, k) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = o; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => { $$('.opt', d).forEach(x => x.setAttribute('aria-pressed', String(x === b))); cb(k); }); d.appendChild(b); }); return d; };
    C.items.forEach((it, i) => {
      const c = document.createElement('div'); c.className = 'card q';
      c.innerHTML = `<p class="qnum">${i + 1} de ${C.items.length}</p><p class="label">${esc(it.q)}</p>${it.ayuda ? `<p class="mute">${esc(it.ayuda)}</p>` : ''}`;
      if (it.tipo === 'escala') {
        const sc = document.createElement('div'); sc.className = 'scale'; c.appendChild(sc);
        const lg = document.createElement('div'); lg.className = 'scale-legend'; lg.innerHTML = `<span>0 · ${esc(it.lo)}</span><span>10 · ${esc(it.hi)}</span>`; c.appendChild(lg);
        escala010(sc, { neutral: true, onPick: n => { qResp[i] = n; act(); } });
      } else if (it.tipo === 'opciones') c.appendChild(lista(it.opciones.map(o => o[0]), k => { qResp[i] = k; act(); }));
      else if (it.tipo === 'rama') {
        const sub = document.createElement('div'); sub.style.cssText = 'display:grid;gap:10px';
        c.appendChild(lista(it.ramas.map(r => r.id + '. ' + r.q.split('. ')[0].split(', ¿')[0] + '.'), k => {
          const r = it.ramas[k]; qResp[i] = { rama: r.id, i: null }; act();
          sub.innerHTML = `<p class="soft">${esc(r.q)}</p>`; sub.appendChild(lista(it.tiempos, t => { qResp[i] = { rama: r.id, i: t }; act(); }));
        }));
        c.appendChild(sub);
      }
      box.appendChild(c);
    });
    act(); $('#qsheet').scrollTop = 0; $('#qsheet').classList.add('open'); $('#q-foot').hidden = false;
  }
  function cerrarQ() { $('#qsheet').classList.remove('open'); $('#q-foot').hidden = true; }
  $('#q-close').addEventListener('click', cerrarQ);
  $('#visa-start').addEventListener('click', () => abrirQ(Y.revisionMensual?.tipo));
  $('#q-send').addEventListener('click', async () => {
    const btn = $('#q-send'); btn.disabled = true;
    const punt = D.puntuar(qTipo, qResp);
    try {
      await api('guardarCuestionario', { tipo: qTipo, puntuacion: punt, respuestas: qResp });
      Y.revisionMensual.hecha = true; cerrarQ(); pintarSemana(); toast(`Enviado · ${punt} puntos`);
    } catch (x) { toast(x.message); btn.disabled = false; }
  });

  /* ---------- Progreso ---------- */
  let P = null;
  async function pintarProgreso() {
    const p = Y.paciente;
    $('#prog-eyebrow').textContent = `Gráficas de mejora · desde el ${new Date(p.fechaInicio + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
    const t = D.plantillas.find(x => x.id === p.plantilla);
    if (t) {
      $('#phases').innerHTML = t.fases.map(f => `<div class="ph ${Y.semana > f.a ? 'done' : Y.semana >= f.de ? 'now' : ''}" style="flex-basis:${(f.a - f.de + 1) / t.semanas * 100}%"><i></i><b>${esc(f.nombre)}</b></div>`).join('');
      const fase = t.fases.find(f => Y.semana >= f.de && Y.semana <= f.a);
      $('#phase-text').innerHTML = `Estás en la fase <b class="text-coral">${esc(fase?.nombre ?? '')}</b> · semana ${Y.semana} de ${p.semanas}.`;
    } else { $('#phases').innerHTML = ''; $('#phase-text').textContent = `Semana ${Y.semana} de ${p.semanas}.`; }
    $('#alta-list').innerHTML = Y.alta.length ? Y.alta.map(a => `<li><b>${esc(a.prueba)}</b><span>${esc(a.criterio)}</span><em>${a.superada ? 'Superada' : 'Pendiente'}</em></li>`).join('') : '<li><span>Dani te dirá tus pruebas de alta.</span></li>';
    try { P = await api('progreso'); } catch (x) { toast(x.message); return; }
    const S = s => 'S' + s;
    const dol = P.dolor, adh = P.adherencia.filter(a => a.valor !== null && a.valor !== '');
    const ultD = dol[dol.length - 1], primD = dol[0];
    const pasos = P.pasos.filter(x => x.pasos).sort((a, b) => a.semana - b.semana);
    $('#stats').innerHTML = [
      ['Dolor medio', ultD ? fmt(ultD.media) : '—', ultD && primD && dol.length > 1 ? `${ultD.media <= primD.media ? '−' : '+'}${fmt(Math.abs(Math.round((ultD.media - primD.media) * 10) / 10))} vs S${primD.semana}` : `semana ${Y.semana}`, ultD && primD && ultD.media > primD.media],
      ['Adherencia', adh.length ? adh[adh.length - 1].valor + '%' : '—', 'esta semana'],
      ['Pasos / día', pasos.length ? fmt((pasos[pasos.length - 1].pasos / 1000).toFixed(1)) + 'k' : '—', 'de tu encuesta'],
    ].map(([l, v, d, malo]) => `<div class="stat"><span>${l}</span><b>${v}</b><em class="${malo ? 'lvl-high' : 'up'}">${esc(d)}</em></div>`).join('');
    if (dol.length) lineas($('#chart-weekly'), dol.map(d => d.media), { max: 10, limite: 4, ticks: [0, 5, 10], etiquetas: dol.map(d => S(d.semana)) }); else vacio($('#chart-weekly'), 'Apunta tu dolor cada día para ver la gráfica');
    if (adh.length) lineas($('#chart-adh'), adh.map(a => a.valor), { max: 100, ticks: [0, 50, 100], etiquetas: adh.map(a => S(a.semana)), unidad: '%', yFmt: v => v + '%' }); else vacio($('#chart-adh'));
    const fu = P.fuerza;
    $('#ex-pick').innerHTML = fu.map((f, i) => `<button class="chip" type="button" data-i="${i}" aria-pressed="${i === 0}">${esc(f.ejercicio)}</button>`).join('');
    const verFuerza = i => {
      $$('#ex-pick .chip').forEach(c => c.setAttribute('aria-pressed', String(+c.dataset.i === i)));
      const s = fu[i].semanas, et = s.map(x => S(x.semana));
      const e1 = escala(s.map(x => x.tonelaje), 10), e2 = escala(s.map(x => x.rm), 10);
      lineas($('#chart-ton'), s.map(x => x.tonelaje), { max: e1.max, ticks: e1.ticks, etiquetas: et, unidad: ' kg' });
      lineas($('#chart-rm'), s.map(x => x.rm), { max: e2.max, ticks: e2.ticks, etiquetas: et, unidad: ' kg' });
    };
    if (fu.length) { $$('#ex-pick .chip').forEach(c => c.addEventListener('click', () => verFuerza(+c.dataset.i))); verFuerza(0); }
    else { vacio($('#chart-ton'), 'Aparecerá cuando apuntes series con peso'); vacio($('#chart-rm')); }
    const ca = P.cardio;
    if (ca.length) {
      const e1 = escala(ca.map(c => c.distancia), 5), e2 = escala(ca.map(c => c.velMax), 10);
      barras($('#chart-dist'), ca.map(c => c.distancia), { max: e1.max, ticks: e1.ticks, etiquetas: ca.map(c => S(c.semana)) });
      lineas($('#chart-vel'), ca.map(c => c.velMax), { max: e2.max, ticks: e2.ticks, etiquetas: ca.map(c => S(c.semana)), unidad: ' km/h' });
    } else { vacio($('#chart-dist'), 'Aparecerá cuando apuntes tu cardio'); vacio($('#chart-vel')); }
    if (pasos.length) { const e = escala(pasos.map(x => x.pasos), 10000); barras($('#chart-steps'), pasos.map(x => x.pasos), { max: e.max, ticks: e.ticks, etiquetas: pasos.map(x => S(x.semana)), yFmt: v => v / 1000 + 'k', valFmt: v => fmt((v / 1000).toFixed(1)) + 'k' }); }
    else vacio($('#chart-steps'), 'Aparecerá con tu encuesta semanal');
  }

  /* ---------- Instalar como app (service worker) y notificaciones ---------- */
  const swListo = ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost'))
    ? navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).catch(() => null) : Promise.resolve(null);
  const b64aBytes = s => { const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  async function pintarAvisos() {
    const card = $('#avisos-card'), clave = Y?.avisos?.clave;
    card.hidden = true; card.classList.remove('solo-texto'); $('#avisos-btn').hidden = false;
    if (!clave) return;                                   // Dani aún no ha activado las notificaciones
    if (esIOS && !instalada) {                            // en iPhone solo funcionan con la app en la pantalla de inicio
      card.hidden = false; card.classList.add('solo-texto'); $('#avisos-btn').hidden = true;
      $('#avisos-text').textContent = 'Para recibir avisos en el iPhone, añade la app a tu pantalla de inicio: botón Compartir → «Añadir a pantalla de inicio», y ábrela desde ahí.';
      return;
    }
    if (!('PushManager' in window) || !('Notification' in window) || Notification.permission === 'denied') return;
    const reg = await swListo; if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub && Notification.permission === 'granted') return; // ya activadas en este móvil
    card.hidden = false; $('#avisos-text').textContent = 'Te avisaremos en el móvil cuando Dani publique tu nueva semana.';
  }
  $('#avisos-btn').addEventListener('click', async () => {
    const btn = $('#avisos-btn'); btn.disabled = true;
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') { toast('Sin permiso no podemos avisarte. Puedes activarlo en los ajustes del móvil.'); $('#avisos-card').hidden = true; return; }
      const reg = await swListo;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aBytes(Y.avisos.clave) });
      await api('guardarAviso', { suscripcion: sub.toJSON() });
      $('#avisos-card').hidden = true; toast('Notificaciones activadas en este móvil');
    } catch (x) { toast(x.message || 'No se han podido activar las notificaciones.'); }
    finally { btn.disabled = false; }
  });

  api.conToken() ? cargar() : mostrarAcceso();
})();
