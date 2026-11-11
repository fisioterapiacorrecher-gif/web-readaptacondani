/* RCD · envío de notificaciones al móvil (Web Push). Solo lo llama el motor de Google (Code.gs),
   que demuestra quién es con PUSH_SECRETO. Las claves viven en las variables de entorno de Netlify:
   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_SECRETO (y opcional VAPID_SUBJECT). */
const webpush = require('web-push');
const crypto = require('crypto');

const iguales = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
};
const json = (statusCode, o) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false });
  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false, error: 'json' }); }
  if (!iguales(b.secreto, process.env.PUSH_SECRETO)) return json(401, { ok: false, error: 'secreto' });
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv } = process.env;
  if (!pub || !priv) return json(500, { ok: false, error: 'faltan claves' });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:info@rcdclinic.com', pub, priv);
  // Texto genérico y corto: nunca datos clínicos en una notificación
  const payload = JSON.stringify({ titulo: String(b.titulo || 'RCD Clinic').slice(0, 80), texto: String(b.texto || '').slice(0, 200), url: String(b.url || '/').slice(0, 200) });
  const subs = Array.isArray(b.subs) ? b.subs.slice(0, 20) : [];
  const resultados = await Promise.all(subs.map(async s => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 86400, urgency: 'normal' }); return { endpoint: s.endpoint, ok: true }; }
    catch (e) { return { endpoint: s.endpoint, ok: false, status: e.statusCode || 0 }; }
  }));
  return json(200, { ok: true, resultados });
};
