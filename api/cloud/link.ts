import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasDatabase } from '../../shared/db.js';
import { linkDevice, CloudError } from '../../shared/cloudService.js';

/**
 * POST /api/cloud/link — ربط جهاز جديد بمحل موجود.
 * body: { storeCode, password }
 * بيرجع الجلسة (token) + آخر لقطة من السحابة (لو فيه) عشان الجهاز الجديد يبدأ منها.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasDatabase()) {
    return res.status(503).json({ error: 'السحابة ما مضبوطة على السيرفر — ضع DATABASE_URL في متغيرات البيئة' });
  }
  try {
    const result = await linkDevice({
      storeCode: String(req.body?.storeCode || ''),
      password: String(req.body?.password || ''),
    });
    return res.status(200).json(result);
  } catch (err: any) {
    if (err instanceof CloudError) return res.status(err.status).json({ error: err.message });
    console.error('cloud/link error:', err);
    return res.status(500).json({ error: 'خطأ في السيرفر — جرّب تاني' });
  }
}
