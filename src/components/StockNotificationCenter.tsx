import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  PackageCheck,
  CheckCircle2,
  X,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  MapPin,
  Settings,
  RefreshCw,
  EyeOff,
  Lock,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StockNotification } from '../types';

interface StockNotificationCenterProps {
  mode?: 'dropdown' | 'dashboard-panel';
  onNavigateToInventory?: () => void;
}

export const StockNotificationCenter: React.FC<StockNotificationCenterProps> = ({
  mode = 'dashboard-panel',
  onNavigateToInventory,
}) => {
  const {
    stockNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    restoreDismissedNotifications,
    quickRestockProduct,
    updateProductReorderLevel,
    currentUser,
    setActiveTab,
    speakAlert,
    speechSettings,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [restockModalProduct, setRestockModalProduct] = useState<StockNotification | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [editingThresholdProduct, setEditingThresholdProduct] = useState<StockNotification | null>(null);
  const [newThreshold, setNewThreshold] = useState<number>(10);
  const [showDismissed, setShowDismissed] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  // RBAC Permission Guards
  const canRestock = currentUser.role === 'owner' || (currentUser.role !== 'cashier' && currentUser.permissions.canOverrideStock);
  const canEditThreshold = currentUser.role === 'owner' || (currentUser.role !== 'cashier' && currentUser.permissions.canEditPrices);

  // Filter list
  const activeNotifications = stockNotifications.filter((n) => {
    if (!showDismissed && n.isDismissed) return false;
    if (activeFilter === 'critical') return n.severity === 'critical';
    if (activeFilter === 'warning') return n.severity === 'warning';
    return true;
  });

  const criticalCount = stockNotifications.filter((n) => n.severity === 'critical' && !n.isDismissed).length;
  const warningCount = stockNotifications.filter((n) => n.severity === 'warning' && !n.isDismissed).length;

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProduct || restockQty <= 0) return;
    quickRestockProduct(restockModalProduct.productId, restockQty);
    setRestockModalProduct(null);
  };

  const handleUpdateThresholdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThresholdProduct || newThreshold < 0) return;
    updateProductReorderLevel(editingThresholdProduct.productId, newThreshold);
    setEditingThresholdProduct(null);
  };

  // DROPDOWN MODE (for Navbar)
  if (mode === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpenDropdown(!isOpenDropdown)}
          className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition border border-slate-700/60 cursor-pointer"
          title="تنبيهات نواقص المخزون ومستوى إعادة الطلب"
        >
          <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {isOpenDropdown && (
          <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden text-right animate-in fade-in">
            {/* Header */}
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs text-white">
                  إشعارات إعادة الطلب ({stockNotifications.filter((n) => !n.isDismissed).length})
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
                <button
                  onClick={() => setIsOpenDropdown(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 text-xs">
              {activeNotifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                  <PackageCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-50 mb-1" />
                  <p className="font-semibold text-slate-300">المخزون في المستوى الآمن</p>
                  <p className="text-[11px] text-slate-500">لا توجد منتجات وصلت إلى حد إعادة الطلب حالياً.</p>
                </div>
              ) : (
                activeNotifications.slice(0, 6).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-3 hover:bg-slate-800/40 transition flex items-start justify-between gap-2 ${
                      !notif.isRead ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {notif.severity === 'critical' ? (
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-bold text-white text-xs">{notif.productName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        الرصيد المتبقي: <span className="font-bold text-rose-400 font-mono">{notif.currentStock} {notif.baseUnit}</span> (حد الطلب: {notif.minStockAlert})
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const msg = notif.currentStock <= 0
                            ? `تنبيه عاجل: لقد نفد مخزون ${notif.productName} بالكامل من الرفوف والمخزن!`
                            : `تنبيه: صنف ${notif.productName} متبقي منه ${notif.currentStock} ${notif.baseUnit} فقط وهو أقل من حد إعادة الطلب.`;
                          speakAlert(msg, true);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-[10px] transition cursor-pointer"
                        title="قراءة التنبيه صوتياً"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {canRestock ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRestockModalProduct(notif);
                            setIsOpenDropdown(false);
                          }}
                          className="px-2 py-1 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white text-[10px] font-bold shrink-0 transition cursor-pointer"
                        >
                          توريد +
                        </button>
                      ) : (
                        <button
                          disabled
                          title="معطل: واجهة للقراءة فقط لموظفي المبيعات"
                          className="px-2 py-1 rounded bg-slate-800 text-slate-500 text-[10px] font-bold shrink-0 cursor-not-allowed opacity-50"
                        >
                          توريد (معطل)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <button
                onClick={() => {
                  setIsOpenDropdown(false);
                  setActiveTab('dashboard');
                }}
                className="text-emerald-400 hover:underline font-bold"
              >
                عرض لوحة التنبيهات الشاملة ←
              </button>
              <button
                onClick={() => {
                  setIsOpenDropdown(false);
                  setActiveTab('inventory');
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                المخزون
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DASHBOARD PANEL MODE (Main Visual Alerts Section)
  return (
    <div className="space-y-4">
      {/* Visual Notification Banner */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 shadow-xl transition-all relative overflow-hidden ${
          criticalCount > 0
            ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-800/80'
            : warningCount > 0
            ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-800/80'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Glowing visual indicator for critical items */}
        {criticalCount > 0 && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                criticalCount > 0
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                  : warningCount > 0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {criticalCount > 0 ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : warningCount > 0 ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <PackageCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  نظام تنبيهات مستوى إعادة الطلب بالمخزون
                </h3>
                {unreadNotificationsCount > 0 && (
                  <span className="bg-rose-500 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-full animate-bounce-slow">
                    {unreadNotificationsCount} تنبيه نشط
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-0.5 max-w-2xl">
                {criticalCount > 0 || warningCount > 0
                  ? `هناك ${criticalCount} صنف في حالة نفاد حرج، و${warningCount} صنف عند مستوى إعادة الطلب المحدد. يرجى توريد هذه الأصناف لضمان استمرار المبيعات دون توقف.`
                  : 'كافة المنتجات حالياً فوق مستويات إعادة الطلب المحددة مسبقاً، والمخزون في وضع آمن ومستقر.'}
              </p>
            </div>
          </div>

          {/* Action buttons on banner */}
          <div className="flex flex-wrap items-center gap-2">
            {activeNotifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const criticalItems = activeNotifications.filter((n) => n.currentStock <= 0);
                  const warningItems = activeNotifications.filter((n) => n.currentStock > 0);
                  let speechText = '';
                  if (criticalItems.length > 0) {
                    const names = criticalItems.map((n) => n.productName).join(' و ');
                    speechText += `تنبيه عاجل: لقد نفد مخزون ${names} بالكامل! `;
                  }
                  if (warningItems.length > 0) {
                    const names = warningItems.map((n) => n.productName).join(' و ');
                    speechText += `وتنبيه: الأصناف ${names} وصلت إلى حد إعادة الطلب.`;
                  }
                  speakAlert(speechText, true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer shadow"
                title="إعلان صوتي لجميع النواقص عبر مكبر الصوت"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>إعلان صوتي للنواقص</span>
              </button>
            )}

            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                تحديد الكل كمقروء
              </button>
            )}

            <button
              onClick={() => setActiveTab('inventory')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>إدارة رفوف المخزون</span>
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-medium ml-1">تصفية التنبيهات:</span>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({stockNotifications.filter((n) => !n.isDismissed).length})
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'critical'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              ⚠️ حرج / نفد ({criticalCount})
            </button>
            <button
              onClick={() => setActiveFilter('warning')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'warning'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              ⚡ حد إعادة الطلب ({warningCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDismissed(!showDismissed)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <EyeOff className="w-3 h-3" />
              <span>{showDismissed ? 'إخفاء المؤجلات' : 'عرض التنبيهات المؤجلة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid of Reorder Alerts */}
      {activeNotifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeNotifications.map((notif) => {
            const isOutOfStock = notif.currentStock <= 0;
            const stockPercent = Math.min(100, Math.round((notif.currentStock / (notif.minStockAlert || 1)) * 100));

            return (
              <div
                key={notif.id}
                className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition shadow-md ${
                  notif.severity === 'critical'
                    ? 'border-rose-900/60 bg-gradient-to-b from-rose-950/20 to-slate-900 hover:border-rose-500/50'
                    : 'border-amber-900/60 bg-gradient-to-b from-amber-950/15 to-slate-900 hover:border-amber-500/50'
                } ${!notif.isRead ? 'ring-1 ring-amber-500/30' : ''}`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{notif.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : notif.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isOutOfStock
                        ? '⛔ نفد المخزون تماماً'
                        : `مستوى الطلب (${stockPercent}%)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ShieldAlert
                      className={`w-4 h-4 shrink-0 ${
                        isOutOfStock || notif.severity === 'critical'
                          ? 'text-rose-400 animate-pulse'
                          : 'text-amber-400'
                      }`}
                    />
                    <h4 className="font-extrabold text-sm text-white">{notif.productName}</h4>
                  </div>

                  {notif.shelfLocation && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      موقع التخزين: {notif.shelfLocation}
                    </span>
                  )}
                </div>

                {/* Level Comparison & Visual Bar */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الكمية المتوفرة:</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      {notif.currentStock} {notif.baseUnit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">حد إعادة الطلب الأدنى:</span>
                    <span className="font-mono text-slate-300">
                      {notif.minStockAlert} {notif.baseUnit}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOutOfStock
                          ? 'w-0'
                          : notif.severity === 'critical'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(5, Math.min(100, stockPercent))}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Quick restock button */}
                    {canRestock ? (
                      <button
                        onClick={() => setRestockModalProduct(notif)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>توريد سريع</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        title="معطل: واجهة للقراءة فقط لموظفي المبيعات — لا تملك صلاحية التوريد"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1 cursor-not-allowed opacity-50"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500/80" />
                        <span>توريد (معطل)</span>
                      </button>
                    )}

                    {/* Edit reorder threshold */}
                    {canEditThreshold ? (
                      <button
                        onClick={() => {
                          setEditingThresholdProduct(notif);
                          setNewThreshold(notif.minStockAlert);
                        }}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition cursor-pointer"
                        title="تعديل حد إعادة الطلب"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-600 text-xs cursor-not-allowed opacity-40"
                        title="معطل: تعديل حد إعادة الطلب متاح للإدارة فقط"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Voice speak & Dismiss */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = notif.currentStock <= 0
                          ? `تنبيه عاجل: لقد نفد مخزون ${notif.productName} بالكامل من الرفوف والمخزن! يرجى إعادة الطلب فوراً.`
                          : `تنبيه: صنف ${notif.productName} وصل إلى حد إعادة الطلب، الرصيد المتبقي ${notif.currentStock} ${notif.baseUnit} فقط.`;
                        speakAlert(msg, true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-amber-400 hover:text-amber-300 transition cursor-pointer flex items-center gap-1 text-[11px]"
                      title="قراءة هذا التنبيه صوتياً"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>قراءة صوتية</span>
                    </button>

                    <button
                      onClick={() => dismissNotification(notif.id)}
                      className="text-[11px] text-slate-500 hover:text-slate-300 transition"
                    >
                      تأجيل
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 space-y-4 text-slate-100 text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                توريد سريع للمنتج: {restockModalProduct.productName}
              </h3>
              <button
                onClick={() => setRestockModalProduct(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400">
              الرصيد المتاح حالياً: <span className="text-rose-400 font-bold font-mono">{restockModalProduct.currentStock} {restockModalProduct.baseUnit}</span> (حد الطلب: {restockModalProduct.minStockAlert})
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1">
                  الكمية المراد إضافتها ({restockModalProduct.baseUnit}):
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                الرصيد الجديد المتوقع بعد التوريد:{' '}
                <span className="text-emerald-400 font-bold font-mono">
                  {restockModalProduct.currentStock + restockQty} {restockModalProduct.baseUnit}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRestockModalProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!canRestock}
                  className={`px-5 py-2 rounded-xl font-bold ${
                    canRestock
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {canRestock ? 'تأكيد التوريد وتحديث الرصيد' : 'معطل (للقراءة فقط)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Threshold Modal */}
      {editingThresholdProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 space-y-4 text-slate-100 text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                تعديل مستوى إعادة الطلب: {editingThresholdProduct.productName}
              </h3>
              <button
                onClick={() => setEditingThresholdProduct(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400">
              سيظهر النظام تنبيهاً مرئياً فور انخفاض رصيد المنتج إلى هذا الرقم أو أقل.
            </p>

            <form onSubmit={handleUpdateThresholdSubmit} className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1">
                  الحد الأدنى الجديد لإعادة الطلب ({editingThresholdProduct.baseUnit}):
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingThresholdProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  حفظ الحد الجديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
