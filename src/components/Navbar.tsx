import React, { useEffect, useState } from 'react';
import {
  Mic,
  Store,
  Layers,
  FileText,
  BarChart3,
  Users,
  BookOpen,
  CheckCircle2,
  ShieldAlert,
  ArrowRightLeft,
  ShoppingBag,
  Sparkles,
  Database,
  Mail,
  Volume2,
  VolumeX,
  Percent,
  Wallet,
  Cloud,
  CloudUpload,
  CloudOff,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { loadSession, onSyncStatus, type SyncStatus } from '../services/cloudSyncClient';
import { LoginGate } from './LoginGate';
import { useApp } from '../context/AppContext';
import { BusinessType, UserProfile } from '../types';
import { StockNotificationCenter } from './StockNotificationCenter';
import { EmailNotificationsModal } from './EmailNotificationsModal';
import { VoiceAlertSettingsModal } from './VoiceAlertSettingsModal';

interface NavbarProps {
  onOpenVoiceModal: () => void;
  onOpenCloudModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenVoiceModal, onOpenCloudModal }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isVoiceAlertSettingsOpen, setIsVoiceAlertSettingsOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<SyncStatus>({ state: 'unconfigured' });
  const [switchTarget, setSwitchTarget] = useState<UserProfile | null>(null);

  useEffect(() => {
    const off = onSyncStatus((s) => setCloudStatus(s));
    return () => { off(); };
  }, []);
  const {
    activeTab,
    setActiveTab,
    businessType,
    setBusinessType,
    currentUser,
    setCurrentUser,
    staffList,
    storeName,
    speechSettings,
    updateSpeechSettings,
    products,
  } = useApp();

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;
  const criticalStockCount = products.filter((p) => p.currentStock <= 0).length;

  const businessTypes: { id: BusinessType; label: string; icon: string }[] = [
    { id: 'grocery', label: 'بقالة وسوبرماركت', icon: '🛒' },
    { id: 'pharmacy', label: 'صيدلية', icon: '💊' },
    { id: 'restaurant', label: 'مطعم وكافيه', icon: '🍽️' },
    { id: 'auto_parts', label: 'ورش وقطع غيار', icon: '🔧' },
    { id: 'electronics', label: 'إلكترونيات وهواتف', icon: '📱' },
    { id: 'clothing', label: 'ملابس وأحذية', icon: '👕' },
    { id: 'building', label: 'مواد بناء وسباكة', icon: '🧱' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 no-print">
      {/* Top Banner: Quick Role Switcher & Business Type Switcher */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-3">
        {/* Business Type Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            نشاط المتجر:
          </span>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value as BusinessType)}
            className="bg-slate-900 border border-slate-700 text-emerald-300 font-semibold rounded px-2 py-0.5 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {businessTypes.map((bt) => (
              <option key={bt.id} value={bt.id}>
                {bt.icon} {bt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-md">
            <span className="text-slate-400">المستخدم النشط:</span>
            <div className="flex items-center gap-1 font-medium text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {currentUser.name}
              <span
                className={`mr-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  currentUser.role === 'owner'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : currentUser.role === 'cashier'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {currentUser.role === 'owner'
                  ? 'المالك / المدير'
                  : currentUser.role === 'cashier'
                  ? 'كاشير ومبيعات'
                  : 'أمين مخزن'}
              </span>
            </div>

            {/* Quick Switch Button */}
            <select
              aria-label="تبديل المستخدم"
              value={currentUser.id}
              onChange={(e) => {
                const found = staffList.find((u) => u.id === e.target.value);
                if (found) {
                  if (found.pin && found.pin.length >= 4) setSwitchTarget(found); // محمي برمز
                  else setCurrentUser(found); // بدون رمز — تبديل مباشر
                }
              }}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[11px] outline-none hover:border-slate-600 cursor-pointer"
            >
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  تبديل إلى: {st.name} ({st.role === 'owner' ? 'مالك' : st.role === 'cashier' ? 'كاشير' : 'مخزن'}){st.pin ? ' 🔒' : ''}
                </option>
              ))}
            </select>
          </div>

          {!currentUser.permissions.canViewProfits && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-400/90 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              صلاحيات كاشير: حجب الأرباح وتكاليف الشراء
            </span>
          )}
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg text-white tracking-tight">حساباتي السودان</h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> ذكي
              </span>
            </div>
            <p className="text-xs text-slate-400">{storeName}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'landing'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            عن المنصة
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            نقطة البيع (POS)
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 relative ${
              activeTab === 'inventory'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>المخزون والأوزان</span>
            {lowStockCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                  criticalStockCount > 0
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-amber-500 text-slate-950 font-black'
                }`}
                title={`يوجد ${lowStockCount} أصناف وصلت لحد إعادة الطلب!`}
              >
                {lowStockCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'invoices'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            الفواتير والمبيعات
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 relative ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>لوحة التحكم والتقارير</span>
            {lowStockCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none flex items-center gap-0.5 ${
                  criticalStockCount > 0
                    ? 'bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-950'
                    : 'bg-amber-500 text-slate-950 font-black shadow-sm'
                }`}
                title={`تحذير مخزون: ${lowStockCount} منتجات أقل من حد الطلب الأدنى`}
              >
                ⚠️ {lowStockCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-emerald-600 text-white shadow shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            المصروفات وP&L
          </button>
          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'taxes'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            الضرائب وVAT
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'staff'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            الموظفون
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'dictionary'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            القاموس السوداني
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'backup'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            النسخ والجدولة
          </button>
          <button
            onClick={() => setActiveTab('verifier')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'verifier'
                ? 'bg-slate-800 text-emerald-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            فحص الدقة
          </button>
        </nav>

        {/* Fast Action Voice Button & Notifications */}
        <div className="flex items-center gap-2">
          {/* Notification Bell Dropdown */}
          <StockNotificationCenter mode="dropdown" />

          {/* Voice Alert Speech Settings Button */}
          <button
            onClick={() => setIsVoiceAlertSettingsOpen(true)}
            className={`relative p-2 rounded-xl border transition cursor-pointer ${
              speechSettings.enabled
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-950/40'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-500 border-slate-700/60'
            }`}
            title={
              speechSettings.enabled
                ? 'إعدادات القراءة الصوتية للتنبيهات (مفعلة 🔊)'
                : 'إعدادات القراءة الصوتية للتنبيهات (مكتومة 🔇)'
            }
          >
            {speechSettings.enabled ? (
              <Volume2 className="w-4 h-4 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Email Reports Button */}
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-sky-400 hover:text-sky-300 transition border border-slate-700/60 cursor-pointer"
            title="نظام الإشعارات والتقارير البريدية اليومية"
          >
            <Mail className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-950/60 transition active:scale-95 border border-emerald-400/20 cursor-pointer"
          >
            <Mic className="w-4 h-4 animate-pulse text-amber-300" />
            <span>تسجيل بالصوت</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto gap-1 px-3 py-2 border-t border-slate-800/80 bg-slate-950/80 scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab('landing')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'landing' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          عن المنصة
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'pos' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          نقطة البيع
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium flex items-center gap-1 ${
            activeTab === 'inventory' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          <span>المخزون</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white">
              {lowStockCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'invoices' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          الفواتير
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium flex items-center gap-1 ${
            activeTab === 'dashboard' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          <span>اللوحة والتقارير</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white animate-pulse">
              ⚠️ {lowStockCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'expenses' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          المصروفات وP&L
        </button>
        <button
          onClick={() => setActiveTab('taxes')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'taxes' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          الضرائب وVAT
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'staff' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          الموظفون
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'dictionary' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          القاموس
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'backup' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          النسخ الاحتياطي
        </button>
        <button
          onClick={() => setActiveTab('verifier')}
          className={`shrink-0 px-2.5 py-1 rounded-md font-medium ${
            activeTab === 'verifier' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
          }`}
        >
          فحص الدقة
        </button>
        {/* زر السحابة — حالة المزامنة */}
        {(() => {
          const linked = Boolean(loadSession());
          const s = cloudStatus.state;
          const Icon = !linked ? CloudOff : s === 'syncing' ? RefreshCw : s === 'error' || s === 'conflict' ? AlertTriangle : CloudUpload;
          const color = !linked
            ? 'text-slate-500 border-slate-700 hover:text-slate-300'
            : s === 'error' || s === 'conflict'
            ? 'text-amber-400 border-amber-500/40 animate-pulse'
            : s === 'syncing'
            ? 'text-sky-400 border-sky-500/40'
            : 'text-emerald-400 border-emerald-500/40';
          const label = !linked ? 'السحابة: محلي بس — اضغط للربط' : s === 'syncing' ? 'بيزامن...' : s === 'error' ? 'مشكلة مزامنة' : s === 'conflict' ? 'تعارض نسخ' : s === 'offline' ? 'أوفلاين — هيتزامن مع النت' : 'متزامن مع السحابة';
          return (
            <button
              onClick={onOpenCloudModal}
              title={label}
              aria-label={label}
              className={`shrink-0 p-1.5 rounded-lg border bg-slate-900 transition-colors ${color}`}
            >
              <Icon className={`w-4 h-4 ${s === 'syncing' ? 'animate-spin' : ''}`} />
            </button>
          );
        })()}
      </div>


      {/* بوابة التبديل برمز الموظف */}
      {switchTarget && (
        <LoginGate
          targetUser={switchTarget}
          title={`دخول: ${switchTarget.name}`}
          onSuccess={(u) => { setCurrentUser(u); setSwitchTarget(null); }}
          onCancel={() => setSwitchTarget(null)}
        />
      )}

      {/* Email Notifications Modal */}
      <EmailNotificationsModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* Voice Alert Settings Modal */}
      <VoiceAlertSettingsModal
        isOpen={isVoiceAlertSettingsOpen}
        onClose={() => setIsVoiceAlertSettingsOpen(false)}
      />
    </header>
  );
};
