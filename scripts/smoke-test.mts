/** Smoke test — يتحقق من محرك اللهجة ودوال الـ API قبل الرفع. */
import { parseWithSudaneseRules } from '../shared/parseWithSudaneseRules.js';
import { handleParseSale } from '../shared/parseSaleService.js';
import parseSaleHandler from '../api/ai/parse-sale.js';
import healthHandler from '../api/health.js';
import emailHandler from '../api/notifications/email/send.js';

const inventory = [
  {
    id: 'p1',
    nameAr: 'سكر كنانة أبيض فاخر',
    aliases: ['سكر'],
    sellingPrice: 1500,
    baseUnit: 'كيلوجرام',
    allowedUnits: [{ unitName: 'كيلو', conversionFactor: 1 }, { unitName: 'رطل', conversionFactor: 0.45 }],
    currentStock: 350,
  },
  {
    id: 'p2',
    nameAr: 'شاي الغزالتين أسود ممتاز',
    aliases: ['شاي'],
    sellingPrice: 1100,
    baseUnit: 'حبة',
    allowedUnits: [{ unitName: 'حبة', conversionFactor: 1 }],
    currentStock: 8,
  },
];

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`, extra ?? ''); }
}

// 1) Rule engine — بيع عادي
const r1 = parseWithSudaneseRules('بعت اتنين كيلو سكر وكيلو شاي', inventory, []);
check('يكتشف صنفين (سكر + شاي)', r1.recognizedItems.length === 2, r1.recognizedItems);
check('كمية السكر = 2', r1.recognizedItems[0]?.quantity === 2, r1.recognizedItems[0]);

// 2) عبارة مبهمة → clarificationNeeded
const r2 = parseWithSudaneseRules('جيب لي خمسة من داك', inventory, []);
check('العبارة المبهمة تُطلب توضيحاً', r2.clarificationNeeded.length === 1 && r2.recognizedItems.length === 0, r2);

// 3) أصناف قابلة للعد بدون وحدة صريحة → تستخدم وحدة المنتج الأساسية (حبة) وليس كيلو
const r2b = parseWithSudaneseRules('بعت تلاتة شاي', inventory, []);
check('«تلاتة شاي» = 3 حبة وليس كيلو', r2b.recognizedItems.length === 1 && r2b.recognizedItems[0]?.quantity === 3 && r2b.recognizedItems[0]?.unit === 'حبة', r2b.recognizedItems[0]);

// 4) طريقة دفع + عميل
const r3 = parseWithSudaneseRules('بعت كيلو سكر للعميل عمر بالآجل', inventory, []);
check('يكتشف الدفع الآجل', r3.paymentMethod === 'credit', r3.paymentMethod);
check('يكتشف اسم العميل', r3.customerName === 'عمر', r3.customerName);

// 5) handleParseSale بدون مفتاح → rule_engine
const r4 = await handleParseSale({ speechText: 'بعت اتنين كيلو سكر', inventoryItems: inventory }, { geminiApiKey: '' });
check('بدون مفتاح يعمل المحرك المحلي', r4.source === 'rule_engine' && r4.recognizedItems.length === 1, r4.source);

// 6) مع مفتاح غير صالح → fallback مهذب (لا يسقط)
const r5 = await handleParseSale({ speechText: 'بعت اتنين كيلو سكر', inventoryItems: inventory }, { geminiApiKey: 'invalid-key-for-test', geminiModel: 'gemini-3.8-flash' });
check('مفتاح غير صالح → fallback آمن', r5.source === 'rule_engine_after_error' && r5.recognizedItems.length === 1, r5);

// 5) دالة Vercel: health
function mockRes() {
  const r: any = { statusCode: 0, body: null };
  r.status = (c: number) => { r.statusCode = c; return r; };
  r.json = (b: unknown) => { r.body = b; return r; };
  r.setHeader = () => r;
  return r;
}
const h = mockRes();
healthHandler({ method: 'GET' } as any, h);
check('GET /api/health يرجع ok', h.statusCode === 200 && h.body.status === 'ok', h.body);

// 6) دالة Vercel: parse-sale (POST)
const ps = mockRes();
await parseSaleHandler({ method: 'POST', body: { speechText: 'بعت اتنين كيلو سكر وكيلو شاي', inventoryItems: inventory, customDictionary: [] } } as any, ps);
check('POST /api/ai/parse-sale يرجع صنفين', ps.statusCode === 200 && ps.body.recognizedItems?.length === 2, ps.body);

// 7) parse-sale بدون نص → 400
const ps400 = mockRes();
await parseSaleHandler({ method: 'POST', body: {} } as any, ps400);
check('بدون speechText يرجع 400', ps400.statusCode === 400, ps400.statusCode);

// 8) parse-sale بـ GET → 405
const ps405 = mockRes();
await parseSaleHandler({ method: 'GET' } as any, ps405);
check('GET على parse-sale يرجع 405', ps405.statusCode === 405, ps405.statusCode);

// 9) email stub
const em = mockRes();
emailHandler({ method: 'POST', body: { recipient: 'a@b.com', subject: 'تقرير', type: 'daily_summary', summaryText: 'مبيعات اليوم' } } as any, em);
check('POST email/send يرجع messageId', em.statusCode === 200 && Boolean(em.body.messageId), em.body);

console.log(`\nالنتيجة: ${pass} ناجح / ${fail} فاشل`);
process.exit(fail > 0 ? 1 : 0);
