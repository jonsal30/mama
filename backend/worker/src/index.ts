import { buildPushPayload } from '@block65/webcrypto-web-push';

type Env = {
  DB: any;
  ALLOWED_ORIGIN: string;
  VAPID_SUBJECT: string;
  VAPID_SERVER_PUBLIC_KEY: string;
  VAPID_SERVER_PRIVATE_KEY: string;
  PAIRING_CODE: string;
  SHEET_SYNC_URL: string;
  SHEET_SYNC_SECRET: string;
};

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
const enc = new TextEncoder();

function cors(env: Env, req?: Request) {
  const origin = req?.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === env.ALLOWED_ORIGIN ? origin : env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function reply(env: Env, req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...cors(env, req) } });
}

function b64url(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomToken(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return b64url(a);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(value));
  return b64url(new Uint8Array(digest));
}

async function constantEqual(a: string, b: string) {
  const aa = enc.encode(a), bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

async function bodyJson(req: Request) {
  try { return await req.json<any>(); } catch { return null; }
}

async function authDevice(req: Request, env: Env) {
  const h = req.headers.get('Authorization') || '';
  if (!h.startsWith('Bearer ')) return null;
  const token = h.slice(7).trim();
  if (!token) return null;
  const hash = await sha256(token);
  const row = await env.DB.prepare('SELECT device_id, lang FROM devices WHERE token_hash = ?').bind(hash).first();
  if (row) await env.DB.prepare('UPDATE devices SET last_seen_at = ? WHERE device_id = ?').bind(new Date().toISOString(), row.device_id).run();
  return row || null;
}

async function recordEvent(env: Env, deviceId: string, eventType: string, ts: string, payload: any, eventId?: string) {
  const id = eventId || crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT OR IGNORE INTO events(event_id, device_id, event_type, ts, payload_json, sync_status, created_at)
    VALUES(?, ?, ?, ?, ?, 'pending', ?)`).bind(id, deviceId, eventType, ts || now, JSON.stringify(payload || {}), now).run();

  if (!env.SHEET_SYNC_URL) return { eventId: id, synced: false, reason: 'sheet_url_not_configured' };
  try {
    const res = await fetch(env.SHEET_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: JSON.stringify({ bridgeCode: env.SHEET_SYNC_SECRET, event: { eventId: id, deviceId, eventType, ts: ts || now, payload: payload || {} } }),
    });
    const text = await res.text();
    if (!res.ok || !text.includes('"ok":true')) throw new Error(`sheet ${res.status}: ${text.slice(0, 200)}`);
    await env.DB.prepare("UPDATE events SET sync_status='synced', sync_error=NULL WHERE event_id=?").bind(id).run();
    return { eventId: id, synced: true };
  } catch (e: any) {
    await env.DB.prepare("UPDATE events SET sync_status='error', sync_error=? WHERE event_id=?").bind(String(e?.message || e).slice(0, 500), id).run();
    return { eventId: id, synced: false, reason: String(e?.message || e) };
  }
}

async function pair(req: Request, env: Env) {
  const b = await bodyJson(req);
  if (!b?.deviceId || !b?.pairingCode) return reply(env, req, { ok: false, error: 'missing_fields' }, 400);
  const enabled = await env.DB.prepare("SELECT value FROM settings WHERE key='pairing_enabled'").first();
  if (enabled?.value !== '1') return reply(env, req, { ok: false, error: 'pairing_closed' }, 403);
  if (!(await constantEqual(String(b.pairingCode), env.PAIRING_CODE))) return reply(env, req, { ok: false, error: 'invalid_pairing_code' }, 403);

  const token = randomToken();
  const hash = await sha256(token);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO devices(device_id, token_hash, lang, paired_at, last_seen_at)
      VALUES(?,?,?,?,?) ON CONFLICT(device_id) DO UPDATE SET token_hash=excluded.token_hash, lang=excluded.lang, last_seen_at=excluded.last_seen_at`)
      .bind(String(b.deviceId), hash, b.lang === 'en' ? 'en' : 'es', now, now),
    env.DB.prepare("UPDATE settings SET value='0' WHERE key='pairing_enabled'")
  ]);
  return reply(env, req, { ok: true, token });
}

async function subscribe(req: Request, env: Env, device: any) {
  const b = await bodyJson(req);
  const s = b?.subscription;
  if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) return reply(env, req, { ok: false, error: 'invalid_subscription' }, 400);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO subscriptions(device_id, endpoint, p256dh, auth, expiration_time, active, created_at, updated_at)
      VALUES(?,?,?,?,?,1,?,?) ON CONFLICT(device_id) DO UPDATE SET endpoint=excluded.endpoint,p256dh=excluded.p256dh,auth=excluded.auth,expiration_time=excluded.expiration_time,active=1,updated_at=excluded.updated_at`)
      .bind(device.device_id, s.endpoint, s.keys.p256dh, s.keys.auth, s.expirationTime ? String(s.expirationTime) : null, now, now),
    env.DB.prepare('UPDATE devices SET lang=?, last_seen_at=? WHERE device_id=?').bind(b?.lang === 'en' ? 'en' : 'es', now, device.device_id)
  ]);
  return reply(env, req, { ok: true });
}

async function scheduleJob(req: Request, env: Env, device: any) {
  const b = await bodyJson(req);
  if (!b?.jobKey || !b?.kind || !b?.dueAt) return reply(env, req, { ok: false, error: 'missing_fields' }, 400);
  const due = new Date(b.dueAt);
  if (!Number.isFinite(due.getTime())) return reply(env, req, { ok: false, error: 'bad_due_at' }, 400);
  const now = new Date().toISOString();
  const c = b.copy || {};
  await env.DB.prepare(`INSERT INTO notification_jobs(job_key,device_id,kind,due_at,next_at,title_es,body_es,title_en,body_en,max_attempts,created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(job_key) DO UPDATE SET due_at=excluded.due_at,next_at=excluded.next_at,title_es=excluded.title_es,body_es=excluded.body_es,title_en=excluded.title_en,body_en=excluded.body_en,max_attempts=excluded.max_attempts,attempts=0,acked_at=NULL,ack_status=NULL,sent_at=NULL,last_error=NULL`)
    .bind(String(b.jobKey), device.device_id, String(b.kind), due.toISOString(), due.toISOString(),
      String(c.titleEs || '💙 YA PUEDES COMER'), String(c.bodyEs || 'Completaste tu meta. No necesitas extender el ayuno.'),
      String(c.titleEn || '💙 YOU CAN EAT NOW'), String(c.bodyEn || 'You completed your goal. You do not need to extend the fast.'),
      Math.min(Math.max(Number(b.maxAttempts || 3), 1), 5), now).run();
  return reply(env, req, { ok: true, scheduledFor: due.toISOString() });
}

async function ackJob(req: Request, env: Env, device: any) {
  const b = await bodyJson(req);
  if (!b?.jobKey) return reply(env, req, { ok: false, error: 'missing_job_key' }, 400);
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE notification_jobs SET acked_at=?, ack_status=? WHERE job_key=? AND device_id=?')
    .bind(now, String(b.status || 'seen'), String(b.jobKey), device.device_id).run();
  const sync = await recordEvent(env, device.device_id, 'push_ack', now, { jobKey: b.jobKey, status: b.status || 'seen' });
  return reply(env, req, { ok: true, sync });
}

async function logEvent(req: Request, env: Env, device: any) {
  const b = await bodyJson(req);
  if (!b?.eventType) return reply(env, req, { ok: false, error: 'missing_event_type' }, 400);
  const sync = await recordEvent(env, device.device_id, String(b.eventType), b.ts || new Date().toISOString(), b.payload || {}, b.eventId);
  return reply(env, req, { ok: true, ...sync });
}

function pushDataFor(row: any, lang: string, origin: string) {
  const title = lang === 'en' ? row.title_en : row.title_es;
  const body = lang === 'en' ? row.body_en : row.body_es;
  return {
    title, body, jobKey: row.job_key, kind: row.kind,
    url: `${origin}/mama/?push=${encodeURIComponent(row.job_key)}&kind=${encodeURIComponent(row.kind)}#window`,
    tag: `health-ally-${row.kind}`,
  };
}

async function sendPush(env: Env, row: any) {
  const sub = await env.DB.prepare('SELECT * FROM subscriptions WHERE device_id=? AND active=1').bind(row.device_id).first();
  if (!sub) return { ok: false, permanent: false, error: 'no_active_subscription' };
  const device = await env.DB.prepare('SELECT lang FROM devices WHERE device_id=?').bind(row.device_id).first();
  const data = pushDataFor(row, device?.lang === 'en' ? 'en' : 'es', env.ALLOWED_ORIGIN);
  const vapid = { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_SERVER_PUBLIC_KEY, privateKey: env.VAPID_SERVER_PRIVATE_KEY };
  const subscription = { endpoint: sub.endpoint, expirationTime: sub.expiration_time ? Number(sub.expiration_time) : null, keys: { p256dh: sub.p256dh, auth: sub.auth } };
  try {
    const payload = await buildPushPayload({ data: JSON.stringify(data), options: { ttl: 3600 } }, subscription as any, vapid as any);
    const res = await fetch(sub.endpoint, payload);
    if (res.status === 404 || res.status === 410) {
      await env.DB.prepare('UPDATE subscriptions SET active=0, updated_at=? WHERE device_id=?').bind(new Date().toISOString(), row.device_id).run();
      return { ok: false, permanent: true, error: `push_endpoint_${res.status}` };
    }
    if (!res.ok) return { ok: false, permanent: false, error: `push_${res.status}_${(await res.text()).slice(0,120)}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, permanent: false, error: String(e?.message || e) };
  }
}

async function processDue(env: Env) {
  const now = new Date();
  const rows = await env.DB.prepare(`SELECT * FROM notification_jobs
    WHERE acked_at IS NULL AND attempts < max_attempts AND next_at <= ? ORDER BY next_at ASC LIMIT 50`).bind(now.toISOString()).all();
  for (const row of rows.results || []) {
    const result = await sendPush(env, row);
    const attempts = Number(row.attempts || 0) + 1;
    if (result.ok) {
      const retryMinutes = attempts === 1 ? 10 : 20;
      const nextAt = attempts < Number(row.max_attempts) ? new Date(Date.now() + retryMinutes * 60000).toISOString() : null;
      await env.DB.prepare('UPDATE notification_jobs SET attempts=?, next_at=COALESCE(?, next_at), sent_at=?, last_error=NULL WHERE id=?')
        .bind(attempts, nextAt, new Date().toISOString(), row.id).run();
    } else if (result.permanent) {
      await env.DB.prepare('UPDATE notification_jobs SET attempts=max_attempts, sent_at=?, last_error=? WHERE id=?')
        .bind(new Date().toISOString(), result.error, row.id).run();
    } else {
      const nextAt = new Date(Date.now() + 15 * 60000).toISOString();
      await env.DB.prepare('UPDATE notification_jobs SET attempts=?, next_at=?, last_error=? WHERE id=?')
        .bind(attempts, nextAt, result.error, row.id).run();
    }
  }

  // Retry sheet sync for recent failed/pending events without blocking pushes.
  const unsynced = await env.DB.prepare("SELECT * FROM events WHERE sync_status!='synced' ORDER BY created_at DESC LIMIT 20").all();
  for (const e of unsynced.results || []) {
    if (!env.SHEET_SYNC_URL) break;
    try {
      const payload = JSON.parse(e.payload_json || '{}');
      const res = await fetch(env.SHEET_SYNC_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: JSON.stringify({ bridgeCode: env.SHEET_SYNC_SECRET, event: { eventId: e.event_id, deviceId: e.device_id, eventType: e.event_type, ts: e.ts, payload } }) });
      const text = await res.text();
      if (!res.ok || !text.includes('"ok":true')) throw new Error(`sheet ${res.status}: ${text.slice(0,160)}`);
      await env.DB.prepare("UPDATE events SET sync_status='synced', sync_error=NULL WHERE event_id=?").bind(e.event_id).run();
    } catch (err: any) {
      await env.DB.prepare("UPDATE events SET sync_status='error', sync_error=? WHERE event_id=?").bind(String(err?.message || err).slice(0,500), e.event_id).run();
    }
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env, req) });
    const url = new URL(req.url);
    if (url.pathname === '/api/health' && req.method === 'GET') return reply(env, req, { ok: true, service: 'health-ally-push', time: new Date().toISOString() });
    if (url.pathname === '/api/config' && req.method === 'GET') return reply(env, req, { ok: true, vapidPublicKey: env.VAPID_SERVER_PUBLIC_KEY });
    if (url.pathname === '/api/pair' && req.method === 'POST') return pair(req, env);

    const device = await authDevice(req, env);
    if (!device) return reply(env, req, { ok: false, error: 'unauthorized' }, 401);
    if (url.pathname === '/api/subscribe' && req.method === 'POST') return subscribe(req, env, device);
    if (url.pathname === '/api/schedule' && req.method === 'POST') return scheduleJob(req, env, device);
    if (url.pathname === '/api/ack' && req.method === 'POST') return ackJob(req, env, device);
    if (url.pathname === '/api/log' && req.method === 'POST') return logEvent(req, env, device);
    return reply(env, req, { ok: false, error: 'not_found' }, 404);
  },

  async scheduled(_event: any, env: Env, ctx: any) {
    ctx.waitUntil(processDue(env));
  }
};
