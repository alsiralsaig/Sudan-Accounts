import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/notifications/email/send — مُرسل الإشعارات البريدية (Vercel Serverless Function).
 *
 * ملاحظة: هذه واجهة محاكاة (Stub) مطابقة لسلوك server.ts — تسجّل العملية
 * وتعيد استجابة نجاح دون إرسال فعلي. ربطها بمزوّد SMTP/SendGrid لاحقاً يتم هنا.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as {
    recipient?: string;
    subject?: string;
    htmlContent?: string;
    type?: string;
    summaryText?: string;
  };

  const { recipient, subject, type, summaryText } = body;

  if (!recipient || !subject) {
    return res.status(400).json({ error: 'recipient and subject are required' });
  }

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();

  console.log(
    `[Email Dispatcher] Sent ${type || 'notification'} to <${recipient}> with subject: "${subject}" (ID: ${messageId})${
      summaryText ? ` — ${String(summaryText).slice(0, 120)}` : ''
    }`
  );

  return res.status(200).json({
    success: true,
    messageId,
    recipient,
    subject,
    type: type || 'general',
    status: 'delivered',
    timestamp,
    deliveryNote: 'تم إرسال الإشعار البريدي بنجاح إلى مدير المتجر عبر خادم الإشعارات.',
  });
}
