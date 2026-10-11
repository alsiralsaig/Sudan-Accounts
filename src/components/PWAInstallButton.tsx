import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'nav' | 'banner' | 'card' }> = ({
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running as standalone app, suppress prompt
  if (isInstalled) {
    return null;
  }

  // Variant for Banner / Card in Dashboard
  if (variant === 'banner') {
    return (
      <>
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>تثبيت التطبيق على جهازك للعمل بدون إنترنت (PWA)</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  تطبيق مستقل
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                يمكنك تشغيل حساباتي السودان مباشرة من شاشة هاتفك أو جهاز الكمبيوتر بسرعة فائقة واستخدام البيانات المخزنة محلياً عند انقطاع الشبكة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/60 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تثبيت الآن على الهاتف / الكمبيوتر</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600/40 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>طريقة التثبيت على الآيفون (iOS)</span>
              </button>
            )}

            {!isInstallable && !isIOS && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
                title="تثبيت التطبيق كبرنامج مستقل"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>تثبيت التطبيق</span>
              </button>
            )}
          </div>
        </div>

        {/* iOS Guided Instructions Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">تثبيت التطبيق على iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 leading-relaxed text-slate-300">
                <div className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري بالأسفل.
                  </span>
                </div>

                <div className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    مرر لأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    اضغط على <strong>"إضافة" (Add)</strong> بالأعلى ليظهر التطبيق كأيقونة على شاشتك.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition shadow"
              >
                فهمت ذلك، إغلاق
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Variant for Navbar button
  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
          title="تثبيت التطبيق على جهازك والعمل دون إنترنت"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">تثبيت التطبيق (PWA)</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
          title="تثبيت التطبيق على جهاز الآيفون"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">تثبيت التطبيق</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">تثبيت التطبيق على iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 leading-relaxed text-slate-300">
              <div className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري بالأسفل.
                </span>
              </div>

              <div className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  مرر لأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.
                </span>
              </div>

              <div className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  اضغط على <strong>"إضافة" (Add)</strong> ليظهر التطبيق كأيقونة على شاشتك.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition shadow"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
};
