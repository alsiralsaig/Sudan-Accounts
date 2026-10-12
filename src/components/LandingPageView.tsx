import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Printer,
  TrendingUp,
  Store,
  Layers,
  ChevronDown,
  HelpCircle,
  Play,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LandingPageViewProps {
  onOpenVoiceModal: () => void;
  onGoToPOS: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenVoiceModal,
  onGoToPOS,
}) => {
  const { setActiveTab } = useApp();

  // Interactive playground state
  const [demoInput, setDemoInput] = useState('بعت اتنين كيلو سكر وكيلو شاي');
  const [demoParsedResult, setDemoParsedResult] = useState<{
    items: { name: string; qty: number; unit: string; price: number }[];
    total: number;
  }>({
    items: [
      { name: 'صنف بضاعة', qty: 2, unit: 'كيلو', price: 3000 },
      { name: 'صنف بضاعة', qty: 1, unit: 'علبة', price: 1100 },
    ],
    total: 4100,
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSimulatePlayground = (phrase: string) => {
    setDemoInput(phrase);
    if (phrase.includes('سكر') && phrase.includes('شاي')) {
      setDemoParsedResult({
        items: [
          { name: 'صنف بضاعة', qty: 2, unit: 'كيلو', price: 3000 },
          { name: 'صنف بضاعة', qty: 1, unit: 'علبة', price: 1100 },
        ],
        total: 4100,
      });
    } else if (phrase.includes('زيت') && phrase.includes('صابون')) {
      setDemoParsedResult({
        items: [
          { name: 'صنف بضاعة', qty: 3, unit: 'رطل', price: 3900 },
          { name: 'صنف بضاعة', qty: 1, unit: 'دستة', price: 5000 },
        ],
        total: 8900,
      });
    } else if (phrase.includes('باكت')) {
      setDemoParsedResult({
        items: [
          { name: 'صنف بضاعة', qty: 2, unit: 'باكت كبير', price: 25000 },
          { name: 'صنف بضاعة', qty: 1, unit: 'جوال 50 كجم', price: 70000 },
        ],
        total: 95000,
      });
    } else {
      setDemoParsedResult({
        items: [{ name: 'صنف بضاعة', qty: 1, unit: 'كيلو', price: 1500 }],
        total: 1500,
      });
    }
  };

  const businessTemplates = [
    {
      title: 'البقالات والسوبرماركت (الأساسي)',
      desc: 'دعم المواد التموينية، الأوزان، الرطل، الجوال، والكرتونة، والبيع السريع.',
      icon: '🛒',
    },
    {
      title: 'الصيدليات ومستودعات الأدوية',
      desc: 'إدارة تواريخ الصلاحية، أرقام التشغيلات (Batch)، والجرعات الدوائية.',
      icon: '💊',
    },
    {
      title: 'المطاعم والكافيهات',
      desc: 'وجبات شعبية، فول مصلح، شاي مقنن، إدارة الطاولات والطلبات السريعة.',
      icon: '🍽️',
    },
    {
      title: 'ورش وصيانة السيارات وقطع الغيار',
      desc: 'رقم القطعة، موديل المركبة، وأجور اليد والمصنعية المنفصلة.',
      icon: '🔧',
    },
    {
      title: 'محلات الإلكترونيات والموبايلات',
      desc: 'تتبع السيريال (IMEI)، فترات الضمان، وملحقات الهواتف الذكية.',
      icon: '📱',
    },
    {
      title: 'محلات الملابس والأحذية',
      desc: 'توزيع المقاسات والألوان والمواسم، وتتبع المخزون بالقطعة والدستة.',
      icon: '👕',
    },
    {
      title: 'متاجر مواد البناء والسباكة',
      desc: 'تجارة الأسمنت بالطن والجوال، مواسير PVC، وحديد التسليح.',
      icon: '🧱',
    },
    {
      title: 'العطور ومستحضرات التجميل',
      desc: 'الأوقية، الصندل، الدخان، والزيوت العطرية بالجرام والعلبة.',
      icon: '✨',
    },
  ];

  const faqs = [
    {
      q: 'كيف يفهم المساعد الأوزان السودانية كـ "الرطل" و"الجوال"؟',
      a: 'النظام مزوّد بمحرك تحويل ومعجم خاص بالأسواق السودانية؛ إذا كان المنتج مسجلاً بسعر الكيلو، يحسب سعر الرطل (450 جرام) تلقائياً بنصف السعر تقريباً، أو يستخدم السعر المخصص للرطل والكرتونة إذا حدده التاجر.',
    },
    {
      q: 'هل تعمل طباعة الفواتير مع الطابعات الحرارية الشائعة في السودان؟',
      a: 'نعم تماماً! يدعم النظام قوالب الطباعة الحرارية (80mm و58mm) المتوافقة مع طابعات الإيصالات، بالإضافة إلى فواتير مقاس A4 الرسمية، والمشاركة المباشرة عبر واتساب.',
    },
    {
      q: 'كيف نضمن عدم اطلاع الكاشير على أرباح المحل وسعر الشراء؟',
      a: 'النظام يفصل الصلاحيات بدقة في الخادم وقاعدة البيانات؛ يُحجب هامش الربح وتكلفة الشراء (COGS) تماماً عن موظف المبيعات، مع تسجيل كل عملية في سجل التدقيق المالي.',
    },
    {
      q: 'ماذا يحدث إذا قال التاجر كلمة مبهمة لم يفهمها المساعد؟',
      a: 'التزاماً بقواعد الدقة المحاسبية، يرفض المساعد تخمين الأسعار أو الأصناف، ويطلب التوضيح فوراً مع عرض خيارات مقترحة، مع إمكانية تعليم المساعد أي مصطلح جديد وحفظه في القاموس.',
    },
    {
      q: 'هل يدعم النظام الدفع عبر تطبيق "بنكك" و"فوري" والبيع الآجل؟',
      a: 'نعم، يسجل النظام فوراً ما إذا كان الدفع نقداً، أو عبر تحويل "بنكك" (بنك الخرطوم)، أو "فوري" (بنك فيصل)، أو بيعاً آجلاً مع تتبع ديون العملاء وتنبيهات الاستحقاق.',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold animate-bounce-slow">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>أول نظام محاسبي ذكي ومخصص للسوق السوداني 🇸🇩</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            حسابات محلك… <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">بصوتك!</span>
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
            مساعد محاسبي ذكي يفهم كلامك واللهجة السودانية، يسجل مبيعاتك، يجهز فواتيرك، ويتابع
            مخزونك وأرباحك الحقيقية، لتدير تجارتك بسهولة واطمئنان في وقت أقل.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-950/80 transition active:scale-95 cursor-pointer border border-emerald-400/30"
            >
              <Mic className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>جرّب التسجيل الصوتي الآن</span>
            </button>

            <button
              onClick={onGoToPOS}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>ابدأ إدارة محلك (نقطة البيع)</span>
            </button>
          </div>

          {/* البانر التعريفي */}
          <div className="pt-6 flex justify-center">
            <img
              src="/hero-banner.webp"
              alt="حساباتي السودان — وحدات القياس السودانية: الرطل والكيلو والجوال والدستة"
              width={560}
              height={560}
              loading="lazy"
              className="w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[520px] rounded-3xl border border-emerald-500/20 shadow-2xl shadow-emerald-950/50"
            />
          </div>

          {/* Trust badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              دعم الرطل والجوال والدستة
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              تكامل مع بنكك وفوري
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              فصل صلاحيات الكاشير عن المدير
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              حساب حقيقي لصافي الربح
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            بساطة وسرعة
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            كيف يعمل المساعد المحاسبي الذكي؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            ثلاث خطوات فقط تفصلك عن إنهاء عملية البيع وطباعة الفاتورة دون كتابة يدوية مرهقة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-right hover:border-emerald-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xl border border-emerald-500/20">
              1
            </div>
            <h3 className="font-bold text-lg text-white">تحدث بالمبيعات بالعامية</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              قل للمساعد ببساطة: «بعت اتنين كيلو سكر وكيلو شاي وعلبة صلصة». يفهم المساعد المصطلحات
              التجارية السودانية والأوزان المحلية.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-right hover:border-emerald-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black text-xl border border-cyan-500/20">
              2
            </div>
            <h3 className="font-bold text-lg text-white">المطابقة وجلب الأسعار</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يطابق المساعد الأصناف مع مخزون محلك الفعلي، ويجلب أسعار البيع المعتمدة، ويطلب التوضيح
              إذا كان هناك صنف غير محدد بدقة.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-right hover:border-emerald-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-black text-xl border border-teal-500/20">
              3
            </div>
            <h3 className="font-bold text-lg text-white">اعتماد، طباعة وتحديث المخزون</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              راجع الفاتورة واعتمدها بضغطة زر؛ تُطبع الفاتورة فوراً وتُخصم الكميات من المخزون وتُسجل
              العملية في الدفتر وصافي الأرباح.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: INTERACTIVE PLAYGROUND (تجربة تفاعلية حية) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              تجربة تفاعلية حية
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              جرّب عبارة بيع الآن وشاهد النتيجة الفورية
            </h2>
            <p className="text-xs text-slate-400">
              بيانات تجريبية حقيقية مسحوبة من مخزون السكر والشاي والزيت والصابون:
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => handleSimulatePlayground('بعت اتنين كيلو سكر وكيلو شاي')}
              className="text-xs bg-slate-950 border border-slate-700 hover:border-emerald-500 text-slate-200 px-3 py-1.5 rounded-xl transition"
            >
              «بعت اتنين كيلو سكر وكيلو شاي»
            </button>
            <button
              onClick={() => handleSimulatePlayground('3 رطل زيت ودستة صابون')}
              className="text-xs bg-slate-950 border border-slate-700 hover:border-emerald-500 text-slate-200 px-3 py-1.5 rounded-xl transition"
            >
              «3 رطل زيت ودستة صابون»
            </button>
            <button
              onClick={() => handleSimulatePlayground('باكت دقيق وجوال سكر')}
              className="text-xs bg-slate-950 border border-slate-700 hover:border-emerald-500 text-slate-200 px-3 py-1.5 rounded-xl transition"
            >
              «باكت دقيق وجوال سكر»
            </button>
          </div>

          {/* Simulated Invoice Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-lg mx-auto space-y-4 font-mono text-xs">
            <div className="text-center pb-3 border-b border-dashed border-slate-800">
              <span className="text-emerald-400 font-bold block text-sm">
                معاينة الفاتورة المنشأة تلقائياً
              </span>
              <span className="text-slate-500 text-[10px]">
                مطابقة أسعار المخزون اللحظية
              </span>
            </div>

            <div className="space-y-2">
              {demoParsedResult.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-300">
                  <span>
                    {item.name} ({item.qty} {item.unit})
                  </span>
                  <span className="font-bold text-white">
                    {item.price.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-dashed border-slate-800 flex justify-between items-center text-sm font-black">
              <span className="text-slate-400">الإجمالي النهائي:</span>
              <span className="text-emerald-400 text-base">
                {demoParsedResult.total.toLocaleString('ar-SD')} ج.س
              </span>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={onOpenVoiceModal}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl transition"
              >
                فتح المساعد الصوتي الكامل
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: BUSINESS TEMPLATES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            مرونة وتخصيص كامل
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            قوالب مهيأة لمختلف الأنشطة التجارية في السودان
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            تختلف تفاصيل الصيدلية عن المطعم عن البقالة، لكن النواة المحاسبية وإدارة الأرباح موحدة
            ودقيقة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {businessTemplates.map((template, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 hover:border-emerald-500/40 transition"
            >
              <div className="text-2xl">{template.icon}</div>
              <h4 className="font-bold text-sm text-white">{template.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{template.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: SECURITY & RBAC */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xl">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white">
              أمان البيانات وحماية الأرباح (RBAC)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              صُمم النظام لضمان حماية أسرار تجارتك وأرباحك. لا يستطيع موظف المبيعات الاطلاع على تكلفة
              الشراء أو الأرباح الصافية إلا إذا منحه المدير الصلاحية رسمياً.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                تطبيق الصلاحيات في السيرفر وقاعدة البيانات وليس فقط في الواجهة.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                سجل تدقيق كامل يوضح من قام بكل عملية ومتى.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                منع بيع الكميات غير المتوفرة لحماية المخزون من الأخطاء.
              </li>
            </ul>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
            <div className="font-bold text-white text-sm pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>مقارنة أدوار النظام:</span>
              <span className="text-emerald-400 font-mono text-xs">مفعلة تلقائياً</span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-0.5">المالك / المدير:</span>
                <span className="text-slate-400">
                  اطلاع كامل على صافي الربح، تكاليف البضاعة، إدارة الموظفين، والتقارير المالية.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-blue-400 block mb-0.5">موظف المبيعات (الكاشير):</span>
                <span className="text-slate-400">
                  إصدار الفواتير، البحث بالباركود والصوت، البحث عن أسعار البيع فقط، دون رؤية الأرباح.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            الأسئلة الشائعة
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            كل ما يهمك معرفته عن النظام
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-right flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-emerald-300"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
