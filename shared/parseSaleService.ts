/**
 * خدمة تحليل طلبات البيع الصوتية/النصية:
 * 1) المحرك اللغوي المحلي (Rule-Based) — يعمل دائماً كاحتياط.
 * 2) Gemini AI عند توفر مفتاح API — مع عودة تلقائية للمحرك عند أي خطأ.
 * تُستخدم من server.ts (تطوير محلي) و api/ai/parse-sale.ts (Vercel Serverless).
 *
 * ملاحظة: استيراد @google/genai يتم ديناميكياً (lazy) عند الحاجة فقط —
 * المكتبة ESM-only وقد يفشل تحميلها في بيئات CJS، والمحرك المحلي يلتقط ذلك.
 */
import { parseWithSudaneseRules } from './parseWithSudaneseRules';

export interface ParseSaleInput {
  speechText: string;
  inventoryItems?: any[];
  customDictionary?: any[];
}

export interface ParseSaleConfig {
  /** مفتاح Gemini؛ إذا كان فارغاً يعمل المحرك المحلي فقط */
  geminiApiKey?: string;
  /** اسم موديل Gemini (الافتراضي gemini-3.8-flash) */
  geminiModel?: string;
}

export interface ParseSaleResult {
  source: 'rule_engine' | 'gemini_ai' | 'rule_engine_after_error';
  recognizedItems: any[];
  clarificationNeeded: any[];
  discountAmount: number;
  customerName: string | null;
  paymentMethod: string;
  paidAmount: number | null;
  summaryNotesAr: string;
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    // بعض النماذج تلفّ JSON بـ ```json ... ```
    const fenced = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(fenced);
  }
}

export async function handleParseSale(
  input: ParseSaleInput,
  config: ParseSaleConfig = {}
): Promise<ParseSaleResult> {
  const speechText = input.speechText;
  const inventoryItems = input.inventoryItems || [];
  const customDictionary = input.customDictionary || [];

  // Pre-process & Fallback Rule Engine
  const fallbackResult = parseWithSudaneseRules(speechText, inventoryItems, customDictionary);

  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  const model = config.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey) {
    // Return high-quality rule-based fallback if no Gemini API key
    return {
      source: 'rule_engine',
      ...fallbackResult,
    } as ParseSaleResult;
  }

  try {
    // استيراد ديناميكي: يحمّل المكتبة (ESM) فقط عند الحاجة، وأي فشل يتحول للاحتياطي
    const { GoogleGenAI } = await import('@google/genai');
    const aiClient = new GoogleGenAI({ apiKey });

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
}`;

    const response = await aiClient.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    const parsedData = extractJson(responseText);

    return {
      source: 'gemini_ai',
      ...fallbackResult,
      ...parsedData,
    } as ParseSaleResult;
  } catch (error: any) {
    console.error('Gemini API parse error, using fallback:', error);
    return {
      source: 'rule_engine_after_error',
      ...fallbackResult,
    } as ParseSaleResult;
  }
}
