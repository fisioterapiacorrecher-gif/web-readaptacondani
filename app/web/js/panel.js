/* RCD · panel de Dani conectado al motor (acciones: bandeja, pacientes, ficha, crearPaciente, editarPaciente,
   publicarSemana, guardarAlta, darAlta, guardarBiblioteca, config, guardarConfig). */
(() => {
  const { $, $$, esc, fmt, crearApi, pantallaAcceso, toast, lineas, vacio, nivel, media } = window.RCDUI;
  const D = window.RCD;
  const api = crearApi('rcd_panel');
  const shell = $('#shell');
  const escritorio = () => window.matchMedia('(min-width: 960px)').matches;
  let pacientes = [], tareas = [], CFG = { config: {}, biblioteca: [] }, F = null, actualId = null;

  /* ================= Acceso ================= */
  api.onSesion = () => mostrarAcceso();
  function mostrarAcceso() {
    shell.hidden = true; $('#cargando').hidden = true; $('#acceso').hidden = false;
    pantallaAcceso($('#acceso'), api, {
      titulo: 'Panel de Dani', subtitulo: 'Entra con info@rcdclinic.com. Te llegará un código a ese correo.', rolEsperado: 'admin',
      alEntrar: () => { $('#acceso').hidden = true; arrancar(); },
    });
  }
  async function arrancar() {
    $('#cargando').hidden = false;
    try {
      [CFG] = await Promise.all([api('config'), recargarLateral()]);
      $('#cargando').hidden = true; shell.hidden = false;
      if (escritorio() && pacientes.length) abrir(pacientes[0].id);
      pintarPlantillas('rotuliana'); pintarBiblioteca(); pintarAjustes();
    } catch (e) {
      if (e.codigo === 'sesion' || e.codigo === 'permiso') return mostrarAcceso();
      $('#cargando').textContent = e.message;
    }
  }
  $('#salir').addEventListener('click', async () => { try { await api('salir'); } catch { } api.setToken(null); mostrarAcceso(); });

  /* ================= Lateral: bandeja y pacientes ================= */
  const KIND = { revision: 'review', dolor: 'pain', silencio: 'silent', mensual: 'call', nuevo: 'new' };
  async function recargarLateral() {
    const [b, p] = await Promise.all([api('bandeja'), api('pacientes')]);
    tareas = b.tareas; pacientes = p.pacientes;
    pintarLateral();
  }
  function sparkline(v) {
    const w = 56, h = 18, x = i => v.length === 1 ? w / 2 : i * w / (v.length - 1), y = n => h - 2 - n / 10 * (h - 4);
    return `<svg width="${w}" height="${h}" aria-hidden="true"><polyline points="${v.map((n, i) => x(i) + ',' + y(n)).join(' ')}" fill="none" stroke="#FF3434" stroke-width="1.5" stroke-linejoin="round"/><circle cx="${x(v.length - 1)}" cy="${y(v[v.length - 1])}" r="2.5" fill="#FFFBE8"/></svg>`;
  }
  const hace = iso => { if (!iso) return 'sin registros'; const d = Math.floor((Date.now() - new Date(iso)) / 86400000); return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`; };
  function pintarLateral() {
    $('#task-count').textContent = tareas.length;
    $('#inbox').innerHTML = tareas.length ? tareas.map((t, i) => `<button class="task" type="button" data-kind="${KIND[t.tipo] || 'review'}" data-i="${i}"><i></i><span><b>${esc(t.titulo)}</b><span>${esc(t.detalle)}</span></span></button>`).join('')
      : '<p class="mute">Nada pendiente. 👌</p>';
    $$('#inbox .task').forEach(b => b.addEventListener('click', () => abrir(tareas[b.dataset.i].pacienteId)));
    $('#patients').innerHTML = pacientes.length ? pacientes.map(p => {
      const d = p.dolor || [], u = d[d.length - 1];
      return `<button class="pt" type="button" data-id="${p.id}" aria-current="${p.id === actualId}">
        <span class="av">${esc((p.nombre || '·')[0].toUpperCase())}</span>
        <span style="min-width:0"><b>${esc(p.nombre)}</b><span>${p.estado === 'activo' ? `Semana ${p.semana} · ${hace(p.ultimaActividad)}` : esc(estadoTxt(p.estado))}</span></span>
        <span class="spark-wrap">${d.length ? sparkline(d) + `<em class="lvl-${nivel(u)}">${fmt(u)}</em>` : '<em class="mute">—</em>'}</span></button>`;
    }).join('') : '<p class="mute">Aún no hay pacientes. Pulsa «+ Nuevo paciente».</p>';
    $$('#patients .pt').forEach(b => b.addEventListener('click', () => abrir(b.dataset.id)));
  }
  const estadoTxt = e => ({ pendiente: 'Pendiente de su primer acceso', activo: 'Activo', pausado: 'En pausa', alta: 'De alta', archivado: 'Archivado' }[e] || e);

  /* ================= Menú y vistas ================= */
  const vistas = ['v-patient', 'v-plantillas', 'v-biblioteca', 'v-ajustes'];
  function verVista(id) {
    vistas.forEach(v => $('#' + v).hidden = v !== id);
    $$('.sidenav button').forEach(b => b.setAttribute('aria-current', String(b.dataset.v === id)));
    shell.dataset.screen = 'detail'; $('#main').scrollTop = 0; window.scrollTo({ top: 0 });
  }
  $$('.sidenav button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.v === 'v-patient') { verVista('v-patient'); if (!escritorio()) shell.dataset.screen = 'list'; return; }
    verVista(b.dataset.v);
  }));
  $$('[data-back]').forEach(b => b.addEventListener('click', () => { shell.dataset.screen = 'list'; }));
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.setAttribute('aria-selected', String(x === t)));
    $$('.pane').forEach(p => p.hidden = p.id !== 'pane-' + t.dataset.pane);
  }));

  /* ================= Ficha ================= */
  async function abrir(id) {
    actualId = id; verVista('v-patient'); pintarLateral();
    $('#sin-paciente').hidden = true; $('#ficha').hidden = false;
    $('#p-name').textContent = 'Cargando…'; $('#p-sub').textContent = '';
    if (id !== F?.paciente?.id) $('.tab[data-pane="review"]').click(); // otro paciente: vuelve a «Revisión semanal»
    try { F = await api('ficha', { pacienteId: id }); } catch (e) { toast(e.message); return; }
    pintarFicha();
  }
  const plantillaDe = p => D.plantillas.find(t => t.id === p.plantilla);
  function pintarFicha() {
    const p = F.paciente, t = plantillaDe(p);
    $('#p-av').textContent = (p.nombre || '·')[0].toUpperCase(); $('#p-name').textContent = p.nombre;
    $('#p-sub').textContent = [t?.nombre || p.plantilla, p.estado === 'activo' ? `Semana ${F.semana} de ${p.semanas}` : estadoTxt(p.estado), p.plan].filter(Boolean).join(' · ');
    const tel = String(p.telefono || '').replace(/\D/g, '');
    $('#p-wa').hidden = !tel; $('#p-wa').href = `https://wa.me/${tel}`;
    pintarRevision(); pintarRegistros(); pintarAlta(); pintarDatos();
  }

  /* ---------- Revisión semanal ---------- */
  const deSemana = (lista, s) => lista.filter(x => x.semana === s);
  function pintarRevision() {
    const s = F.semana, P = F.progreso;
    const presc = deSemana(F.prescripcion, s);
    const dm = P.dolor.find(d => d.semana === s), dmPrev = P.dolor.find(d => d.semana === s - 1);
    const adh = P.adherencia.find(a => a.semana === s)?.valor;
    const ses = deSemana(F.sesiones, s), maxSes = ses.length ? Math.max(...ses.map(x => Number(x.dolorDespues) || 0)) : null;
    const km = P.cardio.find(c => c.semana === s)?.distancia;
    $('#kpis').innerHTML = [
      [`Dolor medio S${s}`, dm ? fmt(dm.media) : '—', dm && dmPrev ? `${dm.media <= dmPrev.media ? '−' : '+'}${fmt(Math.abs(Math.round((dm.media - dmPrev.media) * 10) / 10))} vs S${s - 1}` : 'de su diario', dm && dm.media > 4],
      ['Adherencia', adh != null && adh !== '' ? adh + '%' : '—', `${ses.length} sesiones`, adh != null && adh !== '' && adh < 60],
      ['Dolor máx. tras sesión', maxSes ?? '—', maxSes > 4 ? 'por encima de 4' : 'esta semana', maxSes > 4],
      ['Km corriendo', km ? fmt(km) : '—', 'esta semana', false],
    ].map(([l, v, d, malo]) => `<div class="kpi"><span>${l}</span><b class="${malo ? 'lvl-high' : ''}">${v}</b><em class="${malo ? 'lvl-high' : 'lvl-ok'}">${esc(d)}</em></div>`).join('');

    // Encuesta de esta semana comparada con la anterior
    const e = F.encuestas.find(x => x.semana === s), ep = F.encuestas.find(x => x.semana === s - 1);
    const peores = [];
    $('#survey-title').textContent = `Encuesta de la semana ${s}${ep ? ` · comparada con la ${s - 1}` : ''}`;
    if (e) {
      $('#survey-box').innerHTML = `<table><thead><tr><th>Pregunta</th>${ep ? `<th class="n">S${s - 1}</th>` : ''}<th class="n">S${s}</th></tr></thead><tbody>${D.encuesta.filter(q => q.id).map(q => {
        const a = ep?.respuestas[q.id], b = e.respuestas[q.id];
        let d = '', flag = false;
        if (typeof a === 'number' && typeof b === 'number' && a !== b && q.bien && !q.num) {
          const mejor = q.bien === 'alto' ? b > a : b < a; flag = !mejor && Math.abs(b - a) >= 2; if (flag) peores.push(q.q.toLowerCase());
          d = `<span class="delta ${mejor ? 'lvl-ok' : 'lvl-high'}">${b > a ? '▲' : '▼'}${Math.abs(b - a)}</span>`;
        }
        const f = v => v === undefined || v === '' ? '—' : (q.id === 'pasos' ? Number(v).toLocaleString('es-ES') : fmt(v));
        return `<tr class="${flag ? 'flag' : ''}"><td>${esc(q.q.replace(' (media diaria de pasos)', '').replace(' (media diaria)', ''))}</td>${ep ? `<td class="n mute">${f(a)}</td>` : ''}<td class="n">${f(b)}${d}</td></tr>`;
      }).join('')}</tbody></table>`;
    } else $('#survey-box').innerHTML = `<p class="mute">Todavía no ha enviado la encuesta de la semana ${s}.</p>`;

    // Aviso con tu regla
    const rule = $('#rule');
    if (dm) {
      const ok = dm.media <= 4, extra = [];
      if (maxSes > 4) extra.push(`tras una sesión llegó a ${maxSes}`);
      if (peores.length) extra.push(`ha empeorado: ${peores.slice(0, 2).join(', ')}`);
      rule.hidden = false; rule.className = 'rule' + (ok ? '' : ' stop');
      rule.innerHTML = `<svg><use href="#${ok ? 'i-check' : 'i-alert'}"></use></svg><p><b>Dolor general ${fmt(dm.media)}: ${ok ? 'por debajo de tu límite de 4. Puedes progresar.' : 'por encima de tu límite de 4.'}</b>${extra.length ? ' Ojo: ' + extra.join('; ') + '.' : ''}</p>`;
    } else rule.hidden = true;

    const ult = F.dolor.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-14);
    if (ult.length) lineas($('#chart-daily'), ult.map(d => d.dolor), { max: 10, limite: 4, ticks: [0, 5, 10], etiquetas: ult.map((d, i) => i === 0 || i === ult.length - 1 ? d.fecha.slice(8) + '/' + d.fecha.slice(5, 7) : '') });
    else vacio($('#chart-daily'), 'Sin registros de dolor todavía');

    prepararPlan();
  }

  /* ---------- Preparar la semana siguiente ---------- */
  let plan = [], destino = 1;
  const base = r => ({ series: r.series, valor: r.valor, unidad: r.unidad, kg: r.kg, tempo: r.tempo, descanso: r.descanso });
  const videoDe = nombre => (CFG.biblioteca.find(b => b.nombre === nombre) || {}).video || '';
  function prepararPlan() {
    const actual = deSemana(F.prescripcion, F.semana);
    destino = actual.length ? F.semana + 1 : F.semana;
    const t = plantillaDe(F.paciente);
    $('#prep-title').textContent = actual.length ? `Preparar semana ${destino} · desde la ${F.semana}` : `Preparar la semana ${destino}`;
    $('#from-tpl').hidden = !t; $('#from-tpl').textContent = `Usar ejercicios de la semana ${destino} de «${t?.corto ?? ''}»`;
    plan = actual.map(r => {
      const ej = F.ejercicios.filter(x => x.prescripcionId === r.id), se = F.series.filter(x => x.prescripcionId === r.id);
      const dol = ej.filter(x => x.dolor !== '' && x.dolor != null).map(x => Number(x.dolor));
      return { id: r.id, dia: r.dia, tipo: r.tipo, ejercicio: r.ejercicio, indicacion: r.indicacion, video: r.video || videoDe(r.ejercicio),
        base: base(r), vals: null, auto: null, accion: null,
        stats: r.tipo === 'cardio' ? `${ej.length ? 'hecho' : 'sin registrar'}${ej[0]?.distancia ? ' · ' + fmt(ej[0].distancia) + ' km' : ''}` : `${se.filter(x => x.hecha).length}/${(Number(r.series) || 0) * Math.max(1, new Set(ej.map(x => x.fecha)).size)} series`,
        dolor: dol.length ? Math.max(...dol) : null };
    });
    if (!plan.length && t) usarPlantilla(true);
    $('#note').value = mensajeSugerido();
    pintarPlan();
  }
  function semanaPlantilla(t, n) {
    for (let k = Math.min(n, t.plan.length); k >= 1; k--) { const w = t.plan.find(x => x.n === k); if (w && w.dias) return w; }
    return null;
  }
  function usarPlantilla(silencio) {
    const t = plantillaDe(F.paciente); if (!t) return;
    const w = semanaPlantilla(t, destino); if (!w) return;
    const previos = Object.fromEntries(plan.map(r => [r.ejercicio, r]));
    plan = [];
    w.dias.forEach((dia, i) => dia.forEach(nombre => {
      const p = previos[nombre];
      plan.push(p ? { ...p, dia: i + 1 } : { id: null, dia: i + 1, tipo: 'fuerza', ejercicio: nombre, indicacion: '', video: videoDe(nombre), base: null,
        vals: { series: '', valor: '', unidad: 'reps', kg: '', tempo: '', descanso: '' }, auto: null, accion: 'nuevo', stats: 'nuevo', dolor: null });
    }));
    if (w.cardio) plan.push({ id: null, dia: w.dias.length, tipo: 'cardio', ejercicio: 'Cardio', indicacion: w.cardio, video: '', base: null, vals: {}, auto: null, accion: 'nuevo', stats: 'nuevo', dolor: null });
    if (!silencio) toast(`Cargados los ejercicios de la semana ${w.n} de la plantilla${w.n !== destino ? ' (la ' + destino + ' es de progresión)' : ''}`);
    pintarPlan();
  }
  $('#from-tpl').addEventListener('click', () => usarPlantilla(false));

  function proponer(r, a) {
    const v = { ...r.base };
    const s = r.unidad === 's' || v.unidad === 's';
    if (a === 'reps') v.valor = String((parseFloat(v.valor) || 0) + (s ? 15 : 2));
    if (a === 'tut') v.tempo = !v.tempo || v.tempo === '—' ? '4-2-4' : v.tempo.split('-').map(n => (+n || 0) + 1).join('-');
    if (a === 'kg') v.kg = (Number(v.kg) || 0) + (s ? 5 : 2.5);
    if (a === 'down') { v.kg = Math.max(0, (Number(v.kg) || 0) - 2.5); v.valor = String(Math.max(1, (parseFloat(v.valor) || 0) - (s ? 15 : 2))); }
    return v;
  }
  const dosis = v => !v ? '' : [v.series && v.valor ? `${v.series} × ${v.valor}${v.unidad === 's' ? ' s' : ' reps'}` : '', +v.kg ? `+${fmt(v.kg)} kg` : '', v.tempo || ''].filter(Boolean).join(' · ') || 'sin dosis';
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const ACC = { keep: 'Mantener', reps: '+ Reps', tut: '+ Tiempo bajo tensión', kg: '+ Peso', down: 'Bajar' };
  function lineaDosis(r) {
    if (r.tipo === 'cardio') return `<span>${esc(r.indicacion || 'Cardio')}</span>`;
    if (!r.base) return `<span class="new">${esc(dosis(r.vals))}</span>`;
    if (!r.vals || igual(r.vals, r.base)) return `<span>${esc(dosis(r.base))}</span>${r.accion ? '<span class="mute">sin cambios</span>' : ''}`;
    return `<span class="old">${esc(dosis(r.base))}</span><span>→</span><span class="new">${esc(dosis(r.vals))}</span>${r.auto && !igual(r.vals, r.auto) ? '<span class="handed">ajustado a mano</span>' : ''}`;
  }
  function pintarPlan() {
    const cont = $('#rx-list');
    if (!plan.length) { cont.innerHTML = '<p class="vacio">No hay ejercicios. Usa la plantilla o añádelos abajo.</p>'; contar(); return; }
    const orden = plan.map((r, i) => ({ r, i })).sort((a, b) => a.r.dia - b.r.dia);
    cont.innerHTML = orden.map(({ r, i }) => {
      const campos = r.tipo === 'cardio' ? '' : `<div class="edit" style="grid-template-columns:repeat(6, minmax(0, 1fr))">
          ${[['series', 'Series', 'number'], ['valor', r.vals?.unidad === 's' ? 'Segundos' : 'Reps', 'number'], ['kg', 'Kg extra', 'number'], ['tempo', 'Tempo', 'text'], ['descanso', 'Descanso', 'text']].map(([k, l, ty]) =>
            `<label>${l}<input data-i="${i}" data-k="${k}" type="${ty}" ${ty === 'number' ? 'inputmode="decimal" step="0.5" min="0"' : ''} value="${esc(r.vals?.[k] ?? '')}"></label>`).join('')}
          <label>Unidad<select data-i="${i}" data-k="unidad"><option value="reps" ${r.vals?.unidad !== 's' ? 'selected' : ''}>reps</option><option value="s" ${r.vals?.unidad === 's' ? 'selected' : ''}>seg</option></select></label>
        </div>`;
      const extra = r.vals || r.tipo === 'cardio' ? `<div class="rx-extra">
          <label>${r.tipo === 'cardio' ? 'Qué tiene que hacer' : 'Indicación (opcional)'}<input data-i="${i}" data-x="indicacion" type="text" value="${esc(r.indicacion || '')}"></label>
          <label>Vídeo (enlace de Drive)<input data-i="${i}" data-x="video" type="text" value="${esc(r.video || '')}" placeholder="https://drive.google.com/…"></label></div>` : '';
      return `<div class="rx">
        <div class="rx-top"><div><span class="tag">Día ${r.dia} · ${r.tipo === 'cardio' ? 'Cardio' : 'Fuerza'}</span><b>${esc(r.ejercicio)}</b></div>
          <span class="rx-stats">${esc(r.stats || '')}${r.dolor != null ? ` · dolor <span class="lvl-${nivel(r.dolor)} num">${r.dolor}</span>` : ''}</span></div>
        <div class="rx-dose" id="dose-${i}">${lineaDosis(r)}</div>
        <div class="acts" role="group" aria-label="Decisión para ${esc(r.ejercicio)}">
          ${r.base && r.tipo !== 'cardio' ? Object.entries(ACC).map(([k, l]) => `<button class="act" type="button" data-i="${i}" data-a="${k}" aria-pressed="${r.accion === k}">${l}</button>`).join('') : ''}
          ${r.tipo === 'cardio' && r.base !== undefined && r.id ? `<button class="act" type="button" data-i="${i}" data-a="keep" aria-pressed="${r.accion === 'keep'}">Mantener</button>` : ''}
          <button class="quitar" type="button" data-q="${i}">Quitar</button>
        </div>
        ${r.vals && r.tipo !== 'cardio' ? campos : ''}${extra}
      </div>`;
    }).join('');
    $$('#rx-list .act').forEach(b => b.addEventListener('click', () => {
      const r = plan[b.dataset.i]; r.accion = b.dataset.a;
      if (r.tipo === 'cardio') { r.vals = {}; } else { r.auto = proponer(r, r.accion); r.vals = { ...r.auto }; }
      pintarPlan();
    }));
    $$('#rx-list .quitar').forEach(b => b.addEventListener('click', () => { plan.splice(+b.dataset.q, 1); pintarPlan(); }));
    $$('#rx-list .edit input, #rx-list .edit select').forEach(inp => inp.addEventListener('input', () => {
      const r = plan[inp.dataset.i]; r.vals[inp.dataset.k] = inp.type === 'number' ? (inp.value === '' ? '' : Number(inp.value)) : inp.value;
      if (!r.accion) r.accion = 'editar';
      $('#dose-' + inp.dataset.i).innerHTML = lineaDosis(r); contar();
    }));
    $$('#rx-list .rx-extra input').forEach(inp => inp.addEventListener('input', () => { plan[inp.dataset.i][inp.dataset.x] = inp.value; }));
    contar();
  }
  function contar() {
    const pend = plan.filter(r => !r.accion).length, mano = plan.filter(r => r.auto && r.vals && !igual(r.vals, r.auto)).length;
    const v = r => r.vals || r.base || {};
    const sinDosis = plan.filter(r => r.tipo !== 'cardio' && (!Number(v(r).series) || !String(v(r).valor ?? '').trim())).length;
    $('#decisions').textContent = !plan.length ? '' : sinDosis ? `Faltan series y reps en ${sinDosis} ejercicio${sinDosis > 1 ? 's' : ''}.`
      : `${plan.length - pend} de ${plan.length} decididos${mano ? ` · ${mano} ajustado${mano > 1 ? 's' : ''} a mano` : ''} · se guarda la propuesta y tu ajuste para aprender tu criterio`;
    $('#publish').disabled = !plan.length || pend > 0 || sinDosis > 0;
    $('#publish').textContent = `Publicar semana ${destino}`;
  }
  $('#add-ex').addEventListener('click', () => {
    const nombre = $('#add-name').value.trim(); if (!nombre) return;
    const cardio = /correr|carrera|cardio|bici|trote|caminar/i.test(nombre);
    plan.push({ id: null, dia: +$('#add-day').value, tipo: cardio ? 'cardio' : 'fuerza', ejercicio: nombre, indicacion: '', video: videoDe(nombre), base: null,
      vals: cardio ? {} : { series: '', valor: '', unidad: 'reps', kg: '', tempo: '', descanso: '' }, auto: null, accion: 'nuevo', stats: 'nuevo', dolor: null });
    $('#add-name').value = ''; pintarPlan();
  });

  function mensajeSugerido() {
    const p = F.paciente, total = p.semanas, rest = total - destino + 1, dm = F.progreso.dolor.find(d => d.semana === F.semana);
    if (destino === 1) return `¡Bienvenido a RCD, ${p.nombre.split(' ')[0]}! Esta es tu primera semana. Lo importante ahora es la constancia, no la carga. Cualquier duda, escríbeme.`;
    const id = destino === total ? 'ultima' : rest <= 3 ? 'semanal-final' : destino <= 4 ? 'semanal-inicio' : 'semanal-medio';
    const m = D.mensajes.find(x => x.id === id);
    const meses = Math.floor(F.semana / 4);
    const vars = { nombre: p.nombre.split(' ')[0], semana: F.semana, semana_siguiente: destino, semanas_restantes: rest, dolor_medio: dm ? fmt(dm.media) : '—', meses: meses === 1 ? '1 mes' : meses + ' meses', cuestionario: p.cuestionario || '' };
    return m.texto.replace(/\{(\w+)\}/g, (x, k) => vars[k] ?? x);
  }

  $('#publish').addEventListener('click', async () => {
    const btn = $('#publish'); btn.disabled = true; btn.textContent = 'Publicando…';
    const dmSem = F.progreso.dolor.find(d => d.semana === F.semana)?.media ?? '';
    const ejercicios = plan.slice().sort((a, b) => a.dia - b.dia).map(r => {
      const v = r.tipo === 'cardio' ? {} : (r.vals || r.base || {});
      return { dia: r.dia, tipo: r.tipo, ejercicio: r.ejercicio, series: v.series, valor: v.valor, unidad: v.unidad, kg: v.kg, tempo: v.tempo, descanso: v.descanso, indicacion: r.indicacion, video: r.video };
    });
    const decisiones = plan.filter(r => r.id).map(r => ({ prescripcionId: r.id, ejercicio: r.ejercicio, accion: r.accion, propuesta: r.auto || r.base || {}, final: r.vals || r.base || {}, dolorMedio: dmSem }));
    try {
      await api('publicarSemana', { pacienteId: F.paciente.id, semana: destino, ejercicios, decisiones, mensaje: $('#note').value.trim(), avisar: true });
      toast(`Semana ${destino} publicada · ${F.paciente.nombre.split(' ')[0]} recibirá un email`);
      // Guarda en la biblioteca los vídeos nuevos para la próxima vez
      const nuevos = plan.filter(r => r.video && r.video !== videoDe(r.ejercicio));
      for (const r of nuevos) { try { CFG.biblioteca = (await api('guardarBiblioteca', { nombre: r.ejercicio, video: r.video })).biblioteca; } catch { } }
      await Promise.all([recargarLateral(), abrir(F.paciente.id)]);
    } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = `Publicar semana ${destino}`; }
  });

  /* ---------- Registros ---------- */
  function pintarRegistros() {
    const items = F.sesiones.map(s => ({ f: s.fecha, t: `Semana ${s.semana} · Día ${s.dia}`, s: `Antes ${s.dolorAntes === '' ? '—' : s.dolorAntes} · después ${s.dolorDespues}${s.minutos ? ` · ${s.minutos} min` : ''}`, c: s.comentario, v: s.dolorDespues }))
      .concat(F.dolor.map(d => ({ f: d.fecha, t: 'Dolor diario', s: '', c: d.nota, v: d.dolor })))
      .concat(F.encuestas.map(e => ({ f: e.fecha, t: `Encuesta semana ${e.semana}`, s: e.respuestas.cambios || '', c: '', v: null })))
      .sort((a, b) => b.f.localeCompare(a.f)).slice(0, 60);
    const dfmt = f => new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    $('#log').innerHTML = items.length ? items.map(x => `<div class="log-item"><span class="d">${dfmt(x.f)}</span><div><b>${esc(x.t)}</b>${x.s ? `<p class="mute">${esc(x.s)}</p>` : ''}${x.c ? `<p class="soft" style="font-size:14px;margin-top:4px">«${esc(x.c)}»</p>` : ''}</div>${x.v !== null && x.v !== '' ? `<span class="v lvl-${nivel(x.v)}">${x.v}</span>` : '<span></span>'}</div>`).join('')
      : '<p class="mute">Aún no hay registros.</p>';
    $('#cuest').innerHTML = F.cuestionarios.length ? F.cuestionarios.map(c => `<div class="log-item"><span class="d">${dfmt(c.fecha)}</span><div><b>${esc(c.tipo)}</b><p class="mute">Semana ${c.semana}</p></div><span class="v">${c.puntuacion}</span></div>`).join('')
      : '<p class="mute">Aún no ha hecho ningún cuestionario.</p>';
  }

  /* ---------- Alta ---------- */
  const barraFases = (t, cur) => `<div class="phases" role="img" aria-label="Fases del tratamiento">${t.fases.map(f => {
    const st = cur ? (cur > f.a ? 'done' : cur >= f.de ? 'now' : '') : '';
    return `<div class="ph ${st}" style="flex-basis:${(f.a - f.de + 1) / t.semanas * 100}%"><i></i><b>${esc(f.nombre)}</b><span>S${f.de}${f.a > f.de ? '–' + f.a : ''}</span></div>`;
  }).join('')}</div>`;
  function pintarAlta() {
    const t = plantillaDe(F.paciente), A = F.alta, todas = A.length && A.every(a => a.superada);
    $('#alta').innerHTML = `
      ${t ? `<div class="card" style="display:grid;gap:12px"><p class="sec-title">${esc(t.nombre)} · semana ${F.semana} de ${F.paciente.semanas}</p>${barraFases(t, F.semana)}</div>` : ''}
      <div class="card"><p class="mute" style="margin-bottom:10px">${esc(F.paciente.nombre.split(' ')[0])} ve esta lista en su app. Apunta el resultado y márcala cuando la supere.</p>
        <div class="alta-rows">${A.length ? A.map(a => `<div class="alta-row">
          <div><b>${esc(a.prueba)}</b><p class="mute">Criterio: ${esc(a.criterio)}</p></div>
          <label class="sr" for="ar-${a.id}">Resultado</label><input type="text" id="ar-${a.id}" placeholder="Resultado" value="${esc(a.resultado || '')}">
          <button class="act" type="button" data-id="${a.id}" aria-pressed="${a.superada}">${a.superada ? 'Superada' : 'Marcar superada'}</button></div>`).join('') : '<p class="mute">Este paciente no tiene pruebas de alta.</p>'}</div></div>
      <button class="btn btn-primary" type="button" id="give-alta" ${todas && F.paciente.estado !== 'alta' ? '' : 'disabled'}>${F.paciente.estado === 'alta' ? 'Ya está de alta' : 'Dar el alta'}</button>
      <p class="mute">${A.filter(a => a.superada).length} de ${A.length} pruebas superadas.</p>`;
    $$('#alta [data-id]').forEach(b => b.addEventListener('click', async () => {
      const a = A.find(x => x.id === b.dataset.id); const nuevo = !a.superada; b.disabled = true;
      try { await api('guardarAlta', { id: a.id, resultado: $('#ar-' + a.id).value, superada: nuevo }); a.superada = nuevo; a.resultado = $('#ar-' + a.id).value; pintarAlta(); }
      catch (e) { toast(e.message); b.disabled = false; }
    }));
    $('#give-alta').addEventListener('click', async () => {
      try { await api('darAlta', { pacienteId: F.paciente.id }); toast('Alta registrada'); await Promise.all([recargarLateral(), abrir(F.paciente.id)]); } catch (e) { toast(e.message); }
    });
  }

  /* ---------- Datos del paciente ---------- */
  function pintarDatos() {
    const p = F.paciente;
    $('#datos').innerHTML = `
      <div class="two"><label class="cfg-row">Nombre<input id="d-nombre" type="text" value="${esc(p.nombre)}"></label><label class="cfg-row">Teléfono<input id="d-tel" type="text" inputmode="tel" value="${esc(p.telefono || '')}"></label></div>
      <p class="mute">Email de acceso: <b>${esc(p.email)}</b> · Empezó el ${esc(p.fechaInicio)} · Plantilla: ${esc(plantillaDe(p)?.nombre || p.plantilla || '—')}</p>
      <div class="two"><label class="cfg-row">Plan<input id="d-plan" type="text" value="${esc(p.plan || '')}"></label><label class="cfg-row">Duración (semanas)<input id="d-sem" type="number" min="1" value="${p.semanas}"></label></div>
      <div class="two"><label class="cfg-row">Estado<select id="d-estado">${['pendiente', 'activo', 'pausado', 'alta', 'archivado'].map(e => `<option value="${e}" ${p.estado === e ? 'selected' : ''}>${estadoTxt(e)}</option>`).join('')}</select></label>
        <label class="cfg-row">Semana actual<input id="d-actual" type="number" min="1" value="${p.semanaActual}"></label></div>
      <p class="mute">«Archivado» quita el acceso al paciente y lo oculta de la lista. Sus datos se quedan en tu hoja.</p>
      <button class="btn btn-primary" type="button" id="d-save">Guardar cambios</button>`;
    $('#d-save').addEventListener('click', async () => {
      try {
        await api('editarPaciente', { pacienteId: p.id, cambios: { nombre: $('#d-nombre').value, telefono: $('#d-tel').value, plan: $('#d-plan').value, semanas: $('#d-sem').value, estado: $('#d-estado').value, semanaActual: $('#d-actual').value } });
        toast('Datos guardados'); await recargarLateral(); if ($('#d-estado').value === 'archivado') { $('#ficha').hidden = true; $('#sin-paciente').hidden = false; } else abrir(p.id);
      } catch (e) { toast(e.message); }
    });
  }

  /* ================= Plantillas ================= */
  function pintarPlantillas(id) {
    const t = D.plantillas.find(p => p.id === id);
    $('#tpl-pick').innerHTML = D.plantillas.map(p => `<button class="chip" type="button" data-id="${p.id}" aria-pressed="${p.id === id}">${esc(p.corto)}</button>`).join('');
    $$('#tpl-pick .chip').forEach(c => c.addEventListener('click', () => pintarPlantillas(c.dataset.id)));
    const C = D.cuestionarios?.[t.cuestionario];
    $('#tpl-body').innerHTML = `
      <div class="card" style="display:grid;gap:14px">
        <div class="rx-top"><div><b style="font-size:18px">${esc(t.nombre)}</b><p class="mute">${esc(t.nota)}</p></div><span class="pill ${t.origen === 'dani' ? 'ok' : 'warnp'}">${t.origen === 'dani' ? 'Tu protocolo' : 'Propuesta · revisar'}</span></div>
        ${barraFases(t)}
        <p class="mute">Revisión mensual con el cuestionario <b>${esc(t.cuestionario)}</b>${C ? ` (${C.items.length} preguntas · ${C.texto === 'traduccion' ? 'traducción provisional' : 'preguntas de la versión española validada'})` : ''}.</p>
      </div>
      <p class="sec-title">Semanas</p><div class="hc">${t.plan.map(w => `<details ${w.n === 1 ? 'open' : ''}><summary>Semana ${w.n} <span>${esc(w.fase)}${w.progresar ? ' · progresión' : ''}${w.origen === 'propuesta' && t.origen !== 'propuesta' ? ' · <em class="prop">propuesta</em>' : ''}</span></summary>
        <div class="hc-body">${w.progresar ? `<p class="soft">↻ Se copia la semana anterior y se progresa: ${esc(w.progresar)}${w.cambios ? '<br>' + esc(w.cambios) : ''}</p>`
          : `<div class="days3">${w.dias.map((d, i) => `<div><p class="dayname">Día ${i + 1}${w.titulos ? ' · ' + esc(w.titulos[i]) : ''}</p><ul>${d.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`).join('')}</div>`}
          ${w.cardio ? `<p class="mute">Cardio: ${esc(w.cardio)}</p>` : ''}</div></details>`).join('')}</div>
      <p class="sec-title">Pruebas de alta</p>
      <div class="card"><ul class="alta-list">${t.alta.map(a => `<li><b>${esc(a.prueba)}</b><span>${esc(a.criterio)}</span>${a.origen === 'propuesta' ? '<em class="prop">propuesta</em>' : ''}</li>`).join('')}</ul></div>`;
  }

  /* ================= Biblioteca ================= */
  function nombresBiblioteca() {
    const m = new Map(D.biblioteca.map(e => [e.nombre, { nombre: e.nombre, en: e.en, video: '' }]));
    CFG.biblioteca.forEach(b => { const x = m.get(b.nombre) || { nombre: b.nombre, en: [] }; x.video = b.video; m.set(b.nombre, x); });
    return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  function pintarBiblioteca(q = $('#lib-q').value) {
    const todos = nombresBiblioteca();
    $('#lib-names').innerHTML = todos.map(e => `<option value="${esc(e.nombre)}"></option>`).join('');
    const n = q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const lista = todos.filter(e => e.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(n));
    $('#lib-count').textContent = `${lista.length} de ${todos.length} ejercicios · ${todos.filter(e => e.video).length} con vídeo`;
    $('#lib').innerHTML = lista.map((e, i) => `<div class="lib-row"><b>${esc(e.nombre)}</b><span class="chipline">${(e.en || []).map(x => `<span class="pill">${esc(x)}</span>`).join('')}</span>
      ${e.video ? `<a href="${esc(e.video)}" target="_blank" rel="noopener">Ver vídeo</a>` : '<span class="mute">sin vídeo</span>'}
      <div class="lib-edit"><label class="sr" for="lv-${i}">Enlace del vídeo</label><input id="lv-${i}" type="text" placeholder="Pega el enlace de Drive" value="${esc(e.video || '')}"><button class="btn btn-ghost" type="button" data-n="${esc(e.nombre)}" data-i="${i}">Guardar</button></div></div>`).join('')
      || `<p class="mute">Ningún ejercicio contiene «${esc(q)}». Escríbelo al preparar una semana y se añadirá.</p>`;
    $$('#lib [data-n]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try { CFG.biblioteca = (await api('guardarBiblioteca', { nombre: b.dataset.n, video: $('#lv-' + b.dataset.i).value.trim() })).biblioteca; toast('Vídeo guardado'); pintarBiblioteca(); }
      catch (e) { toast(e.message); b.disabled = false; }
    }));
  }
  $('#lib-q').addEventListener('input', e => pintarBiblioteca(e.target.value));

  /* ================= Ajustes ================= */
  const CAMPOS = [
    ['RECORDATORIOS_ACTIVOS', 'Recordatorios por email', 'select'], ['RECORDATORIO_DOLOR_HORA', 'Hora del recordatorio de dolor diario (0–23)', 'number'],
    ['RECORDATORIO_ENCUESTA_HORA', 'Hora del recordatorio de la encuesta del domingo (0–23)', 'number'], ['RECORDATORIO_ENCUESTA_REPITE_HORA', 'Hora del segundo aviso el lunes, si falta (0–23)', 'number'],
    ['WHATSAPP', 'Tu WhatsApp (con prefijo, sin +)', 'text'], ['RESERVA_CALENDARIO', 'Enlace de citas de Google Calendar (cuando lo actives)', 'text'], ['APP_URL', 'Dirección de la app para pacientes', 'text'],
  ];
  function pintarAjustes() {
    const c = CFG.config || {};
    $('#cfg').innerHTML = CAMPOS.map(([k, l, t]) => `<label class="cfg-row">${l}${t === 'select'
      ? `<select data-k="${k}"><option value="si" ${c[k] !== 'no' ? 'selected' : ''}>Activados</option><option value="no" ${c[k] === 'no' ? 'selected' : ''}>Desactivados</option></select>`
      : `<input data-k="${k}" type="${t}" ${t === 'number' ? 'min="0" max="23"' : ''} value="${esc(c[k] ?? '')}">`}</label>`).join('');
    $('#msgs').innerHTML = D.mensajes.map(m => `<div class="card msg"><p class="eyebrow">${esc(m.cuando)}</p><p class="preview">${esc(m.texto)}</p></div>`).join('');
  }
  $('#cfg-save').addEventListener('click', async () => {
    const cambios = Object.fromEntries($$('#cfg [data-k]').map(i => [i.dataset.k, i.value.trim()]));
    try { CFG.config = (await api('guardarConfig', { cambios })).config; toast('Ajustes guardados'); } catch (e) { toast(e.message); }
  });

  /* ================= Nuevo paciente ================= */
  $('#np-tpl').innerHTML = D.plantillas.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
  let creado = null;
  const paso = n => $$('#np .np-step').forEach(s => s.hidden = s.dataset.step !== String(n));
  function abrirNP() {
    ['#np-name', '#np-email', '#np-phone'].forEach(s => $(s).value = ''); $('#np-err').textContent = ''; $('#np-create').disabled = true;
    paso(1); $('#np').hidden = false; $('#np-scrim').classList.add('open'); requestAnimationFrame(() => $('#np').classList.add('open')); $('#np-name').focus();
  }
  function cerrarNP() { $('#np').classList.remove('open'); $('#np-scrim').classList.remove('open'); setTimeout(() => { $('#np').hidden = true; }, 200); }
  $('#new-patient').addEventListener('click', abrirNP);
  $('#np-close').addEventListener('click', cerrarNP); $('#np-scrim').addEventListener('click', cerrarNP);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#np').hidden) cerrarNP(); });
  ['#np-name', '#np-email'].forEach(s => $(s).addEventListener('input', () => { $('#np-create').disabled = $('#np-name').value.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#np-email').value.trim()); }));
  $('#np-create').addEventListener('click', async () => {
    const t = D.plantillas.find(p => p.id === $('#np-tpl').value), btn = $('#np-create'); btn.disabled = true; $('#np-err').textContent = '';
    try {
      const r = await api('crearPaciente', { nombre: $('#np-name').value.trim(), email: $('#np-email').value.trim(), telefono: $('#np-phone').value.replace(/[^\d]/g, ''),
        plantilla: t.id, plan: $('#np-plan').value, semanas: +$('#np-weeks').value, cuestionario: t.cuestionario, alta: t.alta.map(a => ({ prueba: a.prueba, criterio: a.criterio })) });
      creado = r.paciente;
      const url = (CFG.config.APP_URL || 'https://app.rcdclinic.com').replace(/\/$/, '');
      $('#np-link').textContent = url.replace(/^https?:\/\//, '');
      const msg = `Hola ${creado.nombre.split(' ')[0]}, soy Dani de RCD Clinic. Ya tienes tu app: ${url}\nEntra con tu email (${creado.email}) y te llegará un código. Añádela a la pantalla de inicio para tenerla como una app.`;
      $('#np-wa').href = `https://wa.me/${creado.telefono || ''}?text=` + encodeURIComponent(msg);
      paso(2); recargarLateral();
    } catch (e) { $('#np-err').textContent = e.message; btn.disabled = false; }
  });
  $('#np-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('https://' + $('#np-link').textContent); toast('Enlace copiado'); }
    catch { const r = document.createRange(); r.selectNodeContents($('#np-link')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selecciona y copia el enlace'); }
  });
  $('#np-done').addEventListener('click', () => { cerrarNP(); if (creado) abrir(creado.id); });

  api.conToken() ? arrancar() : mostrarAcceso();
})();
