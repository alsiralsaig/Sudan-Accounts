import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasDatabase } from '../../shared/db.js';
import { pushSnapshot, sessionFromAuthHeader, CloudError } from '../../shared/cloudService.js';

/**
 * POST /api/cloud/push — رفع لقطة البيانات الحالية للسحابة (مصادقة Bearer).
 * body: { data, meta?, clientAt, device, pushedBy, baseSnapshotAt? }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasDatabase()) {
    return res.status(503).json({ error: 'السحابة ما مضبوطة على السيرفر' });
  }
  try {
    const session = sessionFromAuthHeader(req.headers?.authorization);
    if (!req.body?.data) return res.status(400).json({ error: 'data مطلوبة' });
    const result = await pushSnapshot({
      storeId: session.storeId,
      storeCode: session.storeCode,
      data: req.body.data,
      meta: req.body.meta && typeof req.body.meta === 'object' ? req.body.meta : {},
      clientAt: String(req.body.clientAt || ''),
      device: String(req.body.device || ''),
      pushedBy: String(req.body.pushedBy || ''),
      baseSnapshotAt: req.body.baseSnapshotAt ? String(req.body.baseSnapshotAt) : null,
    });
    return res.status(200).json(result);
  } catch (err: any) {
    if (err instanceof CloudError) return res.status(err.status).json({ error: err.message });
    console.error('cloud/push error:', err);
    return res.status(500).json({ error: 'خطأ في السيرفر — جرّب تاني' });
  }
}
