import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasDatabase, dbPing } from '../../shared/db.js';

/**
 * GET /api/cloud/ping — فحص اتصال السحابة (Neon / Supabase / أي Postgres).
 * بدون DATABASE_URL بيرجع configured: false والتطبيق يفضل محلي بالكامل.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!hasDatabase()) {
    return res.status(200).json({ configured: false, ok: false, message: 'السحابة ما مضبوطة — ضع DATABASE_URL' });
  }
  const result = await dbPing();
  return res.status(200).json({
    configured: true,
    ok: result.ok,
    provider: result.provider,
    latencyMs: result.latencyMs,
    error: result.error,
  });
}
