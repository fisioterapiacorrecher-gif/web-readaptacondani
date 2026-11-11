/* Simulación de los servicios de Google para probar Code.gs fuera de Google (la usan las pruebas y el servidor de pruebas). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');

function crearMotor() {
  const peticiones = [];
  let respuestaPush = b => ({ ok: true, resultados: b.subs.map(x => ({ endpoint: x.endpoint, ok: true })) });
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
    UrlFetchApp: { fetch: (url, o) => { peticiones.push({ url, o, cuerpo: JSON.parse(o.payload) }); const r = respuestaPush(JSON.parse(o.payload)); return { getResponseCode: () => r.codigo ?? 200, getContentText: () => JSON.stringify(r.cuerpo ?? r) }; } },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { createTextOutput: s => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }), MimeType: { JSON: 'json' } },
    Logger: { log() {} },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx);
  
  
  const nueva = () => vm.runInContext('for (const k in _cache) delete _cache[k]; _ss = null;', ctx);
  const api = (body) => { nueva(); return JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent()); };
  return { ctx, libro, correos, triggers, nueva, api, peticiones, setRespuestaPush: f => { respuestaPush = f; } };
}
module.exports = { crearMotor };
