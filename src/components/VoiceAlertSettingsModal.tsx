import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  Play,
  Square,
  ShieldAlert,
  AlertTriangle,
  PackageCheck,
  CheckCircle2,
  X,
  Sliders,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface VoiceAlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAlertSettingsModal: React.FC<VoiceAlertSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    speechSettings,
    updateSpeechSettings,
    speakAlert,
    isSpeechSupported,
    stopSpeechAlert,
  } = useApp();

  const [testPlaying, setTestPlaying] = useState(false);

  if (!isOpen) return null;

  const handleTestVoice = (type: 'outOfStock' | 'reorder' | 'general') => {
    setTestPlaying(true);
    let sample = '';
    if (type === 'outOfStock') {
      sample = 'تنبيه عاجل: نفد مخزون صنف من أصنافك — يرجى إعادة الطلب فوراً.';
    } else if (type === 'reorder') {
      sample = 'تحذير: صنف زيت طعام يارا وصل إلى حد إعادة الطلب، الرصيد المتبقي خمسة جالون فقط.';
    } else {
      sample = 'تم تفعيل نظام التنبيهات الصوتية الذكي بنجاح في متجر حساباتي السودان.';
    }

    speakAlert(sample, true);
    setTimeout(() => {
      setTestPlaying(false);
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-right text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                إعدادات القراءة الصوتية للتنبيهات
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Web Speech API
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                إعلان صوتي فوري باللغة العربية عند نفاد المخزون وبلوغ حد إعادة الطلب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Browser Support Check */}
          {!isSpeechSupported && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>المتصفح الحالي لا يدعم واجهة القراءة الصوتية المدمجة (Web Speech API).</span>
            </div>
          )}

          {/* Master Toggle */}
          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  speechSettings.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {speechSettings.enabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="font-bold text-sm block text-white">
                  تفعيل القراءة الصوتية التلقائية
                </span>
                <span className="text-xs text-slate-400">
                  نطق التنبيهات الحرجة عبر مكبر صوت الجهاز بمجرد حدوثها
                </span>
              </div>
            </div>

            <button
              onClick={() => updateSpeechSettings({ enabled: !speechSettings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                speechSettings.enabled ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  speechSettings.enabled ? '-translate-x-6' : '-translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Alert Conditions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              شروط وأحداث الإعلان الصوتي
            </h4>

            {/* Out of stock condition */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/60 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <div>
                  <span className="text-xs font-bold text-white block">
                    تنبيه نفاد المخزون بالكامل (رصيد صفر)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    نطق تنبيه صوتي فوري عند انتهاء كمية أي منتج في المتجر
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={speechSettings.announceOutOfStock}
                onChange={(e) =>
                  updateSpeechSettings({ announceOutOfStock: e.target.checked })
                }
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
            </label>

            {/* Reorder limit condition */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/60 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <div>
                  <span className="text-xs font-bold text-white block">
                    تنبيه بلوغ حد إعادة الطلب الحرج
                  </span>
                  <span className="text-[11px] text-slate-400">
                    الإعلان الصوتي عند اقتراب المنتج من النفاذ ووصوله لحد التنبيه
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={speechSettings.announceReorderWarning}
                onChange={(e) =>
                  updateSpeechSettings({ announceReorderWarning: e.target.checked })
                }
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
            </label>

            {/* Inbound restock confirmation */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/60 cursor-pointer transition">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div>
                  <span className="text-xs font-bold text-white block">
                    إعلان صوتي عند التوريد السريع
                  </span>
                  <span className="text-[11px] text-slate-400">
                    تأكيد صوتي عند شحن الرفوف أو استلام كميات جديدة
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={speechSettings.announceSalesRestock}
                onChange={(e) =>
                  updateSpeechSettings({ announceSalesRestock: e.target.checked })
                }
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
            </label>
          </div>

          {/* Voice Modulation Controls (Rate, Pitch, Volume) */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-800/30 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              خصائص الصوت والسرعة
            </h4>

            {/* Speed / Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>سرعة النطق:</span>
                <span className="font-mono text-cyan-400">{speechSettings.rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={speechSettings.rate}
                onChange={(e) => updateSpeechSettings({ rate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Pitch */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>طبقة النبرة (Pitch):</span>
                <span className="font-mono text-emerald-400">{speechSettings.pitch}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.05"
                value={speechSettings.pitch}
                onChange={(e) => updateSpeechSettings({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>مستوى الصوت (Volume):</span>
                <span className="font-mono text-amber-400">{Math.round(speechSettings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={speechSettings.volume}
                onChange={(e) => updateSpeechSettings({ volume: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Test Voice Section */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-700/80 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              تجربة واستماع التنبيه الصوتي الآن:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestVoice('outOfStock')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                تجربة: نداء نفاد المخزون
              </button>

              <button
                type="button"
                onClick={() => handleTestVoice('reorder')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                تجربة: نداء حد إعادة الطلب
              </button>

              {testPlaying && (
                <button
                  type="button"
                  onClick={() => {
                    stopSpeechAlert();
                    setTestPlaying(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Square className="w-3.5 h-3.5 text-rose-400" />
                  إيقاف الصوت
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            يتم حفظ الإعدادات تلقائياً
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition active:scale-95 shadow-md shadow-emerald-950/40"
          >
            إغلاق وحفظ
          </button>
        </div>
      </div>
    </div>
  );
};
