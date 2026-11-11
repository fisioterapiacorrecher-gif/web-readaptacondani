/* Servidor local para probar las apps con el motor simulado (sin tocar los datos reales ni enviar emails).
   Uso: node app/backend/servidor-pruebas.js [puerto]  →  http://localhost:8787 (paciente) y /panel (Dani)
   El último código enviado a un email se ve en /__codigo?email=… */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { crearMotor } = require('./simulador');

const motor = crearMotor();
motor.nueva(); motor.ctx.instalar();
const RAIZ = path.join(__dirname, '..', 'web');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/api') {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(motor.api(JSON.parse(body || '{}')))); });
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
}).listen(Number(process.argv[2]) || 8787, () => console.log('Servidor de pruebas en http://localhost:' + (Number(process.argv[2]) || 8787)));
