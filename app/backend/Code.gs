/**
 * RCD Clinic · motor de la app (Google Apps Script, cuenta de Workspace info@rcdclinic.com).
 *
 * Qué hace:
 *   - Guarda todos los datos en una hoja de cálculo de tu Workspace («RCD App · Datos»), una pestaña por tabla.
 *   - Responde a las dos apps (paciente y panel) con una API JSON: POST { action, token, ... }.
 *   - Acceso con código por email: el paciente (o Dani) escribe su email, recibe un código de 6 cifras y entra.
 *   - Envía los recordatorios por email (dolor diario, encuesta semanal, revisión mensual).
 *
 * Instalación: sigue app/backend/INSTALAR.md. La primera vez ejecuta la función `instalar` desde el editor.
 * Nada aquí depende de bibliotecas externas: todo el código está a la vista.
 */

/* ============================== Configuración ============================== */

const VERSION = '1.3.0';
const NOMBRE_HOJA = 'RCD App · Datos';
const DURACION_SESION_DIAS = 90;      // cuánto dura el acceso antes de volver a pedir código
const CODIGO_MINUTOS = 10;            // validez del código de acceso
const CODIGO_INTENTOS = 5;            // intentos antes de invalidar el código
const ZONA = 'Europe/Madrid';

/** Tablas y sus columnas. Cambiar el orden de columnas aquí cambia la hoja: no lo toques con datos dentro. */
const TABLAS = {
  Config: ['clave', 'valor'],
  Pacientes: ['id', 'nombre', 'email', 'telefono', 'plantilla', 'plan', 'semanas', 'fechaInicio', 'estado', 'semanaActual', 'cuestionario', 'creado', 'notas'],
  Codigos: ['email', 'hash', 'expira', 'intentos', 'creado'],
  Accesos: ['hash', 'email', 'rol', 'pacienteId', 'expira', 'creado'],
  Prescripcion: ['id', 'pacienteId', 'semana', 'dia', 'orden', 'tipo', 'ejercicio', 'series', 'valor', 'unidad', 'kg', 'tempo', 'descanso', 'indicacion', 'video', 'publicada', 'creado'],
  Series: ['id', 'pacienteId', 'fecha', 'semana', 'dia', 'prescripcionId', 'serie', 'valor', 'kg', 'hecha'],
  Ejercicios: ['id', 'pacienteId', 'fecha', 'semana', 'dia', 'prescripcionId', 'dolor', 'distancia', 'tiempo', 'velMax'],
  Sesiones: ['id', 'pacienteId', 'fecha', 'semana', 'dia', 'dolorAntes', 'dolorDespues', 'minutos', 'comentario'],
  Dolor: ['id', 'pacienteId', 'fecha', 'dolor', 'nota'],
  Encuestas: ['id', 'pacienteId', 'semana', 'fecha', 'respuestas'],
  Cuestionarios: ['id', 'pacienteId', 'tipo', 'fecha', 'semana', 'puntuacion', 'respuestas'],
  Decisiones: ['id', 'pacienteId', 'semana', 'prescripcionId', 'ejercicio', 'accion', 'propuesta', 'final', 'dolorMedio', 'fecha'],
  Mensajes: ['id', 'pacienteId', 'semana', 'texto', 'fecha'],
  Alta: ['id', 'pacienteId', 'prueba', 'criterio', 'resultado', 'superada', 'fecha'],
  Biblioteca: ['nombre', 'video', 'notas'],
  Registro: ['fecha', 'tipo', 'detalle'],
  Avisos: ['pacienteId', 'endpoint', 'p256dh', 'auth', 'creado'],   // móviles con notificaciones activadas
  Presesion: ['pacienteId', 'fecha', 'version', 'respuestas'],        // formulario pre-sesión del paciente
  Consentimientos: ['pacienteId', 'documento', 'version', 'aceptado', 'fecha'],
  Historia: ['pacienteId', 'clave', 'valor', 'fecha'],                // lo que escribe Dani en la historia clínica
};

const CONFIG_INICIAL = {
  ADMIN_EMAIL: 'info@rcdclinic.com',
  CLINICA: 'RCD Clinic',
  WHATSAPP: '34684780066',
  APP_URL: 'https://app.rcdclinic.com',
  RESERVA_CALENDARIO: '',
  RECORDATORIO_DOLOR_HORA: '21',
  RECORDATORIO_ENCUESTA_DIA: '0',   // 0 = domingo
  RECORDATORIO_ENCUESTA_HORA: '18',
  RECORDATORIO_ENCUESTA_REPITE_HORA: '12', // lunes
  RECORDATORIOS_ACTIVOS: 'si',
  // Notificaciones en el móvil (se rellenan desde el panel: Ajustes › Notificaciones)
  PUSH_URL: 'https://app.rcdclinic.com/.netlify/functions/push',
  PUSH_CLAVE_PUBLICA: '',
  PUSH_SECRETO: '',
  EMAIL_SI_NO_HAY_NOTIFICACIONES: 'si',
};

/* ============================== Instalación ============================== */

/** Ejecútala una vez desde el editor. Crea la hoja de datos, las pestañas y el recordatorio horario. */
function instalar() {
  const props = PropertiesService.getScriptProperties();
  let ss;
  const id = props.getProperty('HOJA_ID');
  if (id) ss = SpreadsheetApp.openById(id);
  else {
    ss = SpreadsheetApp.create(NOMBRE_HOJA);
    props.setProperty('HOJA_ID', ss.getId());
  }
  Object.keys(TABLAS).forEach(nombre => {
    let sh = ss.getSheetByName(nombre);
    if (!sh) sh = ss.insertSheet(nombre);
    const cols = TABLAS[nombre];
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  const sobrante = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (sobrante && ss.getSheets().length > 1) ss.deleteSheet(sobrante);
  const cfg = leerConfig_(ss, true);
  Object.keys(CONFIG_INICIAL).forEach(k => { if (!(k in cfg)) anadir_('Config', { clave: k, valor: CONFIG_INICIAL[k] }, ss); });

  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'recordatorios').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('recordatorios').timeBased().everyHours(1).create();

  registrar_('instalar', 'Versión ' + VERSION, ss);
  Logger.log('Listo. Hoja de datos: ' + ss.getUrl());
  return ss.getUrl();
}

/* ============================== Entrada web ============================== */

function doGet() {
  return json_({ ok: true, app: 'RCD Clinic', version: VERSION });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: 'Petición mal formada.' }); }
  try {
    const res = enrutar_(req);
    return json_(Object.assign({ ok: true }, res));
  } catch (err) {
    const msg = err && err.publico ? err.message : 'Algo ha fallado en el servidor. Prueba otra vez en un momento.';
    if (!(err && err.publico)) registrar_('error', (req.action || '?') + ': ' + (err && err.stack || err));
    return json_({ ok: false, error: msg, codigo: err && err.codigo });
  }
}

const ACCIONES_PUBLICAS = { pedirCodigo: 1, verificarCodigo: 1 };
const ACCIONES_PACIENTE = { yo: 1, guardarEjercicio: 1, guardarSesion: 1, guardarDolor: 1, guardarEncuesta: 1, guardarCuestionario: 1, progreso: 1, salir: 1, guardarAviso: 1, quitarAviso: 1, guardarPresesion: 1 };
const ACCIONES_ADMIN = { bandeja: 1, pacientes: 1, ficha: 1, crearPaciente: 1, editarPaciente: 1, publicarSemana: 1, guardarAlta: 1, darAlta: 1, guardarBiblioteca: 1, config: 1, guardarConfig: 1, salir: 1, guardarHistoria: 1, codigoManual: 1 };

function enrutar_(req) {
  const a = req.action;
  if (ACCIONES_PUBLICAS[a]) return ACC[a](req);
  const quien = autenticar_(req.token);
  if (quien.rol === 'admin' && ACCIONES_ADMIN[a]) return ACC[a](req, quien);
  if (quien.rol === 'paciente' && ACCIONES_PACIENTE[a]) return ACC[a](req, quien);
  throw publico_('No tienes permiso para hacer eso.', 'permiso');
}

/* ============================== Acciones ============================== */

const ACC = {
  /* ---------- Acceso ---------- */
  pedirCodigo(req) {
    const email = canonEmail_(req.email);
    if (!email) throw publico_('Escribe un email válido.');
    const cfg = leerConfig_();
    const esAdmin = email === canonEmail_(cfg.ADMIN_EMAIL);
    const paciente = buscar_('Pacientes', p => canonEmail_(p.email) === email && p.estado !== 'archivado')[0];
    // Misma respuesta exista o no el email, para no revelar quién es paciente (pero queda en el Registro para Dani).
    if (!esAdmin && !paciente) { registrar_('codigo', 'Pedido con un email sin acceso: ' + normEmail_(req.email)); return { enviado: true }; }
    const previos = buscar_('Codigos', c => c.email === email);
    if (previos.some(c => Date.now() - new Date(c.creado).getTime() < 60 * 1000)) throw publico_('Espera un minuto antes de pedir otro código.');
    borrar_('Codigos', c => c.email === email);
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    anadir_('Codigos', { email, hash: hash_(codigo), expira: new Date(Date.now() + CODIGO_MINUTOS * 60000).toISOString(), intentos: 0, creado: new Date().toISOString() });
    const destino = esAdmin ? normEmail_(cfg.ADMIN_EMAIL) : normEmail_(paciente.email);
    registrar_('codigo', 'Código enviado a ' + destino);
    MailApp.sendEmail({
      to: destino,
      subject: `Tu código de acceso a ${cfg.CLINICA}: ${codigo}`,
      htmlBody: plantillaEmail_(cfg, `Tu código de acceso es`, `<p style="font-size:34px;letter-spacing:6px;font-weight:700;margin:12px 0">${codigo}</p><p>Caduca en ${CODIGO_MINUTOS} minutos. Si no lo has pedido tú, ignora este mensaje.</p>`),
      name: cfg.CLINICA,
    });
    return { enviado: true };
  },

  verificarCodigo(req) {
    const email = canonEmail_(req.email);
    const codigo = String(req.codigo || '').replace(/\D/g, '');
    const fila = buscar_('Codigos', c => c.email === email)[0];
    if (!fila) throw publico_('Pide un código nuevo.', 'codigo');
    if (new Date(fila.expira).getTime() < Date.now()) { borrar_('Codigos', c => c.email === email); throw publico_('El código ha caducado. Pide uno nuevo.', 'codigo'); }
    if (fila.hash !== hash_(codigo)) {
      const n = Number(fila.intentos) + 1;
      if (n >= CODIGO_INTENTOS) { borrar_('Codigos', c => c.email === email); throw publico_('Demasiados intentos. Pide un código nuevo.', 'codigo'); }
      actualizar_('Codigos', c => c.email === email, { intentos: n });
      throw publico_('Código incorrecto.', 'codigo');
    }
    borrar_('Codigos', c => c.email === email);
    const cfg = leerConfig_();
    const esAdmin = email === canonEmail_(cfg.ADMIN_EMAIL);
    const paciente = esAdmin ? null : buscar_('Pacientes', p => canonEmail_(p.email) === email && p.estado !== 'archivado')[0];
    if (!esAdmin && !paciente) throw publico_('Este email no tiene acceso.', 'permiso');
    const token = Utilities.getUuid() + Utilities.getUuid();
    anadir_('Accesos', { hash: hash_(token), email, rol: esAdmin ? 'admin' : 'paciente', pacienteId: paciente ? paciente.id : '', expira: new Date(Date.now() + DURACION_SESION_DIAS * 86400000).toISOString(), creado: new Date().toISOString() });
    if (paciente && paciente.estado === 'pendiente') actualizar_('Pacientes', p => p.id === paciente.id, { estado: 'activo' });
    registrar_('acceso', email);
    return { token, rol: esAdmin ? 'admin' : 'paciente', nombre: paciente ? paciente.nombre : 'Dani' };
  },

  /** Plan B si el correo no llega: Dani genera el código y se lo manda al paciente por WhatsApp. Vale 24 h. */
  codigoManual(req) {
    const p = paciente_(req.pacienteId);
    if (p.estado === 'archivado') throw publico_('Este paciente está archivado.');
    const email = canonEmail_(p.email);
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    conBloqueo_(() => {
      borrar_('Codigos', c => c.email === email);
      anadir_('Codigos', { email, hash: hash_(codigo), expira: new Date(Date.now() + 24 * 3600000).toISOString(), intentos: 0, creado: new Date(Date.now() - 120000).toISOString() });
    });
    registrar_('codigo', 'Código manual generado por Dani para ' + normEmail_(p.email));
    return { codigo, email: normEmail_(p.email), horas: 24 };
  },

  salir(req) {
    borrar_('Accesos', a => a.hash === hash_(req.token));
    return {};
  },

  /* ---------- Paciente ---------- */
  yo(req, q) {
    const p = paciente_(q.pacienteId);
    const semana = semanaDe_(p);
    const presc = buscar_('Prescripcion', x => x.pacienteId === p.id && Number(x.semana) === semana && esSi_(x.publicada)).sort(porDiaOrden_);
    const hoy = fecha_(new Date());
    const series = buscar_('Series', s => s.pacienteId === p.id && Number(s.semana) === semana);
    const ejercicios = buscar_('Ejercicios', s => s.pacienteId === p.id && Number(s.semana) === semana);
    const sesiones = buscar_('Sesiones', s => s.pacienteId === p.id && Number(s.semana) === semana);
    const dolor = ultimosDias_(buscar_('Dolor', d => d.pacienteId === p.id), 14);
    const mensaje = buscar_('Mensajes', m => m.pacienteId === p.id && Number(m.semana) <= semana).sort((a, b) => b.semana - a.semana)[0];
    const encuesta = buscar_('Encuestas', e => e.pacienteId === p.id && Number(e.semana) === semana)[0];
    const mes = Math.floor((semana - 1) / 4) + 1;
    const cuestionarioHecho = buscar_('Cuestionarios', c => c.pacienteId === p.id && Number(c.semana) > (mes - 1) * 4 && Number(c.semana) <= mes * 4)[0];
    const alta = buscar_('Alta', a => a.pacienteId === p.id);
    const cfg = leerConfig_();
    return {
      paciente: publicoPaciente_(p), semana, hoy,
      prescripcion: presc.map(limpiarPresc_),
      series: series.map(s => ({ prescripcionId: s.prescripcionId, serie: Number(s.serie), valor: num_(s.valor), kg: num_(s.kg), hecha: esSi_(s.hecha), fecha: fecha_(s.fecha) })),
      ejercicios: ejercicios.map(x => ({ prescripcionId: x.prescripcionId, dolor: num_(x.dolor), distancia: num_(x.distancia), tiempo: num_(x.tiempo), velMax: num_(x.velMax), fecha: fecha_(x.fecha) })),
      sesiones: sesiones.map(s => ({ dia: Number(s.dia), dolorAntes: num_(s.dolorAntes), dolorDespues: num_(s.dolorDespues), minutos: num_(s.minutos), fecha: fecha_(s.fecha) })),
      dolor: dolor.map(d => ({ fecha: fecha_(d.fecha), dolor: num_(d.dolor) })),
      mensaje: mensaje ? mensaje.texto : '',
      encuestaHecha: !!encuesta,
      revisionMensual: semana % 4 === 0 || (semana > 1 && (semana - 1) % 4 === 0) ? { tipo: p.cuestionario, mes, hecha: !!cuestionarioHecho } : null,
      alta: alta.map(a => ({ prueba: a.prueba, criterio: a.criterio, superada: esSi_(a.superada) })),
      contacto: { whatsapp: cfg.WHATSAPP, reservaCalendario: cfg.RESERVA_CALENDARIO },
      avisos: { clave: cfg.PUSH_CLAVE_PUBLICA || '', activados: buscar_('Avisos', a => a.pacienteId === p.id).length },
      presesion: { hecha: buscar_('Presesion', x => x.pacienteId === p.id).length > 0 },
    };
  },

  guardarEjercicio(req, q) {
    const p = paciente_(q.pacienteId);
    const pr = buscar_('Prescripcion', x => x.id === req.prescripcionId && x.pacienteId === p.id)[0];
    if (!pr) throw publico_('Ese ejercicio no está en tu plan.');
    const ahora = new Date().toISOString();
    // Se prepara y valida todo antes de borrar lo anterior del mismo día
    const series = (req.series || []).slice(0, 20).map((s, i) => ({ id: id_(), pacienteId: p.id, fecha: ahora, semana: pr.semana, dia: pr.dia, prescripcionId: pr.id, serie: i + 1, valor: num_(s.valor), kg: num_(s.kg), hecha: s.hecha ? 'si' : 'no' }));
    const resumen = { id: id_(), pacienteId: p.id, fecha: ahora, semana: pr.semana, dia: pr.dia, prescripcionId: pr.id, dolor: dolor_(req.dolor, true), distancia: num_(req.distancia), tiempo: num_(req.tiempo), velMax: num_(req.velMax) };
    conBloqueo_(() => {
      borrar_('Series', s => s.prescripcionId === pr.id && fecha_(s.fecha) === fecha_(ahora));
      series.forEach(f => anadir_('Series', f));
      borrar_('Ejercicios', s => s.prescripcionId === pr.id && fecha_(s.fecha) === fecha_(ahora));
      anadir_('Ejercicios', resumen);
    });
    return {};
  },

  guardarSesion(req, q) {
    const p = paciente_(q.pacienteId);
    anadir_('Sesiones', { id: id_(), pacienteId: p.id, fecha: new Date().toISOString(), semana: semanaDe_(p), dia: Number(req.dia) || 1, dolorAntes: dolor_(req.dolorAntes, true), dolorDespues: dolor_(req.dolorDespues), minutos: num_(req.minutos), comentario: texto_(req.comentario, 1000) });
    return {};
  },

  guardarDolor(req, q) {
    const p = paciente_(q.pacienteId);
    const hoy = fecha_(new Date());
    const fila = { id: id_(), pacienteId: p.id, fecha: new Date().toISOString(), dolor: dolor_(req.dolor), nota: texto_(req.nota, 500) }; // valida antes de borrar nada
    conBloqueo_(() => {
      borrar_('Dolor', d => d.pacienteId === p.id && fecha_(d.fecha) === hoy);
      anadir_('Dolor', fila);
    });
    return {};
  },

  guardarEncuesta(req, q) {
    const p = paciente_(q.pacienteId);
    const semana = semanaDe_(p);
    conBloqueo_(() => {
      borrar_('Encuestas', e => e.pacienteId === p.id && Number(e.semana) === semana);
      anadir_('Encuestas', { id: id_(), pacienteId: p.id, semana, fecha: new Date().toISOString(), respuestas: JSON.stringify(req.respuestas || {}) });
    });
    return {};
  },

  guardarCuestionario(req, q) {
    const p = paciente_(q.pacienteId);
    const tipo = String(req.tipo || '');
    if (!/^(VISA-A|VISA-P|VISA-H|LEFS)$/.test(tipo)) throw publico_('Cuestionario desconocido.');
    const max = tipo === 'LEFS' ? 80 : 100;
    const punt = Math.max(0, Math.min(max, Math.round(Number(req.puntuacion) || 0)));
    anadir_('Cuestionarios', { id: id_(), pacienteId: p.id, tipo, fecha: new Date().toISOString(), semana: semanaDe_(p), puntuacion: punt, respuestas: JSON.stringify(req.respuestas || []) });
    return {};
  },

  progreso(req, q) {
    return resumenProgreso_(paciente_(q.pacienteId));
  },

  /* ---------- Panel de Dani ---------- */
  pacientes() {
    return { pacientes: buscar_('Pacientes', p => p.estado !== 'archivado').map(p => Object.assign(publicoPaciente_(p), resumenCorto_(p))) };
  },

  bandeja() {
    const tareas = [];
    const hoy = new Date();
    buscar_('Pacientes', p => p.estado === 'activo').forEach(p => {
      const semana = semanaDe_(p);
      const enc = buscar_('Encuestas', e => e.pacienteId === p.id && Number(e.semana) === semana)[0];
      const publicada = buscar_('Prescripcion', x => x.pacienteId === p.id && Number(x.semana) === semana + 1 && esSi_(x.publicada)).length > 0;
      if (enc && !publicada) tareas.push({ tipo: 'revision', pacienteId: p.id, titulo: `Revisar la semana ${semana} de ${p.nombre}`, detalle: 'Encuesta recibida el ' + fechaLarga_(enc.fecha) });
      const altos = buscar_('Sesiones', s => s.pacienteId === p.id && Number(s.dolorDespues) > 4 && (hoy - new Date(s.fecha)) < 2 * 86400000)
        .concat(buscar_('Dolor', d => d.pacienteId === p.id && Number(d.dolor) > 4 && (hoy - new Date(d.fecha)) < 2 * 86400000));
      if (altos.length) { const x = altos[altos.length - 1]; tareas.push({ tipo: 'dolor', pacienteId: p.id, titulo: `${p.nombre}: dolor ${x.dolorDespues || x.dolor}/10`, detalle: x.comentario ? `«${x.comentario}»` : fechaLarga_(x.fecha) }); }
      const ultimo = ultimaActividad_(p.id);
      if (ultimo && (hoy - ultimo) > 3 * 86400000) tareas.push({ tipo: 'silencio', pacienteId: p.id, titulo: `${p.nombre} lleva ${Math.floor((hoy - ultimo) / 86400000)} días sin registrar`, detalle: 'Último registro: ' + fechaLarga_(ultimo) });
      const cu = buscar_('Cuestionarios', c => c.pacienteId === p.id && (hoy - new Date(c.fecha)) < 3 * 86400000).pop();
      if (cu) tareas.push({ tipo: 'mensual', pacienteId: p.id, titulo: `${p.nombre} completó su cuestionario ${cu.tipo}`, detalle: `${cu.puntuacion} puntos` });
    });
    buscar_('Pacientes', p => p.estado === 'pendiente').forEach(p => tareas.push({ tipo: 'nuevo', pacienteId: p.id, titulo: `${p.nombre}: pendiente de su primer acceso`, detalle: 'Tiene que entrar con su email' }));
    // Formularios pre-sesión recibidos y aún sin valorar
    buscar_('Presesion', () => true).forEach(x => {
      const p = buscar_('Pacientes', y => y.id === x.pacienteId && y.estado !== 'archivado')[0];
      if (!p) return;
      const valorada = buscar_('Historia', h => h.pacienteId === p.id && h.clave === 'valorada' && h.valor === 'si').length > 0;
      if (!valorada) tareas.push({ tipo: 'valoracion', pacienteId: p.id, titulo: `Nueva valoración: ${p.nombre}`, detalle: 'Rellenó el formulario pre-sesión el ' + fechaLarga_(x.fecha) });
    });
    return { tareas };
  },

  ficha(req) {
    const p = paciente_(req.pacienteId);
    const semana = semanaDe_(p);
    return {
      paciente: publicoPaciente_(p), semana,
      prescripcion: buscar_('Prescripcion', x => x.pacienteId === p.id).sort(porDiaOrden_).map(limpiarPresc_),
      encuestas: buscar_('Encuestas', e => e.pacienteId === p.id).map(e => ({ semana: Number(e.semana), fecha: fecha_(e.fecha), respuestas: parse_(e.respuestas, {}) })),
      cuestionarios: buscar_('Cuestionarios', c => c.pacienteId === p.id).map(c => ({ tipo: c.tipo, semana: Number(c.semana), fecha: fecha_(c.fecha), puntuacion: num_(c.puntuacion) })),
      sesiones: buscar_('Sesiones', s => s.pacienteId === p.id).map(s => ({ semana: Number(s.semana), dia: Number(s.dia), fecha: fecha_(s.fecha), dolorAntes: num_(s.dolorAntes), dolorDespues: num_(s.dolorDespues), minutos: num_(s.minutos), comentario: s.comentario })),
      ejercicios: buscar_('Ejercicios', s => s.pacienteId === p.id).map(x => ({ semana: Number(x.semana), prescripcionId: x.prescripcionId, dolor: num_(x.dolor), distancia: num_(x.distancia), velMax: num_(x.velMax), fecha: fecha_(x.fecha) })),
      series: buscar_('Series', s => s.pacienteId === p.id).map(s => ({ semana: Number(s.semana), prescripcionId: s.prescripcionId, serie: Number(s.serie), valor: num_(s.valor), kg: num_(s.kg), hecha: esSi_(s.hecha) })),
      dolor: buscar_('Dolor', d => d.pacienteId === p.id).map(d => ({ fecha: fecha_(d.fecha), dolor: num_(d.dolor), nota: d.nota })),
      alta: buscar_('Alta', a => a.pacienteId === p.id).map(a => ({ id: a.id, prueba: a.prueba, criterio: a.criterio, resultado: a.resultado, superada: esSi_(a.superada) })),
      mensajes: buscar_('Mensajes', m => m.pacienteId === p.id).map(m => ({ semana: Number(m.semana), texto: m.texto })),
      progreso: resumenProgreso_(p),
      presesion: (x => x ? { fecha: fecha_(x.fecha), version: x.version, respuestas: parse_(x.respuestas, {}) } : null)(buscar_('Presesion', x => x.pacienteId === p.id)[0]),
      consentimientos: buscar_('Consentimientos', c => c.pacienteId === p.id).map(c => ({ documento: c.documento, version: c.version, aceptado: esSi_(c.aceptado), fecha: fecha_(c.fecha) })),
      historia: buscar_('Historia', h => h.pacienteId === p.id).reduce((o, h) => (o[h.clave] = String(h.valor), o), {}),
    };
  },

  crearPaciente(req) {
    const email = normEmail_(req.email);
    if (!email) throw publico_('Falta un email válido.');
    const canon = canonEmail_(email);
    if (!texto_(req.nombre, 120)) throw publico_('Falta el nombre.');
    if (buscar_('Pacientes', p => canonEmail_(p.email) === canon && p.estado !== 'archivado').length) throw publico_('Ya hay un paciente con ese email.');
    const p = {
      id: id_(), nombre: texto_(req.nombre, 120), email, telefono: texto_(req.telefono, 30), plantilla: texto_(req.plantilla, 40),
      plan: texto_(req.plan, 60), semanas: Number(req.semanas) || 12, fechaInicio: req.fechaInicio || lunesDe_(new Date()),
      estado: 'pendiente', semanaActual: 1, cuestionario: texto_(req.cuestionario, 10), creado: new Date().toISOString(), notas: '',
    };
    anadir_('Pacientes', p);
    (req.alta || []).forEach(a => anadir_('Alta', { id: id_(), pacienteId: p.id, prueba: texto_(a.prueba, 200), criterio: texto_(a.criterio, 200), resultado: '', superada: 'no', fecha: '' }));
    registrar_('paciente', 'Creado ' + p.id);
    return { paciente: publicoPaciente_(p) };
  },

  editarPaciente(req) {
    const campos = {};
    ['nombre', 'telefono', 'plan', 'estado', 'notas', 'cuestionario'].forEach(k => { if (k in req.cambios) campos[k] = texto_(req.cambios[k], 2000); });
    if ('semanaActual' in req.cambios) campos.semanaActual = Number(req.cambios.semanaActual) || 1;
    if ('semanas' in req.cambios) campos.semanas = Number(req.cambios.semanas) || 12;
    actualizar_('Pacientes', p => p.id === req.pacienteId, campos);
    return { paciente: publicoPaciente_(paciente_(req.pacienteId)) };
  },

  /** Publica (o republica) la prescripción de una semana, guarda las decisiones y el mensaje. */
  publicarSemana(req) {
    const p = paciente_(req.pacienteId);
    const semana = Number(req.semana);
    if (!semana) throw publico_('Falta la semana.');
    conBloqueo_(() => {
      borrar_('Prescripcion', x => x.pacienteId === p.id && Number(x.semana) === semana);
      (req.ejercicios || []).forEach((e, i) => anadir_('Prescripcion', {
        id: id_(), pacienteId: p.id, semana, dia: Number(e.dia) || 1, orden: i + 1, tipo: e.tipo === 'cardio' ? 'cardio' : 'fuerza',
        ejercicio: texto_(e.ejercicio, 160), series: num_(e.series), valor: texto_(e.valor, 40), unidad: texto_(e.unidad, 20), kg: num_(e.kg),
        tempo: texto_(e.tempo, 20), descanso: texto_(e.descanso, 20), indicacion: texto_(e.indicacion, 500), video: texto_(e.video, 300), publicada: 'si', creado: new Date().toISOString(),
      }));
      (req.decisiones || []).forEach(d => anadir_('Decisiones', {
        id: id_(), pacienteId: p.id, semana, prescripcionId: texto_(d.prescripcionId, 60), ejercicio: texto_(d.ejercicio, 160), accion: texto_(d.accion, 20),
        propuesta: JSON.stringify(d.propuesta || {}), final: JSON.stringify(d.final || {}), dolorMedio: num_(d.dolorMedio), fecha: new Date().toISOString(),
      }));
      borrar_('Mensajes', m => m.pacienteId === p.id && Number(m.semana) === semana);
      if (req.mensaje) anadir_('Mensajes', { id: id_(), pacienteId: p.id, semana, texto: texto_(req.mensaje, 1500), fecha: new Date().toISOString() });
      if (semana > Number(p.semanaActual || 0)) actualizar_('Pacientes', x => x.id === p.id, { semanaActual: semana });
    });
    let aviso = null;
    if (req.avisar && p.estado === 'activo') {
      const cfg = leerConfig_();
      // Primero notificación en el móvil; el email solo si no tiene notificaciones activadas (y está permitido en Ajustes)
      const enviadas = notificar_(cfg, p.id, `Tu semana ${semana} ya está lista`, 'Dani ha preparado tu plan. Ábrelo para ver tus ejercicios.', cfg.APP_URL);
      if (enviadas > 0) aviso = 'notificacion';
      else if (cfg.EMAIL_SI_NO_HAY_NOTIFICACIONES !== 'no') {
        enviar_(cfg, p.email, `Tu semana ${semana} ya está lista`, `Hola ${nombrePila_(p.nombre)}`, `<p>Dani ha preparado tu semana ${semana}.</p>${req.mensaje ? `<p><i>«${escapar_(req.mensaje)}»</i></p>` : ''}`);
        aviso = 'email';
      }
    }
    return { aviso };
  },

  /* ---------- Notificaciones en el móvil ---------- */
  guardarAviso(req, q) {
    const s = req.suscripcion || {};
    const endpoint = String(s.endpoint || ''), keys = s.keys || {};
    if (!/^https:\/\/[^\s]+$/.test(endpoint) || endpoint.length > 1000 || !keys.p256dh || !keys.auth) throw publico_('No se ha podido activar el aviso en este móvil.');
    conBloqueo_(() => {
      borrar_('Avisos', a => a.endpoint === endpoint);
      anadir_('Avisos', { pacienteId: q.pacienteId, endpoint, p256dh: texto_(keys.p256dh, 200), auth: texto_(keys.auth, 100), creado: new Date().toISOString() });
    });
    return { activados: buscar_('Avisos', a => a.pacienteId === q.pacienteId).length };
  },

  /** Formulario pre-sesión + consentimientos. Los tres consentimientos principales son obligatorios. */
  guardarPresesion(req, q) {
    const p = paciente_(q.pacienteId);
    const c = req.consentimientos || {};
    if (!c.privacidad || !c.informado || !c.condiciones) throw publico_('Para continuar tienes que aceptar la política de privacidad, el consentimiento informado y las condiciones.');
    const r = req.respuestas || {};
    const limpio = {};
    Object.keys(r).slice(0, 120).forEach(k => { if (/^[a-zA-Z0-9_]{1,40}$/.test(k)) limpio[k] = texto_(r[k], 3000); });
    if (!limpio.nombre) throw publico_('Falta tu nombre.');
    const version = texto_(req.version, 20) || 'v1';
    const ahora = new Date().toISOString();
    conBloqueo_(() => {
      borrar_('Presesion', x => x.pacienteId === p.id);
      anadir_('Presesion', { pacienteId: p.id, fecha: ahora, version, respuestas: JSON.stringify(limpio) });
      ['privacidad', 'informado', 'condiciones', 'grabacion', 'docencia', 'rrss', 'comerciales'].forEach(d =>
        anadir_('Consentimientos', { pacienteId: p.id, documento: d, version, aceptado: c[d] ? 'si' : 'no', fecha: ahora }));
      const cambios = {};
      if (!p.telefono && limpio.telefono) cambios.telefono = limpio.telefono.replace(/[^\d+]/g, '');
      if (Object.keys(cambios).length) actualizar_('Pacientes', x => x.id === p.id, cambios);
    });
    registrar_('presesion', p.id);
    return {};
  },

  quitarAviso(req, q) {
    borrar_('Avisos', a => a.pacienteId === q.pacienteId && a.endpoint === String(req.endpoint || ''));
    return {};
  },

  guardarAlta(req) {
    actualizar_('Alta', a => a.id === req.id, { resultado: texto_(req.resultado, 200), superada: req.superada ? 'si' : 'no', fecha: new Date().toISOString() });
    return {};
  },

  darAlta(req) {
    const p = paciente_(req.pacienteId);
    const pendientes = buscar_('Alta', a => a.pacienteId === p.id && !esSi_(a.superada));
    if (pendientes.length) throw publico_('Faltan pruebas de alta por superar.');
    actualizar_('Pacientes', x => x.id === p.id, { estado: 'alta' });
    registrar_('alta', p.id);
    return {};
  },

  guardarBiblioteca(req) {
    const nombre = texto_(req.nombre, 160);
    if (!nombre) throw publico_('Falta el nombre del ejercicio.');
    if (buscar_('Biblioteca', b => b.nombre === nombre).length) actualizar_('Biblioteca', b => b.nombre === nombre, { video: texto_(req.video, 300), notas: texto_(req.notas, 500) });
    else anadir_('Biblioteca', { nombre, video: texto_(req.video, 300), notas: texto_(req.notas, 500) });
    return { biblioteca: buscar_('Biblioteca', () => true) };
  },

  /** Notas de Dani en la historia clínica: pares clave → texto (exploración, banderas rojas, diferencial…). */
  guardarHistoria(req) {
    const p = paciente_(req.pacienteId);
    const cambios = req.cambios || {};
    const ahora = new Date().toISOString();
    conBloqueo_(() => Object.keys(cambios).slice(0, 200).forEach(k => {
      if (!/^[a-zA-Z0-9_.-]{1,60}$/.test(k)) return;
      const v = texto_(cambios[k], 5000);
      borrar_('Historia', h => h.pacienteId === p.id && h.clave === k);
      if (v !== '') anadir_('Historia', { pacienteId: p.id, clave: k, valor: v, fecha: ahora });
    }));
    return { historia: buscar_('Historia', h => h.pacienteId === p.id).reduce((o, h) => (o[h.clave] = String(h.valor), o), {}) };
  },

  config() {
    return { config: leerConfig_(), biblioteca: buscar_('Biblioteca', () => true) };
  },

  guardarConfig(req) {
    const permitidas = Object.keys(CONFIG_INICIAL).filter(k => k !== 'ADMIN_EMAIL');
    Object.keys(req.cambios || {}).forEach(k => {
      if (permitidas.indexOf(k) < 0) return;
      if (buscar_('Config', c => c.clave === k).length) actualizar_('Config', c => c.clave === k, { valor: texto_(req.cambios[k], 300) });
      else anadir_('Config', { clave: k, valor: texto_(req.cambios[k], 300) });
    });
    return { config: leerConfig_() };
  },
};

/* ============================== Recordatorios (cada hora) ============================== */

function recordatorios() {
  const cfg = leerConfig_();
  if (cfg.RECORDATORIOS_ACTIVOS !== 'si') return;
  const ahora = new Date();
  const hora = Number(Utilities.formatDate(ahora, ZONA, 'H'));
  const diaSemana = Number(Utilities.formatDate(ahora, ZONA, 'u')) % 7; // 0 = domingo
  const hoy = fecha_(ahora);
  buscar_('Pacientes', p => p.estado === 'activo').forEach(p => {
    const nombre = nombrePila_(p.nombre);
    const semana = semanaDe_(p);
    if (hora === Number(cfg.RECORDATORIO_DOLOR_HORA) && !buscar_('Dolor', d => d.pacienteId === p.id && fecha_(d.fecha) === hoy).length)
      enviar_(cfg, p.email, '¿Cómo está tu tendón hoy?', `Hola ${nombre}`, '<p>Te falta apuntar el dolor de hoy. Son 10 segundos.</p>');
    const encuestaHecha = buscar_('Encuestas', e => e.pacienteId === p.id && Number(e.semana) === semana).length > 0;
    const esDomingo = diaSemana === Number(cfg.RECORDATORIO_ENCUESTA_DIA);
    if (!encuestaHecha && ((esDomingo && hora === Number(cfg.RECORDATORIO_ENCUESTA_HORA)) || (diaSemana === (Number(cfg.RECORDATORIO_ENCUESTA_DIA) + 1) % 7 && hora === Number(cfg.RECORDATORIO_ENCUESTA_REPITE_HORA))))
      enviar_(cfg, p.email, `Tu encuesta de la semana ${semana}`, `Hola ${nombre}`, `<p>Rellena tu encuesta semanal (2 minutos) y preparo tu semana ${semana + 1}.</p>`);
    if (esDomingo && hora === Number(cfg.RECORDATORIO_ENCUESTA_HORA) && semana % 4 === 0 && p.cuestionario) {
      const hecho = buscar_('Cuestionarios', c => c.pacienteId === p.id && Number(c.semana) > semana - 4).length > 0;
      if (!hecho) enviar_(cfg, p.email, 'Tu revisión mensual', `Hola ${nombre}`, `<p>Cumples ${semana / 4} ${semana / 4 === 1 ? 'mes' : 'meses'} en RCD. Toca el cuestionario ${p.cuestionario} (5 minutos). Si quieres una videollamada de seguimiento, escríbeme por WhatsApp.</p>`);
    }
  });
}

/* ============================== Cálculos ============================== */

function semanaDe_(p) {
  const s = Number(p.semanaActual) || 1;
  return Math.max(1, Math.min(s, Number(p.semanas) || 52));
}

function resumenCorto_(p) {
  const semana = semanaDe_(p);
  const dolorSemanal = mediasDolorPorSemana_(p);
  const ultima = ultimaActividad_(p.id);
  return { semana, dolor: dolorSemanal.map(d => d.media), ultimaActividad: ultima ? ultima.toISOString() : null, adherencia: adherencia_(p, semana) };
}

function mediasDolorPorSemana_(p) {
  const inicio = new Date(p.fechaInicio);
  const porSemana = {};
  buscar_('Dolor', d => d.pacienteId === p.id).forEach(d => {
    const s = Math.floor((new Date(d.fecha) - inicio) / (7 * 86400000)) + 1;
    if (s < 1) return;
    (porSemana[s] = porSemana[s] || []).push(Number(d.dolor));
  });
  return Object.keys(porSemana).map(Number).sort((a, b) => a - b).map(s => ({ semana: s, media: redondear_(media_(porSemana[s]), 1) }));
}

function adherencia_(p, semana) {
  const dias = {};
  buscar_('Prescripcion', x => x.pacienteId === p.id && Number(x.semana) === semana && esSi_(x.publicada)).forEach(x => dias[x.dia] = 1);
  const programados = Object.keys(dias).length;
  if (!programados) return null;
  const hechas = {};
  buscar_('Sesiones', s => s.pacienteId === p.id && Number(s.semana) === semana).forEach(s => hechas[s.dia] = 1);
  return Math.round(Object.keys(hechas).length / programados * 100);
}

function resumenProgreso_(p) {
  const semanas = [];
  for (let s = 1; s <= semanaDe_(p); s++) semanas.push(s);
  const dolor = mediasDolorPorSemana_(p);
  const presc = buscar_('Prescripcion', x => x.pacienteId === p.id);
  const nombrePorId = {}; presc.forEach(x => nombrePorId[x.id] = x.ejercicio);
  const fuerza = {};
  buscar_('Series', s => s.pacienteId === p.id && esSi_(s.hecha)).forEach(s => {
    const n = nombrePorId[s.prescripcionId]; if (!n) return;
    const f = fuerza[n] = fuerza[n] || {};
    const w = f[s.semana] = f[s.semana] || { tonelaje: 0, rm: 0 };
    const kg = Number(s.kg) || 0, reps = Number(s.valor) || 0;
    w.tonelaje += kg * reps;
    w.rm = Math.max(w.rm, kg * (1 + reps / 30)); // Epley
  });
  const cardio = {};
  buscar_('Ejercicios', e => e.pacienteId === p.id && Number(e.distancia) > 0).forEach(e => {
    const c = cardio[e.semana] = cardio[e.semana] || { distancia: 0, velMax: 0 };
    c.distancia += Number(e.distancia) || 0; c.velMax = Math.max(c.velMax, Number(e.velMax) || 0);
  });
  const pasos = buscar_('Encuestas', e => e.pacienteId === p.id).map(e => ({ semana: Number(e.semana), pasos: Number(parse_(e.respuestas, {}).pasos) || null }));
  return {
    semanas,
    dolor,
    adherencia: semanas.map(s => ({ semana: s, valor: adherencia_(p, s) })),
    fuerza: Object.keys(fuerza).filter(n => Object.keys(fuerza[n]).some(s => fuerza[n][s].tonelaje > 0)).map(n => ({ ejercicio: n, semanas: Object.keys(fuerza[n]).map(Number).sort((a, b) => a - b).map(s => ({ semana: s, tonelaje: Math.round(fuerza[n][s].tonelaje), rm: redondear_(fuerza[n][s].rm, 1) })) })),
    cardio: Object.keys(cardio).map(Number).sort((a, b) => a - b).map(s => ({ semana: s, distancia: redondear_(cardio[s].distancia, 1), velMax: redondear_(cardio[s].velMax, 1) })),
    pasos,
    cuestionarios: buscar_('Cuestionarios', c => c.pacienteId === p.id).map(c => ({ tipo: c.tipo, semana: Number(c.semana), puntuacion: num_(c.puntuacion) })),
  };
}

function ultimaActividad_(pacienteId) {
  const fechas = []
    .concat(buscar_('Dolor', d => d.pacienteId === pacienteId).map(d => new Date(d.fecha)))
    .concat(buscar_('Sesiones', d => d.pacienteId === pacienteId).map(d => new Date(d.fecha)))
    .concat(buscar_('Encuestas', d => d.pacienteId === pacienteId).map(d => new Date(d.fecha)));
  return fechas.length ? new Date(Math.max.apply(null, fechas)) : null;
}

/* ============================== Datos (hoja de cálculo) ============================== */

let _ss = null;
const _cache = {};

function hoja_(ss) {
  if (ss) return ss;
  if (_ss) return _ss;
  const id = PropertiesService.getScriptProperties().getProperty('HOJA_ID');
  if (!id) throw publico_('La app aún no está instalada: ejecuta «instalar» en el editor.');
  _ss = SpreadsheetApp.openById(id);
  return _ss;
}

/** Devuelve la pestaña de una tabla y la crea si falta (así una versión nueva no obliga a reinstalar). */
function pestana_(tabla, ss) {
  const libro = hoja_(ss);
  let sh = libro.getSheetByName(tabla);
  if (!sh) {
    sh = libro.insertSheet(tabla);
    sh.getRange(1, 1, 1, TABLAS[tabla].length).setValues([TABLAS[tabla]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function filas_(tabla, ss) {
  if (_cache[tabla]) return _cache[tabla];
  const sh = pestana_(tabla, ss);
  const cols = TABLAS[tabla];
  const n = sh.getLastRow() - 1;
  const vals = n > 0 ? sh.getRange(2, 1, n, cols.length).getValues() : [];
  _cache[tabla] = vals.map(v => { const o = {}; cols.forEach((c, i) => o[c] = v[i] instanceof Date ? v[i].toISOString() : v[i]); return o; });
  return _cache[tabla];
}

function buscar_(tabla, filtro, ss) { return filas_(tabla, ss).filter(filtro); }

function anadir_(tabla, obj, ss) {
  const cols = TABLAS[tabla];
  const fila = cols.map(c => (obj[c] === undefined || obj[c] === null) ? '' : obj[c]);
  pestana_(tabla, ss).appendRow(fila);
  if (_cache[tabla]) { const o = {}; cols.forEach((c, i) => o[c] = fila[i]); _cache[tabla].push(o); }
}

function actualizar_(tabla, filtro, cambios) {
  const cols = TABLAS[tabla];
  const sh = pestana_(tabla);
  const filas = filas_(tabla);
  filas.forEach((f, i) => {
    if (!filtro(f)) return;
    Object.keys(cambios).forEach(k => {
      const c = cols.indexOf(k); if (c < 0) return;
      f[k] = cambios[k];
      sh.getRange(i + 2, c + 1).setValue(cambios[k]);
    });
  });
}

function borrar_(tabla, filtro) {
  const sh = pestana_(tabla);
  const filas = filas_(tabla);
  for (let i = filas.length - 1; i >= 0; i--) if (filtro(filas[i])) { sh.deleteRow(i + 2); filas.splice(i, 1); }
}

/** Configuración guardada en la pestaña Config. Las claves que aún no existan toman su valor inicial. */
function leerConfig_(ss, soloGuardada) {
  const o = soloGuardada ? {} : Object.assign({}, CONFIG_INICIAL);
  filas_('Config', ss).forEach(r => o[r.clave] = String(r.valor));
  return o;
}

function registrar_(tipo, detalle, ss) {
  try { anadir_('Registro', { fecha: new Date().toISOString(), tipo, detalle: String(detalle).slice(0, 2000) }, ss); } catch (e) { /* no bloquear por el registro */ }
}

function conBloqueo_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ============================== Utilidades ============================== */

function autenticar_(token) {
  if (!token) throw publico_('Inicia sesión de nuevo.', 'sesion');
  const a = buscar_('Accesos', x => x.hash === hash_(token))[0];
  if (!a || new Date(a.expira).getTime() < Date.now()) throw publico_('Tu sesión ha caducado. Entra de nuevo con tu email.', 'sesion');
  if (a.rol === 'paciente') {
    const p = buscar_('Pacientes', x => x.id === a.pacienteId)[0];
    if (!p || p.estado === 'archivado') throw publico_('Tu acceso está desactivado. Escribe a Dani.', 'permiso');
  }
  return { rol: a.rol, email: a.email, pacienteId: a.pacienteId };
}

function paciente_(id) {
  const p = buscar_('Pacientes', x => x.id === id)[0];
  if (!p) throw publico_('No encuentro ese paciente.');
  return p;
}

function publicoPaciente_(p) {
  return { id: p.id, nombre: p.nombre, email: p.email, telefono: p.telefono, plantilla: p.plantilla, plan: p.plan, semanas: Number(p.semanas), fechaInicio: fecha_(p.fechaInicio), estado: p.estado, semanaActual: Number(p.semanaActual), cuestionario: p.cuestionario };
}

function limpiarPresc_(x) {
  return { id: x.id, semana: Number(x.semana), dia: Number(x.dia), orden: Number(x.orden), tipo: x.tipo, ejercicio: x.ejercicio, series: num_(x.series), valor: String(x.valor), unidad: x.unidad, kg: num_(x.kg), tempo: x.tempo, descanso: x.descanso, indicacion: x.indicacion, video: x.video };
}

function porDiaOrden_(a, b) { return (a.semana - b.semana) || (a.dia - b.dia) || (a.orden - b.orden); }

function ultimosDias_(lista, n) {
  const limite = Date.now() - n * 86400000;
  return lista.filter(d => new Date(d.fecha).getTime() >= limite).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

/** Envía una notificación a todos los móviles del paciente a través del servicio de Netlify.
    Devuelve cuántas se entregaron. Los móviles que ya no existen se borran solos. */
function notificar_(cfg, pacienteId, titulo, texto, url) {
  const subs = buscar_('Avisos', a => a.pacienteId === pacienteId);
  if (!subs.length || !cfg.PUSH_URL || !cfg.PUSH_SECRETO) return 0;
  try {
    const r = UrlFetchApp.fetch(cfg.PUSH_URL, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ secreto: cfg.PUSH_SECRETO, titulo, texto, url, subs: subs.map(s => ({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } })) }),
    });
    if (r.getResponseCode() !== 200) { registrar_('aviso', 'Servicio de notificaciones respondió ' + r.getResponseCode()); return 0; }
    const res = JSON.parse(r.getContentText()).resultados || [];
    res.filter(x => x.status === 404 || x.status === 410).forEach(x => borrar_('Avisos', a => a.endpoint === x.endpoint));
    return res.filter(x => x.ok).length;
  } catch (e) { registrar_('aviso', 'No enviada: ' + e); return 0; }
}

function enviar_(cfg, para, asunto, saludo, cuerpo) {
  try {
    MailApp.sendEmail({ to: para, subject: asunto, name: cfg.CLINICA, htmlBody: plantillaEmail_(cfg, saludo, cuerpo + `<p><a href="${cfg.APP_URL}" style="display:inline-block;background:#FF3434;color:#000;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">Abrir la app</a></p>`) });
  } catch (e) { registrar_('email', 'No enviado a ' + para + ': ' + e); }
}

function plantillaEmail_(cfg, titulo, cuerpo) {
  return `<div style="font-family:Arial,sans-serif;background:#000;color:#FFFBE8;padding:28px;border-radius:16px;max-width:520px">
    <p style="color:#FF3434;font-weight:700;letter-spacing:2px;margin:0 0 16px">✦ ${escapar_(cfg.CLINICA).toUpperCase()}</p>
    <h2 style="margin:0 0 8px;font-size:22px">${escapar_(titulo)}</h2>${cuerpo}
    <p style="color:rgba(255,251,232,.6);font-size:12px;margin-top:24px">Readapta con Dani · fisioterapia online para corredores</p></div>`;
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function publico_(msg, codigo) { const e = new Error(msg); e.publico = true; e.codigo = codigo || 'error'; return e; }
function hash_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)); }
function id_() { return Utilities.getUuid().slice(0, 13); }
/** Forma para comparar emails: en Gmail los puntos y lo que va tras «+» no cuentan (llegan al mismo buzón). */
function canonEmail_(e) {
  const s = normEmail_(e); if (!s) return '';
  let [local, dominio] = s.split('@');
  if (dominio === 'gmail.com' || dominio === 'googlemail.com') { local = local.split('+')[0].replace(/\./g, ''); dominio = 'gmail.com'; }
  return local + '@' + dominio;
}
function normEmail_(e) { const s = String(e || '').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : ''; }
function num_(v) { if (v === '' || v === null || v === undefined) return ''; const n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : ''; }
function dolor_(v, opcional) { if ((v === '' || v == null) && opcional) return ''; const n = Math.round(Number(v)); if (!(n >= 0 && n <= 10)) throw publico_('El dolor va de 0 a 10.'); return n; }
function texto_(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
function esSi_(v) { return v === true || v === 'si' || v === 'TRUE'; }
function parse_(s, def) { try { return JSON.parse(s); } catch (e) { return def; } }
function media_(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function redondear_(n, d) { const f = Math.pow(10, d); return Math.round(n * f) / f; }
function fecha_(d) { return d ? Utilities.formatDate(new Date(d), ZONA, 'yyyy-MM-dd') : ''; }
function fechaLarga_(d) { return Utilities.formatDate(new Date(d), ZONA, "d/MM 'a las' HH:mm"); }
function lunesDe_(d) { const x = new Date(d); const dia = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dia); return fecha_(x); }
function nombrePila_(n) { return String(n || '').split(' ')[0]; }
function escapar_(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
