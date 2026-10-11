import { Invoice, Expense, ProfitLossSummary } from '../types';

export interface PnLTimeframe {
  key: 'today' | 'this_week' | 'this_month' | 'last_month' | 'all' | 'custom';
  labelAr: string;
}

export const CATEGORY_LABELS_AR: Record<string, { label: string; iconColor: string; bgBadge: string }> = {
  rent: {
    label: 'إيجار المحل والمستودع',
    iconColor: 'text-violet-400',
    bgBadge: 'bg-violet-950/60 text-violet-300 border-violet-800/60',
  },
  electricity_fuel: {
    label: 'وقود المولد والكهرباء',
    iconColor: 'text-amber-400',
    bgBadge: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
  },
  salaries: {
    label: 'رواتب وأجور العمالة',
    iconColor: 'text-sky-400',
    bgBadge: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
  },
  supplies: {
    label: 'نثريات وتغليف وأكياس',
    iconColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
  },
  maintenance: {
    label: 'صيانة وتشغيل وتجهيزات',
    iconColor: 'text-orange-400',
    bgBadge: 'bg-orange-950/60 text-orange-300 border-orange-800/60',
  },
  transport: {
    label: 'ترحيل وشحن بضائع',
    iconColor: 'text-indigo-400',
    bgBadge: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60',
  },
  other: {
    label: 'مصروفات تشغيلية أخرى',
    iconColor: 'text-slate-400',
    bgBadge: 'bg-slate-900 text-slate-300 border-slate-700',
  },
};

export const PAYMENT_METHOD_LABELS_AR: Record<string, string> = {
  cash: 'نقداً (كاش من الدرج)',
  bankak: 'تحويل بنكك (بنك الخرطوم)',
  fawry: 'تطبيق فوري (بنك فيصل)',
  credit: 'آجل / عهدة ذمة',
};

/**
 * Calculates a complete, accurate Profit & Loss (P&L) summary
 * for the provided invoices and expenses filtered by start & end date.
 */
export function calculateProfitLossStatement(
  invoices: Invoice[],
  expenses: Expense[],
  startDateStr: string, // YYYY-MM-DD
  endDateStr: string,   // YYYY-MM-DD
  periodLabel: string
): ProfitLossSummary {
  // Filter invoices (only completed status)
  const filteredInvoices = invoices.filter((inv) => {
    if (inv.status !== 'completed') return false;
    const invDate = inv.date.split(' ')[0];
    return invDate >= startDateStr && invDate <= endDateStr;
  });

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    const expDate = exp.date.split(' ')[0];
    return expDate >= startDateStr && expDate <= endDateStr;
  });

  // 1. Revenue calculations
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalCOGS = filteredInvoices.reduce((sum, inv) => sum + (inv.costOfGoodsSold || 0), 0);
  const grossProfit = totalSales - totalCOGS;
  const grossProfitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  // 2. Expenses breakdown
  const expensesByCategory: Record<string, number> = {
    rent: 0,
    electricity_fuel: 0,
    salaries: 0,
    supplies: 0,
    maintenance: 0,
    transport: 0,
    other: 0,
  };

  const expensesByPaymentMethod: Record<string, number> = {
    cash: 0,
    bankak: 0,
    fawry: 0,
    credit: 0,
  };

  let totalExpenses = 0;
  filteredExpenses.forEach((exp) => {
    const amt = exp.amount || 0;
    totalExpenses += amt;

    const cat = exp.category || 'other';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;

    const method = exp.paymentMethod || 'cash';
    expensesByPaymentMethod[method] = (expensesByPaymentMethod[method] || 0) + amt;
  });

  // 3. True Real Net Profit = Gross Profit - Operating Expenses
  const netProfit = grossProfit - totalExpenses;
  const netProfitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  return {
    periodLabel,
    startDate: startDateStr,
    endDate: endDateStr,
    totalSales,
    totalCOGS,
    grossProfit,
    grossProfitMargin,
    totalExpenses,
    expensesByCategory,
    expensesByPaymentMethod,
    netProfit,
    netProfitMargin,
    invoicesCount: filteredInvoices.length,
    expensesCount: filteredExpenses.length,
  };
}

/**
 * Exports expenses data to CSV format
 */
export function exportExpensesToCSV(expenses: Expense[]): void {
  const headers = [
    'المعرف',
    'البيان',
    'المبلغ (ج.س)',
    'التصنيف',
    'التاريخ',
    'طريقة الدفع',
    'رقم الإيصال',
    'المدفوع له',
    'تكرار دوري',
    'المسجل بواسطة',
    'الملاحظات',
  ];

  const rows = expenses.map((e) => [
    e.id,
    `"${(e.title || '').replace(/"/g, '""')}"`,
    e.amount,
    `"${CATEGORY_LABELS_AR[e.category]?.label || e.category}"`,
    e.date,
    `"${PAYMENT_METHOD_LABELS_AR[e.paymentMethod || 'cash'] || e.paymentMethod || 'كاش'}"`,
    `"${e.receiptNumber || '-'}"`,
    `"${(e.paidTo || '-').replace(/"/g, '""')}"`,
    e.isRecurring ? 'نعم (دوري)' : 'لا',
    `"${e.createdBy || '-'}"`,
    `"${(e.notes || '-').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `كشف_المصروفات_التشغيلية_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
