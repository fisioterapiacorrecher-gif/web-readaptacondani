/* Servidor local para probar las apps con el motor simulado (sin tocar los datos reales ni enviar emails).
   Uso: node app/backend/servidor-pruebas.js [puerto]  →  http://localhost:8787 (paciente) y /panel (Dani)
   El último código enviado a un email se ve en /__codigo?email=… */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { crearMotor } = require('./simulador');

const motor = crearMotor();
motor.nueva(); motor.ctx.instalar();
// Carpeta de vídeos de prueba para ensayar «Sincronizar con Drive» (id: demo)
motor.carpetas.demo = motor.carpeta([['Isometrico de gemelo.mp4', 'v1'], ['Puntillas aguantando 2.mp4', 'v2'], ['Peso muerto.mov', 'v3', 'video/quicktime']], [motor.carpeta([['Saltos a la comba.mp4', 'v4']])]);
const PUERTO = Number(process.argv[2]) || 8787;
// Drive simulado: subidas reanudables en /__subida/… y descargas en /__drive/… (como la API de Drive)
motor.ctx.DRIVE_API = `http://localhost:${PUERTO}/__drive`;
motor.setBaseSubidas(`http://localhost:${PUERTO}/__subida/`);
const SIN_DIRECTO = process.env.SIN_DIRECTO === '1';   // simula un navegador que no puede subir directo a Drive (prueba el plan B)
const RAIZ = path.join(__dirname, '..', 'web');
const TIPOS = { '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.task': 'application/octet-stream', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/api') {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(motor.api(JSON.parse(body || '{}')))); });
    return;
  }
  if (url.pathname.startsWith('/__subida/') && req.method === 'PUT') {
    if (SIN_DIRECTO) { req.socket.destroy(); return; }
    const partes = []; req.on('data', c => partes.push(c));
    req.on('end', () => {
      const r = motor.trozoSubida(url.pathname.split('/__subida/')[1], req.headers['content-range'], Buffer.concat(partes));
      const s = motor.drive.subidas[url.pathname.split('/__subida/')[1]];
      res.writeHead(r.codigo, Object.assign({ 'Content-Type': 'application/json' }, r.codigo === 308 && s ? { Range: `bytes=0-${s.recibido.length - 1}` } : {}));
      res.end(JSON.stringify(r.cuerpo));
    });
    return;
  }
  const m = url.pathname.match(/^\/__drive\/drive\/v3\/files\/([\w-]+)$/);
  if (m) {
    const f = motor.drive.archivos[m[1]];
    if (req.headers.authorization !== 'Bearer token-de-prueba') { res.writeHead(401); res.end(); return; }
    if (!f || f.papelera) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': f.tipo, 'Content-Length': f.bytes.length }); res.end(f.bytes);
    return;
  }
  if (url.pathname === '/__codigo') {
    const e = (url.searchParams.get('email') || '').toLowerCase();
    const m = [...motor.correos].reverse().find(c => c.to === e);
    res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end(m ? (m.subject.match(/(\d{6})$/) || [])[1] || '' : '');
    return;
  }
  if (url.pathname === '/js/config.js') { res.writeHead(200, { 'Content-Type': TIPOS['.js'] }); res.end("window.RCD_API = '/api';"); return; }
  let f = path.normalize(path.join(RAIZ, decodeURIComponent(url.pathname)));
  if (!f.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); res.end('No encontrado'); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PUERTO, () => console.log('Servidor de pruebas en http://localhost:' + PUERTO));
