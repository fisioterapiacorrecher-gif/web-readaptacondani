/* Pruebas del motor (Code.gs) fuera de Google: simula hojas, email y servicios de Apps Script.
   Ejecutar: node app/backend/pruebas.js */
const assert = require('assert');
const { crearMotor } = require('./simulador');
const { ctx, libro, correos, triggers, nueva, api, peticiones, setRespuestaPush, carpetas, carpeta, drive, trozoSubida } = crearMotor();
const ultimoCodigo = () => (correos[correos.length - 1].subject.match(/(\d{6})$/) || [])[1];
const ok = (r, msg) => { assert.ok(r.ok, (msg || '') + ' → ' + JSON.stringify(r)); return r; };
let pasos = 0; const paso = (t) => console.log(`  ✓ ${++pasos}. ${t}`);

/* ---------- Pruebas ---------- */
console.log('Pruebas del motor RCD');
nueva(); ctx.instalar();
assert.ok(libro.getSheetByName('Pacientes') && !libro.getSheetByName('Hoja 1') && triggers.includes('recordatorios'));
paso('instalar crea las pestañas, la configuración y el recordatorio horario');

let r = api({ action: 'pedirCodigo', email: 'desconocido@x.com' });
assert.ok(r.ok && correos.length === 0);
paso('un email desconocido no recibe código ni se le dice que no existe');

ok(api({ action: 'pedirCodigo', email: 'INFO@rcdclinic.com' }));
assert.strictEqual(correos.length, 1);
r = api({ action: 'verificarCodigo', email: 'info@rcdclinic.com', codigo: '000000' });
assert.ok(!r.ok && r.codigo === 'codigo');
r = ok(api({ action: 'verificarCodigo', email: 'info@rcdclinic.com', codigo: ultimoCodigo() }));
const admin = r.token; assert.strictEqual(r.rol, 'admin');
paso('Dani entra con código (un código erróneo se rechaza)');

r = api({ action: 'pacientes', token: 'falso' });
assert.ok(!r.ok && r.codigo === 'sesion');
paso('sin sesión válida no se puede leer nada');

r = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Ricardo Prueba', email: 'ricardo@ejemplo.com', plantilla: 'aquiles', plan: 'Readaptación Completa', semanas: 12, cuestionario: 'VISA-A',
  fechaInicio: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), alta: [{ prueba: 'VISA-A', criterio: '≥ 90' }, { prueba: 'Pogos', criterio: 'dolor ≤ 2' }] }));
const pid = r.paciente.id;
assert.ok(!api({ action: 'crearPaciente', token: admin, nombre: 'Otro', email: 'ricardo@ejemplo.com' }).ok);
paso('Dani crea un paciente con sus pruebas de alta (sin duplicar emails)');

ok(api({ action: 'publicarSemana', token: admin, pacienteId: pid, semana: 1, mensaje: '¡Empezamos!', avisar: true, ejercicios: [
  { dia: 1, ejercicio: 'Isométrico de gemelo', series: 5, valor: '45', unidad: 's', kg: 0 },
  { dia: 1, ejercicio: 'Puntillas aguantando 2″', series: 4, valor: '10', unidad: 'reps', kg: 10, tempo: '3-0-3' },
  { dia: 2, tipo: 'cardio', ejercicio: 'Correr-caminar 4 × (5′ + 1′)' },
] }));
paso('Dani publica la semana 1');

ok(api({ action: 'pedirCodigo', email: 'ricardo@ejemplo.com' }));
r = api({ action: 'pedirCodigo', email: 'ricardo@ejemplo.com' });
assert.ok(!r.ok);
r = ok(api({ action: 'verificarCodigo', email: 'ricardo@ejemplo.com', codigo: ultimoCodigo() }));
const pac = r.token; assert.strictEqual(r.rol, 'paciente');
paso('el paciente entra con su código (y no puede pedir dos en menos de un minuto)');

r = api({ action: 'pacientes', token: pac });
assert.ok(!r.ok && r.codigo === 'permiso');
paso('un paciente no puede usar acciones del panel');

r = ok(api({ action: 'yo', token: pac }));
assert.strictEqual(r.prescripcion.length, 3); assert.strictEqual(r.mensaje, '¡Empezamos!'); assert.strictEqual(r.paciente.estado, 'activo');
const pr2 = r.prescripcion.find(x => x.ejercicio.startsWith('Puntillas')).id;
const prC = r.prescripcion.find(x => x.tipo === 'cardio').id;
paso('el paciente ve su semana, el mensaje de Dani y pasa a «activo»');

ok(api({ action: 'guardarEjercicio', token: pac, prescripcionId: pr2, dolor: 3, series: [{ valor: 10, kg: 10, hecha: true }, { valor: 10, kg: 10, hecha: true }, { valor: 8, kg: 10, hecha: true }] }));
ok(api({ action: 'guardarEjercicio', token: pac, prescripcionId: pr2, dolor: 3, series: [{ valor: 10, kg: 10, hecha: true }, { valor: 10, kg: 10, hecha: true }, { valor: 10, kg: 10, hecha: true }, { valor: 10, kg: 10, hecha: true }] }));
ok(api({ action: 'guardarEjercicio', token: pac, prescripcionId: prC, dolor: 2, distancia: 3.5, tiempo: 24, velMax: 10.4 }));
ok(api({ action: 'guardarSesion', token: pac, dia: 1, dolorAntes: 3, dolorDespues: 6, minutos: 40, comentario: 'Tirantez al final' }));
ok(api({ action: 'guardarDolor', token: pac, dolor: 4, nota: 'escaleras' }));
ok(api({ action: 'guardarDolor', token: pac, dolor: 3 }));
assert.ok(!api({ action: 'guardarDolor', token: pac, dolor: 14 }).ok);
r = ok(api({ action: 'yo', token: pac }));
assert.strictEqual(r.series.filter(s => s.prescripcionId === pr2).length, 4);
assert.strictEqual(r.dolor.length, 1); assert.strictEqual(r.dolor[0].dolor, 3);
paso('guardar series, cardio, sesión y dolor (repetir el mismo día sustituye, no duplica; dolor fuera de 0–10 se rechaza)');

ok(api({ action: 'guardarEncuesta', token: pac, respuestas: { pautas: 9, pasos: 8900 } }));
ok(api({ action: 'guardarCuestionario', token: pac, tipo: 'VISA-A', puntuacion: 78, respuestas: [] }));
assert.ok(!api({ action: 'guardarCuestionario', token: pac, tipo: 'OTRO', puntuacion: 1 }).ok);
paso('encuesta semanal y cuestionario VISA-A');

r = ok(api({ action: 'bandeja', token: admin }));
const tipos = r.tareas.map(t => t.tipo);
assert.ok(tipos.includes('revision') && tipos.includes('dolor') && tipos.includes('mensual'), JSON.stringify(r.tareas));
paso('la bandeja de Dani avisa de la encuesta por revisar, el dolor > 4 y el cuestionario');

r = ok(api({ action: 'ficha', token: admin, pacienteId: pid }));
const f = r.progreso.fuerza.find(x => x.ejercicio.startsWith('Puntillas'));
assert.strictEqual(f.semanas[0].tonelaje, 400);
assert.strictEqual(r.progreso.cardio[0].distancia, 3.5);
assert.strictEqual(r.progreso.adherencia[0].valor, 50);
paso('progreso: tonelaje 4×10×10 = 400 kg, distancia de cardio y adherencia 1 de 2 días = 50 %');

ok(api({ action: 'publicarSemana', token: admin, pacienteId: pid, semana: 2, mensaje: 'Subimos carga', ejercicios: [{ dia: 1, ejercicio: 'Puntillas aguantando 2″', series: 4, valor: '10', kg: 12.5 }],
  decisiones: [{ prescripcionId: pr2, ejercicio: 'Puntillas', accion: 'kg', propuesta: { kg: 12.5 }, final: { kg: 15 }, dolorMedio: 3.5 }] }));
r = ok(api({ action: 'yo', token: pac }));
assert.strictEqual(r.semana, 2); assert.strictEqual(r.prescripcion.length, 1); assert.strictEqual(r.mensaje, 'Subimos carga');
assert.ok(libro.getSheetByName('Decisiones').rows.length === 2);
paso('publicar la semana 2 avanza al paciente y guarda la decisión (propuesta y ajuste a mano)');

r = ok(api({ action: 'ficha', token: admin, pacienteId: pid }));
assert.ok(!api({ action: 'darAlta', token: admin, pacienteId: pid }).ok);
r.alta.forEach(a => ok(api({ action: 'guardarAlta', token: admin, id: a.id, resultado: 'ok', superada: true })));
ok(api({ action: 'darAlta', token: admin, pacienteId: pid }));
paso('no se puede dar el alta hasta superar todas las pruebas');
r = api({ action: 'yo', token: pac });
assert.ok(!r.ok && r.codigo === 'sesion');
let n9 = correos.length; ok(api({ action: 'pedirCodigo', email: 'ricardo@ejemplo.com' })); assert.strictEqual(correos.length, n9);
paso('al dar el alta se cierra su acceso en todos sus móviles y ya no recibe códigos');

ok(api({ action: 'guardarConfig', token: admin, cambios: { RESERVA_CALENDARIO: 'https://calendar.app.google/xyz', ADMIN_EMAIL: 'hacker@x.com' } }));
r = ok(api({ action: 'config', token: admin }));
assert.strictEqual(r.config.RESERVA_CALENDARIO, 'https://calendar.app.google/xyz'); assert.strictEqual(r.config.ADMIN_EMAIL, 'info@rcdclinic.com');
paso('ajustes: se guarda el enlace del calendario y no se puede cambiar el email de Dani desde la app');


/* ---------- Notificaciones en el móvil ---------- */
{
  // Paciente nuevo con su semana; Dani activa las notificaciones en Ajustes
  let r2 = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Marta Avisos', email: 'marta@ejemplo.com', plantilla: 'rotuliana', semanas: 12 }));
  const mid = r2.paciente.id;
  ok(api({ action: 'pedirCodigo', email: 'marta@ejemplo.com' }));
  const tM = ok(api({ action: 'verificarCodigo', email: 'marta@ejemplo.com', codigo: ultimoCodigo() })).token;
  r2 = ok(api({ action: 'yo', token: tM }));
  assert.strictEqual(r2.avisos.clave, ''); assert.ok(!('PUSH_SECRETO' in r2.avisos));
  ok(api({ action: 'guardarConfig', token: admin, cambios: { PUSH_CLAVE_PUBLICA: 'BClavePublica', PUSH_SECRETO: 'secreto-largo' } }));
  r2 = ok(api({ action: 'yo', token: tM }));
  assert.strictEqual(r2.avisos.clave, 'BClavePublica');
  assert.ok(!JSON.stringify(r2).includes('secreto-largo'));
  paso('la app del paciente recibe la clave pública de notificaciones, nunca el secreto');

  assert.ok(!api({ action: 'guardarAviso', token: tM, suscripcion: { endpoint: 'http://inseguro', keys: { p256dh: 'a', auth: 'b' } } }).ok);
  ok(api({ action: 'guardarAviso', token: tM, suscripcion: { endpoint: 'https://push.ejemplo/movil-1', keys: { p256dh: 'p1', auth: 'a1' } } }));
  r2 = ok(api({ action: 'guardarAviso', token: tM, suscripcion: { endpoint: 'https://push.ejemplo/movil-1', keys: { p256dh: 'p1', auth: 'a1' } } }));
  assert.strictEqual(r2.activados, 1);
  ok(api({ action: 'guardarAviso', token: tM, suscripcion: { endpoint: 'https://push.ejemplo/movil-2', keys: { p256dh: 'p2', auth: 'a2' } } }));
  paso('activar notificaciones en dos móviles (repetir el mismo móvil no lo duplica; solo direcciones https)');

  const correosAntes = correos.length;
  r2 = ok(api({ action: 'publicarSemana', token: admin, pacienteId: mid, semana: 1, avisar: true, ejercicios: [{ dia: 1, ejercicio: 'Sentadilla isométrica 1', series: 4, valor: '45', unidad: 's' }] }));
  assert.strictEqual(r2.aviso, 'notificacion');
  const pet = peticiones[peticiones.length - 1];
  assert.strictEqual(pet.cuerpo.secreto, 'secreto-largo'); assert.strictEqual(pet.cuerpo.subs.length, 2);
  assert.ok(/semana 1/.test(pet.cuerpo.titulo));
  assert.strictEqual(correos.length, correosAntes);
  paso('al publicar la semana llega una notificación a sus dos móviles y no se envía email');

  setRespuestaPush(b => ({ ok: true, resultados: b.subs.map((x, i) => i === 0 ? { endpoint: x.endpoint, ok: true } : { endpoint: x.endpoint, ok: false, status: 410 }) }));
  ok(api({ action: 'publicarSemana', token: admin, pacienteId: mid, semana: 2, avisar: true, ejercicios: [] }));
  assert.strictEqual(libro.getSheetByName('Avisos').rows.length - 1, 1);
  paso('un móvil que ya no existe (respuesta 410) se borra solo');

  setRespuestaPush(b => ({ ok: true, resultados: b.subs.map(x => ({ endpoint: x.endpoint, ok: false, status: 500 })) }));
  r2 = ok(api({ action: 'publicarSemana', token: admin, pacienteId: mid, semana: 3, avisar: true, ejercicios: [] }));
  assert.strictEqual(r2.aviso, 'email'); assert.strictEqual(correos.length, correosAntes + 1);
  ok(api({ action: 'guardarConfig', token: admin, cambios: { EMAIL_SI_NO_HAY_NOTIFICACIONES: 'no' } }));
  r2 = ok(api({ action: 'publicarSemana', token: admin, pacienteId: mid, semana: 4, avisar: true, ejercicios: [] }));
  assert.strictEqual(r2.aviso, null); assert.strictEqual(correos.length, correosAntes + 1);
  paso('si la notificación no llega, email de reserva (y se puede desactivar en Ajustes)');

  // Actualizar el código sin reinstalar: falta la pestaña Avisos y claves nuevas de Config
  libro.sheets.splice(libro.sheets.indexOf(libro.getSheetByName('Avisos')), 1);
  ok(api({ action: 'yo', token: tM }));
  assert.ok(libro.getSheetByName('Avisos'));
  paso('al actualizar el código, la pestaña nueva se crea sola (no hace falta reinstalar)');
}

/* ---------- Emails de Gmail escritos de otra forma (caso Sonia) ---------- */
{
  ok(api({ action: 'crearPaciente', token: admin, nombre: 'Sonia Gmail', email: 'sonia.valencia.sonia@gmail.com', plantilla: 'rotuliana' }));
  assert.ok(!api({ action: 'crearPaciente', token: admin, nombre: 'Duplicada', email: 'SoniaValencia.Sonia@gmail.com' }).ok);
  const n0 = correos.length;
  ok(api({ action: 'pedirCodigo', email: '  SoniaValencia.Sonia+app@Gmail.com ' }));
  assert.strictEqual(correos.length, n0 + 1); assert.strictEqual(correos[correos.length - 1].to, 'sonia.valencia.sonia@gmail.com');
  ok(api({ action: 'verificarCodigo', email: 'soniavalenciasonia@gmail.com', codigo: ultimoCodigo() }));
  const reg = libro.getSheetByName('Registro').rows.map(r => r.join(' ')).join('\n');
  assert.ok(reg.includes('Código enviado a sonia.valencia.sonia@gmail.com'));
  ok(api({ action: 'pedirCodigo', email: 'sonia.valencia@gmail.com' }));
  assert.ok(libro.getSheetByName('Registro').rows.map(r => r.join(' ')).join('\n').includes('Pedido con un email sin acceso: sonia.valencia@gmail.com'));
  paso('Gmail sin puntos, con mayúsculas o con «+» entra igual (el código va a su email real); los intentos quedan en el Registro');
}

/* ---------- Plan B: código manual por WhatsApp ---------- */
{
  const pM = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Pablo Manual', email: 'pablo.manual@ejemplo.com', plantilla: 'aquiles' })).paciente.id;
  const n0 = correos.length;
  const r4 = ok(api({ action: 'codigoManual', token: admin, pacienteId: pM }));
  assert.strictEqual(correos.length, n0); assert.ok(/^\d{6}$/.test(r4.codigo));
  ok(api({ action: 'pedirCodigo', email: 'otro@ejemplo.com' }));
  const t4 = ok(api({ action: 'verificarCodigo', email: 'Pablo.Manual@ejemplo.com', codigo: r4.codigo }));
  assert.strictEqual(t4.rol, 'paciente');
  assert.ok(!api({ action: 'codigoManual', token: t4.token, pacienteId: pM }).ok);
  paso('plan B: Dani genera un código (sin email), el paciente entra con él; un paciente no puede generarlos');
}

/* ---------- Formulario pre-sesión e historia clínica ---------- */
{
  let r3 = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Nora Pre', email: 'nora@ejemplo.com', plantilla: 'aquiles', semanas: 12 }));
  const nid = r3.paciente.id;
  ok(api({ action: 'pedirCodigo', email: 'nora@ejemplo.com' }));
  const tN = ok(api({ action: 'verificarCodigo', email: 'nora@ejemplo.com', codigo: ultimoCodigo() })).token;
  assert.strictEqual(ok(api({ action: 'yo', token: tN })).presesion.hecha, false);
  paso('un paciente nuevo aún no tiene el formulario pre-sesión');

  r3 = api({ action: 'guardarPresesion', token: tN, version: 'v2026-09', respuestas: { nombre: 'Nora' }, consentimientos: { privacidad: true, informado: true } });
  assert.ok(!r3.ok && /aceptar/.test(r3.error));
  ok(api({ action: 'guardarPresesion', token: tN, version: 'v2026-09', respuestas: { nombre: 'Nora Pre', telefono: '+34 600 11 22 33', motivo: 'Dolor en el Aquiles', 'mal clave': 'x' },
    consentimientos: { privacidad: true, informado: true, condiciones: true, rrss: true } }));
  assert.strictEqual(ok(api({ action: 'yo', token: tN })).presesion.hecha, true);
  paso('sin los tres consentimientos obligatorios no se guarda; con ellos sí');

  r3 = ok(api({ action: 'bandeja', token: admin }));
  assert.ok(r3.tareas.some(t => t.tipo === 'valoracion' && t.pacienteId === nid));
  r3 = ok(api({ action: 'ficha', token: admin, pacienteId: nid }));
  assert.strictEqual(r3.presesion.respuestas.motivo, 'Dolor en el Aquiles'); assert.ok(!('mal clave' in r3.presesion.respuestas));
  assert.strictEqual(r3.paciente.telefono, '+34600112233');
  assert.strictEqual(r3.consentimientos.find(c => c.documento === 'rrss').aceptado, true);
  assert.strictEqual(r3.consentimientos.find(c => c.documento === 'comerciales').aceptado, false);
  paso('Dani ve las respuestas, los consentimientos (con fecha y versión) y la tarea «Nueva valoración»');

  ok(api({ action: 'guardarHistoria', token: admin, pacienteId: nid, cambios: { 'obj.0': 'Lunge 9 cm dcha / 12 cm izda', 'rojas.0': 'no', 'dif.principal': 'Tendinopatía porción media' } }));
  r3 = ok(api({ action: 'guardarHistoria', token: admin, pacienteId: nid, cambios: { 'obj.0': 'Lunge 10 cm dcha', 'dif.principal': '', valorada: 'si' } }));
  assert.strictEqual(r3.historia['obj.0'], 'Lunge 10 cm dcha'); assert.ok(!('dif.principal' in r3.historia));
  assert.ok(!api({ action: 'guardarHistoria', token: tN, pacienteId: nid, cambios: { x: 'y' } }).ok);
  r3 = ok(api({ action: 'bandeja', token: admin }));
  assert.ok(!r3.tareas.some(t => t.tipo === 'valoracion' && t.pacienteId === nid));
  paso('historia clínica: Dani guarda y corrige sus notas (un paciente no puede); «valorada» quita la tarea');
}

/* ---------- Enlace personal y duración del acceso según el plan ---------- */
{
  const hoy = new Date().toISOString().slice(0, 10);
  let r5 = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Elena Enlace', email: 'elena.enlace@gmail.com', plantilla: 'aquiles', semanas: 4, fechaInicio: hoy }));
  const eid = r5.paciente.id; let tok = r5.token;
  assert.ok(/^[0-9a-f]{64}$/.test(tok));
  r5 = ok(api({ action: 'invitacion', invitacion: tok }));
  assert.strictEqual(r5.nombre, 'Elena Enlace'); assert.strictEqual(r5.email, 'el•••@gmail.com');
  assert.ok(!api({ action: 'invitacion', invitacion: 'f'.repeat(64) }).ok);
  paso('al crear el paciente se genera su enlace personal; muestra su nombre y el email oculto');

  const n1 = correos.length;
  ok(api({ action: 'pedirCodigo', invitacion: tok }));
  assert.strictEqual(correos.length, n1 + 1); assert.strictEqual(correos[correos.length - 1].to, 'elena.enlace@gmail.com');
  const tE = ok(api({ action: 'verificarCodigo', invitacion: tok, codigo: ultimoCodigo() })).token;
  ok(api({ action: 'yo', token: tE }));
  paso('«Sí, soy yo»: el código va a su email sin que tenga que escribirlo, y entra');

  const viejo = tok; tok = ok(api({ action: 'enlaceAcceso', token: admin, pacienteId: eid })).token;
  assert.ok(!api({ action: 'invitacion', invitacion: viejo }).ok); ok(api({ action: 'invitacion', invitacion: tok }));
  assert.ok(!api({ action: 'enlaceAcceso', token: tE, pacienteId: eid }).ok);
  paso('Dani genera un enlace nuevo y el anterior deja de valer (un paciente no puede generarlos)');

  // Plan de 4 semanas que empezó hace 30 días: el acceso se cierra aunque no hayan pasado 90
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  ok(api({ action: 'editarPaciente', token: admin, pacienteId: eid, cambios: {} }));
  libro.getSheetByName('Pacientes').rows.forEach(row => { if (row[0] === eid) row[7] = hace30; });
  r5 = api({ action: 'yo', token: tE });
  assert.ok(!r5.ok && /plan ha terminado/.test(r5.error));
  assert.ok(!api({ action: 'invitacion', invitacion: tok }).ok);
  paso('si el plan es más corto que 90 días, el acceso termina con el plan («Tu plan ha terminado»)');

  ok(api({ action: 'editarPaciente', token: admin, pacienteId: eid, cambios: { semanas: 8 } }));
  ok(api({ action: 'yo', token: tE }));
  paso('al ampliar el plan en su ficha, su acceso vuelve a funcionar sin pedir nada');

  ok(api({ action: 'editarPaciente', token: admin, pacienteId: eid, cambios: { estado: 'archivado' } }));
  assert.ok(!api({ action: 'yo', token: tE }).ok); assert.ok(!api({ action: 'invitacion', invitacion: tok }).ok);
  paso('archivar al paciente cierra su sesión y anula su enlace');
}

/* ---------- Finanzas: plan y pagos del paciente, gastos e ingresos de RCD ---------- */
{
  const fid = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Fran Finanzas', email: 'fran@ejemplo.com', plantilla: 'rotuliana', semanas: 12 })).paciente.id;
  let r6 = ok(api({ action: 'guardarFinanzasPaciente', token: admin, pacienteId: fid, plan: { nombre: 'Readaptación Completa · 3 meses', precio: '470' },
    pagos: [{ concepto: 'Pago 1 de 3', importe: 160, vence: '2026-10-01', pagado: true, fechaPago: '2026-10-01', metodo: 'Bizum', factura: 'https://drive.google.com/file/d/factura1/view' },
            { concepto: 'Pago 2 de 3', importe: '155', vence: '2026-11-01' }, { concepto: 'Pago 3 de 3', importe: 155, vence: '2026-12-01' }] }));
  assert.strictEqual(r6.finanzas.total, 470); assert.strictEqual(r6.finanzas.pagado, 160); assert.strictEqual(r6.finanzas.pendiente, 310);
  const pagoId = r6.finanzas.pagos[1].id;
  ok(api({ action: 'pedirCodigo', email: 'fran@ejemplo.com' }));
  const tF = ok(api({ action: 'verificarCodigo', email: 'fran@ejemplo.com', codigo: ultimoCodigo() })).token;
  r6 = ok(api({ action: 'yo', token: tF }));
  assert.strictEqual(r6.finanzas.plan.nombre, 'Readaptación Completa · 3 meses'); assert.strictEqual(r6.finanzas.pagos.length, 3);
  assert.strictEqual(r6.finanzas.pagos[0].factura, 'https://drive.google.com/file/d/factura1/view');
  assert.ok(!api({ action: 'guardarFinanzasPaciente', token: tF, pacienteId: fid, pagos: [] }).ok);
  paso('plan de 470 € en 3 pagos: el paciente ve lo pagado (160 €), lo pendiente (310 €) y su factura; no puede modificarlo');

  r6 = ok(api({ action: 'ficha', token: admin, pacienteId: fid }));
  const pagos = r6.finanzas.pagos.map(x => x.id === pagoId ? Object.assign(x, { pagado: true, fechaPago: '2026-11-03', metodo: 'Transferencia' }) : x);
  r6 = ok(api({ action: 'guardarFinanzasPaciente', token: admin, pacienteId: fid, plan: r6.finanzas.plan, pagos }));
  assert.strictEqual(r6.finanzas.pagado, 315); assert.strictEqual(r6.finanzas.pagos.find(x => x.id === pagoId).fechaPago, '2026-11-03');
  paso('Dani marca el pago 2 como cobrado (fecha y método) y se conserva su identificador');

  assert.ok(!api({ action: 'guardarMovimiento', token: admin, movimiento: { tipo: 'gasto', concepto: '', importe: 10 } }).ok);
  ok(api({ action: 'guardarMovimiento', token: admin, movimiento: { tipo: 'gasto', fecha: '2026-10-05', categoria: 'Software', concepto: 'Google Workspace', importe: '13,60', recurrencia: 'mensual' } }));
  r6 = ok(api({ action: 'guardarMovimiento', token: admin, movimiento: { tipo: 'gasto', fecha: '2026-11-02', categoria: 'Publicidad', concepto: 'Anuncios Instagram', importe: 50 } }));
  assert.strictEqual(r6.movimientos.length, 2); assert.strictEqual(r6.movimientos.find(m => m.concepto === 'Google Workspace').importe, 13.6);
  assert.ok(r6.pagos.some(x => x.paciente === 'Fran Finanzas' && x.pagado));
  r6 = ok(api({ action: 'borrarMovimiento', token: admin, id: r6.movimientos.find(m => m.concepto === 'Anuncios Instagram').id }));
  assert.strictEqual(r6.movimientos.length, 1);
  assert.ok(!api({ action: 'finanzas', token: tF }).ok);
  paso('CRM: gastos con categoría y recurrencia (importes con coma), borrar movimientos; un paciente no puede verlo');
}

/* ---------- Vídeos: sincronizar la carpeta de Drive ---------- */
{
  carpetas['carpeta123'] = carpeta([['Isometrico de gemelo.mp4', 'vid1'], ['notas.pdf', 'doc1', 'application/pdf']],
    [carpeta([['Sentadilla búlgara con peso.MOV', 'vid2', 'video/quicktime', false], ['Ejercicio nuevo de Dani.mp4', 'vid3']])]);
  assert.ok(!api({ action: 'sincronizarVideos', token: admin }).ok);
  const r7 = ok(api({ action: 'sincronizarVideos', token: admin, carpeta: 'https://drive.google.com/drive/folders/carpeta123?usp=sharing', nombres: ['Isométrico de gemelo', 'Sentadilla búlgara con peso'] }));
  assert.strictEqual(r7.encontrados, 3); assert.deepStrictEqual(r7.asociados.sort(), ['Isométrico de gemelo', 'Sentadilla búlgara con peso']);
  assert.deepStrictEqual(r7.nuevos, ['Ejercicio nuevo de Dani']); assert.deepStrictEqual(r7.sinPermiso, ['Sentadilla búlgara con peso']);
  assert.strictEqual(ok(api({ action: 'config', token: admin })).config.VIDEOS_CARPETA_ID, 'carpeta123');
  // El paciente recibe el vídeo aunque Dani lo subiera después de publicar la semana
  const vid = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Vera Video', email: 'vera@ejemplo.com', plantilla: 'aquiles' })).paciente.id;
  ok(api({ action: 'publicarSemana', token: admin, pacienteId: vid, semana: 1, ejercicios: [{ dia: 1, ejercicio: 'Isométrico de gemelo', series: 5, valor: '45', unidad: 's' }] }));
  ok(api({ action: 'pedirCodigo', email: 'vera@ejemplo.com' }));
  const tV = ok(api({ action: 'verificarCodigo', email: 'vera@ejemplo.com', codigo: ultimoCodigo() })).token;
  assert.strictEqual(ok(api({ action: 'yo', token: tV })).prescripcion[0].video, 'https://drive.google.com/file/d/vid1/view');
  paso('sincronizar Drive: asocia vídeos por nombre (sin importar acentos ni extensión), añade los nuevos y llegan solos al paciente');
}

const tS = (() => { ok(api({ action: 'crearPaciente', token: admin, nombre: 'Saúl Salir', email: 'saul@ejemplo.com', plantilla: 'aquiles' }));
  ok(api({ action: 'pedirCodigo', email: 'saul@ejemplo.com' })); return ok(api({ action: 'verificarCodigo', email: 'saul@ejemplo.com', codigo: ultimoCodigo() })).token; })();
ok(api({ action: 'salir', token: tS }));
assert.ok(!api({ action: 'yo', token: tS }).ok);
paso('cerrar sesión invalida el acceso');

const antes = correos.length; nueva(); ctx.recordatorios();
assert.ok(correos.length >= antes);
paso('los recordatorios se ejecutan sin errores');

const tokensGuardados = libro.getSheetByName('Accesos').rows.flat().join(' ');
assert.ok(!tokensGuardados.includes(admin));
paso('en la hoja solo se guarda la huella de las sesiones, nunca el acceso en sí');

/* ---------- Gestión: baja, ventas, tareas y objetivos ---------- */
const mesHoy = new Date().toISOString().slice(0, 7), hoyISO = new Date().toISOString().slice(0, 10);
const tB = (() => { ok(api({ action: 'crearPaciente', token: admin, nombre: 'Bea Baja', email: 'bea@ejemplo.com', plantilla: 'rotuliana', canal: 'Instagram', deporte: 'Trail' }));
  ok(api({ action: 'pedirCodigo', email: 'bea@ejemplo.com' })); return ok(api({ action: 'verificarCodigo', email: 'bea@ejemplo.com', codigo: ultimoCodigo() })).token; })();
const bea = ok(api({ action: 'pacientes', token: admin })).pacientes.find(x => x.nombre === 'Bea Baja');
assert.strictEqual(bea.canal, 'instagram'); assert.strictEqual(bea.deporte, 'Trail');
assert.ok(!api({ action: 'darBaja', token: admin, pacienteId: bea.id, motivo: '' }).ok);
assert.ok(!api({ action: 'darBaja', token: admin, pacienteId: bea.id, motivo: 'Me caía mal' }).ok);
r = ok(api({ action: 'darBaja', token: admin, pacienteId: bea.id, motivo: 'Otra lesión', nota: 'Se rompió el tobillo' }));
assert.strictEqual(r.paciente.notaBaja, 'Se rompió el tobillo');
assert.deepStrictEqual(ok(api({ action: 'finanzas', token: admin })).bajas.map(b => b.motivo), ['Otra lesión']);
assert.strictEqual(r.paciente.estado, 'baja'); assert.strictEqual(r.paciente.fechaSalida, hoyISO);
assert.ok(!api({ action: 'yo', token: tB }).ok);
assert.ok(!api({ action: 'darBaja', token: admin, pacienteId: bea.id, motivo: 'otra vez' }).ok);
paso('la baja (sin alta) pide un motivo de la lista, guarda la nota y la fecha, y cierra el acceso');

r = ok(api({ action: 'guardarSetter', token: admin, dia: { fecha: hoyISO, bienvenidas: 12, contestadas: 5, inboundsInstagram: 3, inboundsWhatsapp: 1, followUps: 4 } }));
ok(api({ action: 'guardarSetter', token: admin, dia: { fecha: hoyISO, bienvenidas: 14, contestadas: 6, inboundsInstagram: 3, inboundsWhatsapp: 1, followUps: 4 } }));
assert.ok(!api({ action: 'guardarSetter', token: admin, dia: { fecha: hoyISO, bienvenidas: 2, contestadas: 5 } }).ok);
r = ok(api({ action: 'ventas', token: admin }));
assert.strictEqual(r.setter.length, 1); assert.strictEqual(r.setter[0].bienvenidas, 14);
paso('el Setter guarda un día por fila (volver a guardar el día lo corrige)');

r = ok(api({ action: 'guardarLlamada', token: admin, llamada: { nombre: 'Lola Lead', telefono: '34 600 11 22 33', fecha: hoyISO, canal: 'instagram', origen: 'inbound', lesion: 'Tendinopatía rotuliana', encaja: 'si', objeciones: 'Duda de que online funcione' } }));
const llamadaId = r.id; assert.strictEqual(r.llamadas[0].resultado, 'espera'); assert.strictEqual(r.llamadas[0].telefono, '34600112233');
ok(api({ action: 'guardarLlamada', token: admin, llamada: { nombre: 'Nico No', fecha: hoyISO, resultado: 'no' } }));
r = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Lola Lead', email: 'lola@ejemplo.com', plantilla: 'rotuliana', canal: 'instagram', llamadaId }));
const lola = ok(api({ action: 'ventas', token: admin })).llamadas.find(l => l.id === llamadaId);
assert.strictEqual(lola.resultado, 'compro'); assert.strictEqual(lola.pacienteId, r.paciente.id);
paso('una llamada «compró» crea el paciente y queda enlazada a él');

r = ok(api({ action: 'guardarTarea', token: admin, tarea: { texto: 'Pasarela de pago', fecha: '2020-01-01' } }));
ok(api({ action: 'guardarTarea', token: admin, tarea: { texto: 'Grabar reel' } }));
const tarea = r.tareas[0];
r = ok(api({ action: 'bandeja', token: admin }));
assert.deepStrictEqual(r.misTareas.map(t => t.texto), ['Pasarela de pago', 'Grabar reel']);
ok(api({ action: 'guardarTarea', token: admin, tarea: Object.assign({}, tarea, { hecha: true }) }));
assert.deepStrictEqual(ok(api({ action: 'bandeja', token: admin })).misTareas.map(t => t.texto), ['Grabar reel']);
assert.ok(!api({ action: 'guardarTarea', token: admin, tarea: { texto: '  ' } }).ok);
paso('las tareas pendientes salen en «Para hoy» y desaparecen al marcarlas');

ok(api({ action: 'guardarObjetivo', token: admin, objetivo: { mes: mesHoy, tipo: 'llamadas', meta: 3 } }));
ok(api({ action: 'guardarObjetivo', token: admin, objetivo: { mes: mesHoy, tipo: 'bienvenidas', meta: 10 } }));
ok(api({ action: 'guardarObjetivo', token: admin, objetivo: { mes: mesHoy, tipo: 'manual', texto: 'Pasarela de pago' } }));
assert.ok(!api({ action: 'guardarObjetivo', token: admin, objetivo: { mes: mesHoy, tipo: 'clientes' } }).ok);
r = ok(api({ action: 'gestion', token: admin, mes: mesHoy }));
const obj = k => r.objetivos.find(o => o.tipo === k);
assert.strictEqual(obj('llamadas').valor, 2); assert.strictEqual(obj('llamadas').hecho, false);
assert.strictEqual(obj('bienvenidas').valor, 14); assert.strictEqual(obj('bienvenidas').hecho, true);
assert.strictEqual(obj('manual').valor, null); assert.strictEqual(obj('manual').hecho, false);
paso('los objetivos con contador se calculan solos con Ventas; los demás se marcan a mano');

r = ok(api({ action: 'guardarLlamada', token: admin, llamada: { nombre: 'Eva Espera', fecha: hoyISO, resultado: 'espera', volverEl: '2030-01-10' } }));
const eva = r.id;
assert.strictEqual(r.llamadas.find(l => l.id === eva).volverEl, '2030-01-10');
ok(api({ action: 'guardarLlamada', token: admin, llamada: { id: eva, nombre: 'Eva Espera', fecha: hoyISO, resultado: 'espera', volverEl: '2030-01-12' } }));
let vuelta = ok(api({ action: 'bandeja', token: admin })).misTareas.filter(t => t.llamadaId === eva);
assert.strictEqual(vuelta.length, 1); assert.strictEqual(vuelta[0].fecha, '2030-01-12'); assert.ok(/Eva Espera/.test(vuelta[0].texto));
ok(api({ action: 'guardarLlamada', token: admin, llamada: { id: eva, nombre: 'Eva Espera', fecha: hoyISO, resultado: 'no' } }));
assert.strictEqual(ok(api({ action: 'bandeja', token: admin })).misTareas.filter(t => t.llamadaId === eva).length, 0);
paso('una llamada en espera crea (y mueve) la tarea «volver a contactar»; al decidir, se da por hecha');

assert.strictEqual(ok(api({ action: 'bandeja', token: admin })).setter, null);   // hoy ya está apuntado
libro.getSheetByName('Setter').rows.splice(1);
const hace4 = new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10);
ok(api({ action: 'guardarSetter', token: admin, dia: { fecha: hace4, bienvenidas: 1 } }));
r = ok(api({ action: 'bandeja', token: admin }));
assert.strictEqual(r.setter.faltan, 3);
assert.ok(r.objetivos.length >= 3);
paso('si faltan días del Setter hasta ayer, sale el aviso; la bandeja trae también los objetivos del mes');

/* ---------- Vídeos: petición, subida a Drive (directa y por el motor) y análisis ---------- */
const vera = ok(api({ action: 'crearPaciente', token: admin, nombre: 'Vera Vídeo', email: 'vera.valoracion@ejemplo.com', plantilla: 'rotuliana', alta: [{ prueba: 'Single leg hop', criterio: 'LSI ≥ 90 %' }] })).paciente;
ok(api({ action: 'pedirCodigo', email: 'vera.valoracion@ejemplo.com' }));
const tV = ok(api({ action: 'verificarCodigo', email: 'vera.valoracion@ejemplo.com', codigo: ultimoCodigo() })).token;
ok(api({ action: 'editarPaciente', token: admin, pacienteId: vera.id, cambios: { ladoLesion: 'izquierda' } }));
assert.ok(!api({ action: 'pedirVideos', token: admin, pacienteId: vera.id, apartado: 'valoracion', items: [{ prueba: 'cmj', nombre: 'CMJ' }] }).ok);   // falta el momento
r = ok(api({ action: 'pedirVideos', token: admin, pacienteId: vera.id, apartado: 'valoracion', momento: 'inicial', items: [
  { prueba: 'cmj', nombre: 'CMJ' }, { prueba: 'hop', nombre: 'Single leg hop', lado: 'derecha' }, { prueba: 'hop', nombre: 'Single leg hop', lado: 'izquierda' }] }));
assert.strictEqual(r.videos.length, 3);
const altaId = ok(api({ action: 'ficha', token: admin, pacienteId: vera.id })).alta[0].id;
ok(api({ action: 'pedirVideos', token: admin, pacienteId: vera.id, apartado: 'alta', items: [{ prueba: 'hop', nombre: 'Single leg hop', lado: 'izquierda', altaId }] }));
ok(api({ action: 'pedirVideos', token: admin, pacienteId: vera.id, apartado: 'tecnica', items: [{ prueba: 'tecnica', nombre: 'Peso muerto', instrucciones: 'De perfil, 3 repeticiones' }] }));
let yoV = ok(api({ action: 'yo', token: tV }));
assert.strictEqual(yoV.videos.filter(v => v.estado === 'pedido').length, 5);
assert.ok(!('medidas' in yoV.videos[0]));
paso('Dani pide vídeos de valoración (con momento), alta y técnica; el paciente los ve pendientes');

const cmj = yoV.videos.find(v => v.prueba === 'cmj');
assert.ok(!api({ action: 'iniciarSubida', token: tV, videoId: cmj.id, tamano: 600 * 1048576, tipo: 'video/mp4' }).ok);
r = ok(api({ action: 'iniciarSubida', token: tV, videoId: cmj.id, tamano: 10, tipo: 'video/quicktime', nombre: 'IMG_1.MOV', fps: 240, origen: 'https://app.rcdclinic.com' }));
const abierta = peticiones[peticiones.length - 1];
assert.strictEqual(abierta.o.headers.Origin, 'https://app.rcdclinic.com'); assert.strictEqual(abierta.o.headers.Authorization, 'Bearer token-de-prueba');
const sid = r.url.split('/__subida/')[1];
assert.strictEqual(trozoSubida(sid, 'bytes 0-5/10', Buffer.from('ABCDEF')).codigo, 308);
const fin = trozoSubida(sid, 'bytes 6-9/10', Buffer.from('GHIJ'));
assert.strictEqual(fin.codigo, 200);
const otro = Object.values(drive.carpetas).find(c => c.nombre === 'Técnica') || ctx.DriveApp.createFolder('ajena');
const ajeno = otro.createFile({ nombre: 'x.mp4', tipo: 'video/mp4', bytes: [1] });
assert.ok(!api({ action: 'videoSubido', token: tV, videoId: cmj.id, fileId: ajeno.getId() }).ok);   // un archivo de otra carpeta no vale
r = ok(api({ action: 'videoSubido', token: tV, videoId: cmj.id, fileId: fin.cuerpo.id }));
assert.strictEqual(r.videos.find(v => v.id === cmj.id).estado, 'subido');
const archivo = drive.archivos[fin.cuerpo.id];
assert.strictEqual(archivo.bytes.toString(), 'ABCDEFGHIJ');
assert.ok(/Valoración/.test(drive.carpetas[archivo.padre].nombre) && /Vera Vídeo/.test(drive.carpetas[drive.carpetas[archivo.padre].padre].nombre));
assert.ok(/Valoración inicial/.test(archivo.nombre) && /\.mov$/.test(archivo.nombre));
paso('el vídeo se sube directo a Drive en su carpeta privada (Paciente / Valoración) y se comprueba al terminar');

const hopIzq = yoV.videos.find(v => v.apartado === 'valoracion' && v.lado === 'izquierda');
r = ok(api({ action: 'iniciarSubida', token: tV, videoId: hopIzq.id, tamano: 7, tipo: 'video/mp4' }));
r = ok(api({ action: 'subirTrozo', token: tV, videoId: hopIzq.id, inicio: 0, datos: Buffer.from('1234').toString('base64') }));
assert.strictEqual(r.hecho, false);
r = ok(api({ action: 'subirTrozo', token: tV, videoId: hopIzq.id, inicio: 4, datos: Buffer.from('567').toString('base64') }));
assert.ok(r.hecho && r.fileId);
ok(api({ action: 'videoSubido', token: tV, videoId: hopIzq.id, fileId: r.fileId }));
assert.strictEqual(ok(api({ action: 'verVideo', token: tV, videoId: hopIzq.id })).datos, Buffer.from('1234567').toString('base64'));
paso('si el navegador no puede subir directo, el vídeo va a trozos por el motor (y el paciente lo puede volver a ver)');

const tOtro = (() => { ok(api({ action: 'crearPaciente', token: admin, nombre: 'Otra Paciente', email: 'otra.video@ejemplo.com', plantilla: 'aquiles' }));
  ok(api({ action: 'pedirCodigo', email: 'otra.video@ejemplo.com' })); return ok(api({ action: 'verificarCodigo', email: 'otra.video@ejemplo.com', codigo: ultimoCodigo() })).token; })();
assert.ok(!api({ action: 'iniciarSubida', token: tOtro, videoId: cmj.id, tamano: 10 }).ok);
assert.ok(!api({ action: 'verVideo', token: tOtro, videoId: hopIzq.id }).ok);
assert.ok(!api({ action: 'accesoVideo', token: tV, videoId: cmj.id }).ok);
paso('nadie más puede subir, ver ni pedir acceso a los vídeos de un paciente');

assert.ok(ok(api({ action: 'bandeja', token: admin })).tareas.some(t => t.tipo === 'video' && t.pacienteId === vera.id && /2 vídeos/.test(t.titulo)));
r = ok(api({ action: 'accesoVideo', token: admin, videoId: cmj.id }));
assert.ok(/\/drive\/v3\/files\/fil\d+\?alt=media$/.test(r.url) && r.token && r.fpsGrabacion === 240);
const jpg = 'data:image/jpeg;base64,' + Buffer.from('imagen').toString('base64');
r = ok(api({ action: 'guardarAnalisis', token: admin, videoId: cmj.id, valor: 31.24, unidad: 'cm', texto: 'CMJ 31,2 cm', medidas: { tipo: 'salto', intentos: [{ vuelo: 0.505 }] }, imagen: jpg }));
const cmjA = r.videos.find(v => v.id === cmj.id);
assert.strictEqual(cmjA.estado, 'analizado'); assert.strictEqual(cmjA.resultado, 31.24); assert.ok(cmjA.imagen && cmjA.medidas.intentos.length === 1);
assert.strictEqual(ok(api({ action: 'imagenVideo', token: tV, videoId: cmj.id })).datos, jpg);
assert.ok(!ok(api({ action: 'bandeja', token: admin })).tareas.some(t => t.tipo === 'video' && /2 vídeos/.test(t.titulo)));
paso('Dani analiza el vídeo: se guardan el resultado, las marcas y la imagen; el paciente ve su resultado y la imagen');

const hopAlta = ok(api({ action: 'yo', token: tV })).videos.find(v => v.apartado === 'alta');
r = ok(api({ action: 'iniciarSubida', token: tV, videoId: hopAlta.id, tamano: 3, tipo: 'video/mp4' }));
const fa = trozoSubida(r.url.split('/__subida/')[1], 'bytes 0-2/3', Buffer.from('abc'));
ok(api({ action: 'videoSubido', token: tV, videoId: hopAlta.id, fileId: fa.cuerpo.id }));
ok(api({ action: 'guardarAnalisis', token: admin, videoId: hopAlta.id, valor: 158, unidad: 'cm', texto: 'Izquierda 158 cm · LSI 94 %' }));
assert.strictEqual(ok(api({ action: 'ficha', token: admin, pacienteId: vera.id })).alta[0].resultado, 'Izquierda 158 cm · LSI 94 %');
paso('el resultado de un vídeo de alta se apunta solo en su prueba de alta');

const tec = ok(api({ action: 'yo', token: tV })).videos.find(v => v.apartado === 'tecnica');
ok(api({ action: 'guardarAnalisis', token: admin, videoId: tec.id, comentario: 'Mantén la espalda neutra y empuja con la cadera.', valor: '' }));
yoV = ok(api({ action: 'yo', token: tV }));
const tecP = yoV.videos.find(v => v.id === tec.id);
assert.ok(tecP.comentario && !tecP.visto);
ok(api({ action: 'videoVisto', token: tV, videoId: tec.id }));
assert.ok(ok(api({ action: 'yo', token: tV })).videos.find(v => v.id === tec.id).visto);
r = ok(api({ action: 'borrarVideo', token: admin, videoId: hopIzq.id }));
assert.ok(!r.videos.some(v => v.id === hopIzq.id) && archivo && drive.archivos[Object.keys(drive.archivos).find(k => drive.archivos[k].bytes.toString() === '1234567')].papelera);
paso('la corrección de técnica le llega al paciente (y deja de avisar al verla); borrar un vídeo lo manda a la papelera de Drive');

console.log(`\nTodo correcto: ${pasos} pruebas.`);
