import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/health — فحص حالة الخدمة على Vercel Serverless Functions.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    runtime: 'vercel-serverless',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
