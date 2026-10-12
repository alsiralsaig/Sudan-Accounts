/**
 * خادم التطوير المحلي والإنتاج الذاتي (Express + Vite).
 *
 * على Vercel لا يعمل هذا الملف — بل تعمل دوال Serverless في مجلد `api/`
 * التي تشترك معه في نفس المنطق عبر مجلد `shared/`.
 */
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { handleParseSale } from './shared/parseSaleService.js';
import {
  registerStore,
  linkDevice,
  pushSnapshot,
  getLatest,
  listHistory,
  sessionFromAuthHeader,
  CloudError,
} from './shared/cloudService.js';
import { hasDatabase, dbPing } from './shared/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' })); // لقطات المزامنة السحابية أكبر من JSON الافتراضي

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    runtime: 'express',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasDatabase: hasDatabase(),
    timestamp: new Date().toISOString(),
  });
});

/* ═══════════ الروابط السحابية (Neon / Supabase / أي Postgres) ═══════════ */

const cloudGuard = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!hasDatabase()) {
    return res.status(503).json({ error: 'السحابة ما مضبوطة — ضع DATABASE_URL في ملف .env' });
  }
  next();
};

const cloudError = (err: any, res: express.Response) => {
  if (err instanceof CloudError) return res.status(err.status).json({ error: err.message });
  console.error('cloud error:', err);
  return res.status(500).json({ error: 'خطأ في السيرفر — جرّب تاني' });
};

app.get('/api/cloud/ping', cloudGuard, async (_req, res) => {
  const result = await dbPing();
  res.json({ configured: true, ...result });
});

app.post('/api/cloud/register', cloudGuard, async (req, res) => {
  try {
    res.status(201).json(await registerStore({
      storeName: String(req.body?.storeName || ''),
      ownerName: String(req.body?.ownerName || ''),
      email: String(req.body?.email || ''),
      password: String(req.body?.password || ''),
    }));
  } catch (err) { cloudError(err, res); }
});

app.post('/api/cloud/link', cloudGuard, async (req, res) => {
  try {
    res.json(await linkDevice({
      storeCode: String(req.body?.storeCode || ''),
      password: String(req.body?.password || ''),
    }));
  } catch (err) { cloudError(err, res); }
});

app.post('/api/cloud/push', cloudGuard, async (req, res) => {
  try {
    const session = sessionFromAuthHeader(req.headers?.authorization);
    if (!req.body?.data) return res.status(400).json({ error: 'data مطلوبة' });
    res.json(await pushSnapshot({
      storeId: session.storeId,
      storeCode: session.storeCode,
      data: req.body.data,
      meta: req.body.meta && typeof req.body.meta === 'object' ? req.body.meta : {},
      clientAt: String(req.body.clientAt || ''),
      device: String(req.body.device || ''),
      pushedBy: String(req.body.pushedBy || ''),
      baseSnapshotAt: req.body.baseSnapshotAt ? String(req.body.baseSnapshotAt) : null,
    }));
  } catch (err) { cloudError(err, res); }
});

app.get('/api/cloud/latest', cloudGuard, async (req, res) => {
  try {
    const session = sessionFromAuthHeader(req.headers?.authorization);
    const latest = await getLatest(session.storeId);
    if (!latest) return res.json({ hasSnapshot: false });
    if (req.query.full !== '1' && req.query.full !== 'true') {
      const { data, ...meta } = latest;
      return res.json({ hasSnapshot: true, ...meta });
    }
    res.json({ hasSnapshot: true, ...latest });
  } catch (err) { cloudError(err, res); }
});

app.get('/api/cloud/history', cloudGuard, async (req, res) => {
  try {
    const session = sessionFromAuthHeader(req.headers?.authorization);
    const limit = parseInt(String(req.query.limit || '10'), 10) || 10;
    res.json({ snapshots: await listHistory(session.storeId, limit) });
  } catch (err) { cloudError(err, res); }
});

// Email Notification Dispatcher Endpoints
// ملاحظة: واجهة محاكاة (Stub) — تسجّل العملية دون إرسال فعلي حتى ربطها بمزوّد بريد.
app.post('/api/notifications/email/send', (req, res) => {
  const { recipient, subject, htmlContent, type, summaryText } = req.body;

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

  return res.json({
    success: true,
    messageId,
    recipient,
    subject,
    type: type || 'general',
    status: 'delivered',
    timestamp,
    deliveryNote: 'تم إرسال الإشعار البريدي بنجاح إلى مدير المتجر عبر خادم الإشعارات.',
  });
});

// Sudanese Dialect parser endpoint
app.post('/api/ai/parse-sale', async (req, res) => {
  const { speechText, inventoryItems, customDictionary } = req.body;

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

    return res.json(result);
  } catch (error) {
    console.error('parse-sale handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// In production or dev, hook Vite or static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    // Dev mode with Vite middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
