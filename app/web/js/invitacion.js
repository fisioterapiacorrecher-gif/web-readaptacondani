/* RCD · entrada con enlace personal: «¿Eres tú?» → código al email (una vez) → dentro 90 días o hasta el fin del plan.
   El enlace lleva un identificador en la parte «#i=…» de la dirección, que nunca se envía a ningún servidor web. */
(() => {
  const { $, esc } = window.RCDUI;
  const WA = '34684780066';

  /** Lee y quita de la barra de direcciones el identificador del enlace personal. */
  function leerDeLaDireccion() {
    const m = location.hash.match(/[#&]i=([0-9a-f]{32,128})/i);
    if (!m) return null;
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* sin historial: no pasa nada */ }
    return m[1].toLowerCase();
  }

  function pantalla(cont, api, token, { alEntrar, usarEmail }) {
    const marca = `<div class="login-brand"><svg class="spark"><use href="#spark"></use></svg><div><b>RCD CLINIC</b><small>Readapta con Dani</small></div></div>`;
    const contacto = `<a class="btn btn-ghost btn-block" href="https://wa.me/${WA}" target="_blank" rel="noopener">Escribir a Dani por WhatsApp</a>`;
    const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

    function error(msg) {
      cont.innerHTML = `<div class="login">${marca}<h1>No se puede abrir</h1><p class="soft">${esc(msg)}</p>
        <button class="btn btn-primary btn-block" type="button" id="i-email">Entrar con mi email</button>${contacto}</div>`;
      $('#i-email', cont).addEventListener('click', usarEmail);
    }

    cont.innerHTML = `<div class="login">${marca}<p class="mute">Comprobando tu enlace…</p></div>`;
    api('invitacion', { invitacion: token }).then(info => {
      const nombre = info.nombre.split(' ')[0];
      cont.innerHTML = `
        <div class="login">${marca}
          <h1>Hola, ${esc(nombre)}</h1>
          <p class="soft">Dani te ha dado acceso a tu plan de readaptación en RCD Clinic.</p>
          ${esIOS && !instalada ? `<div class="card ios-tip"><p class="label">Consejo para iPhone</p>
            <p class="mute">Para tenerla como una app y no tener que entrar dos veces: pulsa <b>Compartir</b> (el cuadrado con la flecha) → <b>«Añadir a pantalla de inicio»</b>, ábrela desde el icono y entra con tu email. O sigue aquí si lo prefieres.</p></div>` : ''}
          <div class="card who-card"><p class="eyebrow">¿Eres tú?</p><p class="who-name">${esc(info.nombre)}</p><p class="mute">${esc(info.email)}</p></div>
          <button class="btn btn-primary btn-block" type="button" id="i-si">Sí, soy yo</button>
          <button class="btn btn-ghost btn-block" type="button" id="i-no">No soy yo</button>
          <p class="login-error" id="i-err" role="alert"></p>
        </div>`;
      $('#i-no', cont).addEventListener('click', () => error('Este enlace es personal y pertenece a otra persona. Pídele a Dani el tuyo.'));
      $('#i-si', cont).addEventListener('click', async () => {
        const b = $('#i-si', cont); b.disabled = true; b.textContent = 'Enviando código…';
        try { await api('pedirCodigo', { invitacion: token }); codigo(info, true); }
        catch (x) { if (/minuto/.test(x.message)) codigo(info, true); else { $('#i-err', cont).textContent = x.message; b.disabled = false; b.textContent = 'Sí, soy yo'; } }
      });
    }).catch(x => error(x.message));

    function codigo(info, enviado) {
      cont.innerHTML = `
        <div class="login">${marca}
          <h1>Revisa tu correo</h1>
          <p class="soft">${enviado ? `Te hemos enviado un código de 6 cifras a <b>${esc(info.email)}</b>. Mira también en «Spam» o «Promociones».` : ''}</p>
          <form id="i-form" class="login-form" novalidate>
            <label for="l-code">Código de 6 cifras</label>
            <input id="l-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······" required>
            <button class="btn btn-primary btn-block" type="submit">Entrar</button>
          </form>
          <p class="mute">¿No te llega? Pídele a Dani un código por WhatsApp y escríbelo aquí.</p>
          ${contacto}
          <p class="login-error" id="i-err" role="alert"></p>
        </div>`;
      $('#l-code', cont).focus();
      $('#i-form', cont).addEventListener('submit', async e => {
        e.preventDefault();
        const c = $('#l-code', cont).value.replace(/\D/g, ''), err = $('#i-err', cont);
        if (c.length !== 6) { err.textContent = 'El código tiene 6 cifras.'; return; }
        const b = $('button[type="submit"]', cont); b.disabled = true; b.textContent = 'Un momento…';
        try { const r = await api('verificarCodigo', { invitacion: token, codigo: c }); api.setToken(r.token); alEntrar(r); }
        catch (x) { err.textContent = x.message; b.disabled = false; b.textContent = 'Entrar'; }
      });
    }
  }

  window.RCDInvitacion = { leerDeLaDireccion, pantalla };
})();
