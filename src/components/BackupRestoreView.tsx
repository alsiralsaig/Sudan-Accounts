import React, { useState, useRef } from 'react';
import {
  Database,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Save,
  ArrowRight,
  HardDrive,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackupFrequency, DatabaseSnapshot } from '../types';

export const BackupRestoreView: React.FC = () => {
  const {
    backupSchedule,
    updateBackupSchedule,
    databaseSnapshots,
    createDatabaseSnapshot,
    exportDatabaseAsJSON,
    exportDatabaseAsCSV,
    restoreDatabaseFromSnapshot,
    restoreDatabaseFromJSONString,
    restoreDatabaseFromCSVString,
    deleteSnapshot,
    products,
    invoices,
    expenses,
    currentUser,
  } = useApp();

  // Schedule local form state
  const [scheduleEnabled, setScheduleEnabled] = useState(backupSchedule.enabled);
  const [frequency, setFrequency] = useState<BackupFrequency>(backupSchedule.frequency);
  const [timeOfDay, setTimeOfDay] = useState(backupSchedule.timeOfDay || '23:00');
  const [maxSnapshots, setMaxSnapshots] = useState(backupSchedule.maxSnapshotsToKeep || 10);
  const [scheduleSavedMsg, setScheduleSavedMsg] = useState(false);

  // File Upload & Restore state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileType, setFileType] = useState<'json' | 'csv'>('json');
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [csvTargetType, setCsvTargetType] = useState<'products' | 'expenses'>('products');
  const [previewStats, setPreviewStats] = useState<any | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save Schedule settings
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    updateBackupSchedule({
      enabled: scheduleEnabled,
      frequency,
      timeOfDay,
      maxSnapshotsToKeep: Number(maxSnapshots),
    });
    setScheduleSavedMsg(true);
    setTimeout(() => setScheduleSavedMsg(false), 3000);
  };

  // Immediate manual snapshot
  const handleManualBackupNow = () => {
    createDatabaseSnapshot('نسخة احتياطية فورية يدوية', 'manual');
  };

  // Handle File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRestoreStatus(null);
    setPreviewStats(null);

    const isJson = file.name.endsWith('.json');
    setFileType(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);

      if (isJson) {
        try {
          const parsed = JSON.parse(content);
          const data = parsed.data || parsed;
          if (data.products && Array.isArray(data.products)) {
            setPreviewStats({
              valid: true,
              productsCount: data.products.length,
              invoicesCount: data.invoices ? data.invoices.length : 0,
              expensesCount: data.expenses ? data.expenses.length : 0,
              backupDate: parsed.createdAt || 'تاريخ غير محدد',
              storeName: data.storeSettings?.storeName || 'متجر غير محدد',
            });
          } else {
            setPreviewStats({ valid: false, error: 'الملف لا يحتوي على كائنات منتجات صالحة.' });
          }
        } catch (err: any) {
          setPreviewStats({ valid: false, error: 'تنسيق JSON غير صالح أو الملف تالف.' });
        }
      } else {
        // CSV Preview
        const lines = content.trim().split(/\r?\n/);
        setPreviewStats({
          valid: true,
          linesCount: Math.max(0, lines.length - 1),
          sampleHeaders: lines[0] || '',
        });
      }
    };
    reader.readAsText(file);
  };

  // Execute restore
  const handleExecuteRestore = () => {
    if (!fileContent) return;
    setIsProcessing(true);
    setRestoreStatus(null);

    setTimeout(() => {
      if (fileType === 'json') {
        const result = restoreDatabaseFromJSONString(fileContent, restoreMode);
        if (result.success) {
          setRestoreStatus({ type: 'success', message: result.message });
          setSelectedFile(null);
          setFileContent('');
          setPreviewStats(null);
        } else {
          setRestoreStatus({ type: 'error', message: result.message });
        }
      } else {
        const result = restoreDatabaseFromCSVString(fileContent, csvTargetType);
        if (result.success) {
          setRestoreStatus({ type: 'success', message: result.message });
          setSelectedFile(null);
          setFileContent('');
          setPreviewStats(null);
        } else {
          setRestoreStatus({ type: 'error', message: result.message });
        }
      }
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              جدولة النسخ الاحتياطي واستعادة البيانات
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                حماية البيانات 100%
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              جدولة النسخ الدوري التلقائي، تصدير كامل البيانات بصيغة JSON أو CSV متوافقة مع إكسل، واستعادة
              السجلات بنقرة واحدة في حال فقدانها.
            </p>
          </div>
        </div>

        {/* Fast Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualBackupNow}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ نسخة احتياطية الآن</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 1. Schedule Config & 2. Instant Export & 3. Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Panel 1: Schedule Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">إعدادات الجدولة التلقائية</h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  backupSchedule.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {backupSchedule.enabled ? 'الجدولة مفعلة' : 'متوقفة'}
              </span>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5 text-xs">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">تفعيل النسخ الاحتياطي التلقائي:</span>
                  <span className="text-[11px] text-slate-400">
                    إنشاء نقاط استعادة دورية تلقائياً دون تدخل يدوي
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">وتيرة النسخ الاحتياطي:</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as BackupFrequency)}
                  disabled={!scheduleEnabled}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="daily">يومياً (نهاية كل يوم عمل)</option>
                  <option value="weekly">أسبوعياً (كل يوم أحد)</option>
                  <option value="monthly">شهرياً (بداية كل شهر جديد)</option>
                  <option value="disabled">تعطيل مؤقت</option>
                </select>
              </div>

              {/* Time of day */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  وقت التنفيذ المفضل (توقيت محلي):
                </label>
                <input
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  disabled={!scheduleEnabled}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2 font-mono outline-none disabled:opacity-50"
                />
              </div>

              {/* Max snapshots to keep */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  الحد الأقصى لعدد النسخ المحفوظة محلياً:
                </label>
                <input
                  type="number"
                  min="3"
                  max="50"
                  value={maxSnapshots}
                  onChange={(e) => setMaxSnapshots(parseInt(e.target.value) || 10)}
                  disabled={!scheduleEnabled}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2 font-mono outline-none disabled:opacity-50"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  تحذف النسخ القديمة تلقائياً عند تجاوز هذا العدد لحفظ الذاكرة.
                </span>
              </div>

              {/* Schedule status info */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>آخر نسخة تم إنشاؤها:</span>
                  <span className="font-mono text-slate-200">
                    {backupSchedule.lastBackupDate || 'لا توجد نسخة بعد'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>موعد النسخة القادمة:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {backupSchedule.nextBackupDate || 'تحدد تلقائياً'}
                  </span>
                </div>
              </div>

              {scheduleSavedMsg && (
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-center font-bold">
                  تم حفظ وتحديث إعدادات الجدولة بنجاح!
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition border border-slate-700 cursor-pointer"
              >
                حفظ إعدادات الجدولة
              </button>
            </form>
          </div>
        </div>

        {/* Panel 2: Instant Export (JSON & CSV) & Restore Upload (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Export Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">تصدير فوري لقاعدة البيانات (JSON / CSV)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              قم بتحميل نسخة احتياطية فورية وحفظها على جهازك أو قرص خارجي، أو استخراج جداول المبيعات
              والمخزون كملفات إكسل CSV:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Full JSON Export */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <FileText className="w-4 h-4" />
                    <span>نسخة شاملة كاملة (JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    تحفظ كامل المتجر: الأصناف، المبيعات، الفواتير، المصروفات، الموظفين، وسجل التدقيق في ملف
                    واحد مشفر وخالٍ من الفقد.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportDatabaseAsJSON}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير ملف JSON</span>
                </button>
              </div>

              {/* Excel CSV Export */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>جداول إكسل منفصلة (CSV)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    ملفات CSV متوافقة مع Excel باللغة العربية (UTF-8 BOM) لاستعراض جداول المخزون والمبيعات
                    وتحليلها.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => exportDatabaseAsCSV('products')}
                    className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 transition"
                  >
                    المخزون CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDatabaseAsCSV('invoices')}
                    className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 transition"
                  >
                    الفواتير CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDatabaseAsCSV('expenses')}
                    className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 transition"
                  >
                    المصروفات CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDatabaseAsCSV('all')}
                    className="py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-[11px] transition"
                  >
                    تحميل الكل
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Restore Box (File Upload) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  استعادة البيانات من ملف خارجي (JSON أو CSV)
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                نقطة أمان تلقائية قبل الاستعادة
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* File input drag / drop box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60 transition group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,.csv"
                  className="hidden"
                />
                <Upload className="w-7 h-7 mx-auto text-slate-500 group-hover:text-emerald-400 transition mb-1.5" />
                <p className="font-bold text-white text-xs">
                  {selectedFile ? `الملف المحدد: ${selectedFile.name}` : 'انقر هنا لاختيار ملف النسخة الاحتياطية'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  يدعم ملفات النسخ الاحتياطي الرسمية (.json) أو جداول الأصناف والمخزون (.csv)
                </p>
              </div>

              {/* Preview Box if file selected */}
              {previewStats && previewStats.valid && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      ملف صالح ومعتمد للاستعادة
                    </span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono">
                      {fileType.toUpperCase()}
                    </span>
                  </div>

                  {fileType === 'json' ? (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <span className="text-slate-400 text-[10px] block">الأصناف</span>
                        <span className="font-bold text-white font-mono">{previewStats.productsCount}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <span className="text-slate-400 text-[10px] block">الفواتير</span>
                        <span className="font-bold text-white font-mono">{previewStats.invoicesCount}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <span className="text-slate-400 text-[10px] block">المصروفات</span>
                        <span className="font-bold text-white font-mono">{previewStats.expensesCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-300">
                      يحتوي الملف على {previewStats.linesCount} صف بيانات.
                    </div>
                  )}

                  {/* Options */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    {fileType === 'json' ? (
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[11px]">نمط الاستعادة:</label>
                        <select
                          value={restoreMode}
                          onChange={(e) => setRestoreMode(e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 outline-none text-xs"
                        >
                          <option value="overwrite">استبدال كامل للبيانات (Full Overwrite)</option>
                          <option value="merge">دمج مع البيانات الحالية (Merge)</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[11px]">نوع بيانات CSV:</label>
                        <select
                          value={csvTargetType}
                          onChange={(e) => setCsvTargetType(e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 outline-none text-xs"
                        >
                          <option value="products">أصناف ومخزون (Products)</option>
                          <option value="expenses">مصروفات تشغيلية (Expenses)</option>
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleExecuteRestore}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow"
                    >
                      {isProcessing ? 'جاري الاستعادة...' : 'تأكيد واستعادة البيانات'}
                    </button>
                  </div>
                </div>
              )}

              {previewStats && !previewStats.valid && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{previewStats.error}</span>
                </div>
              )}

              {restoreStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    restoreStatus.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{restoreStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panel 3: In-App Snapshots Archive (سجل نقاط الاستعادة المحفوظة محلياً) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              أرشيف نقاط الاستعادة المحفوظة ({databaseSnapshots.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            يمكنك استعادة المتجر لأي نقطة زمنية سابقة بنقرة زر واحدة مع حفظ نقطة تراجع تلقائية.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="p-3">عنوان النسخة</th>
                <th className="p-3">النوع</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">عدد الأصناف</th>
                <th className="p-3">عدد الفواتير</th>
                <th className="p-3">الإيرادات المسجلة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {databaseSnapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-bold text-white">
                    {snap.title}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        snap.type === 'scheduled'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : snap.type === 'pre_restore_checkpoint'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {snap.type === 'scheduled'
                        ? 'مجدولة تلقائياً'
                        : snap.type === 'pre_restore_checkpoint'
                        ? 'نقطة أمان'
                        : 'يدوية'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-400">
                    {snap.createdAt}
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {snap.stats.productsCount} صنف
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {snap.stats.invoicesCount} فاتورة
                  </td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">
                    {snap.stats.totalRevenue.toLocaleString('ar-SD')} ج.س
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من استعادة المتجر إلى النسخة "${snap.title}" (${snap.createdAt})؟ سيتم إنشاء نقطة أمان للبيانات الحالية تلقائياً.`)) {
                            restoreDatabaseFromSnapshot(snap.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white transition text-xs font-bold flex items-center gap-1"
                        title="استعادة هذه النسخة"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>استعادة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const jsonStr = JSON.stringify(snap, null, 2);
                          const blob = new Blob([jsonStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `snapshot_${snap.id}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="تحميل كملف JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('حذف هذه النسخة الاحتياطية من السجل؟')) {
                            deleteSnapshot(snap.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                        title="حذف النسخة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {databaseSnapshots.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Database className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
              <p className="font-semibold text-slate-300">لا توجد نقاط استعادة محفوظة بعد</p>
              <p className="text-[11px] text-slate-500">
                انقر على «حفظ نسخة احتياطية الآن» بالأعلى لإنشاء أول نقطة استعادة فورية للمتجر.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
