/* RCD · pestaña «Historia clínica» del panel: respuestas del formulario pre-sesión + lo que escribe Dani.
   Las notas de Dani se guardan como pares clave → texto (acción guardarHistoria). */
(() => {
  const { $, $$, esc, toast } = window.RCDUI;

  // Avisos automáticos a partir de las respuestas del paciente (para que no se pasen por alto)
  function alertas(r) {
    const no = v => !v || /^\s*(no|nada|ninguno|ninguna|-)\s*\.?\s*$/i.test(v);
    const a = [];
    if (r.cancer === 'Sí') a.push(['high', 'Antecedentes de cáncer o enfermedad grave' + (r.cancerCual ? `: ${r.cancerCual}` : '')]);
    if (!no(r.farmacos)) a.push(['mid', `Fármacos: ${r.farmacos}`]);
    if (!no(r.cirugia)) a.push(['mid', `Cirugía: ${r.cirugia}`]);
    if (!no(r.patologias)) a.push(['mid', `Otras patologías: ${r.patologias}`]);
    if (r.otrosSintomas === 'Sí') a.push(['high', 'Otros síntomas' + (r.otrosSintomasCual ? `: ${r.otrosSintomasCual}` : '')]);
    if (r.reposo === 'Sí') a.push(['mid', 'Dolor en reposo']);
    if (Number(r.intensidad) >= 7) a.push(['mid', `Intensidad habitual ${r.intensidad}/10`]);
    if (r.moverEmpeora === 'Sí') a.push(['mid', 'Cree que moverse empeora la lesión']);
    if (Number(r.motivacion) <= 5 && r.motivacion !== undefined) a.push(['mid', `Motivación ${r.motivacion}/10`]);
    return a;
  }

  function pintar(cont, F, api, alGuardar) {
    const P = window.RCD.presesion, H = window.RCD.historia;
    const r = F.presesion?.respuestas || {};
    const h = Object.assign({}, F.historia || {});
    const cambios = {};
    const set = (k, v) => { cambios[k] = v; h[k] = v; $('#hc-save', cont).disabled = false; $('#hc-estado', cont).textContent = 'Cambios sin guardar'; };
    const plantilla = F.paciente.plantilla;
    const tests = H.objetiva[plantilla] || H.objetiva.aquiles;
    const nota = (k, ph = 'Tus correcciones o especificaciones…') => `<textarea class="hc-in" data-k="${k}" rows="2" placeholder="${esc(ph)}">${esc(h[k] || '')}</textarea>`;
    const linea = (k, ph = '') => `<input class="hc-in" type="text" data-k="${k}" value="${esc(h[k] || '')}" placeholder="${esc(ph)}">`;
    const cons = F.consentimientos || [];
    const nombreDoc = { privacidad: 'Política de privacidad', informado: 'Consentimiento informado', condiciones: 'Condiciones de contratación', grabacion: 'Grabación con fines clínicos', docencia: 'Uso docente anonimizado', rrss: 'Testimonio en redes', comerciales: 'Comunicaciones comerciales' };
    const al = alertas(r);

    cont.innerHTML = `
      <div class="card" style="display:grid;gap:10px">
        <div class="rx-top"><div><b>Formulario pre-sesión</b><p class="mute">${F.presesion ? `Recibido el ${esc(F.presesion.fecha)} · versión ${esc(F.presesion.version)}` : 'Aún no lo ha rellenado. Le aparecerá la primera vez que entre en la app.'}</p></div>
          <button class="act" type="button" id="hc-valorada" aria-pressed="${h.valorada === 'si'}">${h.valorada === 'si' ? 'Valoración hecha ✓' : 'Marcar valoración hecha'}</button></div>
        ${cons.length ? `<div class="chipline">${cons.map(c => `<span class="pill ${c.aceptado ? 'ok' : ''}">${c.aceptado ? '✓' : '✗'} ${esc(nombreDoc[c.documento] || c.documento)}</span>`).join('')}</div>` : ''}
        ${al.length ? `<div class="hc-alertas">${al.map(([n, t]) => `<p class="lvl-${n}">● ${esc(t)}</p>`).join('')}</div>` : ''}
      </div>

      ${F.presesion ? `<p class="sec-title">Exploración subjetiva · respuestas del paciente</p><div class="hc">${P.bloques.map((b, i) => `
        <details ${i < 2 ? 'open' : ''}><summary>${esc(b.titulo)} <span>${b.preguntas.filter(q => r[q.id]).length} respuestas</span></summary><div class="hc-body">
          <dl style="margin:0;display:grid">${b.preguntas.filter(q => r[q.id]).map(q => `<div class="qa"><dt>${esc(q.q)}</dt><dd>${esc(r[q.id])}</dd></div>`).join('')}</dl>
          <label class="hc-lab">Correcciones y especificaciones${nota('nota.' + b.id)}</label></div></details>`).join('')}</div>` : ''}

      <p class="sec-title">Exploración objetiva</p>
      <div class="card hc-grid">${tests.map((t, i) => `<label class="hc-lab">${esc(t)}${linea('obj.' + i, 'Resultado y anotaciones')}</label>`).join('')}
        <label class="hc-lab">Otras pruebas${nota('obj.otras', 'Test, resultado y anotaciones…')}</label></div>

      <p class="sec-title">Banderas rojas</p>
      <div class="card hc-rojas">${H.rojas.map((t, i) => `<div class="hc-roja"><span>${esc(t)}</span><div class="chips" data-k="rojas.${i}">${['No', 'Sí', 'Dudoso'].map(o => `<button class="chip" type="button" aria-pressed="${(h['rojas.' + i] || '') === o}">${o}</button>`).join('')}</div></div>`).join('')}
        <label class="hc-lab">Notas${nota('rojas.notas', 'Detalles de cualquier respuesta «Sí» o «Dudoso»…')}</label></div>

      <p class="sec-title">Diagnóstico diferencial</p>
      <div class="card hc-grid">
        <label class="hc-lab">Hipótesis principal${linea('dif.principal', 'P. ej., tendinopatía de la porción media del Aquiles')}</label>
        <label class="hc-lab">A descartar${nota('dif.descartar', 'Otras estructuras o cuadros a descartar…')}</label>
        <label class="hc-lab">Región afectada / clínica${nota('dif.clinica', 'Localización, observación…')}</label></div>

      <p class="sec-title">Prescripción general</p>
      <div class="card hc-grid">${H.general.map(g => `<label class="hc-lab">${esc(g.q)}${linea('gen.' + g.id, g.ayuda || '')}</label>`).join('')}</div>

      <div class="hc-pie"><span class="mute" id="hc-estado">Todo guardado</span><button class="btn btn-primary" type="button" id="hc-save" disabled>Guardar historia clínica</button></div>`;

    $$('.hc-in', cont).forEach(i => i.addEventListener('input', () => set(i.dataset.k, i.value)));
    $$('.chips[data-k]', cont).forEach(g => $$('button', g).forEach(b => b.addEventListener('click', () => {
      const ya = b.getAttribute('aria-pressed') === 'true';
      $$('button', g).forEach(x => x.setAttribute('aria-pressed', String(!ya && x === b)));
      set(g.dataset.k, ya ? '' : b.textContent);
    })));
    $('#hc-valorada', cont).addEventListener('click', e => {
      const on = h.valorada !== 'si'; set('valorada', on ? 'si' : '');
      e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.textContent = on ? 'Valoración hecha ✓' : 'Marcar valoración hecha';
    });
    $('#hc-save', cont).addEventListener('click', async () => {
      const btn = $('#hc-save', cont); btn.disabled = true; btn.textContent = 'Guardando…';
      try {
        const res = await api('guardarHistoria', { pacienteId: F.paciente.id, cambios: { ...cambios } });
        Object.keys(cambios).forEach(k => delete cambios[k]);
        F.historia = res.historia; $('#hc-estado', cont).textContent = 'Todo guardado'; toast('Historia clínica guardada'); alGuardar?.();
      } catch (x) { toast(x.message); btn.disabled = false; }
      finally { btn.textContent = 'Guardar historia clínica'; }
    });
  }

  window.RCDHistoria = { pintar };
})();
