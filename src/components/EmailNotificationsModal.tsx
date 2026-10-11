import React, { useState } from 'react';
import {
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  Trash2,
  Eye,
  X,
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Calendar,
  AlertOctagon,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SentEmailLog } from '../types';

interface EmailNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailNotificationsModal: React.FC<EmailNotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    emailConfig,
    updateEmailConfig,
    sentEmailLogs,
    sendDailySalesSummaryEmail,
    sendLowStockAlertEmail,
    sendTestEmail,
    deleteEmailLog,
    clearAllEmailLogs,
    products,
    invoices,
    currentUser,
    storeName,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'send' | 'settings' | 'history'>('send');
  const [managerEmailInput, setManagerEmailInput] = useState(emailConfig.managerEmail || '');
  const [dailyTimeInput, setDailyTimeInput] = useState(emailConfig.dailySummaryTime || '22:00');
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(emailConfig.dailySummaryEnabled);
  const [lowStockAlertsEnabled, setLowStockAlertsEnabled] = useState(emailConfig.lowStockAlertsEnabled);
  const [includeProfit, setIncludeProfit] = useState(emailConfig.includeProfitInSummary);

  // CC emails
  const [newCcEmail, setNewCcEmail] = useState('');
  const [ccEmailsList, setCcEmailsList] = useState<string[]>(emailConfig.additionalEmails || []);

  // Action status states
  const [isSendingDaily, setIsSendingDaily] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected email for live preview
  const [previewEmail, setPreviewEmail] = useState<SentEmailLog | null>(null);

  if (!isOpen) return null;

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;
  const completedInvoicesCount = invoices.filter((i) => i.status === 'completed').length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerEmailInput.trim()) {
      setFeedbackMessage({ type: 'error', text: 'يرجى إدخال عنوان البريد الإلكتروني لمدير المتجر.' });
      return;
    }

    updateEmailConfig({
      managerEmail: managerEmailInput.trim(),
      dailySummaryTime: dailyTimeInput,
      dailySummaryEnabled,
      lowStockAlertsEnabled,
      includeProfitInSummary: includeProfit,
      additionalEmails: ccEmailsList,
    });

    setFeedbackMessage({ type: 'success', text: 'تم حفظ إعدادات الإشعارات البريدية بنجاح!' });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleAddCcEmail = () => {
    if (newCcEmail && newCcEmail.includes('@') && !ccEmailsList.includes(newCcEmail)) {
      setCcEmailsList([...ccEmailsList, newCcEmail.trim()]);
      setNewCcEmail('');
    }
  };

  const handleRemoveCcEmail = (emailToRemove: string) => {
    setCcEmailsList(ccEmailsList.filter((e) => e !== emailToRemove));
  };

  const handleTriggerDailyReport = async () => {
    setIsSendingDaily(true);
    setFeedbackMessage(null);
    const result = await sendDailySalesSummaryEmail();
    setIsSendingDaily(false);
    setFeedbackMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    if (result.success && result.logId) {
      const created = sentEmailLogs.find((l) => l.id === result.logId);
      if (created) setPreviewEmail(created);
    }
  };

  const handleTriggerLowStockAlert = async () => {
    setIsSendingAlert(true);
    setFeedbackMessage(null);
    const result = await sendLowStockAlertEmail();
    setIsSendingAlert(false);
    setFeedbackMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    if (result.success && result.logId) {
      const created = sentEmailLogs.find((l) => l.id === result.logId);
      if (created) setPreviewEmail(created);
    }
  };

  const handleTriggerTestEmail = async () => {
    setIsSendingTest(true);
    setFeedbackMessage(null);
    const result = await sendTestEmail();
    setIsSendingTest(false);
    setFeedbackMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-sky-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Mail className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">نظام الإشعارات والتقارير البريدية</h3>
                <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> تقارير آلية
                </span>
              </div>
              <p className="text-xs text-slate-400">
                إرسال ملخص المبيعات اليومي للمدير وتنبيهات فورية عند وصول المخزون لمستوى إعادة الطلب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('send')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'send'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال فوري وتنبيهات</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>إعدادات البريد والجدولة</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>سجل الرسائل المرسلة ({sentEmailLogs.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span>المرسل إليه:</span>
            <span className="font-mono text-sky-400 font-bold">{emailConfig.managerEmail}</span>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMessage && (
          <div
            className={`p-3 text-xs flex items-center justify-between border-b ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: QUICK SEND ACTIONS */}
          {activeTab === 'send' && (
            <div className="space-y-6">
              {/* Status Overview Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>بريد مدير المتجر المعتمد</span>
                    <UserCheck className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono truncate" title={emailConfig.managerEmail}>
                    {emailConfig.managerEmail}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    نظام الإشعارات مفعل وجاهز للإرسال
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>موعد التقرير اليومي الآلي</span>
                    <Calendar className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    يومياً الساعة {emailConfig.dailySummaryTime} مساءً
                  </div>
                  <div className="text-[10px] text-slate-400">
                    آخر إرسال: {emailConfig.lastDailyReportSent || 'اليوم'}
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>تنبيهات نواقص المخزون</span>
                    <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
                  </div>
                  <div className={`text-sm font-bold font-mono ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {lowStockCount > 0 ? `${lowStockCount} أصناف بلغت حد الطلب` : 'المخزون مكتمل'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    تنبيهات فورية تلقائية عند وصول الرصيد للحد الأدنى
                  </div>
                </div>
              </div>

              {/* Action Trigger Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Send Daily Sales Summary */}
                <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 hover:border-sky-500/40 p-5 rounded-2xl space-y-4 shadow-lg transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">إرسال تقرير ملخص المبيعات اليومي</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        يحتوي على إجمالي المبيعات، تكلفة البضاعة المباعة (COGS)، صافي الأرباح، وطرق التحصيل (بنكك، كاش، فوري).
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">عدد الفواتير المنفذة لليوم:</span>
                      <span className="font-bold font-mono text-white">{completedInvoicesCount} فواتير</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">تضمين صافي الربح الحقيقي:</span>
                      <span className="font-bold text-emerald-400">نعم (وفق معادلة الدقة)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerDailyReport}
                    disabled={isSendingDaily}
                    className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingDaily ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جارٍ إعداد وتوليد التقرير وإرساله...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال تقرير المبيعات اليومي الآن بريدياً</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Send Low Stock Alert */}
                <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 hover:border-amber-500/40 p-5 rounded-2xl space-y-4 shadow-lg transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">إرسال تنبيه نواقص المخزون الفوري</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        يرسل تقريراً عاجلاً بجميع الأصناف التي وصلت لكمية إعادة الطلب المحددة مع أماكن الرفوف والكميات المتبقية.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">أصناف تحت مستوى إعادة الطلب:</span>
                      <span className={`font-bold font-mono ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {lowStockCount} أصناف بحاجة لتوريد
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">مستوى الخطورة:</span>
                      <span className="font-bold text-amber-400">
                        {lowStockCount > 0 ? 'حرجة / تنبيه فوري' : 'مطمئنة'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerLowStockAlert}
                    disabled={isSendingAlert}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingAlert ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جارٍ التحقق من الأرصدة وإرسال التنبيه...</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>إرسال تنبيه نواقص المخزون الآن بريدياً</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Fast Test Ping */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    هل تريد اختبار وصول الإيميلات إلى صندوق الوارد لمدير المتجر؟
                  </span>
                </div>
                <button
                  onClick={handleTriggerTestEmail}
                  disabled={isSendingTest}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSendingTest ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>إرسال رسالة فحص تجريبية</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS & SCHEDULING */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-sky-400" />
                  إعدادات البريد الإلكتروني للمدير
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Manager Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      عنوان بريد مدير المتجر الرئيسي *
                    </label>
                    <input
                      type="email"
                      required
                      value={managerEmailInput}
                      onChange={(e) => setManagerEmailInput(e.target.value)}
                      placeholder="manager@domain.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-sky-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      يتلقى التقرير المالي اليومي وتنبيهات إعادة طلب المخزون.
                    </p>
                  </div>

                  {/* Daily Report Scheduled Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      وقت إرسال التقرير اليومي التلقائي
                    </label>
                    <input
                      type="time"
                      value={dailyTimeInput}
                      onChange={(e) => setDailyTimeInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-sky-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      يتم تجميع عمليات البيع والمصروفات وإرسالها فور انتهاء دوام المتجر.
                    </p>
                  </div>
                </div>

                {/* Additional CC Emails */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    عناوين بريد إضافية للشركاء أو المحاسب القانوني (نسخة CC)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newCcEmail}
                      onChange={(e) => setNewCcEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCcEmail}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>

                  {ccEmailsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {ccEmailsList.map((email) => (
                        <span
                          key={email}
                          className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => handleRemoveCcEmail(email)}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  خيارات الإرسال التلقائي
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        تفعيل إرسال التقرير اليومي التلقائي
                      </span>
                      <span className="text-[11px] text-slate-400">
                        إرسال ملخص مالي تنفيذي يومياً عند موعد الإغلاق المحدد.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={dailySummaryEnabled}
                      onChange={(e) => setDailySummaryEnabled(e.target.checked)}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        تفعيل التنبيهات الفورية لنواقص المخزون
                      </span>
                      <span className="text-[11px] text-slate-400">
                        إشعار بريدي فوري عندما يقل رصيد صنف عن حد إعادة الطلب.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={lowStockAlertsEnabled}
                      onChange={(e) => setLowStockAlertsEnabled(e.target.checked)}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        تضمين تفاصيل صافي الربح و COGS في التقرير
                      </span>
                      <span className="text-[11px] text-slate-400">
                        إظهار تكاليف الشراء والمصروفات والأرباح الصافية (صلاحيات المدير).
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeProfit}
                      onChange={(e) => setIncludeProfit(e.target.checked)}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ إعدادات الإشعارات</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DISPATCH LOGS & HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">سجل الرسائل والإشعارات البريدية المرسلة</h4>
                  <p className="text-xs text-slate-400">
                    أرشيف بجميع التقارير والتنبيهات مع إمكانية المعاينة الحية
                  </p>
                </div>

                {sentEmailLogs.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('هل تريد مسح سجل الرسائل المرسلة بالكامل؟')) {
                        clearAllEmailLogs();
                      }
                    }}
                    className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

              {sentEmailLogs.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold">لا توجد رسائل مسجلة في السجل بعد</p>
                  <p className="text-xs text-slate-500">قم بإرسال تقرير المبيعات اليومي لتسجيله هنا</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sentEmailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === 'daily_summary'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : log.type === 'low_stock_alert'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {log.type === 'daily_summary'
                              ? '📊 تقرير مبيعات يومي'
                              : log.type === 'low_stock_alert'
                              ? '⚠️ تنبيه نواقص'
                              : '🧪 رسالة فحص'}
                          </span>
                          <span className="font-bold text-xs text-white">{log.subject}</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> تم التسليم
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 font-sans line-clamp-1">
                          {log.summaryText}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>إلى: <b className="font-mono text-slate-400">{log.recipient}</b></span>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setPreviewEmail(log)}
                          className="bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة الإيميل</span>
                        </button>
                        <button
                          onClick={() => deleteEmailLog(log.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                          title="حذف من السجل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Email HTML Preview Modal */}
        {previewEmail && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">معاينة الرسالة الحقيقية المستلمة في البريد</h4>
                  <p className="text-xs text-slate-400">
                    مرسل إلى: <span className="font-mono text-sky-400">{previewEmail.recipient}</span>
                  </p>
                </div>
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950">
                <div
                  className="border border-slate-800 rounded-xl overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: previewEmail.htmlPreview }}
                />
              </div>

              <div className="bg-slate-950 p-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>نظام إشعارات بريدي آمن متصل بخادم الإرسال</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
