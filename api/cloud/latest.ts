import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasDatabase } from '../../shared/db.js';
import { getLatest, sessionFromAuthHeader, CloudError } from '../../shared/cloudService.js';

/**
 * GET /api/cloud/latest — أحدث لقطة من السحابة (مصادقة Bearer).
 * ?full=1 لجلب البيانات كاملة (بدونها بيرجع المعلومات بس للمقارنة السريعة).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasDatabase()) {
    return res.status(503).json({ error: 'السحابة ما مضبوطة على السيرفر' });
  }
  try {
    const session = sessionFromAuthHeader(req.headers?.authorization);
    const full = req.query?.full === '1' || req.query?.full === 'true';
    const latest = await getLatest(session.storeId);
    if (!latest) return res.status(200).json({ hasSnapshot: false });
    if (!full) {
      const { data, ...meta } = latest;
      return res.status(200).json({ hasSnapshot: true, ...meta });
    }
    return res.status(200).json({ hasSnapshot: true, ...latest });
  } catch (err: any) {
    if (err instanceof CloudError) return res.status(err.status).json({ error: err.message });
    console.error('cloud/latest error:', err);
    return res.status(500).json({ error: 'خطأ في السيرفر — جرّب تاني' });
  }
}
