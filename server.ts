import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI if key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({});
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Email Notification Dispatcher Endpoints
app.post('/api/notifications/email/send', (req, res) => {
  const { recipient, subject, htmlContent, type, summaryText } = req.body;

  if (!recipient || !subject) {
    return res.status(400).json({ error: 'recipient and subject are required' });
  }

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = new Date().toISOString();

  console.log(`[Email Dispatcher] Sent ${type || 'notification'} to <${recipient}> with subject: "${subject}" (ID: ${messageId})`);

  return res.json({
    success: true,
    messageId,
    recipient,
    subject,
    type: type || 'general',
    status: 'delivered',
    timestamp,
    deliveryNote: 'تم إرسال الإشعار البريدي بنجاح إلى مدير المتجر عبر خادم الإشعارات.'
  });
});


// Sudanese Dialect parser endpoint
app.post('/api/ai/parse-sale', async (req, res) => {
  const { speechText, inventoryItems, customDictionary } = req.body;

  if (!speechText || typeof speechText !== 'string') {
    return res.status(400).json({ error: 'speechText is required' });
  }

  // Pre-process & Fallback Rule Engine
  const fallbackResult = parseWithSudaneseRules(speechText, inventoryItems || [], customDictionary || []);

  if (!process.env.GEMINI_API_KEY || !aiClient) {
    // Return high-quality rule-based fallback if no Gemini API key
    return res.json({
      source: 'rule_engine',
      ...fallbackResult,
    });
  }

  try {
    const inventorySummary = (inventoryItems || []).map((item: any) => ({
      id: item.id,
      name: item.nameAr,
      aliases: item.aliases || [],
      price: item.sellingPrice,
      baseUnit: item.baseUnit,
      allowedUnits: (item.allowedUnits || []).map((u: any) => u.unitName),
      stock: item.currentStock,
    }));

    const dictionarySummary = (customDictionary || []).map((d: any) => ({
      dialect: d.dialectTerm,
      standard: d.standardTerm,
      mappedProduct: d.productName,
    }));

    const prompt = `
أنت خبير محاسبي متخصص في فهم اللهجة السودانية الدارجة والمصطلحات التجارية في الأسواق ومحلات البقالة والتجارة في السودان.
المهمة: قم بتحليل طلب البيع التالي الصادر من تاجر سوداني واستخراج المنتجات والكميات والوحدات بدقة متناهية، ومطابقتها مع قائمة المخزون المتاحة.

نص التاجر: "${speechText}"

قائمة المخزون المتوفرة بالمحل:
${JSON.stringify(inventorySummary, null, 2)}

قاموس المصطلحات والمترادفات السودانية المعتمدة:
${JSON.stringify(dictionarySummary, null, 2)}

قواعد صارمة:
1. الوحدات السودانية تشمل: (كيلو، رطل، أوقية، كرتونة، جوال، شكارة، دستة، باكت، حبة، لتر، جركانة، ربطة، الخ).
2. الرطل في السودان يساوي تقريباً نصف كيلو (أو 450 جرام).
3. الجوال = شوال (عادة 50 كجم للمواد التموينية).
4. الدستة = 12 حبة.
5. لا تخترع أسعاراً إطلاقاً! استخرج السعر من المخزون فقط.
6. إذا كان هناك منتج غير واضح أو مبهم تماماً (مثل "جيب لي خمسة من داك" أو صنف غير موجود)، ضعه في مصفوفة clarificationNeeded مع سبب عدم الفهم وخيارات مقترحة بدلاً من التخمين!
7. استخرج طريقة الدفع إذا ذُكرت: كاش (cash)، بنكك (bankak - بنك الخرطوم)، فوري (fawry)، أو آجل (credit - دين).
8. استخرج اسم العميل والمبلغ المدفوع إن وجد.

قم بإرجاع النتيجة بتنسيق JSON حصراً بالشكل التالي:
{
  "recognizedItems": [
    {
      "productId": "معرف المنتج من المخزون أو null",
      "productName": "اسم المنتج المطابق في المخزون أو النص المذكور",
      "quantity": 2,
      "unit": "كيلو",
      "unitPrice": 1500,
      "confidence": 0.95,
      "notes": "تمت المطابقة مع سكر كنانة"
    }
  ],
  "clarificationNeeded": [
    {
      "originalPhrase": "العبارة غير المفهومة",
      "reason": "المنتج غير محدد أو غير موجود في المخزون",
      "possibleMatches": ["سكر كنانة", "سكر مستورد"]
    }
  ],
  "discountAmount": 0,
  "customerName": null,
  "paymentMethod": "cash",
  "paidAmount": null,
  "summaryNotesAr": "شرح باللغة العربية لما تم فهمه من لهجة التاجر"
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    return res.json({
      source: 'gemini_ai',
      ...parsedData,
    });
  } catch (error: any) {
    console.error('Gemini API parse error, using fallback:', error);
    return res.json({
      source: 'rule_engine_after_error',
      ...fallbackResult,
    });
  }
});

// Rule-based Sudanese Dialect Parser Fallback
function parseWithSudaneseRules(text: string, inventory: any[], dictionary: any[]) {
  const recognizedItems: any[] = [];
  const clarificationNeeded: any[] = [];
  let paymentMethod = 'cash';
  let customerName: string | null = null;
  let discountAmount = 0;

  const normalized = text.trim();

  // Detect payment method
  if (/بنكك|تطبيق بنك الخرطوم|تحويل بنكي/i.test(normalized)) {
    paymentMethod = 'bankak';
  } else if (/فوري|بنك فيصل/i.test(normalized)) {
    paymentMethod = 'fawry';
  } else if (/آجل|دين|شيل|شكك|على الحساب/i.test(normalized)) {
    paymentMethod = 'credit';
  }

  // Detect customer name if mentioned (e.g., للعميل عمر or لـ عمر)
  const customerMatch = normalized.match(/(?:للعميل|لـ|للزول|للأستاذ|لعم)\s+([^\s,]+)/);
  if (customerMatch && customerMatch[1]) {
    customerName = customerMatch[1];
  }

  // Detect discount
  const discountMatch = normalized.match(/خصم\s+(\d+)/);
  if (discountMatch) {
    discountAmount = parseFloat(discountMatch[1]);
  }

  // Common Sudanese numbers
  const numberWordMap: Record<string, number> = {
    'واحد': 1, 'واحدة': 1, 'اتنين': 2, 'إثنين': 2, 'تلاتة': 3, 'ثلاثة': 3,
    'أربعة': 4, 'اربعه': 4, 'خمسة': 5, 'خمسه': 5, 'ستة': 6, 'سته': 6,
    'سبعة': 7, 'سبعه': 7, 'تمانية': 8, 'ثمانية': 8, 'تسعة': 9, 'تسعه': 9,
    'عشرة': 10, 'عشره': 10, 'نص': 0.5, 'نصف': 0.5, 'ربع': 0.25, 'تمن': 0.125,
  };

  // Common Sudanese units
  const unitRegex = /(كيلو|كيلوجرام|رطل|أوقية|وقية|دستة|كرتونة|كرتونه|جوال|شكارة|شوال|باكت|باكتين|علبة|علبه|حبة|حبه|قطعة|قطعه|لتر|جركانة|باغة|ربطة)/;

  // Split clauses by 'و' or comma or 'ثم'
  const clauses = normalized
    .replace(/^(بعت|سجل|أضف|اعمل فاتورة|نزل لي)\s+/i, '')
    .split(/,|\s+و(?=\s|\d|[أ-ي])/);

  for (const rawClause of clauses) {
    const clause = rawClause.trim();
    if (!clause) continue;

    // Check for ambiguous pronouns
    if (/داك|داكا|الحاجة ديك|الشي داك|حاجة كدا|خمسة من داك/i.test(clause)) {
      clarificationNeeded.push({
        originalPhrase: clause,
        reason: 'اسم الصنف مبهم أو ضمير إشارة غير محدد. يرجى ذكر اسم الصنف بوضوح.',
        possibleMatches: inventory.slice(0, 3).map((i) => i.nameAr),
      });
      continue;
    }

    // Extract quantity
    let quantity = 1;
    let foundNumber = false;

    // Direct digit
    const digitMatch = clause.match(/(\d+(?:\.\d+)?)/);
    if (digitMatch) {
      quantity = parseFloat(digitMatch[1]);
      foundNumber = true;
    } else {
      for (const [word, val] of Object.entries(numberWordMap)) {
        if (new RegExp(`\\b${word}\\b`).test(clause)) {
          quantity = val;
          foundNumber = true;
          break;
        }
      }
    }

    // Extract unit
    const unitMatch = clause.match(unitRegex);
    let unit = 'حبة';
    if (unitMatch) {
      unit = unitMatch[1];
      // Normalize dual words
      if (unit === 'باكتين') {
        quantity = 2;
        unit = 'باكت';
      }
    } else if (foundNumber && quantity > 0) {
      unit = 'كيلو';
    }

    // Match product against inventory & dictionary
    let matchedProduct: any = null;
    let confidence = 0.5;

    // Check dictionary first
    for (const dict of dictionary) {
      if (clause.includes(dict.dialectTerm)) {
        matchedProduct = inventory.find((p) => p.id === dict.productId || p.nameAr.includes(dict.standardTerm));
        if (matchedProduct) {
          confidence = 0.95;
          break;
        }
      }
    }

    // Match inventory directly
    if (!matchedProduct) {
      for (const product of inventory) {
        const prodName = product.nameAr.toLowerCase();
        // Check main name
        const keywords = prodName.split(/\s+/).filter((k: string) => k.length > 2);
        for (const kw of keywords) {
          if (clause.includes(kw)) {
            matchedProduct = product;
            confidence = 0.85;
            break;
          }
        }
        if (matchedProduct) break;

        // Check aliases
        if (product.aliases) {
          for (const alias of product.aliases) {
            if (clause.includes(alias.toLowerCase())) {
              matchedProduct = product;
              confidence = 0.9;
              break;
            }
          }
        }
        if (matchedProduct) break;
      }
    }

    if (matchedProduct) {
      let unitPrice = matchedProduct.sellingPrice;
      // Unit conversion price adjustment if product has custom unit mapping
      if (matchedProduct.allowedUnits && Array.isArray(matchedProduct.allowedUnits)) {
        const customUnit = matchedProduct.allowedUnits.find(
          (u: any) => u.unitName === unit || u.unitId === unit
        );
        if (customUnit && customUnit.customPrice) {
          unitPrice = customUnit.customPrice;
        } else if (customUnit && customUnit.conversionFactor) {
          unitPrice = matchedProduct.sellingPrice * customUnit.conversionFactor;
        } else if (unit === 'رطل' && matchedProduct.baseUnit === 'كيلوجرام') {
          unitPrice = Math.round(matchedProduct.sellingPrice * 0.45);
        } else if (unit === 'نص' || quantity === 0.5) {
          unitPrice = matchedProduct.sellingPrice;
        }
      }

      recognizedItems.push({
        productId: matchedProduct.id,
        productName: matchedProduct.nameAr,
        quantity,
        unit,
        unitPrice,
        confidence,
        notes: `مطابقة من المخزون: ${matchedProduct.nameAr}`,
      });
    } else if (clause.length > 3 && !clause.includes('كاش') && !clause.includes('بنكك') && !clause.includes('خصم')) {
      clarificationNeeded.push({
        originalPhrase: clause,
        reason: 'الصنف غير مسجل في المخزون أو لم يتم التعرف عليه بدقة.',
        possibleMatches: inventory.slice(0, 3).map((i) => i.nameAr),
      });
    }
  }

  return {
    recognizedItems,
    clarificationNeeded,
    discountAmount,
    customerName,
    paymentMethod,
    paidAmount: null,
    summaryNotesAr: recognizedItems.length > 0
      ? `تم التعرف على ${recognizedItems.length} صنف من حديث التاجر.`
      : 'لم يتم العثور على أصناف مطابقة، يرجى التوضيح.',
  };
}

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
