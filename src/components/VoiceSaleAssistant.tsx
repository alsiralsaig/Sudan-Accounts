import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Plus,
  Trash2,
  X,
  Volume2,
  ArrowRight,
  BookPlus,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentMethod } from '../types';

interface VoiceSaleAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (invoiceId: string) => void;
}

interface ParsedItem {
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  confidence: number;
  notes?: string;
}

interface ClarificationItem {
  originalPhrase: string;
  reason: string;
  possibleMatches?: string[];
}

export const VoiceSaleAssistant: React.FC<VoiceSaleAssistantProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated,
}) => {
  const { products, dictionary, createInvoice, addDictionaryItem, calculateItemPrice } = useApp();

  const [inputSpeechText, setInputSpeechText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recognizedItems, setRecognizedItems] = useState<ParsedItem[]>([]);
  const [clarifications, setClarifications] = useState<ClarificationItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [analysisNotes, setAnalysisNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New term to teach
  const [showTeachModal, setShowTeachModal] = useState(false);
  const [termToTeach, setTermToTeach] = useState({ dialect: '', standard: '', productId: '' });

  // منع التكرار: WebView بيرسل نفس الكلمة كذا مرة في event.results — الكود القديم كان بيجمعها كلها
  const speechStopRef = useRef(false);

  // Web Speech Recognition support
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && isRecording) {
      speechStopRef.current = false;
      recognition = new SpeechRecognition();
      recognition.lang = 'ar-SD'; // Sudanese Arabic
      recognition.continuous = true;
      recognition.interimResults = true;

      // النتائج النهائية بتتثبت حسب ترتيبها (كتابة فوق نفس الموضع = بدون تكرار)،
      // والنتيجة المؤقتة بنعرض آخر واحدة بس — ده بيمنع «الشايالشايالشاي...» في WebView
      const finalsByIndex: Array<string | undefined> = [];

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript ?? '';
          if (event.results[i].isFinal) {
            finalsByIndex[i] = piece;
          } else {
            interim = piece;
          }
        }
        const finalPart = finalsByIndex.filter(Boolean).join(' ');
        setInputSpeechText(
          (finalPart + (interim ? (finalPart ? ' ' : '') + interim : '')).trim()
        );
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          speechStopRef.current = true;
          setIsRecording(false);
        }
        // 'no-speech' أو 'aborted' → onend هيرجع يسجل لو المستخدم لسه ماسك المايك
      };

      recognition.onend = () => {
        if (speechStopRef.current) {
          setIsRecording(false);
          return;
        }
        // WebView بينهي الجلسة بسرعة عند الصمت — نرجع نسجل طول ما الزر مضغوط
        try {
          recognition.start();
        } catch {
          setIsRecording(false);
        }
      };

      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      if (recognition) {
        speechStopRef.current = true;
        try {
          recognition.stop();
        } catch {
          /* تجاهل */
        }
      }
    };
  }, [isRecording]);

  // لو النافذة اتقفلت والمايك مفتوح — قفله
  useEffect(() => {
    if (!isOpen) {
      speechStopRef.current = true;
      setIsRecording(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleRecording = () => {
    if (isRecording) {
      speechStopRef.current = true;
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  const handleAnalyze = async (textToProcess?: string) => {
    const text = textToProcess || inputSpeechText;
    if (!text.trim()) {
      setErrorMsg('الرجاء كتابة أو نطق عبارة البيع أولاً.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setRecognizedItems([]);
    setClarifications([]);

    try {
      const response = await fetch('/api/ai/parse-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechText: text,
          inventoryItems: products,
          customDictionary: dictionary,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل معالجة الصوت من الخادم');
      }

      const data = await response.json();

      if (data.recognizedItems && Array.isArray(data.recognizedItems)) {
        // Validate with current inventory prices
        const verifiedItems: ParsedItem[] = data.recognizedItems.map((item: any) => {
          const invProduct = products.find((p) => p.id === item.productId || p.nameAr === item.productName);
          let price = item.unitPrice;
          let prodId = item.productId;

          if (invProduct) {
            prodId = invProduct.id;
            const calc = calculateItemPrice(invProduct, item.unit || invProduct.baseUnit, item.quantity || 1);
            price = calc.unitPrice;
          }

          return {
            productId: prodId,
            productName: invProduct ? invProduct.nameAr : item.productName,
            quantity: item.quantity || 1,
            unit: item.unit || (invProduct ? invProduct.baseUnit : 'حبة'),
            unitPrice: price || 0,
            confidence: item.confidence || 0.8,
            notes: item.notes,
          };
        });

        setRecognizedItems(verifiedItems);
      }

      if (data.clarificationNeeded && Array.isArray(data.clarificationNeeded)) {
        setClarifications(data.clarificationNeeded);
      }

      if (data.customerName) {
        setCustomerName(data.customerName);
      }
      if (data.paymentMethod) {
        setPaymentMethod(data.paymentMethod as PaymentMethod);
      }
      if (data.discountAmount) {
        setDiscountAmount(data.discountAmount);
      }
      if (data.summaryNotesAr) {
        setAnalysisNotes(data.summaryNotesAr);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء معالجة الطلب. جاري استخدام المحلل المحلي التلقائي.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick preset pills
  const presetExamples = [
    'بعت اتنين كيلو سكر وكيلو شاي',
    '3 رطل زيت ودستة صابون',
    'جوال سكر 50 كيلو وباكتين دقيق',
    'نص رطل شاي وعلبة صلصة كاش',
    'كرتونة مكرونة وباقي الحساب آجل للعميل عمر',
    'طلب مبهم للتجربة: جيب لي خمسة من داك',
  ];

  const handleSelectPreset = (preset: string) => {
    setInputSpeechText(preset);
    handleAnalyze(preset);
  };

  // Clarification match picked
  const handleResolveClarification = (clarification: ClarificationItem, selectedProduct: string) => {
    const prod = products.find((p) => p.nameAr === selectedProduct || p.nameAr.includes(selectedProduct));
    if (prod) {
      setRecognizedItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.nameAr,
          quantity: 1,
          unit: prod.baseUnit,
          unitPrice: prod.sellingPrice,
          confidence: 1.0,
          notes: `تم التوضيح يدوياً: ${selectedProduct}`,
        },
      ]);
      // Remove from clarifications
      setClarifications((prev) => prev.filter((c) => c.originalPhrase !== clarification.originalPhrase));
    }
  };

  // Confirm Sale & Create Invoice
  const handleCommitInvoice = () => {
    if (recognizedItems.length === 0) {
      setErrorMsg('لا توجد منتجات معتمدة لإنشاء الفاتورة.');
      return;
    }

    const validItems = recognizedItems.filter((i) => i.productId);
    if (validItems.length === 0) {
      setErrorMsg('يرجى التأكد من مطابقة جميع المنتجات مع أصناف المخزون.');
      return;
    }

    const invoiceItems = validItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const costPrice = prod ? prod.purchasePrice : 0;
      const totalPrice = item.quantity * item.unitPrice;

      return {
        productId: item.productId!,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        costPrice,
        totalPrice,
        profit: totalPrice - costPrice * item.quantity,
      };
    });

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = Math.max(0, subtotal - discountAmount);

    const result = createInvoice({
      customerName: customerName || undefined,
      items: invoiceItems,
      subtotal,
      discount: discountAmount,
      tax: 0,
      total,
      paidAmount: paymentMethod === 'credit' ? 0 : total,
      remainingAmount: paymentMethod === 'credit' ? total : 0,
      paymentMethod,
      cashierId: 'current',
      cashierName: 'الكاشير',
      status: 'completed',
      templateType: 'thermal',
      notes: analysisNotes ? `أُنشئت عبر المساعد الصوتي: "${inputSpeechText}"` : undefined,
    });

    if (result.success && result.invoiceId) {
      onInvoiceCreated(result.invoiceId);
      onClose();
    } else {
      setErrorMsg(result.error || 'فشل اعتماد الفاتورة. تأكد من توفر الكمية في المخزون.');
    }
  };

  // Calculations
  const calculatedSubtotal = recognizedItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                المساعد المحاسبي الصوتي الذكي
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  لهجة سودانية 🇸🇩
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تحدث بحرية باللهجة المحلية، وسيقوم المساعد بجلب أسعار المخزون وإعداد الفاتورة.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Voice & Input Area */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                تحدث أو اكتب طلب البيع (مثل: «بعت اتنين كيلو سكر وكيلو شاي»):
              </label>
              {isRecording && (
                <span className="text-xs text-rose-400 animate-pulse font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> جاري الاستماع للصوت...
                </span>
              )}
            </div>

            <div className="relative">
              <textarea
                value={inputSpeechText}
                onChange={(e) => setInputSpeechText(e.target.value)}
                placeholder="تحدث أو اكتب هنا: مثلاً «بعت 3 رطل زيت ودستة صابون وباقي الحساب بنكك»..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
              />

              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? 'إيقاف التسجيل' : 'بدء التحدث بالمايك'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{isAnalyzing ? 'جاري الفهم...' : 'تحليل وإنشاء الفاتورة'}</span>
                </button>
              </div>
            </div>

            {/* Quick Sudanese Examples */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                💡 جرّب عبارات سودانية سريعة بنقرة واحدة:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {presetExamples.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 px-2.5 py-1 rounded-md transition text-right"
                  >
                    «{preset}»
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Clarification Needed Section (Strict Accounting Rule: No Blind Guessing!) */}
          {clarifications.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>طلب توضيح من المساعد (الالتزام بعدم تخمين المنتجات المبهمة):</span>
              </div>
              <p className="text-xs text-amber-200/80">
                النظام لا يخمن الأسعار أو الأصناف غير الواضحة حمايةً لأموالك. يرجى توضيح الأصناف التالية:
              </p>

              <div className="space-y-2">
                {clarifications.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-amber-900/50 p-2.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        العبارة المذكورة: <span className="text-amber-300">«{item.originalPhrase}»</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{item.reason}</div>
                    </div>

                    {item.possibleMatches && item.possibleMatches.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">هل تقصد:</span>
                        {item.possibleMatches.map((m, mIdx) => (
                          <button
                            key={mIdx}
                            type="button"
                            onClick={() => handleResolveClarification(item, m)}
                            className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded transition"
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Results & Live Preview */}
          {recognizedItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  الأصناف المستخلصة من المخزون (معاينة قبل الاعتماد):
                </h3>
                <span className="text-xs text-emerald-400 font-medium">
                  {recognizedItems.length} صنف مطابق
                </span>
              </div>

              {/* Items Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-2.5">اسم الصنف</th>
                      <th className="p-2.5">الكمية</th>
                      <th className="p-2.5">الوحدة السودانية</th>
                      <th className="p-2.5">سعر الوحدة</th>
                      <th className="p-2.5">الإجمالي</th>
                      <th className="p-2.5 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recognizedItems.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-900/40">
                        <td className="p-2.5 font-medium text-slate-200">
                          {item.productName}
                          {item.notes && (
                            <span className="block text-[10px] text-emerald-400/80">
                              {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              setRecognizedItems((prev) =>
                                prev.map((it, idx) => (idx === index ? { ...it, quantity: val } : it))
                              );
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-center outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="p-2.5">
                          <span className="bg-slate-900 border border-slate-700/80 text-emerald-300 px-2 py-0.5 rounded text-[11px]">
                            {item.unit}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300 font-mono">
                          {item.unitPrice.toLocaleString('ar-SD')} ج.س
                        </td>
                        <td className="p-2.5 font-bold text-emerald-400 font-mono">
                          {(item.quantity * item.unitPrice).toLocaleString('ar-SD')} ج.س
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setRecognizedItems((prev) => prev.filter((_, idx) => idx !== index))
                            }
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Meta: Payment, Customer, Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">طريقة الدفع:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none focus:border-emerald-500"
                  >
                    <option value="cash">💵 نقداً (كاش)</option>
                    <option value="bankak">📱 تطبيق بنكك (بنك الخرطوم)</option>
                    <option value="fawry">💳 تطبيق فوري (بنك فيصل)</option>
                    <option value="credit">⏳ آجل (على الحساب / دين)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">اسم العميل (اختياري):</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: عمر البشير"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">الخصم (إن وجد):</label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">إجمالي الفاتورة الصافي:</span>
                  <div className="text-xl font-extrabold text-emerald-400 font-mono">
                    {calculatedTotal.toLocaleString('ar-SD')} ج.س
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="text-slate-400 text-left">
                    <span>قبل الخصم: {calculatedSubtotal.toLocaleString('ar-SD')} ج.س</span>
                    <span className="block text-amber-400">
                      قيمة الخصم: {discountAmount.toLocaleString('ar-SD')} ج.س
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Option to Teach New Dialect Words */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <BookPlus className="w-3.5 h-3.5 text-cyan-400" />
              هل ذكر التاجر كلمة سودانية لم يفهمها المساعد؟
            </span>
            <button
              type="button"
              onClick={() => setShowTeachModal(!showTeachModal)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
            >
              {showTeachModal ? 'إلغاء' : 'تعليم المساعد مصطلحاً جديداً'}
            </button>
          </div>

          {/* Teach Modal Inline */}
          {showTeachModal && (
            <div className="bg-slate-950 border border-cyan-800/60 p-3.5 rounded-xl space-y-3 text-xs">
              <p className="text-cyan-300 font-semibold">
                حفظ المصطلح الجديد في القاموس التجاري مع ربطه بالمنتج القياسي:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="المصطلح السوداني (مثال: رطل شاي)"
                  value={termToTeach.dialect}
                  onChange={(e) => setTermToTeach({ ...termToTeach, dialect: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-slate-100 p-2 rounded-lg outline-none"
                />
                <input
                  type="text"
                  placeholder="المعنى القياسي (مثال: شاي 100 جم)"
                  value={termToTeach.standard}
                  onChange={(e) => setTermToTeach({ ...termToTeach, standard: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-slate-100 p-2 rounded-lg outline-none"
                />
                <select
                  value={termToTeach.productId}
                  onChange={(e) => setTermToTeach({ ...termToTeach, productId: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-slate-100 p-2 rounded-lg outline-none"
                >
                  <option value="">اختر المنتج المطابق من المخزون</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (termToTeach.dialect && termToTeach.standard) {
                    const matchedProd = products.find((p) => p.id === termToTeach.productId);
                    addDictionaryItem({
                      dialectTerm: termToTeach.dialect,
                      standardTerm: termToTeach.standard,
                      productId: termToTeach.productId || undefined,
                      productName: matchedProd?.nameAr,
                      verified: true,
                    });
                    setShowTeachModal(false);
                    setTermToTeach({ dialect: '', standard: '', productId: '' });
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg"
              >
                حفظ في القاموس وتحديث الذكاء الاصطناعي
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={recognizedItems.length === 0}
              onClick={handleCommitInvoice}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>اعتماد الفاتورة وتحديث المخزون تلقائياً</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
