import type { VercelRequest, VercelResponse } from '@vercel/node';
// مهم: الاستيرادات النسبية داخل مجلد api/ يجب أن تنتهي بـ .js صراحةً
// (البناء على Vercel يُخرج ESM، والـ import بدون امتداد يفشل وقت التحميل).
import { handleParseSale } from '../../shared/parseSaleService.js';

/**
 * POST /api/ai/parse-sale — محلل اللهجة السودانية لطلبات البيع (Vercel Serverless Function).
 *
 * العقد مطابق تماماً لـ server.ts (تطوير محلي):
 * Body: { speechText, inventoryItems, customDictionary }
 * Response: { source, recognizedItems, clarificationNeeded, discountAmount,
 *             customerName, paymentMethod, paidAmount, summaryNotesAr }
 *
 * بدون مفتاح GEMINI_API_KEY يعمل المحرك اللغوي المحلي (Rule-Based) تلقائياً.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as {
    speechText?: unknown;
    inventoryItems?: any[];
    customDictionary?: any[];
  };

  const { speechText, inventoryItems, customDictionary } = body;

  if (!speechText || typeof speechText !== 'string') {
    return res.status(400).json({ error: 'speechText is required' });
  }

  try {
    const result = await handleParseSale(
      {
        speechText,
        inventoryItems: Array.isArray(inventoryItems) ? inventoryItems : [],
        customDictionary: Array.isArray(customDictionary) ? customDictionary : [],
      },
      {
        geminiApiKey: process.env.GEMINI_API_KEY,
        geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      }
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('parse-sale handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
