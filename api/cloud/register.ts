import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasDatabase } from '../../shared/db.js';
import { registerStore, CloudError } from '../../shared/cloudService.js';

/**
 * POST /api/cloud/register — تسجيل محل جديد في السحابة (المالك).
 * body: { storeName, ownerName, email, password }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasDatabase()) {
    return res.status(503).json({ error: 'السحابة ما مضبوطة على السيرفر — ضع DATABASE_URL في متغيرات البيئة' });
  }
  try {
    const result = await registerStore({
      storeName: String(req.body?.storeName || ''),
      ownerName: String(req.body?.ownerName || ''),
      email: String(req.body?.email || ''),
      password: String(req.body?.password || ''),
    });
    return res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof CloudError) return res.status(err.status).json({ error: err.message });
    console.error('cloud/register error:', err);
    return res.status(500).json({ error: 'خطأ في السيرفر — جرّب تاني' });
  }
}
