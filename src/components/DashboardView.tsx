import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Building,
  Fuel,
  Zap,
  Info,
  Database,
  Mail,
  Eye,
  ShieldAlert,
  PackagePlus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Volume2,
  Percent,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { StockNotificationCenter } from './StockNotificationCenter';
import { SalesAnalyticsCharts } from './SalesAnalyticsCharts';
import { EmailNotificationsModal } from './EmailNotificationsModal';

export const DashboardView: React.FC = () => {
  const {
    invoices,
    expenses,
    products,
    addExpense,
    deleteExpense,
    currentUser,
    setActiveTab,
    quickRestockProduct,
    speakAlert,
    vatSettings,
    getMonthlyTaxReport,
  } = useApp();

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('electricity_fuel');
  const [expenseNote, setExpenseNote] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Quick Reorder Sub-menu state for low stock items
  const [reorderMenuProductId, setReorderMenuProductId] = useState<string | null>(null);
  const [reorderAmount, setReorderAmount] = useState<number>(20);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // Permissions & Read-Only Logic
  const canManageExpenses = currentUser.role === 'owner' || currentUser.permissions.canManageSettings;
  const canDeleteExpenses = currentUser.role === 'owner';
  const isReportsReadOnly = currentUser.role === 'cashier' || !currentUser.permissions.canManageSettings;
  const canRestock = currentUser.role === 'owner' || (currentUser.role !== 'cashier' && currentUser.permissions.canOverrideStock);

  const handleQuickReorder = (productId: string, qty: number) => {
    if (!canRestock) return;
    const success = quickRestockProduct(productId, qty);
    if (success) {
      const prod = products.find((p) => p.id === productId);
      setReorderSuccessMsg(`تمت إعادة طلب وتوريد ${qty} ${prod?.baseUnit || 'وحدة'} بنجاح للصنف: ${prod?.nameAr}`);
      setReorderMenuProductId(null);
      setTimeout(() => {
        setReorderSuccessMsg(null);
      }, 4000);
    }
  };

  // Financial calculations
  const activeInvoices = invoices.filter((i) => i.status === 'completed');

  // 1. Total Sales
  const totalSales = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // 2. Real Cost of Goods Sold (COGS)
  const totalCOGS = activeInvoices.reduce((sum, inv) => sum + (inv.costOfGoodsSold || 0), 0);

  // 3. Gross Profit (المجمل) = Sales - COGS
  const grossProfit = totalSales - totalCOGS;

  // 4. Total Operating Expenses (المصروفات التشغيلية)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 5. Real Net Profit (صافي الربح الحقيقي) = Gross Profit - Operating Expenses
  const realNetProfit = grossProfit - totalExpenses;

  // 6. Outstanding Receivables (الديون المستحقة على العملاء)
  const totalOutstandingCredit = activeInvoices.reduce(
    (sum, inv) => sum + (inv.remainingAmount || 0),
    0
  );

  // Payment Breakdown
  const paymentStats = {
    cash: activeInvoices
      .filter((i) => i.paymentMethod === 'cash')
      .reduce((sum, i) => sum + i.total, 0),
    bankak: activeInvoices
      .filter((i) => i.paymentMethod === 'bankak')
      .reduce((sum, i) => sum + i.total, 0),
    fawry: activeInvoices
      .filter((i) => i.paymentMethod === 'fawry')
      .reduce((sum, i) => sum + i.total, 0),
    credit: activeInvoices
      .filter((i) => i.paymentMethod === 'credit')
      .reduce((sum, i) => sum + i.total, 0),
  };

  // Current month's VAT compliance report
  const currentVatReport = getMonthlyTaxReport(2026, 10);

  // Top selling products
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  activeInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      productSalesMap[item.productName].quantity += item.quantity;
      productSalesMap[item.productName].revenue += item.totalPrice;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Low stock products
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || expenseAmount <= 0) return;

    addExpense({
      title: expenseTitle,
      amount: expenseAmount,
      category: expenseCategory,
      date: new Date().toISOString().split('T')[0],
      notes: expenseNote,
    });

    setExpenseTitle('');
    setExpenseAmount(0);
    setExpenseNote('');
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Prominent High-Visibility Stock Warning Alert Banner & Visual Badges */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/70 border-2 border-rose-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5 animate-pulse shadow-lg shadow-rose-950">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white">
                  تحذير نواقص المخزون: وصول أصناف إلى مستوى أقل من حد الطلب الأدنى!
                </h3>
                <span className="bg-rose-500 text-white font-mono text-xs font-black px-2.5 py-0.5 rounded-full animate-bounce shadow">
                  🚨 {lowStockProducts.length} أصناف حرجة
                </span>
                {lowStockProducts.some((p) => p.currentStock <= 0) && (
                  <span className="bg-rose-950 text-rose-300 border border-rose-700/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ⚠️ يوجد أصناف نفدت بالكامل
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                تنبيه آلي من نظام إدارة المخزون: انخفض رصيد هذه الأصناف عن حد الأمان التشغيلي. يرجى توريدها فوراً لتجنب فقدان عمليات البيع.
              </p>

              {/* Visual Badges for individual low stock items */}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                {lowStockProducts.map((p) => {
                  const isZero = p.currentStock <= 0;
                  return (
                    <div
                      key={p.id}
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold border transition shadow-sm ${
                        isZero
                          ? 'bg-rose-950/90 text-rose-200 border-rose-600/80 ring-1 ring-rose-500/40'
                          : 'bg-amber-950/90 text-amber-200 border-amber-600/70'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isZero ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
                        }`}
                      />
                      <span className="text-white font-extrabold">{p.nameAr}:</span>
                      <span className="font-mono">
                        {isZero ? 'نفد بالكامل (0)' : `متبقي ${p.currentStock} ${p.baseUnit}`}
                      </span>
                      <span className="text-[10px] opacity-75 font-mono">
                        [حد الطلب: {p.minStockAlert}]
                      </span>
                      {canRestock && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickReorder(
                              p.id,
                              p.minStockAlert > 0 ? p.minStockAlert * 2 : 20
                            )
                          }
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer shadow ml-1"
                          title={`توريد فوري +${p.minStockAlert * 2} ${p.baseUnit}`}
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>توريد</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action triggers on banner */}
          <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                const zeroItems = lowStockProducts.filter((p) => p.currentStock <= 0);
                const lowItems = lowStockProducts.filter((p) => p.currentStock > 0);
                let text = '';
                if (zeroItems.length > 0) {
                  text += `تنبيه عاجل: لقد نفد مخزون ${zeroItems
                    .map((p) => p.nameAr)
                    .join(' و ')} بالكامل من المحل! `;
                }
                if (lowItems.length > 0) {
                  text += `وتنبيه: الأصناف ${lowItems
                    .map((p) => p.nameAr)
                    .join(' و ')} انخفضت عن حد الطلب الأدنى.`;
                }
                speakAlert(text, true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow"
              title="قراءة التنبيهات صوتياً"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>إعلان صوتي للنواقص</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>إدارة المخزون والتوريد</span>
            </button>
          </div>
        </div>
      )}

      {/* Educational Banner on Accounting Integrity */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white">
              قواعد الدقة المحاسبية: الفصل التام بين المبيعات وصافي الربح
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              لا يُعتبر إجمالي المبيعات ربحاً للمتجر أبداً. نحسب صافي الربح الحقيقي وفق المعادلة
              المحاسبية المعتمدة:
              <span className="font-mono text-emerald-400 font-bold mx-1">
                [صافي الربح = إجمالي المبيعات - تكلفة البضاعة المباعة (COGS) - المصروفات التشغيلية]
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {canManageExpenses ? (
            <>
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>التقارير البريدية</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>النسخ والجدولة</span>
              </button>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-950/50 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تسجيل مصروف تشغيلي</span>
              </button>
            </>
          ) : (
            <>
              <button
                disabled
                title="معطل: واجهة للقراءة فقط لموظفي المبيعات — إدارة التقارير البريدية متاحة لمدير المتجر فقط"
                className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 text-slate-500 font-bold text-xs px-3 py-2 rounded-xl cursor-not-allowed opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>التقارير البريدية (معطل)</span>
              </button>

              <button
                disabled
                title="معطل: واجهة للقراءة فقط لموظفي المبيعات — النسخ والجدولة متاح لمدير المتجر فقط"
                className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 text-slate-500 font-bold text-xs px-3 py-2 rounded-xl cursor-not-allowed opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>النسخ والجدولة (معطل)</span>
              </button>

              <button
                disabled
                title="معطل: واجهة للقراءة فقط لموظفي المبيعات — لا تملك صلاحية تسجيل أو إضافة مصروفات"
                className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 text-slate-400 font-bold text-xs px-3.5 py-2 rounded-xl cursor-not-allowed opacity-60 shadow-none"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>تسجيل مصروف (معطل - للقراءة فقط)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Read-Only Notice Banner for Reports (Sales Staff) */}
      {isReportsReadOnly && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  لوحة التقارير للقراءة فقط (Read-Only Mode) — موظف مبيعات
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> وضع القراءة فقط
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                أنت مسجل حالياً كـ <span className="font-bold text-white font-mono">{currentUser.name}</span> ({currentUser.role === 'cashier' ? 'كاشير ومبيعات' : 'موظف'}). يُسمح لك بالاطلاع على تحليلات المبيعات ومؤشرات طرق الدفع دون تعديل. <span className="text-amber-300 font-semibold">تم تعطيل أزرار إضافة المصروفات، حذف المصروفات، وإعدادات النسخ الاحتياطي والبريد لعدم توفر صلاحيات التعديل لديك.</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl font-mono">
              الصلاحية: قراءة فقط 📊
            </span>
          </div>
        </div>
      )}

      {/* Visual Stock Reorder Notification System */}
      <div id="stock-reorder-section">
        <StockNotificationCenter mode="dashboard-panel" />
      </div>

      {/* KPI Cards Grid (5-column layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Sales */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">إجمالي المبيعات</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalSales.toLocaleString('ar-SD')} <span className="text-xs text-slate-400 font-normal">ج.س</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>من واقع {activeInvoices.length} فاتورة معتمدة</span>
          </div>
        </div>

        {/* Card 2: COGS (Guarded by RBAC) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">تكلفة البضاعة المباعة (COGS)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          {currentUser.permissions.canViewCOGS ? (
            <div className="text-2xl font-black text-amber-400 font-mono">
              {totalCOGS.toLocaleString('ar-SD')} <span className="text-xs text-slate-400 font-normal">ج.س</span>
            </div>
          ) : (
            <div className="text-sm font-bold text-amber-400/80 flex items-center gap-1.5 py-1">
              <Lock className="w-4 h-4" /> محجوب (صلاحية المدير فقط)
            </div>
          )}
          <div className="text-[11px] text-slate-400">سعر شراء البضاعة المفرغة من الرفوف</div>
        </div>

        {/* Card 3: Operating Expenses */}
        <div
          onClick={() => setActiveTab('expenses')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg hover:border-slate-700 transition cursor-pointer group"
          title="انقر لفتح صفحة المصروفات اليومية وقائمة الأرباح والخسائر P&L"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium group-hover:text-rose-300 transition">
              المصروفات التشغيلية
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {totalExpenses.toLocaleString('ar-SD')} <span className="text-xs text-slate-400 font-normal">ج.س</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>إيجار، وقود، رواتب ({expenses.length} مصروفات)</span>
            <span className="text-[10px] text-rose-400 font-bold group-hover:underline">عرض P&L ←</span>
          </div>
        </div>

        {/* Card 4: Real Net Profit (Guarded by RBAC) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">صافي الربح الفعلي المحقق</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          {currentUser.permissions.canViewProfits ? (
            <div
              className={`text-2xl font-black font-mono ${
                realNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {realNetProfit.toLocaleString('ar-SD')}{' '}
              <span className="text-xs text-slate-400 font-normal">ج.س</span>
            </div>
          ) : (
            <div className="text-sm font-bold text-amber-400/80 flex items-center gap-1.5 py-1">
              <Lock className="w-4 h-4" /> محجوب (صلاحية المدير فقط)
            </div>
          )}
          <div className="text-[11px] text-slate-400">
            {totalSales > 0 && currentUser.permissions.canViewProfits
              ? `هامش صافي: ${((realNetProfit / totalSales) * 100).toFixed(1)}%`
              : 'صافي الربح بعد استقطاع كافة التكاليف'}
          </div>
        </div>

        {/* Card 5: Low Stock Warning Badge Card */}
        <div
          onClick={() => {
            const el = document.getElementById('stock-reorder-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              setActiveTab('inventory');
            }
          }}
          className={`border p-4 rounded-2xl space-y-2 shadow-lg transition cursor-pointer group ${
            lowStockProducts.length > 0
              ? 'bg-gradient-to-b from-slate-900 to-rose-950/40 border-rose-500/50 hover:border-rose-400'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
          title="انقر للاطلاع على تفاصيل نواقص المخزون وإعادة الطلب"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium group-hover:text-rose-300 transition">
              حالة حد الطلب الأدنى
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                lowStockProducts.length > 0
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div
              className={`text-2xl font-black font-mono ${
                lowStockProducts.length > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {lowStockProducts.length}{' '}
              <span className="text-xs text-slate-400 font-normal">أصناف حرجة</span>
            </div>
            {lowStockProducts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse shadow">
                تحذير ⚠️
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              {lowStockProducts.length > 0
                ? `${lowStockProducts.filter((p) => p.currentStock <= 0).length} نفد | ${
                    lowStockProducts.filter((p) => p.currentStock > 0).length
                  } تحت الحد`
                : 'كافة الأصناف فوق حد الطلب'}
            </span>
            <span className="text-[10px] text-rose-400 font-bold group-hover:underline">
              {lowStockProducts.length > 0 ? 'توريد النواقص ←' : 'المخزون آمن'}
            </span>
          </div>
        </div>
      </div>

      {/* VAT Financial & Compliance Quick Widget */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">
                ضريبة القيمة المضافة لشهر {currentVatReport.monthNameAr} {currentVatReport.year} (VAT {vatSettings.taxRate}%)
              </h4>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                مطابق لديوان الضرائب
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
              <span>
                المخرجات المحصلة:{' '}
                <strong className="text-emerald-400 font-bold">
                  {currentVatReport.outputVatTotal.toLocaleString('ar-SD')} ج.س
                </strong>
              </span>
              <span>•</span>
              <span>
                المدخلات المخصومة:{' '}
                <strong className="text-amber-400 font-bold">
                  {currentVatReport.inputVatTotal.toLocaleString('ar-SD')} ج.س
                </strong>
              </span>
              <span>•</span>
              <span>
                صافي الضريبة المستحقة:{' '}
                <strong className="text-white font-extrabold">
                  {currentVatReport.netVatPayable.toLocaleString('ar-SD')} ج.س
                </strong>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('taxes')}
          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/50 cursor-pointer shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>عرض وطباعة الإقرار الضريبي الشهري</span>
        </button>
      </div>

      {/* Interactive Sales & Profit Analytics (Recharts Dashboard) */}
      <SalesAnalyticsCharts />

      {/* Grid: Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Payment Methods Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              توزيع المبيعات حسب طريقة الدفع
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {/* Cash */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">نقداً (كاش)</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {paymentStats.cash.toLocaleString('ar-SD')} ج.س
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${totalSales > 0 ? (paymentStats.cash / totalSales) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Bankak */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">📱 تطبيق بنكك (بنك الخرطوم)</span>
                <span className="font-mono text-blue-400 font-bold">
                  {paymentStats.bankak.toLocaleString('ar-SD')} ج.س
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${totalSales > 0 ? (paymentStats.bankak / totalSales) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Fawry */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">💳 تطبيق فوري (بنك فيصل)</span>
                <span className="font-mono text-purple-400 font-bold">
                  {paymentStats.fawry.toLocaleString('ar-SD')} ج.س
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{
                    width: `${totalSales > 0 ? (paymentStats.fawry / totalSales) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Credit / Receivables */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">⏳ مبيعات آجلة (ديون للعملاء)</span>
                <span className="font-mono text-rose-400 font-bold">
                  {paymentStats.credit.toLocaleString('ar-SD')} ج.س
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{
                    width: `${totalSales > 0 ? (paymentStats.credit / totalSales) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
            <span>إجمالي الديون المعلقة (آجل):</span>
            <span className="font-bold text-rose-400 font-mono">
              {totalOutstandingCredit.toLocaleString('ar-SD')} ج.س
            </span>
          </div>
        </div>

        {/* Top Selling & Low Stock Tabs (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-white">الأصناف الأكثر مبيعاً ونواقص المخزون</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Top Products */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                🔥 الأكثر طلباً ومبيعاً:
              </span>
              <div className="space-y-2">
                {topProducts.map((p, idx) => {
                  const matchingProd = products.find(
                    (item) => item.nameAr === p.name || item.code === p.name
                  );
                  const isLow = matchingProd && matchingProd.currentStock <= matchingProd.minStockAlert;

                  return (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                        {isLow && (
                          <span
                            title={`تنبيه: الصنف بلغ حد إعادة الطلب (${matchingProd.currentStock} ${matchingProd.baseUnit})`}
                            className="inline-flex items-center shrink-0"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          </span>
                        )}
                        <span className="text-slate-300 truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLow && matchingProd && (
                          <button
                            onClick={() => {
                              setReorderMenuProductId(
                                reorderMenuProductId === matchingProd.id ? null : matchingProd.id
                              );
                              setReorderAmount(
                                matchingProd.minStockAlert > 0 ? matchingProd.minStockAlert * 2 : 20
                              );
                            }}
                            className="text-[10px] bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold transition flex items-center gap-0.5 cursor-pointer"
                            title="فتح القائمة الفرعية لإعادة الطلب السريع"
                          >
                            <span>طلب ⚡</span>
                          </button>
                        )}
                        <span className="font-mono font-bold text-slate-200">
                          {p.quantity} قطع
                        </span>
                      </div>
                    </div>
                  );
                })}
                {topProducts.length === 0 && (
                  <span className="text-slate-500 text-[11px]">لا توجد بيانات كافية بعد.</span>
                )}
              </div>
            </div>

            {/* Low Stock Reorder Alert with Visual ShieldAlert and Sub-menu */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>تنبيهات نواقص الرفوف ومستوى إعادة الطلب:</span>
                </span>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-full font-bold">
                  {lowStockProducts.length} أصناف
                </span>
              </div>

              {/* Toast for Quick Reorder Success */}
              {reorderSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] p-2 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="font-medium">{reorderSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {lowStockProducts.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const isMenuOpen = reorderMenuProductId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`border rounded-xl p-2.5 transition ${
                        isOutOfStock
                          ? 'bg-rose-950/20 border-rose-800/60'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Product Name with ShieldAlert icon */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ShieldAlert
                            className={`w-4 h-4 shrink-0 ${
                              isOutOfStock ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="text-slate-200 font-bold text-xs truncate block">
                              {p.nameAr}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              الرصيد: <strong className="text-rose-400 font-bold">{p.currentStock} {p.baseUnit}</strong> (حد الطلب: {p.minStockAlert})
                            </span>
                          </div>
                        </div>

                        {/* Right: Quick Reorder Submenu trigger button & Speech button */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const msg = p.currentStock <= 0
                                ? `تنبيه عاجل: لقد نفد مخزون ${p.nameAr} بالكامل من الرفوف والمخزن! يرجى إعادة الطلب فوراً.`
                                : `تنبيه: صنف ${p.nameAr} متبقي منه ${p.currentStock} ${p.baseUnit} فقط وهو أقل من حد إعادة الطلب.`;
                              speakAlert(msg, true);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition text-[10px]"
                            title="قراءة التنبيه صوتياً"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setReorderMenuProductId(isMenuOpen ? null : p.id);
                              setReorderAmount(p.minStockAlert > 0 ? p.minStockAlert * 2 : 20);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                              isMenuOpen
                                ? 'bg-amber-500 text-slate-950 font-black shadow'
                                : 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40'
                            }`}
                            title="فتح القائمة الفرعية السريعة لإعادة الطلب"
                          >
                            <PackagePlus className="w-3 h-3" />
                            <span>إعادة الطلب</span>
                            {isMenuOpen ? (
                              <ChevronUp className="w-2.5 h-2.5" />
                            ) : (
                              <ChevronDown className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* QUICK REORDER SUB-MENU (القائمة الفرعية السريعة لإعادة الطلب) */}
                      {isMenuOpen && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2 bg-slate-950/95 -mx-2.5 -mb-2.5 p-3 rounded-b-xl animate-in fade-in slide-in-from-top-1 text-right">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-200 font-bold flex items-center gap-1">
                              ⚡ قائمة فرعية لإعادة الطلب الفوري:
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              الوحدة: <span className="font-mono text-emerald-400 font-bold">{p.baseUnit}</span>
                            </span>
                          </div>

                          {/* Permission notice if Read-Only Sales Staff */}
                          {!canRestock && (
                            <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2 text-[10px] text-amber-300 flex items-center gap-1.5 leading-relaxed">
                              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>وضع القراءة فقط: أزرار تأكيد التوريد معطلة لموظفي المبيعات لعدم توفر صلاحية إدارة المخزون.</span>
                            </div>
                          )}

                          {/* Quick Preset Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400">كميات سريعة:</span>
                            {[5, 10, 25, 50].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                disabled={!canRestock}
                                onClick={() => handleQuickReorder(p.id, preset)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition font-mono ${
                                  canRestock
                                    ? 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 cursor-pointer'
                                    : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                                }`}
                                title={canRestock ? `طلب توريد +${preset} ${p.baseUnit} فوراً` : 'معطل لموظفي المبيعات'}
                              >
                                +{preset} {p.baseUnit}
                              </button>
                            ))}
                          </div>

                          {/* Custom Amount Field and Confirm Button */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                              <span className="text-[10px] text-slate-400 ml-1">الكمية:</span>
                              <input
                                type="number"
                                min="1"
                                disabled={!canRestock}
                                value={reorderAmount}
                                onChange={(e) => setReorderAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              disabled={!canRestock}
                              onClick={() => handleQuickReorder(p.id, reorderAmount)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                                canRestock
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{canRestock ? 'تأكيد التوريد' : 'توريد (معطل)'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setReorderMenuProductId(null)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                              title="إغلاق القائمة الفرعية"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {lowStockProducts.length === 0 && (
                  <div className="p-4 text-center text-emerald-400 text-xs flex flex-col items-center gap-1">
                    <CheckCircle2 className="w-6 h-6 opacity-80" />
                    <span className="font-bold">المخزون ممتاز، لا توجد أصناف وصلت لحد إعادة الطلب!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">المصروفات التشغيلية الأخيرة:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('expenses')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                  title="فتح صفحة المصروفات اليومية وقوائم الأرباح والخسائر"
                >
                  صفحة المصروفات وP&L ←
                </button>
                {canManageExpenses ? (
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    + إضافة مصروف
                  </button>
                ) : (
                <button
                  disabled
                  title="معطل: واجهة للقراءة فقط لموظفي المبيعات — لا تملك صلاحية إضافة مصروفات"
                  className="text-xs text-slate-500 cursor-not-allowed opacity-50 flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-amber-500/80" />
                  <span>+ إضافة مصروف (معطل)</span>
                </button>
              )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-slate-950/80 border border-slate-800/80 p-2 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-slate-200 block">{exp.title}</span>
                    <span className="text-[10px] text-slate-500">{exp.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-400">
                      -{exp.amount.toLocaleString('ar-SD')} ج.س
                    </span>
                    {canDeleteExpenses ? (
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        title="حذف المصروف"
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        disabled
                        title="معطل: واجهة للقراءة فقط لموظفي المبيعات — حذف المصروفات متاح للمدير والمالك فقط"
                        className="text-slate-700 cursor-not-allowed opacity-40 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 space-y-4 text-slate-100 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-white">تسجيل مصروف تشغيلي جديد للمحل</h3>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">بيان المصروف:</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="مثال: جازولين للمولد التجاري، كهرباء، إيجار دكان"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">المبلغ (ج.س):</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">التصنيف:</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                >
                  <option value="electricity_fuel">وقود وكهرباء ومولد</option>
                  <option value="rent">إيجار المحل أو المستودع</option>
                  <option value="salaries">أجور وعمالة يومية</option>
                  <option value="supplies">أكياس وتغليف ونثريات</option>
                  <option value="maintenance">صيانة وتشغيل وتجهيزات</option>
                  <option value="transport">ترحيل وشحن بضائع</option>
                  <option value="other">مصروفات أخرى</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ملاحظات (اختياري):</label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!canManageExpenses}
                  className={`px-4 py-2 rounded-xl font-bold transition ${
                    canManageExpenses
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {canManageExpenses ? 'حفظ المصروف' : 'معطل (للقراءة فقط)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Email Notifications Modal */}
      <EmailNotificationsModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
};
