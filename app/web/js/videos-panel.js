/* RCD · pestaña «Vídeos» de la ficha del paciente (panel): Valoración, Técnica y Alta.
   Dani pide los vídeos, ve en qué estado están y abre el analizador. */
(() => {
  const { $, $$, esc, toast } = window.RCDUI;
  const V = () => window.RCD.videos;
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 });
  const fechaCorta = f => f ? new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '') : '';
  const ESTADO = { pedido: 'Pedido', subido: 'Por analizar', analizado: 'Analizado' };
  const ordenMomento = m => m === 'inicial' ? -1 : m === 'final' ? 999 : Number(String(m).slice(7)) || 0;
  const valorTxt = v => v.resultado === '' || v.resultado == null ? '' : v.unidad === 'RSI' ? 'RSI ' + fmt1(v.resultado) : fmt1(v.resultado) + (v.unidad === '°' ? '°' : ' ' + (v.unidad || ''));
  let parte = 'valoracion';

  /** Simetría entre piernas: pierna afectada / pierna sana × 100 (si se sabe cuál es la afectada). */
  function lsi(ladoLesion, der, izq) {
    if (!(der > 0) || !(izq > 0) || !/^(derecha|izquierda)$/.test(ladoLesion || '')) return null;
    return Math.round((ladoLesion === 'derecha' ? der / izq : izq / der) * 100);
  }

  function pintar(cont, F, api, alCambiar) {
    const P = F.paciente, videos = F.videos || [];
    const cuenta = ap => videos.filter(v => v.apartado === ap && v.estado === 'subido').length;
    cont.innerHTML = `
      <div class="vp-cab">
        <div class="chipline" role="tablist" aria-label="Tipo de vídeos">${Object.entries(V().APARTADOS).map(([k, t]) =>
          `<button class="chip" type="button" role="tab" data-parte="${k}" aria-selected="${parte === k}" aria-pressed="${parte === k}">${t}${cuenta(k) ? ` <span class="vp-num">${cuenta(k)}</span>` : ''}</button>`).join('')}</div>
        <label class="vp-lado">Pierna afectada<select id="vp-lado"><option value="">—</option>${['derecha', 'izquierda', 'ambas'].map(l => `<option value="${l}" ${P.ladoLesion === l ? 'selected' : ''}>${l[0].toUpperCase() + l.slice(1)}</option>`).join('')}</select></label>
      </div>
      <div id="vp-cuerpo" style="display:grid;gap:16px"></div>`;
    $$('[data-parte]', cont).forEach(b => b.addEventListener('click', () => { parte = b.dataset.parte; pintar(cont, F, api, alCambiar); }));
    $('#vp-lado', cont).addEventListener('change', async e => {
      try { const r = await api('editarPaciente', { pacienteId: P.id, cambios: { ladoLesion: e.target.value } }); F.paciente = r.paciente; toast('Guardado'); pintar(cont, F, api, alCambiar); } catch (x) { toast(x.message); }
    });
    const cuerpo = $('#vp-cuerpo', cont);
    const refrescar = nuevos => { F.videos = nuevos; alCambiar?.(); pintar(cont, F, api, alCambiar); };
    const ctx = { F, api, refrescar, videos };
    if (parte === 'valoracion') pintarValoracion(cuerpo, ctx);
    if (parte === 'tecnica') pintarTecnica(cuerpo, ctx);
    if (parte === 'alta') pintarAlta(cuerpo, ctx);
    $$('[data-analizar]', cuerpo).forEach(b => b.addEventListener('click', () => analizar(ctx, videos.find(v => v.id === b.dataset.analizar))));
    $$('[data-quitar-video]', cuerpo).forEach(b => b.addEventListener('click', async () => {
      const v = videos.find(x => x.id === b.dataset.quitarVideo);
      if (!confirm(v.estado === 'pedido' ? `¿Quitar la petición «${v.nombre}»?` : `¿Borrar el vídeo «${v.nombre}»? Irá a la papelera de Drive (se puede recuperar 30 días).`)) return;
      try { refrescar((await api('borrarVideo', { videoId: v.id })).videos); toast('Quitado'); } catch (x) { toast(x.message); }
    }));
  }

  /** Abre el analizador. Para pruebas a una pierna, añade la simetría si la otra pierna ya está medida. */
  function analizar(ctx, v) {
    const prueba = V().prueba(v.prueba) || V().TECNICA, P = ctx.F.paciente;
    const pareja = () => ctx.videos.find(x => x.id !== v.id && x.prueba === v.prueba && x.apartado === v.apartado && x.momento === v.momento && (x.altaId || '') === (v.altaId || '') && x.lado && x.lado !== v.lado && x.estado === 'analizado' && x.resultado !== '');
    window.RCDAnalizador.abrir({
      api: ctx.api, video: v, paciente: P, prueba,
      otros: ctx.videos.filter(x => x.estado !== 'pedido'),
      textoResultado: (valor, texto) => {
        const o = pareja(); if (!prueba.unilateral || !o || valor === '') return texto;
        const l = lsi(P.ladoLesion, v.lado === 'derecha' ? valor : o.resultado, v.lado === 'izquierda' ? valor : o.resultado);
        return l == null ? texto : `${texto} · simetría ${l} %`;
      },
      alGuardar: nuevos => ctx.refrescar(nuevos),
    });
  }

  const accionesVideo = v => `${v.estado === 'pedido' ? `<span class="pill">Pedido el ${fechaCorta(v.creado)}</span>` : `<button class="act ${v.estado === 'subido' ? 'on' : ''}" type="button" data-analizar="${v.id}">${v.estado === 'subido' ? 'Analizar' : 'Ver análisis'}</button>`}
    <button class="quitar" type="button" data-quitar-video="${v.id}">Quitar</button>`;

  /* ================= Valoración ================= */
  function pintarValoracion(cuerpo, ctx) {
    const { F, api } = ctx, P = F.paciente;
    const vals = ctx.videos.filter(v => v.apartado === 'valoracion');
    const momentos = [...new Set(vals.map(v => v.momento))].sort((a, b) => ordenMomento(a) - ordenMomento(b));
    // Filas: prueba (+ lado); columnas: momentos
    const filas = [];
    vals.forEach(v => { const k = v.prueba + '|' + (v.lado || ''); if (!filas.some(f => f.k === k)) filas.push({ k, prueba: v.prueba, lado: v.lado, nombre: (V().prueba(v.prueba)?.corto || v.nombre) + (v.lado ? ' · ' + v.lado : '') }); });
    filas.sort((a, b) => V().PRUEBAS.findIndex(p => p.id === a.prueba) - V().PRUEBAS.findIndex(p => p.id === b.prueba) || String(a.lado).localeCompare(String(b.lado)));
    const celda = (f, m) => {
      const v = vals.filter(x => x.prueba === f.prueba && (x.lado || '') === (f.lado || '') && x.momento === m)[0];
      if (!v) return '<td class="mute">—</td>';
      if (v.estado !== 'analizado') return `<td><button class="vp-celda ${v.estado}" type="button" ${v.estado === 'subido' ? `data-analizar="${v.id}"` : 'disabled'}>${ESTADO[v.estado]}</button></td>`;
      const ini = vals.find(x => x.prueba === f.prueba && (x.lado || '') === (f.lado || '') && x.momento === momentos[0] && x.estado === 'analizado');
      const dif = ini && ini !== v && ini.resultado !== '' && v.resultado !== '' ? v.resultado - ini.resultado : null;
      return `<td><button class="vp-celda ok" type="button" data-analizar="${v.id}"><b>${valorTxt(v) || 'Visto'}</b>${dif != null && Math.abs(dif) >= 0.05 ? `<em class="${(v.unidad === '°' ? -dif : dif) >= 0 ? 'lvl-ok' : 'lvl-high'}">${dif > 0 ? '+' : '−'}${fmt1(Math.abs(dif))}</em>` : ''}</button></td>`;
    };
    // Filas de simetría para las pruebas a una pierna con los dos lados medidos
    const simetria = [...new Set(filas.filter(f => f.lado).map(f => f.prueba))].map(pr => {
      const celdas = momentos.map(m => {
        const d = vals.find(x => x.prueba === pr && x.lado === 'derecha' && x.momento === m && x.estado === 'analizado'), i = vals.find(x => x.prueba === pr && x.lado === 'izquierda' && x.momento === m && x.estado === 'analizado');
        const l = d && i ? lsi(P.ladoLesion, d.resultado, i.resultado) : null;
        return `<td>${l == null ? '<span class="mute">—</span>' : `<b class="${l >= 90 ? 'lvl-ok' : l >= 80 ? 'lvl-mid' : 'lvl-high'}">${l} %</b>`}</td>`;
      });
      return `<tr class="vp-lsi"><th scope="row">Simetría ${esc(V().prueba(pr)?.corto || pr)}</th>${celdas.join('')}</tr>`;
    });

    const t = window.RCD.plantillas.find(x => x.id === P.plantilla);
    const bateria = V().BATERIAS[P.plantilla] || ['cmj', 'hop'];
    const semana = F.semana || 1;
    const hayInicial = momentos.includes('inicial');
    cuerpo.innerHTML = `
      <div class="card vp-pedir">
        <p class="sec-title">Pedir valoración</p>
        <div class="two"><label>Momento<select id="vp-momento">
            <option value="inicial" ${!hayInicial ? 'selected' : ''}>Valoración inicial</option>
            <option value="semana" ${hayInicial ? 'selected' : ''}>Revisión de la semana…</option>
            <option value="final">Valoración final</option></select></label>
          <label id="vp-semana-l" ${hayInicial ? '' : 'hidden'}>Semana<input type="number" id="vp-semana" min="1" max="52" value="${semana}"></label></div>
        <p class="mute">Batería propuesta para ${esc(t?.nombre || 'esta lesión')}. Quita o añade pruebas; las de una pierna se piden de las dos.</p>
        <div class="chipline" id="vp-bateria">${V().PRUEBAS.filter(p => !p.libre).map(p => `<button class="chip" type="button" data-prueba="${p.id}" aria-pressed="${bateria.includes(p.id)}">${esc(p.corto)}${p.unilateral ? ' ×2' : ''}</button>`).join('')}</div>
        <label class="hc-lab" for="vp-msg">Mensaje para el paciente (opcional)<textarea class="hc-in" id="vp-msg" rows="2" maxlength="600" placeholder="Por ejemplo: hazlo con calzado de correr y después de calentar 10 minutos."></textarea></label>
        <button class="btn btn-primary" type="button" id="vp-pedir">Pedir vídeos</button>
      </div>
      ${filas.length ? `<p class="sec-title">Evolución</p><div class="card tbl-wrap"><table class="vp-tabla"><thead><tr><th>Prueba</th>${momentos.map(m => `<th>${esc(V().MOMENTOS(m))}</th>`).join('')}</tr></thead>
        <tbody>${filas.map(f => `<tr><th scope="row">${esc(f.nombre)}</th>${momentos.map(m => celda(f, m)).join('')}</tr>`).join('')}${simetria.join('')}</tbody></table>
        <p class="mute">Diferencia respecto a la ${esc(V().MOMENTOS(momentos[0]).toLowerCase())}. ${P.ladoLesion && P.ladoLesion !== 'ambas' ? `Simetría = pierna ${P.ladoLesion} ÷ pierna sana.` : 'Indica arriba la pierna afectada para calcular la simetría.'} Pulsa un resultado para revisarlo o compararlo.</p></div>` : '<p class="mute">Aún no has pedido ninguna valoración en vídeo.</p>'}
      ${vals.some(v => v.estado !== 'analizado') ? `<p class="sec-title">Pendientes</p><div class="card vp-lista">${vals.filter(v => v.estado !== 'analizado').map(filaVideo).join('')}</div>` : ''}`;
    $('#vp-momento', cuerpo).addEventListener('change', e => { $('#vp-semana-l', cuerpo).hidden = e.target.value !== 'semana'; });
    $$('[data-prueba]', cuerpo).forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); contar(); }));
    const elegidas = () => $$('[data-prueba][aria-pressed="true"]', cuerpo).map(b => V().prueba(b.dataset.prueba));
    const contar = () => { const n = elegidas().reduce((t, p) => t + (p.unilateral ? 2 : 1), 0); $('#vp-pedir', cuerpo).textContent = n ? `Pedir ${n} vídeo${n === 1 ? '' : 's'}` : 'Elige al menos una prueba'; $('#vp-pedir', cuerpo).disabled = !n; };
    contar();
    $('#vp-pedir', cuerpo).addEventListener('click', async () => {
      const m = $('#vp-momento', cuerpo).value, momento = m === 'semana' ? 'semana-' + (Number($('#vp-semana', cuerpo).value) || semana) : m;
      const items = elegidas().flatMap(p => p.unilateral ? ['derecha', 'izquierda'].map(lado => ({ prueba: p.id, nombre: p.nombre, lado })) : [{ prueba: p.id, nombre: p.nombre }]);
      const b = $('#vp-pedir', cuerpo); b.disabled = true;
      try { ctx.refrescar((await api('pedirVideos', { pacienteId: P.id, apartado: 'valoracion', momento, items, mensaje: $('#vp-msg', cuerpo).value.trim() })).videos); toast(`Pedidos ${items.length} vídeos · le llega a su app`); }
      catch (x) { toast(x.message); b.disabled = false; }
    });
  }

  const filaVideo = v => `<div class="vp-fila">
      <div><b>${esc(v.nombre)}${v.lado ? ' · ' + esc(v.lado) : ''}</b><p class="mute">${[V().MOMENTOS(v.momento), v.estado === 'pedido' ? 'esperando el vídeo' : v.subido ? 'subido el ' + fechaCorta(v.subido) : '', v.analizado ? 'analizado el ' + fechaCorta(v.analizado) : ''].filter(Boolean).map(esc).join(' · ')}</p>
        ${v.texto ? `<p>${esc(v.texto)}</p>` : ''}${v.comentario ? `<p class="vp-coment">«${esc(v.comentario)}»</p>` : ''}</div>
      <div class="acts">${accionesVideo(v)}</div></div>`;

  /* ================= Técnica ================= */
  function pintarTecnica(cuerpo, ctx) {
    const { F, api } = ctx, P = F.paciente;
    const tec = ctx.videos.filter(v => v.apartado === 'tecnica');
    const ejercicios = [...new Set(F.prescripcion.filter(x => x.semana === F.semana).map(x => x.ejercicio).concat(F.prescripcion.map(x => x.ejercicio)))];
    cuerpo.innerHTML = `
      <div class="card vp-pedir"><p class="sec-title">Pedir vídeo de técnica</p>
        <label>Ejercicio<input type="text" id="vt-ej" list="vt-ejs" maxlength="120" placeholder="Elige un ejercicio de su plan o escríbelo" autocomplete="off"></label>
        <datalist id="vt-ejs">${ejercicios.map(e => `<option value="${esc(e)}">`).join('')}</datalist>
        <label class="hc-lab" for="vt-ins">Cómo quieres que lo grabe<textarea class="hc-in" id="vt-ins" rows="2" maxlength="600">Grábate de perfil haciendo 3 repeticiones, como en tu sesión.</textarea></label>
        <button class="btn btn-primary" type="button" id="vt-pedir">Pedir vídeo</button></div>
      <p class="sec-title">Vídeos de técnica</p>
      <div class="card vp-lista">${tec.length ? tec.map(filaVideo).join('') : '<p class="mute">Ninguno todavía.</p>'}</div>`;
    $('#vt-pedir', cuerpo).addEventListener('click', async () => {
      const nombre = $('#vt-ej', cuerpo).value.trim(); if (!nombre) { $('#vt-ej', cuerpo).focus(); toast('Elige el ejercicio'); return; }
      const presc = F.prescripcion.filter(x => x.ejercicio === nombre).pop();
      try { ctx.refrescar((await api('pedirVideos', { pacienteId: P.id, apartado: 'tecnica', items: [{ prueba: 'tecnica', nombre, prescripcionId: presc?.id || '', instrucciones: $('#vt-ins', cuerpo).value.trim() }] })).videos); toast('Pedido · le llega a su app'); }
      catch (x) { toast(x.message); }
    });
  }

  /* ================= Alta ================= */
  const adivinarPrueba = t => { const s = String(t || '').toLowerCase(); return /triple/.test(s) ? 'triplehop' : /hop|horizontal a una/.test(s) ? 'hop' : /drop/.test(s) ? 'dj' : /una pierna|unipodal|single leg/.test(s) && /cmj|salto/.test(s) ? 'slcmj' : /squat jump|\bsj\b/.test(s) ? 'sj' : /cmj|salto/.test(s) ? 'cmj' : /sentadilla/.test(s) ? 'slsquat' : /dorsiflex|lunge|pared/.test(s) ? 'lunge' : ''; };
  function pintarAlta(cuerpo, ctx) {
    const { F, api } = ctx, P = F.paciente;
    const altas = ctx.videos.filter(v => v.apartado === 'alta');
    cuerpo.innerHTML = F.alta.length ? F.alta.map(a => {
      const sug = adivinarPrueba(a.prueba), vs = altas.filter(v => v.altaId === a.id);
      return `<div class="card vp-alta" data-alta="${a.id}">
        <div class="vp-alta-top"><div><b>${esc(a.prueba)}</b><p class="mute">Criterio: ${esc(a.criterio)}${a.resultado ? ` · <span class="soft">Resultado: ${esc(a.resultado)}</span>` : ''}</p></div><span class="pill ${a.superada ? 'ok' : ''}">${a.superada ? 'Superada' : 'Pendiente'}</span></div>
        ${vs.length ? `<div class="vp-lista">${vs.map(filaVideo).join('')}</div>` : ''}
        <div class="vp-alta-pedir"><label>Prueba en vídeo<select data-sel="${a.id}"><option value="">Elige…</option>${V().PRUEBAS.map(p => `<option value="${p.id}" ${p.id === sug ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></label>
          <button class="btn btn-ghost" type="button" data-pedir-alta="${a.id}">Pedir vídeo${V().prueba(sug)?.unilateral ? 's (las dos piernas)' : ''}</button></div>
      </div>`;
    }).join('') + '<p class="mute">El resultado medido se apunta solo en la prueba de alta (pestaña «Alta»). Tú decides si la marcas como superada.</p>'
      : '<p class="mute">Este paciente no tiene pruebas de alta.</p>';
    $$('[data-sel]', cuerpo).forEach(s => s.addEventListener('change', () => { const b = $(`[data-pedir-alta="${s.dataset.sel}"]`, cuerpo); b.textContent = V().prueba(s.value)?.unilateral ? 'Pedir vídeos (las dos piernas)' : 'Pedir vídeo'; }));
    $$('[data-pedir-alta]', cuerpo).forEach(b => b.addEventListener('click', async () => {
      const a = F.alta.find(x => x.id === b.dataset.pedirAlta), p = V().prueba($(`[data-sel="${a.id}"]`, cuerpo).value);
      if (!p) { toast('Elige qué prueba tiene que grabar'); return; }
      const items = (p.unilateral ? ['derecha', 'izquierda'] : ['']).map(lado => ({ prueba: p.id, nombre: a.prueba, lado, altaId: a.id }));
      try { ctx.refrescar((await api('pedirVideos', { pacienteId: P.id, apartado: 'alta', items })).videos); toast('Pedido · le llega a su app'); } catch (x) { toast(x.message); }
    }));
  }

  window.RCDVideosPanel = { pintar, lsi };
})();
