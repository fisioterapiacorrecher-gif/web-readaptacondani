/* RCD · gestión del panel: tareas (también en «Para hoy»), objetivos del mes con contador, y Ventas (Setter + Closer). */
(() => {
  const { $, $$, esc, toast } = window.RCDUI;
  const ayerISO = () => { const d = new Date(Date.now() - 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const hoyISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const masDias = n => { const d = new Date(Date.now() + n * 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const mesDe = f => String(f || '').slice(0, 7);
  const sumarMes = (ym, n) => { const d = new Date(ym + '-15T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };
  const nombreMes = ym => { const t = new Date(ym + '-15T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); };
  const fechaCorta = f => new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
  const pct = (a, b) => b > 0 ? Math.round(a / b * 100) + ' %' : '—';
  const eur = n => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' €';
  const CANALES = { instagram: 'Instagram', whatsapp: 'WhatsApp', referido: 'Referido', otro: 'Otro' };
  const ORIGEN = { bienvenida: 'Bienvenida', inbound: 'Inbound' };
  const RESULTADO = { espera: 'En espera', compro: 'Compró', no: 'No compró' };
  const LESIONES = ['Tendinopatía rotuliana', 'Tendinopatía aquílea', 'Tendinopatía isquiotibial', 'Cintilla iliotibial', 'Pata de ganso', 'Fascitis plantar', 'Tendinitis del pie', 'Estabilidad de tobillo', 'Otra'];
  const TIPOS = { llamadas: 'Llamadas de venta', clientes: 'Clientes nuevos', ingresos: 'Ingresos', bienvenidas: 'Bienvenidas dadas', inbounds: 'Inbounds', manual: 'Otro (lo marco yo)' };
  const opciones = (obj, sel, vacio) => (vacio ? `<option value="">${vacio}</option>` : '') + Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(v)}</option>`).join('');
  const ICO_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /** Cuándo vence una tarea, dicho como lo diría Dani: «hoy», «mañana», «jue», «12 dic» o «vencida». */
  function cuando(f) {
    if (!f) return { txt: '', cls: '' };
    const hoy = hoyISO(), dias = Math.round((new Date(f + 'T12:00:00') - new Date(hoy + 'T12:00:00')) / 86400000);
    if (dias < 0) return { txt: 'vencida · ' + fechaCorta(f), cls: 'vencida' };
    if (dias === 0) return { txt: 'hoy', cls: 'hoy' };
    if (dias === 1) return { txt: 'mañana', cls: '' };
    if (dias < 7) return { txt: new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''), cls: '' };
    return { txt: fechaCorta(f), cls: '' };
  }

  const filaTarea = (t, conBorrar) => {
    const c = cuando(t.fecha);
    return `<div class="mt ${t.hecha ? 'hecha' : ''}" data-id="${esc(t.id)}">
      <button class="mt-check" type="button" aria-pressed="${t.hecha}" aria-label="${t.hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}: ${esc(t.texto)}">${ICO_CHECK}</button>
      <span class="mt-txt">${esc(t.texto)}</span>
      ${t.hecha ? `<em class="mt-f">${t.hechaEl ? 'hecha ' + fechaCorta(t.hechaEl) : ''}</em>` : c.txt ? `<em class="mt-f ${c.cls}">${esc(c.txt)}</em>` : '<em class="mt-f"></em>'}
      ${conBorrar ? `<button class="quitar" type="button" data-borrar="${esc(t.id)}">Quitar</button>` : ''}</div>`;
  };

  const formTarea = id => `<form class="mt-form" id="${id}" hidden>
      <label class="sr" for="${id}-t">Tarea</label><input type="text" id="${id}-t" placeholder="¿Qué tienes que hacer?" maxlength="300" autocomplete="off">
      <label class="sr" for="${id}-f">Para cuándo (opcional)</label><input type="date" id="${id}-f" aria-label="Para cuándo (opcional)">
      <button class="btn btn-primary" type="submit">Añadir</button></form>`;

  /** Engancha marcar/borrar/añadir tareas. alGuardar recibe la lista nueva de tareas del motor. */
  function engancharTareas(cont, api, lista, alGuardar, formId) {
    $$('.mt-check', cont).forEach(b => b.addEventListener('click', async () => {
      const fila = b.closest('.mt'), t = lista().find(x => x.id === fila.dataset.id); if (!t) return;
      b.disabled = true; fila.classList.toggle('hecha', !t.hecha); b.setAttribute('aria-pressed', String(!t.hecha));
      try { alGuardar((await api('guardarTarea', { tarea: Object.assign({}, t, { hecha: !t.hecha }) })).tareas); }
      catch (e) { toast(e.message); fila.classList.toggle('hecha', t.hecha); b.disabled = false; }
    }));
    $$('[data-borrar]', cont).forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try { alGuardar((await api('borrarTarea', { id: b.dataset.borrar })).tareas); toast('Tarea quitada'); } catch (e) { toast(e.message); b.disabled = false; }
    }));
    const form = $('#' + formId, cont); if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const texto = $('#' + formId + '-t', cont).value.trim(); if (!texto) { $('#' + formId + '-t', cont).focus(); return; }
      const btn = form.querySelector('button'); btn.disabled = true;
      try { alGuardar((await api('guardarTarea', { tarea: { texto, fecha: $('#' + formId + '-f', cont).value } })).tareas); toast('Tarea añadida'); }
      catch (x) { toast(x.message); btn.disabled = false; }
    });
  }

  /* ================= «Para hoy» en la barra lateral ================= */
  function pintarMisTareas(cont, tareas, api, alCambiar, extra = {}) {
    const S = extra.setter, O = extra.objetivos || [];
    const aviso = S ? `<button class="mt-aviso" type="button" id="mt-setter"><i></i><span>${S.faltan === 1 && S.desde === ayerISO() ? 'Apunta el Setter de ayer' : `Apunta el Setter · falta${S.faltan === 1 ? '' : 'n'} ${S.faltan} día${S.faltan === 1 ? '' : 's'} (desde el ${fechaCorta(S.desde)})`}</span></button>` : '';
    const mini = O.length ? `<button class="mini-obj" type="button" id="mini-obj" aria-label="Ver los objetivos del mes">
      <span class="sub-h">Objetivos de ${esc(nombreMes(hoyISO().slice(0, 7)).split(' ')[0].toLowerCase())} · ${O.filter(o => o.hecho).length}/${O.length}</span>
      ${O.map(o => o.tipo === 'manual' ? `<span class="mo ${o.hecho ? 'ok' : ''}"><b>${esc(o.texto)}</b><em>${o.hecho ? 'hecho' : 'pendiente'}</em></span>`
        : `<span class="mo ${o.hecho ? 'ok' : ''}"><b>${esc(o.texto)}</b><em class="num">${o.tipo === 'ingresos' ? eur(o.valor) : o.valor}/${o.tipo === 'ingresos' ? eur(o.meta) : o.meta}</em><span class="obj-bar"><i style="width:${Math.min(100, o.meta > 0 ? o.valor / o.meta * 100 : 0)}%"></i></span></span>`).join('')}</button>` : '';
    cont.innerHTML = `${aviso}<div class="mt-lista">${tareas.map(t => filaTarea(t, false)).join('')}</div>
      <button class="mt-add" type="button" id="mt-add">+ Añadir tarea</button>${formTarea('mt-form')}${mini}`;
    $('#mt-setter', cont)?.addEventListener('click', () => extra.irSetter(S.desde));
    $('#mini-obj', cont)?.addEventListener('click', () => extra.irGestion());
    const lista = () => tareas;
    engancharTareas(cont, api, lista, nuevas => alCambiar(nuevas.filter(t => !t.hecha)), 'mt-form');
    $('#mt-add', cont).addEventListener('click', () => { $('#mt-add', cont).hidden = true; $('#mt-form', cont).hidden = false; $('#mt-form-t', cont).focus(); });
    $('#mt-form-t', cont).addEventListener('keydown', e => { if (e.key === 'Escape') { $('#mt-form', cont).hidden = true; $('#mt-add', cont).hidden = false; } });
  }

  /* ================= Gestión: objetivos del mes + tareas ================= */
  async function pintarGestion(cont, api, ctx) {
    cont.innerHTML = '<p class="mute">Cargando…</p>';
    let G;
    try { G = await api('gestion', { mes: ctx.mes || '' }); } catch (x) { cont.innerHTML = `<p class="vacio">${esc(x.message)}</p>`; return; }

    const filaObjetivo = o => {
      if (o.tipo === 'manual') return `<div class="obj manual ${o.hecho ? 'ok' : ''}">
        <button class="mt-check" type="button" data-obj="${esc(o.id)}" aria-pressed="${o.hecho}" aria-label="${o.hecho ? 'Marcar como no cumplido' : 'Marcar como cumplido'}: ${esc(o.texto)}">${ICO_CHECK}</button>
        <span class="obj-txt">${esc(o.texto)}</span><button class="quitar" type="button" data-qobj="${esc(o.id)}">Quitar</button></div>`;
      const v = o.tipo === 'ingresos' ? eur(o.valor) : o.valor, m = o.tipo === 'ingresos' ? eur(o.meta) : o.meta;
      const p = Math.max(0, Math.min(100, o.meta > 0 ? o.valor / o.meta * 100 : 0));
      return `<div class="obj ${o.hecho ? 'ok' : ''}">
        <span class="obj-txt">${esc(o.texto)}</span>
        <span class="obj-bar" role="progressbar" aria-label="${esc(o.texto)}" aria-valuemin="0" aria-valuemax="${o.meta}" aria-valuenow="${o.valor}"><i style="width:${p}%"></i></span>
        <b class="obj-num num">${v} / ${m}</b><button class="quitar" type="button" data-qobj="${esc(o.id)}">Quitar</button></div>`;
    };
    const cumplidos = G.objetivos.filter(o => o.hecho).length;
    const pend = G.tareas.filter(t => !t.hecha), hechas = G.tareas.filter(t => t.hecha);

    cont.innerHTML = `
      <div class="fin-mes"><button class="btn btn-ghost" type="button" id="g-prev" aria-label="Mes anterior">‹</button><b>${esc(nombreMes(G.mes))}</b><button class="btn btn-ghost" type="button" id="g-next" aria-label="Mes siguiente">›</button></div>
      <p class="sec-title">Objetivos del mes ${G.objetivos.length ? `<span class="mute" style="letter-spacing:0">· ${cumplidos} de ${G.objetivos.length} cumplidos</span>` : ''}</p>
      <div class="card objs">${G.objetivos.length ? G.objetivos.map(filaObjetivo).join('') : `<p class="mute">Sin objetivos para ${esc(nombreMes(G.mes).toLowerCase())}.${G.meses.length ? ' Puedes copiar los del mes anterior.' : ''}</p>`}</div>
      <form class="card fin-form obj-form" id="g-oform">
        <label>Objetivo<select id="g-otipo">${opciones(TIPOS, 'llamadas')}</select></label>
        <label id="g-ometa-l">Cifra<input type="number" inputmode="decimal" min="0" step="1" id="g-ometa" placeholder="3"></label>
        <label id="g-otexto-l" hidden class="ancho">Qué quieres conseguir<input type="text" id="g-otexto" maxlength="200" placeholder="Pasarela de pago"></label>
        <button class="btn btn-primary" type="submit">Añadir objetivo</button>
        ${!G.objetivos.length ? `<button class="btn btn-ghost" type="button" id="g-copiar" ${G.meses.some(m => m < G.mes) ? '' : 'hidden'}>Copiar los del mes anterior</button>` : ''}
        <p class="mute ancho">Llamadas, clientes, ingresos, bienvenidas e inbounds los cuenta la app sola con Ventas, Pacientes y Finanzas. Lo demás lo marcas tú.</p>
      </form>
      <p class="sec-title">Tareas <span class="mute" style="letter-spacing:0">· ${pend.length} pendiente${pend.length === 1 ? '' : 's'} · también salen en «Para hoy»</span></p>
      <div class="card" id="g-tareas">
        <form class="mt-form" id="g-tform"><label class="sr" for="g-tform-t">Tarea</label><input type="text" id="g-tform-t" placeholder="Nueva tarea…" maxlength="300" autocomplete="off">
          <label class="sr" for="g-tform-f">Para cuándo (opcional)</label><input type="date" id="g-tform-f" aria-label="Para cuándo (opcional)"><button class="btn btn-primary" type="submit">Añadir</button></form>
        <div class="mt-lista">${pend.length ? pend.map(t => filaTarea(t, true)).join('') : '<p class="mute">Nada pendiente.</p>'}</div>
        ${hechas.length ? `<details class="mt-hechas"><summary>Hechas (${hechas.length})</summary><div class="mt-lista">${hechas.slice(0, 50).map(t => filaTarea(t, true)).join('')}</div></details>` : ''}
      </div>`;

    const otra = mes => { ctx.mes = mes; pintarGestion(cont, api, ctx); };
    $('#g-prev', cont).addEventListener('click', () => otra(sumarMes(G.mes, -1)));
    $('#g-next', cont).addEventListener('click', () => otra(sumarMes(G.mes, 1)));
    const tipoSel = $('#g-otipo', cont);
    const ajustar = () => {
      const manual = tipoSel.value === 'manual';
      $('#g-ometa-l', cont).hidden = manual; $('#g-otexto-l', cont).hidden = !manual;
      $('#g-ometa', cont).placeholder = tipoSel.value === 'ingresos' ? '1500' : tipoSel.value === 'bienvenidas' ? '100' : '3';
      $('#g-ometa-l', cont).firstChild.textContent = tipoSel.value === 'ingresos' ? 'Cifra (€)' : 'Cifra';
    };
    tipoSel.addEventListener('change', ajustar); ajustar();
    $('#g-oform', cont).addEventListener('submit', async e => {
      e.preventDefault();
      const tipo = tipoSel.value, objetivo = { mes: G.mes, tipo, meta: $('#g-ometa', cont).value, texto: tipo === 'manual' ? $('#g-otexto', cont).value.trim() : '' };
      try { await api('guardarObjetivo', { objetivo }); toast('Objetivo añadido'); ctx.alCambiar?.(); pintarGestion(cont, api, ctx); } catch (x) { toast(x.message); }
    });
    $('#g-copiar', cont)?.addEventListener('click', async () => {
      const anterior = G.meses.filter(m => m < G.mes).pop();
      try {
        const prev = await api('gestion', { mes: anterior });
        for (const o of prev.objetivos) await api('guardarObjetivo', { objetivo: { mes: G.mes, tipo: o.tipo, meta: o.meta, texto: o.tipo === 'manual' ? o.texto : '' } });
        toast(`Copiados ${prev.objetivos.length} objetivos de ${nombreMes(anterior).toLowerCase()}`); ctx.alCambiar?.(); pintarGestion(cont, api, ctx);
      } catch (x) { toast(x.message); }
    });
    $$('[data-obj]', cont).forEach(b => b.addEventListener('click', async () => {
      const o = G.objetivos.find(x => x.id === b.dataset.obj); b.disabled = true;
      try { await api('guardarObjetivo', { objetivo: Object.assign({}, o, { hecho: !o.hecho }) }); ctx.alCambiar?.(); pintarGestion(cont, api, ctx); } catch (x) { toast(x.message); b.disabled = false; }
    }));
    $$('[data-qobj]', cont).forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try { await api('borrarObjetivo', { id: b.dataset.qobj }); ctx.alCambiar?.(); pintarGestion(cont, api, ctx); } catch (x) { toast(x.message); b.disabled = false; }
    }));
    engancharTareas($('#g-tareas', cont), api, () => G.tareas, nuevas => { ctx.alCambiarTareas(nuevas.filter(t => !t.hecha)); pintarGestion(cont, api, ctx); }, 'g-tform');
  }

  /* ================= Ventas: Setter + Closer ================= */
  async function pintarVentas(cont, api, ctx) {
    cont.innerHTML = '<p class="mute">Cargando ventas…</p>';
    let V;
    try { V = await api('ventas'); } catch (x) { cont.innerHTML = `<p class="vacio">${esc(x.message)}</p>`; return; }
    ctx.mes = ctx.mes || hoyISO().slice(0, 7); ctx.parte = ctx.parte || 'setter';
    let editando = null;   // llamada abierta en el formulario (objeto) o null

    function pintar() {
      const mes = ctx.mes;
      const dias = V.setter.filter(d => mesDe(d.fecha) === mes);
      const llam = V.llamadas.filter(l => mesDe(l.fecha) === mes);
      const s = k => dias.reduce((t, d) => t + (d[k] || 0), 0);
      const bienv = s('bienvenidas'), cont_ = s('contestadas'), inb = s('inboundsInstagram') + s('inboundsWhatsapp');
      const compro = llam.filter(l => l.resultado === 'compro').length, decididas = llam.filter(l => l.resultado !== 'espera').length;
      const espera = V.llamadas.filter(l => l.resultado === 'espera');
      cont.innerHTML = `
        <div class="fin-mes"><button class="btn btn-ghost" type="button" id="v-prev" aria-label="Mes anterior">‹</button><b>${esc(nombreMes(mes))}</b><button class="btn btn-ghost" type="button" id="v-next" aria-label="Mes siguiente">›</button></div>
        <div class="kpis kpis-auto embudo">
          <div class="kpi"><span>Bienvenidas</span><b>${bienv}</b><em class="mute">${pct(cont_, bienv)} contestadas</em></div>
          <div class="kpi"><span>Inbounds</span><b>${inb}</b><em class="mute">IG ${s('inboundsInstagram')} · WA ${s('inboundsWhatsapp')}</em></div>
          <div class="kpi"><span>Follow ups</span><b>${s('followUps')}</b><em class="mute">${dias.length} día${dias.length === 1 ? '' : 's'} apuntado${dias.length === 1 ? '' : 's'}</em></div>
          <div class="kpi"><span>Llamadas</span><b>${llam.length}</b><em class="mute">${espera.length} en espera</em></div>
          <div class="kpi"><span>Ventas</span><b class="${compro ? 'lvl-ok' : ''}">${compro}</b><em class="mute">${pct(compro, decididas)} de cierre</em></div>
        </div>
        <div class="chipline" role="tablist" aria-label="Parte de ventas">
          <button class="chip" type="button" role="tab" data-parte="setter" aria-selected="${ctx.parte === 'setter'}" aria-pressed="${ctx.parte === 'setter'}">Setter · mensajes</button>
          <button class="chip" type="button" role="tab" data-parte="closer" aria-selected="${ctx.parte === 'closer'}" aria-pressed="${ctx.parte === 'closer'}">Closer · llamadas</button>
        </div>
        <div id="v-parte" style="display:grid;gap:16px"></div>`;
      $('#v-prev', cont).addEventListener('click', () => { ctx.mes = sumarMes(mes, -1); editando = null; pintar(); });
      $('#v-next', cont).addEventListener('click', () => { ctx.mes = sumarMes(mes, 1); editando = null; pintar(); });
      $$('[data-parte]', cont).forEach(b => b.addEventListener('click', () => { ctx.parte = b.dataset.parte; pintar(); }));
      ctx.parte === 'setter' ? pintarSetter($('#v-parte', cont), dias) : pintarCloser($('#v-parte', cont), llam, espera);
    }

    /* ---------- Setter ---------- */
    function pintarSetter(box, dias) {
      const CAMPOS = [['bienvenidas', 'Bienvenidas dadas'], ['contestadas', 'Bienvenidas contestadas'], ['inboundsInstagram', 'Inbounds Instagram'], ['inboundsWhatsapp', 'Inbounds WhatsApp'], ['followUps', 'Follow ups']];
      const porDefecto = ctx.fechaSetter || (mesDe(hoyISO()) === ctx.mes ? hoyISO() : (dias[dias.length - 1]?.fecha || ctx.mes + '-01'));
      ctx.fechaSetter = null;
      box.innerHTML = `
        <form class="card fin-form setter-form" id="s-form">
          <label>Día<input type="date" id="s-fecha" value="${porDefecto}"></label>
          ${CAMPOS.map(([k, t]) => `<label>${t}<input type="number" inputmode="numeric" min="0" step="1" data-k="${k}" placeholder="0"></label>`).join('')}
          <label class="ancho">Notas del día<input type="text" id="s-notas" maxlength="500" placeholder="Opcional"></label>
          <div class="fin-form-acts ancho"><span class="mute" id="s-estado"></span><button class="btn btn-primary" type="submit">Guardar día</button></div>
        </form>
        <div class="card tbl-wrap">${dias.length ? `<table class="tbl setter-tbl"><thead><tr><th>Día</th><th>Bienv.</th><th>Contest.</th><th>%</th><th>Inb. IG</th><th>Inb. WA</th><th>Follow ups</th></tr></thead><tbody>
          ${dias.slice().reverse().map(d => `<tr data-f="${d.fecha}" tabindex="0" title="Pulsa para corregir este día"><td>${fechaCorta(d.fecha)}</td><td>${d.bienvenidas}</td><td>${d.contestadas}</td><td class="mute">${pct(d.contestadas, d.bienvenidas)}</td><td>${d.inboundsInstagram}</td><td>${d.inboundsWhatsapp}</td><td>${d.followUps}</td></tr>`).join('')}
          </tbody></table>` : `<p class="mute">Aún no has apuntado ningún día de ${esc(nombreMes(ctx.mes).toLowerCase())}.</p>`}</div>`;
      const cargar = f => {
        const d = V.setter.find(x => x.fecha === f);
        $$('#s-form [data-k]', box).forEach(i => i.value = d ? d[i.dataset.k] : '');
        $('#s-notas', box).value = d ? d.notas : '';
        $('#s-estado', box).textContent = d ? 'Este día ya está apuntado: al guardar lo corriges.' : '';
      };
      $('#s-fecha', box).addEventListener('change', e => cargar(e.target.value));
      $$('tr[data-f]', box).forEach(tr => { const ir = () => { $('#s-fecha', box).value = tr.dataset.f; cargar(tr.dataset.f); $('#s-form [data-k]', box).focus(); }; tr.addEventListener('click', ir); tr.addEventListener('keydown', e => { if (e.key === 'Enter') ir(); }); });
      $('#s-form', box).addEventListener('submit', async e => {
        e.preventDefault();
        const dia = { fecha: $('#s-fecha', box).value, notas: $('#s-notas', box).value.trim() };
        $$('#s-form [data-k]', box).forEach(i => dia[i.dataset.k] = i.value);
        const btn = e.submitter || $('#s-form button', box); btn.disabled = true;
        try { V = await api('guardarSetter', { dia }); ctx.mes = mesDe(dia.fecha); toast('Día guardado'); ctx.alCambiar?.(); pintar(); } catch (x) { toast(x.message); btn.disabled = false; }
      });
      cargar($('#s-fecha', box).value);
    }

    /* ---------- Closer ---------- */
    function pintarCloser(box, llam, espera) {
      const otrasEspera = espera.filter(l => mesDe(l.fecha) !== ctx.mes);
      const fila = l => `<div class="ll" data-id="${esc(l.id)}">
          <div class="ll-top"><b>${esc(l.nombre)}</b><span class="pill ${l.resultado === 'compro' ? 'ok' : l.resultado === 'no' ? 'no' : 'warnp'}">${RESULTADO[l.resultado]}</span></div>
          <p class="mute">${[fechaCorta(l.fecha), l.lesion, CANALES[l.canal], ORIGEN[l.origen], l.encaja === 'si' ? 'encaja con tu cliente ideal' : l.encaja === 'no' ? 'no encaja' : ''].filter(Boolean).map(esc).join(' · ')}</p>
          ${l.objeciones ? `<p class="ll-obj">«${esc(l.objeciones)}»</p>` : ''}
          ${l.resultado === 'espera' && l.volverEl ? `<p class="ll-volver ${cuando(l.volverEl).cls}">Volver a contactar: ${esc(cuando(l.volverEl).txt)}</p>` : ''}
          <div class="acts">
            <button class="act" type="button" data-editar="${esc(l.id)}">Editar</button>
            ${l.telefono ? `<a class="act" href="https://wa.me/${esc(l.telefono.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
            ${l.resultado === 'compro' && !l.pacienteId ? `<button class="act on" type="button" data-crear="${esc(l.id)}">Crear paciente</button>` : ''}
            ${l.pacienteId ? `<button class="act" type="button" data-ficha="${esc(l.pacienteId)}">Ver su ficha</button>` : ''}
          </div></div>`;
      box.innerHTML = `
        <div class="rx-top"><p class="sec-title">Llamadas de ${esc(nombreMes(ctx.mes).toLowerCase())}</p><button class="btn btn-primary" type="button" id="c-nueva">+ Nueva llamada</button></div>
        <div id="c-form-box"></div>
        <div class="card ll-lista">${llam.length ? llam.map(fila).join('') : '<p class="mute">Ninguna llamada este mes.</p>'}</div>
        ${otrasEspera.length ? `<p class="sec-title">En espera de otros meses</p><div class="card ll-lista">${otrasEspera.map(fila).join('')}</div>` : ''}`;
      $('#c-nueva', box).addEventListener('click', () => { editando = { fecha: mesDe(hoyISO()) === ctx.mes ? hoyISO() : ctx.mes + '-01', resultado: 'espera' }; formulario(box); });
      $$('[data-editar]', box).forEach(b => b.addEventListener('click', () => { editando = Object.assign({}, V.llamadas.find(l => l.id === b.dataset.editar)); formulario(box); }));
      $$('[data-crear]', box).forEach(b => b.addEventListener('click', () => ctx.crearPaciente(V.llamadas.find(l => l.id === b.dataset.crear))));
      $$('[data-ficha]', box).forEach(b => b.addEventListener('click', () => ctx.abrirPaciente(b.dataset.ficha)));
      if (editando) formulario(box);
    }

    function formulario(box) {
      const l = editando, f = $('#c-form-box', box);
      f.innerHTML = `<form class="card fin-form" id="c-form">
        <p class="sec-title ancho">${l.id ? 'Editar llamada' : 'Nueva llamada'}</p>
        <label>Nombre y apellido<input type="text" id="c-nombre" maxlength="120" value="${esc(l.nombre || '')}" autocomplete="off"></label>
        <label>Teléfono<input type="tel" id="c-tel" inputmode="tel" maxlength="30" value="${esc(l.telefono || '')}" placeholder="34 600 000 000"></label>
        <label>Fecha de la llamada<input type="date" id="c-fecha" value="${esc(l.fecha || hoyISO())}"></label>
        <label>Canal<select id="c-canal">${opciones(CANALES, l.canal, '—')}</select></label>
        <label>Origen<select id="c-origen">${opciones(ORIGEN, l.origen, '—')}</select></label>
        <label>Lesión<input type="text" id="c-lesion" list="c-lesiones" maxlength="80" value="${esc(l.lesion || '')}" placeholder="Tendinopatía rotuliana"></label>
        <datalist id="c-lesiones">${LESIONES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
        <label>¿Encaja con tu cliente ideal?<select id="c-encaja">${opciones({ si: 'Sí', no: 'No' }, l.encaja, '—')}</select></label>
        <div class="ancho c-res"><span>Resultado</span><div class="chipline" role="group" aria-label="Resultado">${Object.entries(RESULTADO).map(([k, v]) => `<button class="chip" type="button" data-res="${k}" aria-pressed="${l.resultado === k}">${v}</button>`).join('')}</div></div>
        <label id="c-volver-l" ${l.resultado === 'espera' ? '' : 'hidden'}>Volver a contactar el<input type="date" id="c-volver" value="${esc(l.id ? l.volverEl || '' : masDias(3))}"></label>
        <p class="mute" id="c-volver-ayuda" ${l.resultado === 'espera' ? '' : 'hidden'}>Te aparecerá como tarea en «Para hoy». Déjalo vacío si no quieres recordatorio.</p>
        <label class="ancho">Objeciones / miedos<textarea id="c-obj" rows="2" maxlength="1500" placeholder="¿Qué le frenaba?">${esc(l.objeciones || '')}</textarea></label>
        <label class="ancho">Notas<textarea id="c-notas" rows="2" maxlength="1500">${esc(l.notas || '')}</textarea></label>
        <div class="fin-form-acts ancho">${l.id ? '<button class="btn btn-ghost" type="button" id="c-borrar">Borrar</button>' : ''}<button class="btn btn-ghost" type="button" id="c-cancelar">Cancelar</button><button class="btn btn-primary" type="submit">Guardar llamada</button></div>
      </form>`;
      $$('[data-res]', f).forEach(b => b.addEventListener('click', () => {
        l.resultado = b.dataset.res; $$('[data-res]', f).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        $('#c-volver-l', f).hidden = $('#c-volver-ayuda', f).hidden = l.resultado !== 'espera';
        if (l.resultado === 'espera' && !$('#c-volver', f).value) $('#c-volver', f).value = masDias(3);
      }));
      $('#c-cancelar', f).addEventListener('click', () => { editando = null; f.innerHTML = ''; });
      $('#c-borrar', f)?.addEventListener('click', async () => {
        if (!confirm(`¿Borrar la llamada de ${l.nombre}?`)) return;
        try { V = await api('borrarLlamada', { id: l.id }); editando = null; toast('Llamada borrada'); ctx.alCambiar?.(); pintar(); } catch (x) { toast(x.message); }
      });
      $('#c-form', f).addEventListener('submit', async e => {
        e.preventDefault();
        const llamada = { id: l.id, nombre: $('#c-nombre', f).value.trim(), telefono: $('#c-tel', f).value, fecha: $('#c-fecha', f).value, canal: $('#c-canal', f).value, origen: $('#c-origen', f).value,
          lesion: $('#c-lesion', f).value.trim(), encaja: $('#c-encaja', f).value, resultado: l.resultado, objeciones: $('#c-obj', f).value.trim(), notas: $('#c-notas', f).value.trim(), volverEl: l.resultado === 'espera' ? $('#c-volver', f).value : '' };
        if (!llamada.nombre) { $('#c-nombre', f).focus(); toast('Escribe el nombre'); return; }
        const btn = e.submitter || f.querySelector('[type="submit"]'); btn.disabled = true;
        try {
          const r = await api('guardarLlamada', { llamada }); V = r; editando = null; ctx.mes = mesDe(llamada.fecha); ctx.parte = 'closer';
          const guardada = r.llamadas.find(x => x.id === r.id);
          toast(guardada.resultado === 'compro' && !guardada.pacienteId ? '¡Venta! Ya puedes crear su ficha de paciente' : guardada.volverEl ? 'Llamada guardada · tienes la tarea de volver a contactar' : 'Llamada guardada'); ctx.alCambiar?.(); pintar();
        } catch (x) { toast(x.message); btn.disabled = false; }
      });
      $('#c-nombre', f).focus();
    }

    ctx.refrescar = async () => { try { V = await api('ventas'); pintar(); } catch { } };
    pintar();
  }

  window.RCDGestion = { pintarMisTareas, pintarGestion, pintarVentas, CANALES };
})();
