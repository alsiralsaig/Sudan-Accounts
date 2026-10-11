/**
 * محرك تحليل اللهجة السودانية (Rule-Based) — يعمل بدون أي مفتاح API.
 * يُستخدم من server.ts (تطوير محلي) و api/ai/parse-sale.ts (Vercel Serverless).
 */

export function parseWithSudaneseRules(text: string, inventory: any[], dictionary: any[]) {
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
      // مطابقة الأرقام المكتوبة بالحروف: \b (حدود الكلمة) لا يعمل مع الحروف العربية،
      // لذا نستخدم includes مع ترتيب الأطول أولاً لمنع تداخل الأمثلة («اربعه» ⊃ «ربع»).
      const sortedNumbers = Object.entries(numberWordMap).sort((a, b) => b[0].length - a[0].length);
      for (const [word, val] of sortedNumbers) {
        if (clause.includes(word)) {
          quantity = val;
          foundNumber = true;
          break;
        }
      }
    }

    // Extract unit
    const unitMatch = clause.match(unitRegex);
    let unit = 'حبة';
    let unitExplicit = false;
    if (unitMatch) {
      unit = unitMatch[1];
      unitExplicit = true;
      // Normalize dual words
      if (unit === 'باكتين') {
        quantity = 2;
        unit = 'باكت';
      }
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
      // إذا لم تُذكر وحدة صريحاً في العبارة، نستخدم الوحدة الأساسية للمنتج
      // (بدلاً من افتراض «كيلو» دائماً — «خمسة صابون» = 5 حبة وليس 5 كيلو).
      if (!unitExplicit && matchedProduct.baseUnit) {
        unit = matchedProduct.baseUnit;
      }
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
