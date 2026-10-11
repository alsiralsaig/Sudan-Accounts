/**
 * بانر تحذير النسخ الاحتياطي — يظهر في نقطة البيع عندما تكون البيانات معرضة للخطر
 * (لا توجد نسخة احتياطية حديثة) مع أزرار نسخ سريع ومشاركة واتساب.
 */
import React, { useState } from 'react';
import { ShieldAlert, Download, Share2, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isBackupDue, backupAgeLabel } from '../services/backupSchedulerService';

export const BackupAlertBanner: React.FC = () => {
  const { backupSchedule, exportDatabaseAsJSON, shareBackupViaWhatsApp } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareMsg, setShareMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (dismissed || !isBackupDue(backupSchedule)) return null;

  const handleQuickBackup = () => {
    exportDatabaseAsJSON(); // ينشئ نسخة + ينزّل الملف + يحدّث lastBackupDate → يخفي البانر تلقائياً
  };

  const handleWhatsAppShare = async () => {
    setBusy(true);
    setShareMsg(null);
    const result = await shareBackupViaWhatsApp();
    setBusy(false);
    setShareMsg({ ok: result.success, text: result.message });
    if (result.success) setTimeout(() => setShareMsg(null), 6000);
  };

  return (
    <div className="no-print border-b border-amber-900/60 bg-gradient-to-l from-amber-950/80 to-red-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
            <span className="font-bold">⚠️ بياناتك محفوظة في هذا الجهاز فقط —</span>{' '}
            آخر نسخة احتياطية: <span className="font-bold text-amber-300">{backupAgeLabel(backupSchedule.lastBackupDate)}</span>
            {' '}— اعمل نسخة الآن قبل ضياع البيانات!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleQuickBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نسخة سريعة</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>واتساب</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-amber-200/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="إخفاء مؤقت"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {shareMsg && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 pb-2 text-[11px] font-bold ${shareMsg.ok ? 'text-emerald-300' : 'text-red-300'}`}>
          {shareMsg.text}
        </div>
      )}
    </div>
  );
};
