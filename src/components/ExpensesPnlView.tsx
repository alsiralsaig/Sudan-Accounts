import React, { useState, useMemo } from 'react';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building,
  Zap,
  Users,
  Package,
  Wrench,
  Truck,
  FileText,
  PieChart,
  BarChart3,
  ShieldAlert,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  CreditCard,
  Receipt,
  Repeat,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Expense, PaymentMethod, ProfitLossSummary } from '../types';
import {
  CATEGORY_LABELS_AR,
  PAYMENT_METHOD_LABELS_AR,
  calculateProfitLossStatement,
  exportExpensesToCSV,
} from '../services/financialPnlService';

type ActiveSubTab = 'expenses_ledger' | 'pnl_statement' | 'analytics';
type TimeFilterOption = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export const ExpensesPnlView: React.FC = () => {
  const {
    expenses,
    invoices,
    addExpense,
    updateExpense,
    deleteExpense,
    currentUser,
    storeName,
    storePhone,
    storeAddress,
  } = useApp();

  // Navigation tab
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('expenses_ledger');

  // Time & Category Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('this_month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-31');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<Expense['category']>('electricity_fuel');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('cash');
  const [formReceiptNumber, setFormReceiptNumber] = useState<string>('');
  const [formPaidTo, setFormPaidTo] = useState<string>('');
  const [formIsRecurring, setFormIsRecurring] = useState<boolean>(false);
  const [formRecurringInterval, setFormRecurringInterval] = useState<
    'daily' | 'weekly' | 'monthly' | 'one_time'
  >('monthly');
  const [formNotes, setFormNotes] = useState<string>('');

  // Delete Confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Role Permissions
  const canManageExpenses = currentUser.role === 'owner' || currentUser.permissions.canManageSettings;
  const canDeleteExpenses = currentUser.role === 'owner';
  const canViewProfits = currentUser.permissions.canViewProfits;

  // Compute Active Date Range Strings
  const dateRange = useMemo(() => {
    // Reference date: October 10, 2026
    const todayStr = '2026-10-10';
    if (timeFilter === 'today') {
      return { start: todayStr, end: todayStr, label: 'اليوم (10 أكتوبر 2026)' };
    }
    if (timeFilter === 'this_week') {
      return { start: '2026-10-04', end: '2026-10-10', label: 'هذا الأسبوع (4 - 10 أكتوبر 2026)' };
    }
    if (timeFilter === 'this_month') {
      return { start: '2026-10-01', end: '2026-10-31', label: 'شهر أكتوبر 2026' };
    }
    if (timeFilter === 'last_month') {
      return { start: '2026-09-01', end: '2026-09-30', label: 'شهر سبتمبر 2026' };
    }
    if (timeFilter === 'custom') {
      return {
        start: customStartDate || '2026-01-01',
        end: customEndDate || '2026-12-31',
        label: `فترة مخصصة (${customStartDate} إلى ${customEndDate})`,
      };
    }
    // all
    return { start: '2026-01-01', end: '2026-12-31', label: 'كامل الفترة المسجلة (2026)' };
  }, [timeFilter, customStartDate, customEndDate]);

  // Filtered Expenses List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Date filter
      const expDate = exp.date ? exp.date.split(' ')[0] : '';
      if (expDate < dateRange.start || expDate > dateRange.end) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      // Payment Method filter
      if (
        selectedPaymentMethod !== 'all' &&
        (exp.paymentMethod || 'cash') !== selectedPaymentMethod
      ) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = (exp.title || '').toLowerCase().includes(query);
        const matchPaidTo = (exp.paidTo || '').toLowerCase().includes(query);
        const matchReceipt = (exp.receiptNumber || '').toLowerCase().includes(query);
        const matchNotes = (exp.notes || '').toLowerCase().includes(query);
        if (!matchTitle && !matchPaidTo && !matchReceipt && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, dateRange, selectedCategory, selectedPaymentMethod, searchQuery]);

  // Profit and Loss Summary
  const pnlSummary = useMemo<ProfitLossSummary>(() => {
    return calculateProfitLossStatement(
      invoices,
      expenses,
      dateRange.start,
      dateRange.end,
      dateRange.label
    );
  }, [invoices, expenses, dateRange]);

  // Overall Expenses Quick Stats
  const quickStats = useMemo(() => {
    const totalCurrentMonth = expenses
      .filter((e) => (e.date || '').startsWith('2026-10'))
      .reduce((s, e) => s + (e.amount || 0), 0);

    const totalToday = expenses
      .filter((e) => (e.date || '').startsWith('2026-10-10'))
      .reduce((s, e) => s + (e.amount || 0), 0);

    const totalFiltered = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);

    // Highest expense item in filtered
    const highestExpense = filteredExpenses.reduce(
      (max, e) => (e.amount > (max?.amount || 0) ? e : max),
      null as Expense | null
    );

    return {
      totalFiltered,
      totalCurrentMonth,
      totalToday,
      highestExpense,
      count: filteredExpenses.length,
    };
  }, [expenses, filteredExpenses]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingExpenseId(null);
    setFormTitle('');
    setFormAmount(0);
    setFormCategory('electricity_fuel');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('cash');
    setFormReceiptNumber('');
    setFormPaidTo('');
    setFormIsRecurring(false);
    setFormRecurringInterval('monthly');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setFormTitle(exp.title || '');
    setFormAmount(exp.amount || 0);
    setFormCategory(exp.category || 'other');
    setFormDate(exp.date || new Date().toISOString().split('T')[0]);
    setFormPaymentMethod(exp.paymentMethod || 'cash');
    setFormReceiptNumber(exp.receiptNumber || '');
    setFormPaidTo(exp.paidTo || '');
    setFormIsRecurring(!!exp.isRecurring);
    setFormRecurringInterval(exp.recurringInterval || 'monthly');
    setFormNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  // Save Expense (Create or Update)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formAmount <= 0) return;

    if (editingExpenseId) {
      // Update
      const existing = expenses.find((e) => e.id === editingExpenseId);
      if (existing) {
        updateExpense({
          ...existing,
          title: formTitle.trim(),
          amount: formAmount,
          category: formCategory,
          date: formDate,
          paymentMethod: formPaymentMethod,
          receiptNumber: formReceiptNumber.trim() || undefined,
          paidTo: formPaidTo.trim() || undefined,
          isRecurring: formIsRecurring,
          recurringInterval: formIsRecurring ? formRecurringInterval : undefined,
          notes: formNotes.trim() || undefined,
        });
      }
    } else {
      // Add
      addExpense({
        title: formTitle.trim(),
        amount: formAmount,
        category: formCategory,
        date: formDate,
        paymentMethod: formPaymentMethod,
        receiptNumber: formReceiptNumber.trim() || undefined,
        paidTo: formPaidTo.trim() || undefined,
        isRecurring: formIsRecurring,
        recurringInterval: formIsRecurring ? formRecurringInterval : undefined,
        notes: formNotes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  // Print P&L Report
  const handlePrintPnlReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                المصروفات اليومية وقوائم الأرباح والخسائر
              </h1>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                نظام P&L المتكامل
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              تسجيل وتصنيف النفقات التشغيلية للمتجر (إيجار، كهرباء ومولدات، رواتب وعمالة، نثريات
              وتغليف، صيانة) وربطها التلقائي بتكاليف البضاعة المباعة (COGS) لحساب صافي الربح الحقيقي.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
          <button
            onClick={() => exportExpensesToCSV(filteredExpenses)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer shadow-sm"
            title="تصدير كشف المصروفات كملف Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={handlePrintPnlReport}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer shadow-sm"
            title="طباعة قائمة الأرباح والخسائر الرسمية للمتجر"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>طباعة تقرير P&L</span>
          </button>

          {canManageExpenses ? (
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مصروف جديد</span>
            </button>
          ) : (
            <button
              disabled
              title="معطل: لا تملك صلاحية تسجيل أو تعديل المصروفات"
              className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700 text-slate-500 text-xs font-bold px-4 py-2.5 rounded-xl cursor-not-allowed opacity-60"
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>تسجيل مصروف (معطل)</span>
            </button>
          )}
        </div>
      </div>

      {/* Accounting Integrity Principle Callout */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white ml-1">معادلة الأرباح والخسائر المعتمدة:</span>
            <span className="font-mono text-emerald-400 font-bold">
              [صافي الربح الفعلي = إجمالي المبيعات - تكلفة البضاعة المباعة (COGS) - المصروفات
              التشغيلية]
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
          <span>الفترة الحالية:</span>
          <span className="font-bold text-slate-200">{dateRange.label}</span>
        </div>
      </div>

      {/* Primary Navigation SubTabs */}
      <div className="flex items-center border-b border-slate-800 gap-2 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('expenses_ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'expenses_ledger'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>سجل المصروفات اليومية</span>
          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {filteredExpenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('pnl_statement')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'pnl_statement'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>قائمة الأرباح والخسائر (P&L)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              pnlSummary.netProfit >= 0
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {pnlSummary.netProfit >= 0 ? '+' : ''}
            {pnlSummary.netProfit.toLocaleString('ar-SD')} ج.س
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التحليل المالي وتوزيع النفقات</span>
        </button>
      </div>

      {/* Date & Filter Control Bar (Common to subtabs) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Quick Time Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs text-slate-400 ml-1 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              الفترة:
            </span>
            {(
              [
                { id: 'today', label: 'اليوم' },
                { id: 'this_week', label: 'هذا الأسبوع' },
                { id: 'this_month', label: 'شهر أكتوبر (الحالي)' },
                { id: 'last_month', label: 'شهر سبتمبر' },
                { id: 'all', label: 'كامل العام' },
                { id: 'custom', label: 'تاريخ مخصص' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setTimeFilter(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  timeFilter === item.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في البيان، المستلم، أو رقم الإيصال..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Picker (shown when custom is selected) */}
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 flex-wrap text-xs">
            <span className="text-slate-400 font-bold">من تاريخ:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
            />
            <span className="text-slate-400 font-bold">إلى تاريخ:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
            />
          </div>
        )}

        {/* Secondary Category & Payment Method Filters (for ledger) */}
        {activeSubTab === 'expenses_ledger' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 flex-wrap text-xs">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">التصنيف:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">كافة التصنيفات</option>
                <option value="rent">إيجار المحل والمستودع</option>
                <option value="electricity_fuel">وقود المولد والكهرباء</option>
                <option value="salaries">رواتب وأجور العمالة</option>
                <option value="supplies">نثريات وتغليف وأكياس</option>
                <option value="maintenance">صيانة وتشغيل وتجهيزات</option>
                <option value="transport">ترحيل وشحن بضائع</option>
                <option value="other">مصروفات أخرى</option>
              </select>
            </div>

            {/* Payment Method Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">طريقة الدفع:</span>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">كافة الطرق</option>
                <option value="cash">نقداً (كاش من الدرج)</option>
                <option value="bankak">تحويل بنكك (بنك الخرطوم)</option>
                <option value="fawry">تطبيق فوري (بنك فيصل)</option>
                <option value="credit">آجل / عهدة ذمة</option>
              </select>
            </div>

            {(selectedCategory !== 'all' || selectedPaymentMethod !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedPaymentMethod('all');
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Expenses in Period */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>مصروفات الفترة المحددة</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {pnlSummary.totalExpenses.toLocaleString('ar-SD')}{' '}
            <span className="text-xs text-slate-400">ج.س</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{pnlSummary.expensesCount} سند مصروف</span>
            <span>بند مسجل</span>
          </div>
        </div>

        {/* Total Sales in Period */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>إجمالي المبيعات (الفترة)</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-sky-400">
            {pnlSummary.totalSales.toLocaleString('ar-SD')}{' '}
            <span className="text-xs text-slate-400">ج.س</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{pnlSummary.invoicesCount} فاتورة بيع</span>
            <span>تكلفة: {pnlSummary.totalCOGS.toLocaleString('ar-SD')} ج.س</span>
          </div>
        </div>

        {/* Gross Profit (Commercial Profit) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>إجمالي الربح التجاري (Gross)</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-400">
            {pnlSummary.grossProfit.toLocaleString('ar-SD')}{' '}
            <span className="text-xs text-slate-400">ج.س</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>هامش إجمالي:</span>
            <span className="font-mono text-indigo-300 font-bold">
              {pnlSummary.grossProfitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Net Real Profit (True Net Profit after all OPEX) */}
        <div
          className={`border rounded-2xl p-4 shadow-sm relative overflow-hidden ${
            pnlSummary.netProfit >= 0
              ? 'bg-gradient-to-b from-slate-900 to-emerald-950/40 border-emerald-800/60'
              : 'bg-gradient-to-b from-slate-900 to-rose-950/40 border-rose-800/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 font-bold">صافي الربح الفعلي (Net P&L)</span>
            <div
              className={`p-1.5 rounded-lg ${
                pnlSummary.netProfit >= 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              pnlSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {pnlSummary.netProfit >= 0 ? '+' : ''}
            {pnlSummary.netProfit.toLocaleString('ar-SD')}{' '}
            <span className="text-xs text-slate-400">ج.س</span>
          </div>
          <div className="text-[11px] mt-1 flex items-center justify-between">
            <span className="text-slate-400">هامش صافي نهائي:</span>
            <span
              className={`font-mono font-bold ${
                pnlSummary.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {pnlSummary.netProfitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* SUB-TAB 1: DAILY EXPENSES LEDGER (جدول وسجل المصروفات اليومية) */}
      {/* =============================================================== */}
      {activeSubTab === 'expenses_ledger' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/40">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>كشف المصروفات والمدفوعات اليومية</span>
                <span className="text-xs font-mono text-slate-400">
                  ({filteredExpenses.length} مصروف)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل مفصل لكل عملية صرف نقدية أو بنكية، موضحاً البيان، المستلم، والجهة المسؤولة.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">إجمالي المبالغ المعروضة:</span>
              <span className="font-mono text-rose-400 font-extrabold text-sm">
                {quickStats.totalFiltered.toLocaleString('ar-SD')} ج.س
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">بيان المصروف</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                  <th className="py-3 px-4">المدفوع له / السند</th>
                  <th className="py-3 px-4">المسجل بواسطة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredExpenses.map((exp) => {
                  const catMeta = CATEGORY_LABELS_AR[exp.category] || CATEGORY_LABELS_AR.other;
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-800/40 transition duration-150 group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{exp.date}</span>
                        </div>
                      </td>

                      {/* Title & Notes */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {exp.notes}
                          </div>
                        )}
                        {exp.isRecurring && (
                          <div className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded mt-1">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>دوري متكرر ({exp.recurringInterval === 'monthly' ? 'شهري' : exp.recurringInterval === 'weekly' ? 'أسبوعي' : 'يومي'})</span>
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${catMeta.bgBadge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${catMeta.iconColor} bg-current`}></span>
                          {catMeta.label}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-extrabold text-rose-400">
                          -{exp.amount.toLocaleString('ar-SD')}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500">ج.س</span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 w-fit">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {PAYMENT_METHOD_LABELS_AR[exp.paymentMethod || 'cash'] || 'نقداً كاش'}
                        </span>
                      </td>

                      {/* Paid To & Receipt */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-300 text-xs font-medium">
                          {exp.paidTo || 'غير محدد'}
                        </div>
                        {exp.receiptNumber && (
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            سند #{exp.receiptNumber}
                          </div>
                        )}
                      </td>

                      {/* Created By */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-xs">
                        {exp.createdBy || 'المسؤول'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canManageExpenses ? (
                            <button
                              onClick={() => handleOpenEditModal(exp)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                              title="تعديل بيانات المصروف"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 rounded-lg bg-slate-900 text-slate-600 cursor-not-allowed opacity-40"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDeleteExpenses ? (
                            <button
                              onClick={() => setExpenseToDelete(exp)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="حذف هذا المصروف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title="حذف المصروف متاح لصاحب المتجر فقط"
                              className="p-1.5 rounded-lg bg-slate-900 text-slate-600 cursor-not-allowed opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Wallet className="w-10 h-10 text-slate-600 opacity-60" />
                        <span className="font-bold text-sm text-slate-300">
                          لا توجد مصروفات مسجلة تطابق هذه المعايير
                        </span>
                        <span className="text-xs text-slate-500">
                          جرب تغيير الفلاتر الزمنية أو أضف مصروفاً جديداً الآن.
                        </span>
                        {canManageExpenses && (
                          <button
                            onClick={handleOpenAddModal}
                            className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer transition shadow"
                          >
                            + إضافة مصروف جديد
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* SUB-TAB 2: PROFIT & LOSS STATEMENT (قائمة الأرباح والخسائر الرسمية) */}
      {/* =============================================================== */}
      {activeSubTab === 'pnl_statement' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>قائمة الدخل والأرباح والخسائر المعتمدة (P&L Income Statement)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تقرير مالي محاسبي رسمي يربط بدقة بين الإيرادات، تكلفة البضاعة المباعة (COGS)،
                والمصروفات التشغيلية.
              </p>
            </div>

            <button
              onClick={handlePrintPnlReport}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة القائمة المالية (A4)</span>
            </button>
          </div>

          {/* Printable Container (#printable-pnl-report) */}
          <div
            id="printable-pnl-report"
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100"
          >
            {/* Header for print / screen */}
            <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-extrabold mb-1">
                  نظام إدارة المحاسبة والمخازن — جمهورية السودان
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">{storeName}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {storeAddress} | هاتف: {storePhone}
                </p>
              </div>

              <div className="text-left sm:text-right bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0">
                <div className="text-xs font-bold text-slate-400">بيانات التقرير المالي:</div>
                <div className="text-xs text-white font-bold mt-1">
                  الفترة: <span className="font-mono text-emerald-400">{pnlSummary.periodLabel}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  من: {pnlSummary.startDate} إلى: {pnlSummary.endDate}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  تاريخ الطباعة: {new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>

            {/* P&L Financial Waterfall Breakdown */}
            <div className="space-y-4">
              {/* 1. REVENUE (الإيرادات والمبيعات) */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <span>إجمالي المبيعات والإيرادات التجارية (Gross Sales Revenue)</span>
                  </span>
                  <span className="font-mono text-base font-black text-sky-400">
                    +{pnlSummary.totalSales.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
                <div className="text-xs text-slate-400 pt-2 flex items-center justify-between">
                  <span>عدد فواتير البيع المكتملة المسددة:</span>
                  <span className="font-mono font-bold text-slate-300">
                    {pnlSummary.invoicesCount} فاتورة
                  </span>
                </div>
              </div>

              {/* 2. COST OF GOODS SOLD (تكلفة البضاعة المباعة) */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <span>تكلفة البضاعة المباعة (Cost of Goods Sold - COGS)</span>
                  </span>
                  <span className="font-mono text-base font-black text-amber-400">
                    -{pnlSummary.totalCOGS.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
                <div className="text-xs text-slate-400 pt-2 flex items-center justify-between">
                  <span>التكلفة الفعلية للأصناف والمواد المسحوبة من المخزن:</span>
                  <span className="font-mono text-slate-300">
                    {pnlSummary.totalSales > 0
                      ? `${((pnlSummary.totalCOGS / pnlSummary.totalSales) * 100).toFixed(1)}% من المبيعات`
                      : '0%'}
                  </span>
                </div>
              </div>

              {/* 3. GROSS PROFIT (إجمالي الربح التجاري) */}
              <div className="bg-indigo-950/30 border border-indigo-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between font-extrabold text-base text-white">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-black">
                      =
                    </span>
                    <span>إجمالي الربح التجاري (Gross Profit)</span>
                  </span>
                  <span className="font-mono text-lg font-black text-indigo-300">
                    {pnlSummary.grossProfit.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
                <div className="text-xs text-indigo-200/80 pt-2 flex items-center justify-between">
                  <span>هامش الربح الإجمالي (المبيعات - تكلفة الشراء):</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {pnlSummary.grossProfitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 4. OPERATING EXPENSES (المصروفات التشغيلية المفصلة) */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-black">
                      3
                    </span>
                    <span>المصروفات التشغيلية والنفقات العامة (Operating Expenses - OPEX)</span>
                  </span>
                  <span className="font-mono text-base font-black text-rose-400">
                    -{pnlSummary.totalExpenses.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>

                {/* Sub-item categories table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                  {Object.entries(pnlSummary.expensesByCategory).map(([catKey, amount]) => {
                    const cat = CATEGORY_LABELS_AR[catKey] || CATEGORY_LABELS_AR.other;
                    const percentOfTotalExpenses =
                      pnlSummary.totalExpenses > 0
                        ? ((amount / pnlSummary.totalExpenses) * 100).toFixed(1)
                        : '0';
                    return (
                      <div
                        key={catKey}
                        className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cat.iconColor} bg-current`}></span>
                          <span className="text-slate-300 font-medium">{cat.label}:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-400">
                            {amount.toLocaleString('ar-SD')} ج.س
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({percentOfTotalExpenses}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. NET REAL PROFIT (صافي الربح الفعلي الحقيقي) */}
              <div
                className={`rounded-2xl p-5 border-2 ${
                  pnlSummary.netProfit >= 0
                    ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/80 border-emerald-500/80'
                    : 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-rose-950/80 border-rose-500/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-extrabold block">
                      النتيجة المحاسبية النهائية لقائمة الدخل:
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                      صافي الربح الفعلي بعد خصم كافة المصروفات (Net Profit)
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <div
                      className={`text-2xl sm:text-3xl font-black font-mono ${
                        pnlSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {pnlSummary.netProfit >= 0 ? '+' : ''}
                      {pnlSummary.netProfit.toLocaleString('ar-SD')}{' '}
                      <span className="text-sm font-normal text-slate-300">ج.س</span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      هامش صافي الربح:{' '}
                      <strong
                        className={pnlSummary.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}
                      >
                        {pnlSummary.netProfitMargin.toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      pnlSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  />
                  <span>
                    {pnlSummary.netProfit >= 0
                      ? `يحقق المتجر أرباحاً صافية إيجابية بنسبة هامش ${pnlSummary.netProfitMargin.toFixed(
                          1
                        )}% بعد استيفاء جميع النفقات التشغيلية وشراء البضاعة.`
                      : 'تتجاوز المصروفات التشغيلية وتكاليف البضاعة إجمالي الإيرادات، مما يشير إلى عجز مالي خلال هذه الفترة يستوجب ضبط النفقات.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Signatures & Seal Section (for A4 print) */}
            <div className="pt-8 border-t border-slate-800 grid grid-cols-3 gap-6 text-center text-xs text-slate-400">
              <div className="space-y-8">
                <div className="font-bold text-slate-200">المحاسب المسؤول</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {currentUser.name} ({currentUser.role === 'owner' ? 'المالك' : 'المدير'})
                </div>
              </div>

              <div className="space-y-8">
                <div className="font-bold text-slate-200">ختم المتجر المعتمد</div>
                <div className="w-20 h-20 mx-auto rounded-full border border-dashed border-slate-700 flex items-center justify-center text-[10px] text-slate-600">
                  (مكان الختم)
                </div>
              </div>

              <div className="space-y-8">
                <div className="font-bold text-slate-200">اعتماد إدارة المتجر</div>
                <div className="text-[11px] text-slate-500">التوقيع والتاريخ: _________________</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* SUB-TAB 3: FINANCIAL ANALYTICS & BREAKDOWN (التحليل المالي) */}
      {/* =============================================================== */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Category Distribution Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  <span>توزيع المصروفات حسب التصنيف</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {pnlSummary.totalExpenses.toLocaleString('ar-SD')} ج.س
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(pnlSummary.expensesByCategory).map(([catKey, amount]) => {
                  const cat = CATEGORY_LABELS_AR[catKey] || CATEGORY_LABELS_AR.other;
                  const ratio =
                    pnlSummary.totalExpenses > 0
                      ? (amount / pnlSummary.totalExpenses) * 100
                      : 0;

                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${cat.iconColor} bg-current`}></span>
                          {cat.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">
                            {amount.toLocaleString('ar-SD')} ج.س
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            ({ratio.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Payment Method Distribution Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span>توزيع المصروفات عبر وسائل الدفع</span>
                </h3>
                <span className="text-xs text-slate-400">تحليل السيولة والخزينة</span>
              </div>

              <div className="space-y-3">
                {Object.entries(pnlSummary.expensesByPaymentMethod).map(([methodKey, amount]) => {
                  const label = PAYMENT_METHOD_LABELS_AR[methodKey] || methodKey;
                  const ratio =
                    pnlSummary.totalExpenses > 0
                      ? (amount / pnlSummary.totalExpenses) * 100
                      : 0;

                  return (
                    <div key={methodKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">
                            {amount.toLocaleString('ar-SD')} ج.س
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            ({ratio.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            methodKey === 'cash'
                              ? 'bg-amber-500'
                              : methodKey === 'bankak'
                              ? 'bg-rose-500'
                              : methodKey === 'fawry'
                              ? 'bg-sky-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Financial Tip Box */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                <div className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>توجيه مالي لتجار السودان:</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  دفع المصروفات التشغيلية نقداً من الدرج يؤثر مباشرة على الرصيد الفعلي في الخزينة
                  اليومية. تأكد دائماً من مطابقة مبالغ سندات الصرف مع المتبقي في الدرج لتفادي أي
                  عجز في المطابقة المسائية.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL: ADD / EDIT EXPENSE (تسجيل وتعديل المصروف) */}
      {/* =============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 sm:p-6 space-y-4 text-slate-100 text-xs shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {editingExpenseId ? 'تعديل سند مصروف تشغيلي' : 'تسجيل مصروف تشغيلي جديد'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    أدخل تفاصيل المصروف للربط الفوري بحسابات الأرباح والخسائر
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              {/* Title / Description */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  بيان المصروف <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: إيجار دكان السوق، جازولين للمولد، راتب عامل تفريغ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    المبلغ بالجنيه (ج.س) <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    التصنيف المالي <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="electricity_fuel">وقود المولد والكهرباء</option>
                    <option value="rent">إيجار المحل أو المستودع</option>
                    <option value="salaries">رواتب وأجور العمالة</option>
                    <option value="supplies">نثريات وتغليف وأكياس</option>
                    <option value="maintenance">صيانة وتشغيل وتجهيزات</option>
                    <option value="transport">ترحيل وشحن بضائع</option>
                    <option value="other">مصروفات تشغيلية أخرى</option>
                  </select>
                </div>
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">تاريخ المصروف:</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">طريقة الدفع:</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="cash">نقداً (كاش من الدرج)</option>
                    <option value="bankak">تحويل تطبيق بنكك</option>
                    <option value="fawry">تطبيق فوري</option>
                    <option value="credit">آجل / عهدة ذمة</option>
                  </select>
                </div>
              </div>

              {/* Paid To & Receipt Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">المدفوع له (المستلم):</label>
                  <input
                    type="text"
                    value={formPaidTo}
                    onChange={(e) => setFormPaidTo(e.target.value)}
                    placeholder="مثال: صاحب العقار، محطة الوقود، اسم الموظف"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">رقم الإيصال / السند الورقي:</label>
                  <input
                    type="text"
                    value={formReceiptNumber}
                    onChange={(e) => setFormReceiptNumber(e.target.value)}
                    placeholder="رقم الفاتورة أو الإشعار إن وجد"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Recurring Switch */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span className="text-slate-300 font-bold">مصروف دوري متكرر (إيجار، رواتب...)</span>
                </label>

                {formIsRecurring && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-400">تكرار كل:</span>
                    <select
                      value={formRecurringInterval}
                      onChange={(e) => setFormRecurringInterval(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-1 text-white text-xs outline-none"
                    >
                      <option value="monthly">شهر (شهرياً)</option>
                      <option value="weekly">أسبوع (أسبوعياً)</option>
                      <option value="daily">يوم (يومياً)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-400 block mb-1">ملاحظات إضافية (اختياري):</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="أي تفاصيل أو شروط خاصة بعملية الصرف..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!canManageExpenses}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-950/60 cursor-pointer"
                >
                  {editingExpenseId ? 'حفظ التعديلات' : 'تسجيل المصروف في الحسابات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL: DELETE CONFIRMATION (تأكيد الحذف) */}
      {/* =============================================================== */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 space-y-4 text-slate-100 text-xs shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">تأكيد حذف المصروف</h3>
            </div>

            <p className="text-slate-300 leading-relaxed">
              هل أنت متأكد من حذف سند المصروف:
              <br />
              <strong className="text-white font-bold block mt-1">
                "{expenseToDelete.title}" بقيمة {expenseToDelete.amount.toLocaleString('ar-SD')} ج.س
              </strong>
              سيتم تعديل تقارير الأرباح والخسائر وحسابات المتجر فوراً.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
