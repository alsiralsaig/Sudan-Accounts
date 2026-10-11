import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Percent,
  TrendingUp,
  Receipt,
  DollarSign,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings,
  CreditCard,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Search,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Stamp,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARABIC_MONTH_NAMES,
  calculateVatBreakdown,
  parseYearMonth,
} from '../services/vatCalculationService';
import { Expense } from '../types';

export const FinancialTaxReportsView: React.FC = () => {
  const {
    invoices,
    expenses,
    vatSettings,
    updateVatSettings,
    getMonthlyTaxReport,
    availableTaxPeriods,
    exportTaxReportCSV,
    storeName,
    storePhone,
    storeAddress,
    currentUser,
  } = useApp();

  // Selected period state
  const defaultPeriod =
    availableTaxPeriods.length > 0
      ? availableTaxPeriods[0]
      : {
          periodKey: '2026-10',
          year: 2026,
          month: 10,
          labelAr: 'أكتوبر 2026',
          invoicesCount: 0,
        };

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>(
    defaultPeriod.periodKey
  );

  // Active view tab: overview, declaration, ledger, settings
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'declaration' | 'ledger' | 'settings'
  >('declaration');

  // Search and filter inside ledger
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPaymentFilter, setLedgerPaymentFilter] = useState('all');

  // VAT Simulator interactive tool state
  const [simulatorAmount, setSimulatorAmount] = useState<number>(100000);
  const [simulatorMode, setSimulatorMode] = useState<'inclusive' | 'exclusive'>(
    'inclusive'
  );

  // Parse currently selected year and month
  const [selYear, selMonth] = selectedPeriodKey.split('-').map(Number);
  const currentReport = getMonthlyTaxReport(selYear, selMonth);

  // Period Invoices & Expenses
  const periodInvoices = invoices.filter((inv) => {
    if (inv.status !== 'completed') return false;
    const ym = parseYearMonth(inv.date);
    return ym && ym.year === selYear && ym.month === selMonth;
  });

  const periodExpenses = expenses.filter((exp) => {
    const ym = parseYearMonth(exp.date);
    return ym && ym.year === selYear && ym.month === selMonth;
  });

  // Filtered invoices for the ledger table
  const filteredInvoices = periodInvoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (inv.customerName &&
        inv.customerName.toLowerCase().includes(ledgerSearch.toLowerCase())) ||
      (inv.cashierName &&
        inv.cashierName.toLowerCase().includes(ledgerSearch.toLowerCase()));

    const matchesPayment =
      ledgerPaymentFilter === 'all' || inv.paymentMethod === ledgerPaymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Print tax report handler
  const handlePrintReport = () => {
    window.print();
  };

  // Export CSV handler
  const handleExportCSV = () => {
    exportTaxReportCSV(currentReport);
  };

  // Simulator calculations
  const simBreakdown = calculateVatBreakdown(
    simulatorAmount || 0,
    vatSettings.taxRate,
    simulatorMode === 'inclusive'
  );

  // Local settings form state
  const [formTIN, setFormTIN] = useState(vatSettings.taxIdentificationNumber);
  const [formLegalName, setFormLegalName] = useState(vatSettings.businessLegalName);
  const [formCR, setFormCR] = useState(vatSettings.commercialRegistrationNumber);
  const [formTaxOffice, setFormTaxOffice] = useState(vatSettings.taxOfficeName);
  const [formTaxRate, setFormTaxRate] = useState(vatSettings.taxRate);
  const [formIsInclusive, setFormIsInclusive] = useState(
    vatSettings.isPricesTaxInclusive
  );
  const [formDeductibleCats, setFormDeductibleCats] = useState(
    vatSettings.deductibleExpenseCategories
  );
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(
    null
  );

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateVatSettings({
      taxIdentificationNumber: formTIN,
      businessLegalName: formLegalName,
      commercialRegistrationNumber: formCR,
      taxOfficeName: formTaxOffice,
      taxRate: Number(formTaxRate),
      isPricesTaxInclusive: formIsInclusive,
      deductibleExpenseCategories: formDeductibleCats,
    });
    setSettingsSavedMessage('تم حفظ وتحديث إعدادات الملف الضريبي بنجاح!');
    setTimeout(() => setSettingsSavedMessage(null), 3500);
  };

  const toggleCategory = (cat: Expense['category']) => {
    if (formDeductibleCats.includes(cat)) {
      setFormDeductibleCats(formDeductibleCats.filter((c) => c !== cat));
    } else {
      setFormDeductibleCats([...formDeductibleCats, cat]);
    }
  };

  // Legal declaration filing deadline (20th of following month)
  const nextMonth = selMonth === 12 ? 1 : selMonth + 1;
  const nextYear = selMonth === 12 ? selYear + 1 : selYear;
  const filingDeadlineStr = `20 ${ARABIC_MONTH_NAMES[nextMonth]} ${nextYear}`;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Screen Header (Hidden in Print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  التقارير المالية وضريبة القيمة المضافة (VAT)
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Percent className="w-3 h-3" /> نسبة {vatSettings.taxRate}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                حساب الضرائب المستحقة، الإقرارات الشهرية المعتمدة، وسجلات الفواتير والمصروفات المؤهلة للخصم 🇸🇩
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium">الفترة الضريبية:</span>
            <select
              value={selectedPeriodKey}
              onChange={(e) => setSelectedPeriodKey(e.target.value)}
              className="bg-transparent text-emerald-300 font-bold text-xs outline-none cursor-pointer"
            >
              {availableTaxPeriods.map((p) => (
                <option key={p.periodKey} value={p.periodKey} className="bg-slate-900 text-slate-100">
                  {p.labelAr} ({p.invoicesCount} فواتير)
                </option>
              ))}
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-lg shadow-emerald-900/40 cursor-pointer"
            title="طباعة الإقرار الضريبي الرسمي A4"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإقرار الضريبي</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-3 py-2 rounded-xl transition cursor-pointer"
            title="تصدير بيانات الضريبة إلى ملف Excel / CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Hidden in Print) */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Taxable Sales Base */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              إجمالي مبيعات الشهر
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl font-extrabold text-white">
              {currentReport.grossSalesTotal.toLocaleString('ar-SD')}{' '}
              <span className="text-xs font-normal text-slate-400">ج.س</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>وعاء الضريبة:</span>
              <span className="text-slate-300 font-semibold">
                {currentReport.taxableSalesBase.toLocaleString('ar-SD')} ج.س
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>عدد الفواتير الصادرة:</span>
            <span className="text-blue-300 font-bold">
              {currentReport.totalInvoicesCount} فاتورة
            </span>
          </div>
        </div>

        {/* 2. Output VAT Collected */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              ضريبة المبيعات (المخرجات)
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl font-extrabold text-emerald-400">
              {currentReport.outputVatTotal.toLocaleString('ar-SD')}{' '}
              <span className="text-xs font-normal text-slate-400">ج.س</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>نسبة الضريبة:</span>
              <span className="text-emerald-300 font-semibold">
                {vatSettings.taxRate}%{' '}
                {vatSettings.isPricesTaxInclusive ? '(شاملة بالأسعار)' : '(مضافة)'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>المحصل من العملاء:</span>
            <span className="text-emerald-400 font-bold">100% موثقة</span>
          </div>
        </div>

        {/* 3. Deductible Input VAT */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              ضريبة المدخلات (المخصومة)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl font-extrabold text-amber-400">
              {currentReport.inputVatTotal.toLocaleString('ar-SD')}{' '}
              <span className="text-xs font-normal text-slate-400">ج.س</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>المصروفات المؤهلة:</span>
              <span className="text-slate-300 font-semibold">
                {currentReport.deductibleExpensesBase.toLocaleString('ar-SD')} ج.س
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>عدد سندات الصرف:</span>
            <span className="text-amber-300 font-bold">
              {currentReport.totalExpensesCount} سند
            </span>
          </div>
        </div>

        {/* 4. Net VAT Payable / Due */}
        <div
          className={`p-4 rounded-xl flex flex-col justify-between border ${
            currentReport.isRefundCredit
              ? 'bg-cyan-950/30 border-cyan-500/30'
              : 'bg-emerald-950/30 border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">
              {currentReport.isRefundCredit
                ? 'رصيد ضريبي دائن مرحّل'
                : 'صافي الضريبة واجبة السداد'}
            </span>
            <div
              className={`p-2 rounded-lg ${
                currentReport.isRefundCredit
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div
              className={`text-xl font-black ${
                currentReport.isRefundCredit ? 'text-cyan-400' : 'text-emerald-400'
              }`}
            >
              {currentReport.netVatPayable.toLocaleString('ar-SD')}{' '}
              <span className="text-xs font-normal text-slate-300">ج.س</span>
            </div>
            <div className="text-xs text-slate-300 flex items-center justify-between">
              <span>آخر موعد للسداد:</span>
              <span className="text-white font-semibold">
                {filingDeadlineStr}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-between">
            <span>الحالة القانونية:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> جاهز للتقديم
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar (Hidden in Print) */}
      <div className="no-print flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('declaration')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'declaration'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>الإقرار الضريبي الشهري المعتمد (نموذج 102)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>لوحة التحليل المالي والوسائل</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'ledger'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>سجل الفواتير والمصروفات ({periodInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>الملف القانوني ونسبة الضريبة</span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: OFFICIAL MONTHLY TAX DECLARATION FORM (نموذج الإقرار)
          This container is dual-rendered: on-screen as a realistic sheet,
          and in print as #printable-tax-report.
         ======================================================== */}
      {activeSubTab === 'declaration' && (
        <div className="space-y-4">
          {/* Quick Notice Header */}
          <div className="no-print bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                هذا النموذج مطابق لمواصفات <strong>الإقرار الضريبي لضريبة القيمة المضافة</strong> المعتمد رسمياً لدى ديوان الضرائب السوداني.
              </span>
            </div>
            <button
              onClick={handlePrintReport}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة المستند الورقي A4</span>
            </button>
          </div>

          {/* Printable Official Tax Report Sheet */}
          <div
            id="printable-tax-report"
            className="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl p-6 sm:p-10 font-sans space-y-6"
            dir="rtl"
          >
            {/* Header: Emblem & State Details */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-right space-y-0.5">
                <h2 className="text-base font-extrabold text-slate-900">
                  جمهورية السودان
                </h2>
                <h3 className="text-sm font-bold text-slate-700">
                  وزارة المالية والتخطيط الاقتصادي
                </h3>
                <h4 className="text-xs font-semibold text-slate-600">
                  ديوان الضرائب - {vatSettings.taxOfficeName}
                </h4>
              </div>

              <div className="text-center px-4 py-2 border-2 border-slate-900 rounded-lg bg-slate-50">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  نموذج إقرار رسمي (102-ق)
                </span>
                <h1 className="text-lg font-black text-slate-900">
                  إقرار ضريبة القيمة المضافة الشهري
                </h1>
                <span className="inline-block mt-0.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  فترة شهر: {currentReport.monthNameAr} {currentReport.year} م
                </span>
              </div>

              <div className="text-left text-xs text-slate-600 space-y-1">
                <div>
                  <span className="font-bold text-slate-800">تاريخ الإصدار: </span>
                  <span>{new Date().toLocaleDateString('ar-SD')}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">الرقم المرجعي: </span>
                  <span className="font-mono font-bold text-slate-900">
                    VAT-{currentReport.periodKey}-{vatSettings.taxIdentificationNumber.slice(-4)}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">الموعد الأقصى: </span>
                  <span className="font-bold text-red-600">{filingDeadlineStr}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Taxpayer Profile Information */}
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/70 text-xs">
              <h5 className="font-black text-slate-900 text-xs border-b border-slate-300 pb-1 mb-2">
                أولاً: بيانات المكلف والمنشأة المسجلة ضريبياً
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block">الاسم القانوني للمنشأة:</span>
                  <span className="font-bold text-slate-900">
                    {vatSettings.businessLegalName || storeName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">الرقم التعريفي الضريبي (TIN):</span>
                  <span className="font-mono font-black text-slate-900 tracking-wider">
                    {vatSettings.taxIdentificationNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">رقم السجل التجاري:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {vatSettings.commercialRegistrationNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">العنوان والموقع:</span>
                  <span className="font-medium text-slate-900">{storeAddress}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Sales & Output VAT Table (ضريبة المخرجات) */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1">
                <h5 className="font-black text-slate-900 text-xs">
                  ثانياً: جدول المبيعات وضريبة القيمة المضافة المحصلة (ضريبة المخرجات)
                </h5>
                <span className="text-[11px] font-bold text-slate-600">
                  النسبة المعيارية: {vatSettings.taxRate}%
                </span>
              </div>
              <table className="w-full text-right border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <th className="border border-slate-300 p-2">البند / التصنيف</th>
                    <th className="border border-slate-300 p-2 text-center">عدد العمليات</th>
                    <th className="border border-slate-300 p-2">وعاء القيمة الخاضع (ج.س)</th>
                    <th className="border border-slate-300 p-2 text-center">النسبة %</th>
                    <th className="border border-slate-300 p-2 text-left">ضريبة المخرجات (ج.س)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold">
                      مبيعات نقدية (نقداً)
                    </td>
                    <td className="border border-slate-300 p-2 text-center">
                      {periodInvoices.filter((i) => i.paymentMethod === 'cash').length}
                    </td>
                    <td className="border border-slate-300 p-2">
                      {currentReport.paymentBreakdown.cash.sales.toLocaleString('ar-SD')}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">{vatSettings.taxRate}%</td>
                    <td className="border border-slate-300 p-2 text-left font-bold text-slate-900">
                      {currentReport.paymentBreakdown.cash.vat.toLocaleString('ar-SD')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold">
                      مبيعات إلكترونية (تطبيق بنكك - بنك الخرطوم)
                    </td>
                    <td className="border border-slate-300 p-2 text-center">
                      {periodInvoices.filter((i) => i.paymentMethod === 'bankak').length}
                    </td>
                    <td className="border border-slate-300 p-2">
                      {currentReport.paymentBreakdown.bankak.sales.toLocaleString('ar-SD')}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">{vatSettings.taxRate}%</td>
                    <td className="border border-slate-300 p-2 text-left font-bold text-slate-900">
                      {currentReport.paymentBreakdown.bankak.vat.toLocaleString('ar-SD')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold">
                      مبيعات إلكترونية (تطبيق فوري - بنك فيصل)
                    </td>
                    <td className="border border-slate-300 p-2 text-center">
                      {periodInvoices.filter((i) => i.paymentMethod === 'fawry').length}
                    </td>
                    <td className="border border-slate-300 p-2">
                      {currentReport.paymentBreakdown.fawry.sales.toLocaleString('ar-SD')}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">{vatSettings.taxRate}%</td>
                    <td className="border border-slate-300 p-2 text-left font-bold text-slate-900">
                      {currentReport.paymentBreakdown.fawry.vat.toLocaleString('ar-SD')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold">
                      مبيعات آجلة معتمدة
                    </td>
                    <td className="border border-slate-300 p-2 text-center">
                      {periodInvoices.filter((i) => i.paymentMethod === 'credit').length}
                    </td>
                    <td className="border border-slate-300 p-2">
                      {currentReport.paymentBreakdown.credit.sales.toLocaleString('ar-SD')}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">{vatSettings.taxRate}%</td>
                    <td className="border border-slate-300 p-2 text-left font-bold text-slate-900">
                      {currentReport.paymentBreakdown.credit.vat.toLocaleString('ar-SD')}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-black text-slate-900">
                    <td className="border border-slate-300 p-2" colSpan={2}>
                      إجمالي المبيعات وضريبة المخرجات المحصلة (أ)
                    </td>
                    <td className="border border-slate-300 p-2 font-black">
                      {currentReport.taxableSalesBase.toLocaleString('ar-SD')}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">متوسط</td>
                    <td className="border border-slate-300 p-2 text-left text-sm text-emerald-800">
                      {currentReport.outputVatTotal.toLocaleString('ar-SD')} ج.س
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Deductible Purchases & Input VAT (ضريبة المدخلات) */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1">
                <h5 className="font-black text-slate-900 text-xs">
                  ثالثاً: جدول المصروفات والمشتريات المؤهلة لخصم الضريبة (ضريبة المدخلات)
                </h5>
                <span className="text-[11px] font-semibold text-slate-600">
                  بموجب فواتير وسندات صرف مستوفية الشروط
                </span>
              </div>
              <table className="w-full text-right border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <th className="border border-slate-300 p-2">بيان المصروف / النفقة المؤهلة</th>
                    <th className="border border-slate-300 p-2 text-center">حالة الخصم</th>
                    <th className="border border-slate-300 p-2">إجمالي المصروف (ج.س)</th>
                    <th className="border border-slate-300 p-2 text-left">ضريبة المدخلات المخصومة (ج.س)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {periodExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="border border-slate-300 p-3 text-center text-slate-500">
                        لا توجد مصروفات مسجلة لهذه الفترة
                      </td>
                    </tr>
                  ) : (
                    periodExpenses.map((exp) => {
                      const isDeductible = vatSettings.deductibleExpenseCategories.includes(exp.category);
                      const breakdown = calculateVatBreakdown(
                        exp.amount,
                        vatSettings.taxRate,
                        true
                      );
                      const vatAmt = isDeductible ? breakdown.vatAmount : 0;

                      return (
                        <tr key={exp.id}>
                          <td className="border border-slate-300 p-2 font-medium">
                            {exp.title}
                            <span className="text-[10px] text-slate-500 block">{exp.notes || exp.date}</span>
                          </td>
                          <td className="border border-slate-300 p-2 text-center">
                            {isDeductible ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                                مؤهل للخصم
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">غير مؤهل</span>
                            )}
                          </td>
                          <td className="border border-slate-300 p-2">
                            {exp.amount.toLocaleString('ar-SD')}
                          </td>
                          <td className="border border-slate-300 p-2 text-left font-bold text-slate-900">
                            {vatAmt.toLocaleString('ar-SD')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-slate-100 font-black text-slate-900">
                    <td className="border border-slate-300 p-2" colSpan={2}>
                      إجمالي المصروفات المؤهلة وضريبة المدخلات القابلة للخصم (ب)
                    </td>
                    <td className="border border-slate-300 p-2 font-black">
                      {currentReport.deductibleExpensesBase.toLocaleString('ar-SD')}
                    </td>
                    <td className="border border-slate-300 p-2 text-left text-sm text-amber-800">
                      {currentReport.inputVatTotal.toLocaleString('ar-SD')} ج.س
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: Final Settlement / Net Payable Box (الخلاصة وصافي المستحق) */}
            <div className="border-2 border-slate-900 rounded-xl p-4 bg-slate-50 space-y-3">
              <h5 className="font-black text-slate-900 text-xs border-b border-slate-300 pb-1">
                رابعاً: خلاصة الحساب الضريبي وصافي الضريبة الواجبة السداد
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-300">
                  <span className="text-slate-500 block text-[11px]">إجمالي ضريبة المخرجات (أ):</span>
                  <span className="font-bold text-base text-slate-900">
                    {currentReport.outputVatTotal.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-300">
                  <span className="text-slate-500 block text-[11px]">يطرح: ضريبة المدخلات القابلة للخصم (ب):</span>
                  <span className="font-bold text-base text-amber-700">
                    - {currentReport.inputVatTotal.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border-2 border-emerald-600">
                  <span className="text-emerald-800 block text-[11px] font-extrabold">
                    {currentReport.isRefundCredit ? 'رصيد دائن مرحّل:' : 'صافي الضريبة واجبة السداد (أ - ب):'}
                  </span>
                  <span className="font-black text-lg text-emerald-900">
                    {currentReport.netVatPayable.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
              </div>
            </div>

            {/* Section 5: Legal Declarations, Signatures and Stamps */}
            <div className="pt-3 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-700">
              {/* Certification Statement */}
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> إقرار المسؤول المالي:
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  أقر أنا الموقع أدناه بأن كافة البيانات الواردة في هذا الإقرار صحيحة ومطابقة للدفاتر والسجلات المحاسبية الإلكترونية والفواتير الصادرة.
                </p>
                <div className="pt-4">
                  <span className="block text-[11px] text-slate-500">اسم المسؤول: {currentUser.name}</span>
                  <span className="block text-[11px] text-slate-500">الصفة: {currentUser.role === 'owner' ? 'المدير العام / المالك' : 'مسؤول الحسابات'}</span>
                  <span className="block text-[11px] font-bold text-slate-900 mt-2">التوقيع: ............................</span>
                </div>
              </div>

              {/* Official Stamp */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-400 rounded-xl p-3 text-center">
                <Stamp className="w-7 h-7 text-slate-400 mb-1" />
                <span className="font-bold text-slate-800 text-[11px]">ختم المنشأة التجاري</span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {vatSettings.businessLegalName}
                </span>
              </div>

              {/* Tax Office Endorsement */}
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> اعتماد ديوان الضرائب:
                </span>
                <div className="p-2.5 bg-slate-100 rounded-lg text-[10px] text-slate-600 space-y-1 font-mono">
                  <div>رمز التحقق: SD-VAT-AUTH-{currentReport.periodKey}</div>
                  <div>المأمورية: {vatSettings.taxOfficeName}</div>
                  <div>تاريخ التوريد: .......... / .......... / 2026</div>
                  <div>توقيع المفتش: ........................</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: ANALYTICS & SIMULATOR (لوحة التحليل المالي والوسائل)
         ======================================================== */}
      {activeSubTab === 'overview' && (
        <div className="no-print space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Method Tax Contribution */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">
                    توزيع الضريبة حسب وسيلة السداد
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {currentReport.totalInvoicesCount} فاتورة
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'تطبيق بنكك (بنك الخرطوم)',
                    key: 'bankak',
                    color: 'bg-emerald-500',
                    textColor: 'text-emerald-400',
                    data: currentReport.paymentBreakdown.bankak,
                  },
                  {
                    name: 'نقداً باليد (Cash)',
                    key: 'cash',
                    color: 'bg-blue-500',
                    textColor: 'text-blue-400',
                    data: currentReport.paymentBreakdown.cash,
                  },
                  {
                    name: 'تطبيق فوري (بنك فيصل)',
                    key: 'fawry',
                    color: 'bg-purple-500',
                    textColor: 'text-purple-400',
                    data: currentReport.paymentBreakdown.fawry,
                  },
                  {
                    name: 'مبيعات آجلة (ذمم مدينة)',
                    key: 'credit',
                    color: 'bg-amber-500',
                    textColor: 'text-amber-400',
                    data: currentReport.paymentBreakdown.credit,
                  },
                ].map((item) => {
                  const pct =
                    currentReport.outputVatTotal > 0
                      ? Math.round(
                          (item.data.vat / currentReport.outputVatTotal) * 100
                        )
                      : 0;

                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${item.textColor}`}>
                            {item.data.vat.toLocaleString('ar-SD')} ج.س
                          </span>
                          <span className="text-slate-500 text-[11px]">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tax Flow Balance Card (ميزان التدفق الضريبي) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">
                    ميزان المقاصة الضريبية
                  </h3>
                </div>
                <span className="text-xs text-cyan-400 font-semibold">
                  صافي المستحق
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block">ضريبة المبيعات المحصلة (مخرجات):</span>
                    <span className="text-sm font-bold text-emerald-400">
                      +{currentReport.outputVatTotal.toLocaleString('ar-SD')} ج.س
                    </span>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block">ضريبة المصروفات القابلة للخصم (مدخلات):</span>
                    <span className="text-sm font-bold text-amber-400">
                      -{currentReport.inputVatTotal.toLocaleString('ar-SD')} ج.س
                    </span>
                  </div>
                  <ArrowDownRight className="w-5 h-5 text-amber-400" />
                </div>

                <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-300 block font-semibold">
                      الصافي الواجب توريده:
                    </span>
                    <span className="text-lg font-black text-white">
                      {currentReport.netVatPayable.toLocaleString('ar-SD')} ج.س
                    </span>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Interactive VAT Simulator Tool */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">
                    حاسبة المحاكاة الضريبية السريعة
                  </h3>
                </div>
                <span className="text-xs text-amber-400 font-semibold">
                  {vatSettings.taxRate}%
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">
                    أدخل المبلغ المراد احتسابه (ج.س):
                  </label>
                  <input
                    type="number"
                    value={simulatorAmount}
                    onChange={(e) => setSimulatorAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-500"
                    placeholder="مثال: 50000"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulatorMode('inclusive')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      simulatorMode === 'inclusive'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    السعر شامل الضريبة
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorMode('exclusive')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      simulatorMode === 'exclusive'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    السعر غير شامل (تضاف)
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>وعاء القيمة الصافي:</span>
                    <span className="text-slate-200 font-bold">
                      {simBreakdown.taxableBase.toLocaleString('ar-SD')} ج.س
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>قيمة ضريبة القيمة المضافة ({vatSettings.taxRate}%):</span>
                    <span className="font-extrabold">
                      {simBreakdown.vatAmount.toLocaleString('ar-SD')} ج.س
                    </span>
                  </div>
                  <div className="flex justify-between text-white border-t border-slate-800 pt-1 font-black">
                    <span>الإجمالي الكلي:</span>
                    <span className="text-emerald-400">
                      {simBreakdown.totalWithVat.toLocaleString('ar-SD')} ج.س
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: TAX INVOICES & EXPENSES LEDGER (سجل الفواتير والمصروفات)
         ======================================================== */}
      {activeSubTab === 'ledger' && (
        <div className="no-print space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="بحث برقم الفاتورة، اسم العميل، أو الكاشير..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">وسيلة السداد:</span>
              <select
                value={ledgerPaymentFilter}
                onChange={(e) => setLedgerPaymentFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">كافة الوسائل</option>
                <option value="cash">نقداً</option>
                <option value="bankak">بنكك</option>
                <option value="fawry">فوري</option>
                <option value="credit">آجل</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  سجل الفواتير الضريبية لفترة {currentReport.monthNameAr} {currentReport.year}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                إجمالي المعروض: {filteredInvoices.length} من أصل {periodInvoices.length} فاتورة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">وسيلة الدفع</th>
                    <th className="p-3">وعاء الضريبة</th>
                    <th className="p-3">ضريبة VAT ({vatSettings.taxRate}%)</th>
                    <th className="p-3">الإجمالي مع الضريبة</th>
                    <th className="p-3">الكاشير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        لا توجد فواتير مطابقة للبحث في هذا الشهر
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const breakdown = calculateVatBreakdown(
                        inv.total,
                        vatSettings.taxRate,
                        vatSettings.isPricesTaxInclusive
                      );

                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-white">
                            {inv.id}
                          </td>
                          <td className="p-3 text-slate-400">{inv.date}</td>
                          <td className="p-3 font-medium text-slate-200">
                            {inv.customerName || 'عميل نقدي سريع'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.paymentMethod === 'bankak'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : inv.paymentMethod === 'fawry'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  : inv.paymentMethod === 'credit'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {inv.paymentMethod === 'bankak'
                                ? 'بنكك'
                                : inv.paymentMethod === 'fawry'
                                ? 'فوري'
                                : inv.paymentMethod === 'credit'
                                ? 'آجل'
                                : 'نقداً'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-300">
                            {breakdown.taxableBase.toLocaleString('ar-SD')} ج.س
                          </td>
                          <td className="p-3 font-bold text-emerald-400">
                            {breakdown.vatAmount.toLocaleString('ar-SD')} ج.س
                          </td>
                          <td className="p-3 font-black text-white">
                            {inv.total.toLocaleString('ar-SD')} ج.س
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {inv.cashierName}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: SETTINGS & LEGAL TAX PROFILE (إعدادات الملف الضريبي)
         ======================================================== */}
      {activeSubTab === 'settings' && (
        <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-base text-white">
                  إعدادات الملف الضريبي ونظام ضريبة القيمة المضافة
                </h3>
                <p className="text-xs text-slate-400">
                  تعديل الرقم الضريبي، الاسم القانوني المسجل، ونسبة الضريبة المعيارية
                </p>
              </div>
            </div>
          </div>

          {settingsSavedMessage && (
            <div className="mb-6 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{settingsSavedMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  الاسم التجاري القانوني المسجل ضريبياً:
                </label>
                <input
                  type="text"
                  value={formLegalName}
                  onChange={(e) => setFormLegalName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  الرقم التعريفي الضريبي للمكلف (TIN):
                </label>
                <input
                  type="text"
                  value={formTIN}
                  onChange={(e) => setFormTIN(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  رقم السجل التجاري:
                </label>
                <input
                  type="text"
                  value={formCR}
                  onChange={(e) => setFormCR(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  المأمورية / الإدارة الضريبية المختصة:
                </label>
                <input
                  type="text"
                  value={formTaxOffice}
                  onChange={(e) => setFormTaxOffice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  نسبة ضريبة القيمة المضافة (VAT %):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formTaxRate}
                    onChange={(e) => setFormTaxRate(Number(e.target.value))}
                    className="w-32 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-extrabold outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-slate-400">% (النسبة الرسمية بالسودان: 17%)</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  طريقة احتساب الأسعار في المتجر:
                </label>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="pricing_mode"
                      checked={formIsInclusive}
                      onChange={() => setFormIsInclusive(true)}
                      className="accent-emerald-500"
                    />
                    <span>الأسعار المعروضة شاملة الضريبة (نمط التجزئة والسوبرماركت)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="pricing_mode"
                      checked={!formIsInclusive}
                      onChange={() => setFormIsInclusive(false)}
                      className="accent-emerald-500"
                    />
                    <span>الأسعار غير شاملة (تضاف الضريبة عند إصدار الفاتورة)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Deductible Expense Categories Selection */}
            <div className="pt-3 border-t border-slate-800">
              <label className="text-slate-300 block mb-2 font-semibold">
                فئات المصروفات المؤهلة لخصم ضريبة المدخلات:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'electricity_fuel', label: 'الكهرباء والوقود والمولدات' },
                  { id: 'supplies', label: 'المستلزمات والأكياس والتعبئة' },
                  { id: 'rent', label: 'إيجار العقارات والمستودعات' },
                  { id: 'other', label: 'مصروفات تشغيلية وصيانة أخرى' },
                  { id: 'salaries', label: 'المرتبات والأجور (معفية عادة)' },
                ].map((cat) => {
                  const isChecked = formDeductibleCats.includes(
                    cat.id as Expense['category']
                  );
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          toggleCategory(cat.id as Expense['category'])
                        }
                        className="accent-emerald-500"
                      />
                      <span>{cat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
