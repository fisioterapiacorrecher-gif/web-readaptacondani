/* Simulación de los servicios de Google para probar Code.gs fuera de Google (la usan las pruebas y el servidor de pruebas). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');

function crearMotor() {
  const peticiones = [];
  const carpetas = {};
  const iter = a => { let i = 0; return { hasNext: () => i < a.length, next: () => a[i++] }; };
  const carpeta = (archivos, sub = []) => ({ getFiles: () => iter(archivos.map(([n, id, mime, propio]) => ({ getName: () => n, getId: () => id, getMimeType: () => mime || 'video/mp4',
    setSharing: () => { if (propio === false) throw new Error('sin permiso'); } }))), getFolders: () => iter(sub) });
  let respuestaPush = b => ({ ok: true, resultados: b.subs.map(x => ({ endpoint: x.endpoint, ok: true })) });
  /* Drive en memoria (carpetas y archivos de vídeo) y subidas reanudables, como las de la API de Drive */
  const drive = { carpetas: {}, archivos: {}, subidas: {}, n: 0 };
  const nuevaCarpeta = (nombre, padre) => {
    const id = 'dir' + (++drive.n), c = { id, nombre, padre, getId: () => id, getName: () => nombre,
      createFolder: n => nuevaCarpeta(n, id), getFoldersByName: n => iter(Object.values(drive.carpetas).filter(x => x.padre === id && x.nombre === n)),
      createFile: blob => nuevoArchivo(blob.nombre, blob.tipo, blob.bytes, id), getFiles: () => iter([]), getFolders: () => iter([]) };
    drive.carpetas[id] = c; carpetas[id] = c; return c;
  };
  const nuevoArchivo = (nombre, tipo, bytes, padre) => {
    const id = 'fil' + (++drive.n), f = { id, nombre, tipo, bytes: Buffer.from(bytes), padre, papelera: false, getId: () => id, getName: () => nombre, getMimeType: () => tipo,
      getSize: () => f.bytes.length, getBlob: () => ({ getBytes: () => [...f.bytes], getContentType: () => tipo }), getParents: () => iter([drive.carpetas[padre]]), setTrashed(v) { f.papelera = v; } };
    drive.archivos[id] = f; return f;
  };
  /** Recibe un trozo de una subida reanudable. Devuelve { codigo: 308 } o { codigo: 200, cuerpo: { id } } */
  const trozoSubida = (sid, rango, bytes) => {
    const s = drive.subidas[sid]; if (!s) return { codigo: 404, cuerpo: {} };
    const m = /bytes (\d+)-(\d+)\/(\d+)/.exec(rango || ''); if (!m || +m[1] !== s.recibido.length) return { codigo: 400, cuerpo: { error: 'rango' } };
    s.recibido = Buffer.concat([s.recibido, Buffer.from(bytes)]);
    if (s.recibido.length < s.total) return { codigo: 308, cuerpo: {} };
    const f = nuevoArchivo(s.meta.name, s.meta.mimeType, s.recibido, s.meta.parents[0]); delete drive.subidas[sid];
    return { codigo: 200, cuerpo: { id: f.id, size: String(f.bytes.length), mimeType: f.tipo } };
  };
  let baseSubidas = 'http://localhost/__subida/';
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
      base64Decode: b => [...Buffer.from(b, 'base64')], base64Encode: b => Buffer.from(b).toString('base64'),
      newBlob: (bytes, tipo, nombre) => ({ bytes, tipo, nombre }),
      computeDigest: (_alg, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()],
      base64EncodeWebSafe: b => Buffer.from(b).toString('base64url'),
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      formatDate: (d, tz, p) => fmt(d, tz, p),
    },
    ScriptApp: {
      getOAuthToken: () => 'token-de-prueba',
      getProjectTriggers: () => triggers.map(h => ({ getHandlerFunction: () => h })), deleteTrigger() { triggers.length = 0; },
      newTrigger: h => ({ timeBased: () => ({ everyHours: () => ({ create: () => triggers.push(h) }) }) }),
    },
    MailApp: { sendEmail: o => correos.push(o) },
    DriveApp: {
      Access: { ANYONE_WITH_LINK: 'link' }, Permission: { VIEW: 'view' }, getRootFolder: () => ({}),
      getFolderById: id => { const c = carpetas[id]; if (!c) throw new Error('no existe'); return c; },
      createFolder: n => nuevaCarpeta(n, 'raiz'),
      getFileById: id => { const f = drive.archivos[id]; if (!f || f.papelera) throw new Error('no existe'); return f; },
    },
    UrlFetchApp: { fetch: (url, o) => {
      if (/\/upload\/drive\/v3\/files\?uploadType=resumable/.test(url)) {   // abrir subida reanudable
        const sid = 's' + (++drive.n); drive.subidas[sid] = { meta: JSON.parse(o.payload), total: +o.headers['X-Upload-Content-Length'], recibido: Buffer.alloc(0), origen: o.headers.Origin };
        peticiones.push({ url, o });
        return { getResponseCode: () => 200, getHeaders: () => ({ Location: baseSubidas + sid }), getContentText: () => '' };
      }
      if (url.includes('/__subida/')) { const r = trozoSubida(url.split('/__subida/')[1], o.headers['Content-Range'], o.payload); return { getResponseCode: () => r.codigo, getContentText: () => JSON.stringify(r.cuerpo), getHeaders: () => ({}) }; }
      peticiones.push({ url, o, cuerpo: JSON.parse(o.payload) }); const r = respuestaPush(JSON.parse(o.payload)); return { getResponseCode: () => r.codigo ?? 200, getContentText: () => JSON.stringify(r.cuerpo ?? r) }; } },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { createTextOutput: s => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }), MimeType: { JSON: 'json' } },
    Logger: { log() {} },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx);
  
  
  const nueva = () => vm.runInContext('for (const k in _cache) delete _cache[k]; _ss = null;', ctx);
  const api = (body) => { nueva(); return JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent()); };
  return { ctx, libro, correos, triggers, nueva, api, peticiones, setRespuestaPush: f => { respuestaPush = f; }, carpetas, carpeta, drive, trozoSubida, setBaseSubidas: b => { baseSubidas = b; } };
}
module.exports = { crearMotor };
