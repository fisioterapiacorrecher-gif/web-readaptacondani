/* Pruebas del motor (Code.gs) fuera de Google: simula hojas, email y servicios de Apps Script.
   Ejecutar: node app/backend/pruebas.js */
const assert = require('assert');
const { crearMotor } = require('./simulador');
const { ctx, libro, correos, triggers, nueva, api, peticiones, setRespuestaPush } = crearMotor();
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

ok(api({ action: 'salir', token: pac }));
assert.ok(!api({ action: 'yo', token: pac }).ok);
paso('cerrar sesión invalida el acceso');

const antes = correos.length; nueva(); ctx.recordatorios();
assert.ok(correos.length >= antes);
paso('los recordatorios se ejecutan sin errores');

const tokensGuardados = libro.getSheetByName('Accesos').rows.flat().join(' ');
assert.ok(!tokensGuardados.includes(admin));
paso('en la hoja solo se guarda la huella de las sesiones, nunca el acceso en sí');

console.log(`\nTodo correcto: ${pasos} pruebas.`);
