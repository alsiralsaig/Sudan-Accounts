import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasDatabase } from '../../shared/db.js';
import { listHistory, sessionFromAuthHeader, CloudError } from '../../shared/cloudService.js';

/**
 * GET /api/cloud/history — قائمة اللقطات المحفوظة في السحابة (مصادقة Bearer).
 * ?limit=10
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasDatabase()) {
    return res.status(503).json({ error: 'السحابة ما مضبوطة على السيرفر' });
  }
  try {
    const session = sessionFromAuthHeader(req.headers?.authorization);
    const limit = parseInt(String(req.query?.limit || '10'), 10) || 10;
    const snapshots = await listHistory(session.storeId, limit);
    return res.status(200).json({ snapshots });
  } catch (err: any) {
    if (err instanceof CloudError) return res.status(err.status).json({ error: err.message });
    console.error('cloud/history error:', err);
    return res.status(500).json({ error: 'خطأ في السيرفر — جرّب تاني' });
  }
}
