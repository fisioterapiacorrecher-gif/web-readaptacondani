/* RCD · finanzas del panel: pestaña «Pagos» de cada paciente y CRM de RCD (ingresos, gastos y progresión). */
(() => {
  const { $, $$, esc, toast, lineas, barras, escala } = window.RCDUI;
  const eur = n => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const hoyISO = () => new Date().toISOString().slice(0, 10);
  const fechaCorta = f => f ? new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const sumarMeses = (f, n) => { const d = new Date(f + 'T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };
  const METODOS = ['Bizum', 'Transferencia', 'Tarjeta', 'Stripe', 'PayPal', 'Efectivo'];
  const CAT_GASTO = ['Software y suscripciones', 'Publicidad y marketing', 'Cuota de autónomos', 'Seguros y colegio profesional', 'Gestoría', 'Formación', 'Material', 'Comisiones de pago', 'Impuestos', 'Otros'];
  const CAT_INGRESO = ['Formación y charlas', 'Colaboraciones', 'Otros'];

  /* ================= Pestaña «Pagos» del paciente ================= */
  function pintarPagos(cont, F, api) {
    const p = F.paciente;
    let plan = F.finanzas?.plan || { nombre: `${p.plan || 'Readaptación'} · ${p.semanas} semanas`, precio: '' };
    let pagos = (F.finanzas?.pagos || []).map(x => ({ ...x }));
    const total = () => Number(plan.precio) || pagos.reduce((t, x) => t + (Number(x.importe) || 0), 0);
    const pagado = () => pagos.filter(x => x.pagado).reduce((t, x) => t + (Number(x.importe) || 0), 0);
    let sucio = false;
    const marcar = () => { sucio = true; $('#fp-save', cont).disabled = false; resumen(); };

    function resumen() {
      const t = total(), pg = pagado(), suma = pagos.reduce((s, x) => s + (Number(x.importe) || 0), 0);
      $('#fp-resumen', cont).innerHTML = `
        <div class="kpi"><span>Total del plan</span><b>${eur(t)}</b><em class="mute">${pagos.length} pago${pagos.length === 1 ? '' : 's'}</em></div>
        <div class="kpi"><span>Pagado</span><b class="lvl-ok">${eur(pg)}</b><em class="mute">${pagos.filter(x => x.pagado).length} de ${pagos.length}</em></div>
        <div class="kpi"><span>Falta</span><b class="${t - pg > 0 ? 'lvl-mid' : 'lvl-ok'}">${eur(Math.max(0, t - pg))}</b><em class="mute">${pagos.some(x => !x.pagado && x.vence && x.vence < hoyISO()) ? '<span class="lvl-high">hay pagos vencidos</span>' : 'al día'}</em></div>`;
      $('#fp-aviso', cont).textContent = pagos.length && Math.abs(suma - t) > 0.009 ? `Ojo: los pagos suman ${eur(suma)} y el total del plan es ${eur(t)}.` : '';
    }

    function filas() {
      $('#fp-filas', cont).innerHTML = pagos.length ? pagos.map((x, i) => `
        <div class="fp-fila ${x.pagado ? 'ok' : x.vence && x.vence < hoyISO() ? 'vencido' : ''}">
          <label>Concepto<input type="text" data-i="${i}" data-k="concepto" value="${esc(x.concepto)}"></label>
          <label>Importe (€)<input type="number" inputmode="decimal" step="0.01" min="0" data-i="${i}" data-k="importe" value="${esc(x.importe)}"></label>
          <label>Vence<input type="date" data-i="${i}" data-k="vence" value="${esc(x.vence)}"></label>
          <label class="fp-check"><input type="checkbox" data-i="${i}" data-k="pagado" ${x.pagado ? 'checked' : ''}> Pagado</label>
          <label>Fecha de pago<input type="date" data-i="${i}" data-k="fechaPago" value="${esc(x.fechaPago)}" ${x.pagado ? '' : 'disabled'}></label>
          <label>Método<select data-i="${i}" data-k="metodo"><option value="">—</option>${METODOS.map(m => `<option ${x.metodo === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
          <label class="fp-fact">Factura (enlace de Drive)<input type="text" data-i="${i}" data-k="factura" value="${esc(x.factura)}" placeholder="https://drive.google.com/…"></label>
          <button class="quitar" type="button" data-q="${i}">Quitar</button>
        </div>`).join('') : '<p class="mute">Sin pagos todavía. Genera el calendario arriba o añade uno a mano.</p>';
      $$('#fp-filas [data-k]', cont).forEach(inp => inp.addEventListener(inp.type === 'checkbox' ? 'change' : 'input', () => {
        const x = pagos[inp.dataset.i], k = inp.dataset.k;
        x[k] = inp.type === 'checkbox' ? inp.checked : inp.value;
        if (k === 'pagado') { if (x.pagado && !x.fechaPago) x.fechaPago = hoyISO(); filas(); }
        marcar();
      }));
      $$('#fp-filas .quitar', cont).forEach(b => b.addEventListener('click', () => { pagos.splice(+b.dataset.q, 1); filas(); marcar(); }));
    }

    cont.innerHTML = `
      <div class="kpis" id="fp-resumen"></div>
      <p class="lvl-mid" id="fp-aviso"></p>
      <div class="card fp-plan">
        <label>Plan contratado<input type="text" id="fp-nombre" value="${esc(plan.nombre)}" placeholder="Readaptación Completa · 3 meses"></label>
        <label>Precio total (€)<input type="number" inputmode="decimal" step="0.01" min="0" id="fp-precio" value="${esc(plan.precio)}"></label>
      </div>
      <div class="card fp-gen"><p class="sec-title">Generar calendario de pagos</p>
        <label>Nº de pagos<select id="fp-n">${[1, 2, 3, 4, 6, 12].map(n => `<option ${n === 3 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>Primer pago<input type="date" id="fp-ini" value="${esc(p.fechaInicio || hoyISO())}"></label>
        <label>Cada<select id="fp-cada"><option value="1">mes</option><option value="0.5">15 días</option><option value="3">3 meses</option></select></label>
        <button class="btn btn-ghost" type="button" id="fp-generar">Generar</button>
        <p class="mute">Reparte el precio total en pagos iguales (el último ajusta los céntimos). Sustituye los pagos pendientes; los ya pagados se mantienen.</p>
      </div>
      <p class="sec-title">Pagos</p>
      <div id="fp-filas" class="fp-filas"></div>
      <button class="btn btn-ghost" type="button" id="fp-add">+ Añadir pago</button>
      <div class="hc-pie"><span class="mute">El paciente ve su plan, sus pagos y sus facturas en la pestaña «Plan» de su app.</span><button class="btn btn-primary" type="button" id="fp-save" disabled>Guardar pagos</button></div>`;

    $('#fp-nombre', cont).addEventListener('input', e => { plan.nombre = e.target.value; marcar(); });
    $('#fp-precio', cont).addEventListener('input', e => { plan.precio = e.target.value; marcar(); });
    $('#fp-generar', cont).addEventListener('click', () => {
      const n = +$('#fp-n', cont).value, ini = $('#fp-ini', cont).value || hoyISO(), cada = +$('#fp-cada', cont).value;
      const t = Number(plan.precio); if (!(t > 0)) { toast('Pon primero el precio total del plan'); return; }
      const ya = pagos.filter(x => x.pagado), resto = Math.max(0, t - ya.reduce((s, x) => s + (Number(x.importe) || 0), 0));
      const nPend = Math.max(1, n - ya.length), base = Math.floor(resto / nPend * 100) / 100;
      const nuevos = Array.from({ length: nPend }, (_, i) => ({
        concepto: `Pago ${ya.length + i + 1} de ${ya.length + nPend}`, importe: i === nPend - 1 ? Math.round((resto - base * (nPend - 1)) * 100) / 100 : base,
        vence: cada === 0.5 ? new Date(new Date(ini + 'T12:00:00').getTime() + (ya.length + i) * 15 * 86400000).toISOString().slice(0, 10) : sumarMeses(ini, (ya.length + i) * cada),
        pagado: false, fechaPago: '', metodo: '', factura: '',
      }));
      pagos = ya.concat(nuevos); filas(); marcar();
    });
    $('#fp-add', cont).addEventListener('click', () => { pagos.push({ concepto: `Pago ${pagos.length + 1}`, importe: '', vence: hoyISO(), pagado: false, fechaPago: '', metodo: '', factura: '' }); filas(); marcar(); });
    $('#fp-save', cont).addEventListener('click', async () => {
      const b = $('#fp-save', cont); b.disabled = true; b.textContent = 'Guardando…';
      try { const r = await api('guardarFinanzasPaciente', { pacienteId: p.id, plan, pagos }); F.finanzas = r.finanzas; pagos = r.finanzas.pagos.map(x => ({ ...x })); sucio = false; filas(); resumen(); toast('Pagos guardados'); }
      catch (x) { toast(x.message); b.disabled = false; }
      finally { b.textContent = 'Guardar pagos'; }
    });
    filas(); resumen();
  }

  /* ================= CRM de RCD ================= */
  const mesDe = f => String(f || '').slice(0, 7);
  const difMeses = (a, b) => (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7));
  /** ¿Cuenta este movimiento en el mes «ym» (AAAA-MM)? Tiene en cuenta la recurrencia. */
  function cuentaEn(m, ym) {
    const ini = mesDe(m.fecha); if (!ini || ym < ini) return false;
    if (m.hasta && ym > mesDe(m.hasta)) return false;
    const d = difMeses(ini, ym);
    return m.recurrencia === 'mensual' ? true : m.recurrencia === 'trimestral' ? d % 3 === 0 : m.recurrencia === 'anual' ? d % 12 === 0 : d === 0;
  }
  const nombreMes = ym => { const t = new Date(ym + '-15T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); };
  const mesCorto = ym => new Date(ym + '-15T12:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');

  async function pintarCRM(cont, api) {
    cont.innerHTML = '<p class="mute">Cargando finanzas…</p>';
    let D;
    try { D = await api('finanzas'); } catch (x) { cont.innerHTML = `<p class="vacio">${esc(x.message)}</p>`; return; }
    let mes = new Date().toISOString().slice(0, 7), editando = null;

    function calcular(ym) {
      const cobros = D.pagos.filter(x => x.pagado && mesDe(x.fechaPago) === ym);
      const movs = D.movimientos.filter(m => cuentaEn(m, ym));
      const ingresosOtros = movs.filter(m => m.tipo === 'ingreso'), gastos = movs.filter(m => m.tipo === 'gasto');
      const ing = cobros.reduce((t, x) => t + x.importe, 0) + ingresosOtros.reduce((t, m) => t + m.importe, 0);
      const gas = gastos.reduce((t, m) => t + m.importe, 0);
      return { cobros, ingresosOtros, gastos, ing, gas, ben: ing - gas };
    }

    function pintar() {
      const c = calcular(mes);
      const pendiente = D.pagos.filter(x => !x.pagado), vencido = pendiente.filter(x => x.vence && x.vence < hoyISO());
      const porCat = {}; c.gastos.forEach(m => (porCat[m.categoria] = porCat[m.categoria] || []).push(m));
      const meses = Array.from({ length: 12 }, (_, i) => { const d = new Date(mes + '-15T12:00:00'); d.setMonth(d.getMonth() - 11 + i); return d.toISOString().slice(0, 7); });
      const serie = meses.map(calcular);
      const recurrente = m => m.recurrencia === 'no' ? '' : ` · ${m.recurrencia}${m.hasta ? ' hasta ' + fechaCorta(m.hasta) : ''}`;

      cont.innerHTML = `
        <div class="fin-mes"><button class="btn btn-ghost" type="button" data-m="-1" aria-label="Mes anterior">‹</button><b>${esc(nombreMes(mes))}</b><button class="btn btn-ghost" type="button" data-m="1" aria-label="Mes siguiente">›</button></div>
        <div class="kpis">
          <div class="kpi"><span>Ingresos</span><b class="lvl-ok">${eur(c.ing)}</b><em class="mute">${c.cobros.length} cobro${c.cobros.length === 1 ? '' : 's'} de pacientes</em></div>
          <div class="kpi"><span>Gastos</span><b class="lvl-high">${eur(c.gas)}</b><em class="mute">${c.gastos.length} gasto${c.gastos.length === 1 ? '' : 's'}</em></div>
          <div class="kpi"><span>Beneficio</span><b class="${c.ben >= 0 ? 'lvl-ok' : 'lvl-high'}">${eur(c.ben)}</b><em class="mute">ingresos − gastos</em></div>
          <div class="kpi"><span>Pendiente de cobro</span><b class="lvl-mid">${eur(pendiente.reduce((t, x) => t + x.importe, 0))}</b><em class="${vencido.length ? 'lvl-high' : 'mute'}">${vencido.length ? `${vencido.length} vencido${vencido.length > 1 ? 's' : ''} · ${eur(vencido.reduce((t, x) => t + x.importe, 0))}` : 'nada vencido'}</em></div>
        </div>

        <p class="sec-title">Progresión de los últimos 12 meses</p>
        <div class="fin-graficas">
          <div class="card"><p class="mini-title">Ingresos y gastos</p><svg class="chart" id="fin-chart" viewBox="0 0 340 150" role="img" aria-label="Ingresos y gastos por mes"></svg>
            <div class="legend-row"><span><i></i>Ingresos</span><span><i class="dash"></i>Gastos</span></div></div>
          <div class="card"><p class="mini-title">Beneficio mensual</p><svg class="chart" id="fin-ben" viewBox="0 0 340 150" role="img" aria-label="Beneficio por mes"></svg>
            <div class="legend-row"><span>Ingresos menos gastos (los meses en negativo salen a 0)</span></div></div>
        </div>

        <div class="grid-2">
          <div style="display:grid;gap:12px;min-width:0"><p class="sec-title">Gastos de ${esc(mesCorto(mes))}, por categoría</p>
            <div class="card fin-lista">${Object.keys(porCat).length ? Object.entries(porCat).sort((a, b) => b[1].reduce((t, m) => t + m.importe, 0) - a[1].reduce((t, m) => t + m.importe, 0)).map(([cat, ms]) => {
              const t = ms.reduce((s, m) => s + m.importe, 0);
              return `<div class="fin-cat"><div class="fin-cat-top"><b>${esc(cat)}</b><span>${eur(t)} · ${Math.round(t / c.gas * 100)} %</span></div><div class="bar"><i style="transform:scaleX(${t / c.gas})"></i></div>
                ${ms.map(m => `<p class="fin-item"><span>${esc(m.concepto)}<em class="mute">${esc(recurrente(m))}${m.notas ? ' · ' + esc(m.notas) : ''}</em></span><span>${eur(m.importe)}</span></p>`).join('')}</div>`;
            }).join('') : '<p class="mute">Sin gastos este mes.</p>'}</div></div>
          <div style="display:grid;gap:12px;min-width:0"><p class="sec-title">Ingresos de ${esc(mesCorto(mes))}</p>
            <div class="card fin-lista">${c.cobros.length || c.ingresosOtros.length ? c.cobros.map(x => `<p class="fin-item"><span>${esc(x.paciente)}<em class="mute"> · ${esc(x.concepto)}${x.metodo ? ' · ' + esc(x.metodo) : ''} · ${esc(fechaCorta(x.fechaPago))}</em></span><span>${eur(x.importe)}</span></p>`).join('')
              + c.ingresosOtros.map(m => `<p class="fin-item"><span>${esc(m.concepto)}<em class="mute"> · ${esc(m.categoria)}${esc(recurrente(m))}</em></span><span>${eur(m.importe)}</span></p>`).join('') : '<p class="mute">Sin ingresos este mes.</p>'}</div>
            <p class="sec-title">Próximos cobros</p>
            <div class="card fin-lista">${pendiente.length ? pendiente.sort((a, b) => String(a.vence).localeCompare(String(b.vence))).slice(0, 12).map(x => `<p class="fin-item ${x.vence && x.vence < hoyISO() ? 'vencido' : ''}"><span>${esc(x.paciente)}<em class="mute"> · ${esc(x.concepto)} · vence ${esc(fechaCorta(x.vence))}</em></span><span>${eur(x.importe)}</span></p>`).join('') : '<p class="mute">Nada pendiente.</p>'}</div>
          </div>
        </div>

        <p class="sec-title">Por qué se van · bajas sin alta</p>
        <div class="card fin-lista">${(D.bajas || []).length ? (() => {
          const por = {}; D.bajas.forEach(x => por[x.motivo] = (por[x.motivo] || 0) + 1);
          const n = D.bajas.length;
          return `<p class="mute">${n} baja${n === 1 ? '' : 's'} y ${D.altas || 0} alta${D.altas === 1 ? '' : 's'} en total.</p>` + Object.entries(por).sort((a, b) => b[1] - a[1]).map(([m, k]) =>
            `<div class="fin-cat"><div class="fin-cat-top"><b>${esc(m)}</b><span>${k} · ${Math.round(k / n * 100)} %</span></div><div class="bar"><i style="transform:scaleX(${k / n})"></i></div></div>`).join('');
        })() : `<p class="mute">Nadie se ha dado de baja sin el alta${D.altas ? ` · ${D.altas} alta${D.altas === 1 ? '' : 's'}` : ''}.</p>`}</div>

        <p class="sec-title" id="fin-form-t">${editando ? 'Editar movimiento' : 'Añadir gasto o ingreso'}</p>
        <form class="card fin-form" id="fin-form" novalidate>
          <label>Tipo<select id="mv-tipo"><option value="gasto">Gasto</option><option value="ingreso">Ingreso (que no sea de pacientes)</option></select></label>
          <label>Fecha<input type="date" id="mv-fecha" value="${hoyISO()}"></label>
          <label>Categoría<select id="mv-cat"></select></label>
          <label class="ancho">Concepto<input type="text" id="mv-concepto" placeholder="Ej.: Google Workspace, Canva Pro, cuota de autónomos…"></label>
          <label>Importe (€)<input type="number" id="mv-importe" inputmode="decimal" step="0.01" min="0"></label>
          <label>Se repite<select id="mv-rec"><option value="no">No</option><option value="mensual">Cada mes</option><option value="trimestral">Cada 3 meses</option><option value="anual">Cada año</option></select></label>
          <label>Hasta (opcional)<input type="date" id="mv-hasta"></label>
          <label class="ancho">Explicación (opcional)<input type="text" id="mv-notas" placeholder="Para qué es, por qué lo pagas…"></label>
          <div class="ancho fin-form-acts">${editando ? '<button class="btn btn-ghost" type="button" id="mv-cancel">Cancelar</button>' : ''}<button class="btn btn-primary" type="submit">${editando ? 'Guardar cambios' : 'Añadir'}</button></div>
          <p class="login-error ancho" id="mv-err"></p>
        </form>

        <p class="sec-title">Todos los gastos e ingresos</p>
        <div class="card fin-lista">${D.movimientos.length ? D.movimientos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).map(m => `
          <div class="fin-mov"><span><b>${esc(m.concepto)}</b><em class="mute"> · ${m.tipo === 'gasto' ? 'Gasto' : 'Ingreso'} · ${esc(m.categoria)} · ${esc(fechaCorta(m.fecha))}${esc(recurrente(m))}</em></span>
            <span class="${m.tipo === 'gasto' ? 'lvl-high' : 'lvl-ok'}">${m.tipo === 'gasto' ? '−' : '+'}${eur(m.importe)}</span>
            <span class="fin-acts"><button class="act" type="button" data-e="${m.id}">Editar</button><button class="quitar" type="button" data-b="${m.id}">Borrar</button></span></div>`).join('') : '<p class="mute">Todavía no has apuntado gastos. Empieza por los fijos de cada mes (Workspace, autónomos, seguro…) marcando «Cada mes».</p>'}</div>`;

      // Gráficas
      const ing = serie.map(s => s.ing), gas = serie.map(s => s.gas), et = meses.map((m, i) => i % 2 === 0 || i === 11 ? mesCorto(m) : '');
      const e = escala(ing.concat(gas), 100);
      lineas($('#fin-chart', cont), ing, { max: e.max, ticks: e.ticks, etiquetas: et, unidad: ' €', yFmt: v => v >= 1000 ? (v / 1000) + 'k' : v });
      const svg = $('#fin-chart', cont), W = 340, H = 150, L = 34, R = 12, T = 16, B = 24, y = v => T + (1 - v / e.max) * (H - T - B), x = i => L + i * (W - L - R) / 11;
      svg.insertAdjacentHTML('beforeend', `<polyline points="${gas.map((v, i) => x(i) + ',' + y(v)).join(' ')}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" class="fin-gas"/>`);
      const ben = serie.map(s => Math.max(0, s.ben)), eb = escala(ben, 100);
      barras($('#fin-ben', cont), ben, { max: eb.max, ticks: eb.ticks, etiquetas: meses.map(mesCorto), yFmt: v => v >= 1000 ? (v / 1000) + 'k' : v, valFmt: v => v ? Math.round(v) : '' });

      // Formulario
      const cats = () => { $('#mv-cat', cont).innerHTML = ($('#mv-tipo', cont).value === 'gasto' ? CAT_GASTO : CAT_INGRESO).map(c => `<option>${c}</option>`).join(''); };
      $('#mv-tipo', cont).addEventListener('change', cats); cats();
      if (editando) {
        const m = D.movimientos.find(x => x.id === editando);
        $('#mv-tipo', cont).value = m.tipo; cats();
        $('#mv-fecha', cont).value = m.fecha; $('#mv-cat', cont).value = m.categoria; $('#mv-concepto', cont).value = m.concepto; $('#mv-importe', cont).value = m.importe;
        $('#mv-rec', cont).value = m.recurrencia; $('#mv-hasta', cont).value = m.hasta; $('#mv-notas', cont).value = m.notas || '';
        $('#mv-cancel', cont).addEventListener('click', () => { editando = null; pintar(); });
      }
      $('#fin-form', cont).addEventListener('submit', async ev => {
        ev.preventDefault();
        const mov = { id: editando || '', tipo: $('#mv-tipo', cont).value, fecha: $('#mv-fecha', cont).value, categoria: $('#mv-cat', cont).value, concepto: $('#mv-concepto', cont).value.trim(),
          importe: $('#mv-importe', cont).value, recurrencia: $('#mv-rec', cont).value, hasta: $('#mv-hasta', cont).value, notas: $('#mv-notas', cont).value.trim() };
        try { D = await api('guardarMovimiento', { movimiento: mov }); toast(editando ? 'Movimiento actualizado' : 'Movimiento añadido'); editando = null; pintar(); }
        catch (x) { $('#mv-err', cont).textContent = x.message; }
      });
      $$('[data-e]', cont).forEach(b => b.addEventListener('click', () => { editando = b.dataset.e; pintar(); $('#fin-form-t', cont).scrollIntoView({ behavior: 'smooth' }); }));
      $$('[data-b]', cont).forEach(b => b.addEventListener('click', async () => {
        if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro?'; return; }
        try { D = await api('borrarMovimiento', { id: b.dataset.b }); toast('Movimiento borrado'); pintar(); } catch (x) { toast(x.message); }
      }));
      $$('.fin-mes [data-m]', cont).forEach(b => b.addEventListener('click', () => { const d = new Date(mes + '-15T12:00:00'); d.setMonth(d.getMonth() + +b.dataset.m); mes = d.toISOString().slice(0, 7); pintar(); }));
    }
    pintar();
  }

  window.RCDFinanzas = { pintarPagos, pintarCRM, eur, fechaCorta };
})();
