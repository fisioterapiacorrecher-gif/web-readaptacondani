/* Pruebas del motor (Code.gs) fuera de Google: simula hojas, email y servicios de Apps Script.
   Ejecutar: node app/backend/pruebas.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

/* ---------- Simulación mínima de los servicios de Google ---------- */
function crearHoja(nombre) {
  const rows = [];
  const sh = {
    nombre, rows,
    getRange(r, c, nr = 1, nc = 1) {
      return {
        setValues(v) { for (let i = 0; i < nr; i++) { rows[r - 1 + i] = rows[r - 1 + i] || []; for (let j = 0; j < nc; j++) rows[r - 1 + i][c - 1 + j] = v[i][j]; } return this; },
        getValues() { const out = []; for (let i = 0; i < nr; i++) { const row = rows[r - 1 + i] || []; out.push(Array.from({ length: nc }, (_, j) => row[c - 1 + j] ?? '')); } return out; },
        setValue(v) { rows[r - 1] = rows[r - 1] || []; rows[r - 1][c - 1] = v; return this; },
        setFontWeight() { return this; },
      };
    },
    setFrozenRows() {}, getLastRow() { return rows.length; },
    appendRow(a) { rows.push(a.slice()); }, deleteRow(i) { rows.splice(i - 1, 1); },
  };
  return sh;
}
function crearLibro() {
  const sheets = [crearHoja('Hoja 1')];
  return {
    sheets, getId: () => 'libro1', getUrl: () => 'https://docs.google.com/spreadsheets/d/libro1',
    getSheetByName: n => sheets.find(s => s.nombre === n) || null,
    insertSheet(n) { const s = crearHoja(n); sheets.push(s); return s; },
    getSheets: () => sheets, deleteSheet(s) { sheets.splice(sheets.indexOf(s), 1); },
  };
}
const libro = crearLibro();
const props = {};
const correos = [];
const triggers = [];
const fmt = (d, tz, pat) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(d).map(x => [x.type, x.value]));
  const iso = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[p.weekday];
  return pat.replace(/'([^']*)'/g, '\u0000$1\u0000').split('\u0000').map((seg, i) => i % 2 ? seg :
    seg.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace(/\bd\b/, String(+p.day)).replace('HH', p.hour).replace(/\bH\b/, String(+p.hour)).replace('mm', p.minute).replace(/\bu\b/, String(iso))).join('');
};
const ctx = {
  console, Date, Math, JSON, String, Number, Object, Array, Error, isFinite, RegExp,
  SpreadsheetApp: { create: () => libro, openById: () => libro },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (_alg, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()],
    base64EncodeWebSafe: b => Buffer.from(b).toString('base64url'),
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
    formatDate: (d, tz, p) => fmt(d, tz, p),
  },
  ScriptApp: {
    getProjectTriggers: () => triggers.map(h => ({ getHandlerFunction: () => h })), deleteTrigger() { triggers.length = 0; },
    newTrigger: h => ({ timeBased: () => ({ everyHours: () => ({ create: () => triggers.push(h) }) }) }),
  },
  MailApp: { sendEmail: o => correos.push(o) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: s => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }), MimeType: { JSON: 'json' } },
  Logger: { log() {} },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx);

/* Cada petición web es una ejecución nueva en Apps Script: vaciamos la caché entre llamadas */
const nueva = () => vm.runInContext('for (const k in _cache) delete _cache[k]; _ss = null;', ctx);
const api = (body) => { nueva(); return JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent()); };
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
