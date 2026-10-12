/**
 * خدمة السحابة — حسابات المتجر + المزامنة.
 *
 * المعمارية: «أوفلاين أولاً + مزامنة سحابية»
 *   • التطبيق يشتغل محلياً بالكامل (localStorage) زي ما هو.
 *   • الجهاز المرتبط بالمحل بيرفع «لقطة» (snapshot) كاملة للسحابة وبيجيب أحدث لقطة.
 *   • الموظفين بيستخدموا نفس نظام الـPIN الموجود في التطبيق — السحابة بتوصل الأجهزة، والصلاحيات محلية زي ما هي.
 *
 * الأمان:
 *   • كلمة سر المالك: scrypt (ملح عشوائي لكل متجر).
 *   • الجلسة: JWT موقّعة HS256 بمفتاح AUTH_SECRET (أو مشتق من DATABASE_URL لو ما اتحدد).
 */
import crypto from 'node:crypto';
import { withClient } from './db.js';

/* ════════════════════════ أدوات التشفير ════════════════════════ */

const b64u = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64url');

function authSecret(): string {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) {
    return process.env.AUTH_SECRET;
  }
  // مشتق ثابت من رابط القاعدة — الجلسات ما تكسر مع كل redeploy
  return 'derived:' + crypto.createHash('sha256')
    .update(process.env.DATABASE_URL || 'hisabati-fallback')
    .digest('hex');
}

export function signToken(payload: Record<string, unknown>, ttlHours = 24 * 30): string {
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlHours * 3600,
  }));
  const sig = crypto.createHmac('sha256', authSecret()).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string | null | undefined): Record<string, any> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', authSecret()).update(`${header}.${body}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex');
  const a = Buffer.from(candidate);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** كود المتجر: حروف واضحة (بدون 0/O و 1/I) زي AMNA-7K2Q */
function generateStoreCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = (n: number) =>
    Array.from(crypto.randomBytes(n)).map((b) => alphabet[b % alphabet.length]).join('');
  return `${pick(4)}-${pick(4)}`;
}

/* ════════════════════════ الأخطاء الموحدة ════════════════════════ */

export class CloudError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ════════════════════════ التسجيل والربط ════════════════════════ */

export interface RegisterInput {
  storeName: string;
  ownerName: string;
  email: string;
  password: string;
}

export async function registerStore(input: RegisterInput): Promise<{
  storeCode: string;
  storeId: string;
  storeName: string;
  token: string;
}> {
  const storeName = (input.storeName || '').trim();
  const email = (input.email || '').trim().toLowerCase();
  const password = input.password || '';
  if (storeName.length < 2) throw new CloudError('اسم المحل مطلوب', 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new CloudError('البريد الإلكتروني غير صحيح', 400);
  if (password.length < 6) throw new CloudError('كلمة السر لازم 6 حروف على الأقل', 400);

  return withClient(async (client) => {
    // متجر واحد لكل بريد
    const existing = await client.query('SELECT id FROM cloud_stores WHERE owner_email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      throw new CloudError('فيه حساب مسجل بنفس البريد ده — جرب «ربط جهاز» بدل التسجيل', 409);
    }
    let code = generateStoreCode();
    for (let i = 0; i < 5; i++) {
      const clash = await client.query('SELECT id FROM cloud_stores WHERE code = $1', [code]);
      if (!clash.rowCount) break;
      code = generateStoreCode();
    }
    const inserted = await client.query(
      `INSERT INTO cloud_stores (code, name, owner_name, owner_email, password_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, code, name`,
      [code, storeName, (input.ownerName || '').trim(), email, hashPassword(password)]
    );
    const row = inserted.rows[0];
    return {
      storeCode: row.code,
      storeId: row.id,
      storeName: row.name,
      token: signToken({ sid: row.id, code: row.code, email, role: 'owner' }),
    };
  });
}

export async function linkDevice(input: { storeCode: string; password: string }): Promise<{
  storeCode: string;
  storeId: string;
  storeName: string;
  ownerName: string;
  token: string;
  latest: SnapshotRow | null;
}> {
  const code = (input.storeCode || '').trim().toUpperCase();
  const password = input.password || '';
  if (!code) throw new CloudError('كود المحل مطلوب', 400);

  return withClient(async (client) => {
    const found = await client.query(
      'SELECT id, code, name, owner_name, password_hash FROM cloud_stores WHERE code = $1',
      [code]
    );
    if (!found.rowCount) throw new CloudError('ما لقينا محل بهاد الكود — تأكد منو', 404);
    const store = found.rows[0];
    if (!verifyPassword(password, store.password_hash)) {
      throw new CloudError('كلمة السر غلط', 401);
    }
    const latest = await getLatestRow(client, store.id);
    return {
      storeCode: store.code,
      storeId: store.id,
      storeName: store.name,
      ownerName: store.owner_name,
      token: signToken({ sid: store.id, code: store.code, role: 'owner' }),
      latest,
    };
  });
}

/* ════════════════════════ المزامنة ════════════════════════ */

export interface SnapshotRow {
  id: number;
  clientAt: string;
  receivedAt: string;
  device: string;
  pushedBy: string;
  sizeBytes: number;
  data: unknown;
  meta: Record<string, unknown>;
}

const MAX_SNAPSHOTS_PER_STORE = 20;
const MAX_SNAPSHOT_BYTES = 4 * 1024 * 1024; // 4MB — حد طلبات Vercel

async function getLatestRow(client: any, storeId: string): Promise<SnapshotRow | null> {
  const res = await client.query(
    `SELECT id, client_at, received_at, device, pushed_by, size_bytes, data, meta
     FROM cloud_snapshots WHERE store_id = $1 ORDER BY id DESC LIMIT 1`,
    [storeId]
  );
  if (!res.rowCount) return null;
  return rowToSnapshot(res.rows[0]);
}

function rowToSnapshot(row: any): SnapshotRow {
  return {
    id: Number(row.id),
    clientAt: new Date(row.client_at).toISOString(),
    receivedAt: new Date(row.received_at).toISOString(),
    device: row.device || '',
    pushedBy: row.pushed_by || '',
    sizeBytes: Number(row.size_bytes) || 0,
    data: row.data,
    meta: row.meta || {},
  };
}

export async function pushSnapshot(params: {
  storeId: string;
  storeCode: string;
  data: unknown;
  meta?: Record<string, unknown>;
  clientAt: string;
  device: string;
  pushedBy: string;
  baseSnapshotAt?: string | null;
}): Promise<{ ok: true; snapshotId: number; conflict: boolean; latestAt: string | null }> {
  const serialized = JSON.stringify(params.data ?? null);
  const size = Buffer.byteLength(serialized, 'utf-8');
  if (size > MAX_SNAPSHOT_BYTES) {
    throw new CloudError(
      `حجم البيانات ${Math.round(size / 1024 / 1024)}MB أكبر من حد السحابة (4MB) — أرشف الفواتير القديمة وجرّب تاني`,
      413
    );
  }
  const clientAt = params.clientAt && !isNaN(Date.parse(params.clientAt))
    ? new Date(params.clientAt).toISOString()
    : new Date().toISOString();

  return withClient(async (client) => {
    const latest = await getLatestRow(client, params.storeId);
    // تعارض: السحابة فيها نسخة أحدث من اللي جهازك مبني عليها (جهاز تاني رفع بعدها)
    const conflict = Boolean(
      latest && params.baseSnapshotAt &&
      Date.parse(latest.clientAt) > Date.parse(params.baseSnapshotAt)
    );

    const inserted = await client.query(
      `INSERT INTO cloud_snapshots (store_id, data, meta, client_at, device, pushed_by, size_bytes)
       VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, $6, $7) RETURNING id`,
      [params.storeId, serialized, JSON.stringify(params.meta || {}), clientAt, params.device || '', params.pushedBy || '', size]
    );

    // تقليم التاريخ — نحتفظ بآخر N لقطة
    await client.query(
      `DELETE FROM cloud_snapshots WHERE store_id = $1 AND id NOT IN (
         SELECT id FROM cloud_snapshots WHERE store_id = $1 ORDER BY id DESC LIMIT $2
       )`,
      [params.storeId, MAX_SNAPSHOTS_PER_STORE]
    );

    const nowLatest = await getLatestRow(client, params.storeId);
    return {
      ok: true as const,
      snapshotId: Number(inserted.rows[0].id),
      conflict,
      latestAt: nowLatest ? nowLatest.clientAt : null,
    };
  });
}

export async function getLatest(storeId: string): Promise<SnapshotRow | null> {
  return withClient(async (client) => getLatestRow(client, storeId));
}

export async function listHistory(storeId: string, limit = 10): Promise<Omit<SnapshotRow, 'data'>[]> {
  return withClient(async (client) => {
    const res = await client.query(
      `SELECT id, client_at, received_at, device, pushed_by, size_bytes, meta
       FROM cloud_snapshots WHERE store_id = $1 ORDER BY id DESC LIMIT $2`,
      [storeId, Math.min(Math.max(limit, 1), 20)]
    );
    return res.rows.map((row: any) => {
      const snap = rowToSnapshot(row);
      delete (snap as any).data;
      return snap;
    });
  });
}

/** استخراج معلومات الجلسة من ترويسة الطلب */
export function sessionFromAuthHeader(auth: string | null | undefined): { storeId: string; storeCode: string } {
  const token = (auth || '').replace(/^Bearer\s+/i, '');
  const payload = verifyToken(token);
  if (!payload?.sid || !payload?.code) {
    throw new CloudError('الجلسة منتهية — اربط الجهاز بالمحل من جديد', 401);
  }
  return { storeId: String(payload.sid), storeCode: String(payload.code) };
}
