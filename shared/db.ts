/**
 * طبقة Postgres السحابية — تشتغل مع أي مزود Postgres:
 *   • Neon      (neon.tech)
 *   • Supabase  (supabase.com)
 *   • أي خادم Postgres تاني
 *
 * كل اللي تحتاجه: متغير DATABASE_URL في البيئة.
 * بدونو التطبيق يفضل يعمل محلياً 100% (localStorage) — السحابة اختيارية بالكامل.
 *
 * ملاحظة الإنتاج: استخدم رابط الـ Pooling من المزود:
 *   Neon:     الرابط المنتهي بـ -pooler
 *   Supabase: Connection Pooler (port 6544)
 */
import { Pool, PoolClient } from 'pg';

let _pool: Pool | null = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function needsSsl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
    if (/[?&]sslmode=disable/.test(url)) return false;
    // Neon و Supabase وكل السحابية بتطلب SSL
    return true;
  } catch {
    return false;
  }
}

/** الاتصال — بيتعمل مرة وبيفضل حي (warm invocations على Vercel) */
export function getPool(): Pool {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL غير مضبوط');
  _pool = new Pool({
    connectionString: url,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
    max: 3, // سيرفرلس: خفيف
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 20000,
  });
  _pool.on('error', (err) => {
    console.error('[db] pool error:', err.message);
  });
  return _pool;
}

/** تنفيذ استعلام مع ضمان إنو المخطط موجود (مرة واحدة لكل عملية باردة) */
let _schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (_schemaReady) return _schemaReady;
  _schemaReady = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cloud_stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        owner_name TEXT NOT NULL DEFAULT '',
        owner_email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS cloud_snapshots (
        id BIGSERIAL PRIMARY KEY,
        store_id UUID NOT NULL REFERENCES cloud_stores(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        meta JSONB NOT NULL DEFAULT '{}',
        client_at TIMESTAMPTZ NOT NULL,
        received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        device TEXT NOT NULL DEFAULT '',
        pushed_by TEXT NOT NULL DEFAULT '',
        size_bytes INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_cloud_snapshots_store
        ON cloud_snapshots(store_id, id DESC);
    `);
  })().catch((err) => {
    _schemaReady = null; // خلّي المحاولة الجاية تجرب من جديد
    throw err;
  });
  return _schemaReady;
}

/** جلسة عمل — المخطط + الاستعلامات في معاملة واحدة عند الحاجة */
export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/** فحص سريع للاتصال — لشاشة الإعداد */
export async function dbPing(): Promise<{ ok: boolean; provider: string; latencyMs: number; error?: string }> {
  const started = Date.now();
  try {
    await ensureSchema();
    await getPool().query('SELECT 1');
    const url = process.env.DATABASE_URL || '';
    const provider = /neon\.tech/i.test(url) ? 'Neon'
      : /supabase\.(co|com)/i.test(url) ? 'Supabase'
      : 'Postgres';
    return { ok: true, provider, latencyMs: Date.now() - started };
  } catch (err: any) {
    return { ok: false, provider: 'غير معروف', latencyMs: Date.now() - started, error: err?.message || 'فشل الاتصال' };
  }
}
