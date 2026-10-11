/**
 * VAT & Financial Tax Calculation Engine
 * Handles Value Added Tax (VAT / ضريبة القيمة المضافة) calculations for sales,
 * deductible input VAT for qualifying expenses, monthly tax declarations,
 * and compliance reporting.
 */

import { Invoice, Expense, VatSettings, MonthlyTaxReportSummary } from '../types';

export const DEFAULT_VAT_SETTINGS: VatSettings = {
  enabled: true,
  taxRate: 17, // 17% Standard VAT in Sudan
  taxIdentificationNumber: 'SD-TAX-984210-2026',
  commercialRegistrationNumber: 'CR-847291',
  taxOfficeName: 'الإدارة العامة للضرائب - مأمورية الخرطوم شرق',
  businessLegalName: 'مؤسسة الأمانة للتجارة العامة والتوزيع',
  taxFilingFrequency: 'monthly',
  isPricesTaxInclusive: true, // Typical retail POS: customer prices include VAT
  deductibleExpenseCategories: ['electricity_fuel', 'supplies', 'rent', 'other'],
};

export const ARABIC_MONTH_NAMES: Record<number, string> = {
  1: 'يناير',
  2: 'فبراير',
  3: 'مارس',
  4: 'أبريل',
  5: 'مايو',
  6: 'يونيو',
  7: 'يوليو',
  8: 'أغسطس',
  9: 'سبتمبر',
  10: 'أكتوبر',
  11: 'نوفمبر',
  12: 'ديسمبر',
};

/**
 * Calculates VAT amount and taxable base for a given gross sale amount
 */
export function calculateVatBreakdown(
  grossAmount: number,
  ratePercent: number,
  isInclusive: boolean
): { taxableBase: number; vatAmount: number; totalWithVat: number } {
  if (ratePercent <= 0 || grossAmount <= 0) {
    return { taxableBase: grossAmount, vatAmount: 0, totalWithVat: grossAmount };
  }

  const rate = ratePercent / 100;

  if (isInclusive) {
    // Total is inclusive of VAT: Base = Total / (1 + rate), VAT = Total - Base
    const taxableBase = Math.round((grossAmount / (1 + rate)) * 100) / 100;
    const vatAmount = Math.round((grossAmount - taxableBase) * 100) / 100;
    return {
      taxableBase,
      vatAmount,
      totalWithVat: grossAmount,
    };
  } else {
    // Total is exclusive of VAT: VAT = Base * rate, Total = Base + VAT
    const vatAmount = Math.round(grossAmount * rate * 100) / 100;
    return {
      taxableBase: grossAmount,
      vatAmount,
      totalWithVat: grossAmount + vatAmount,
    };
  }
}

/**
 * Parses date string (e.g. '2026-10-10 14:30' or '2026-10-09') into year and month
 */
export function parseYearMonth(dateStr: string): { year: number; month: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-/ :]/);
  if (parts.length >= 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (!isNaN(year) && !isNaN(month)) {
      return { year, month };
    }
  }
  return null;
}

/**
 * Returns available year/month periods present in invoices and expenses data
 */
export function getAvailableTaxPeriods(
  invoices: Invoice[],
  expenses: Expense[]
): Array<{ year: number; month: number; periodKey: string; labelAr: string; invoicesCount: number }> {
  const periodMap = new Map<string, { year: number; month: number; count: number }>();

  invoices.forEach((inv) => {
    const ym = parseYearMonth(inv.date);
    if (ym) {
      const key = `${ym.year}-${String(ym.month).padStart(2, '0')}`;
      const existing = periodMap.get(key) || { year: ym.year, month: ym.month, count: 0 };
      existing.count += 1;
      periodMap.set(key, existing);
    }
  });

  expenses.forEach((exp) => {
    const ym = parseYearMonth(exp.date);
    if (ym) {
      const key = `${ym.year}-${String(ym.month).padStart(2, '0')}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, { year: ym.year, month: ym.month, count: 0 });
      }
    }
  });

  // Ensure current month (e.g., 2026-10) is always present
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (!periodMap.has(currentKey)) {
    periodMap.set(currentKey, { year: now.getFullYear(), month: now.getMonth() + 1, count: 0 });
  }

  // Sort descending by periodKey
  return Array.from(periodMap.entries())
    .map(([key, data]) => ({
      periodKey: key,
      year: data.year,
      month: data.month,
      labelAr: `${ARABIC_MONTH_NAMES[data.month] || data.month} ${data.year}`,
      invoicesCount: data.count,
    }))
    .sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

/**
 * Generates a comprehensive monthly tax report summary
 */
export function generateMonthlyTaxReport(
  invoices: Invoice[],
  expenses: Expense[],
  settings: VatSettings,
  targetYear: number,
  targetMonth: number
): MonthlyTaxReportSummary {
  const periodKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
  const ratePercent = settings.enabled ? settings.taxRate : 0;
  const isInclusive = settings.isPricesTaxInclusive;

  // 1. Filter completed invoices for the target period
  const periodInvoices = invoices.filter((inv) => {
    if (inv.status !== 'completed') return false;
    const ym = parseYearMonth(inv.date);
    return ym && ym.year === targetYear && ym.month === targetMonth;
  });

  // 2. Filter expenses for the target period
  const periodExpenses = expenses.filter((exp) => {
    const ym = parseYearMonth(exp.date);
    return ym && ym.year === targetYear && ym.month === targetMonth;
  });

  // 3. Calculate sales output tax
  let grossSalesTotal = 0;
  let taxableSalesBase = 0;
  let exemptSalesBase = 0;
  let outputVatTotal = 0;

  const paymentBreakdown = {
    cash: { sales: 0, vat: 0 },
    bankak: { sales: 0, vat: 0 },
    fawry: { sales: 0, vat: 0 },
    credit: { sales: 0, vat: 0 },
  };

  periodInvoices.forEach((inv) => {
    const invTotal = inv.total;
    grossSalesTotal += invTotal;

    // Check if invoice already has a defined tax field > 0
    let invVat = 0;
    let invBase = 0;

    if (inv.tax && inv.tax > 0) {
      invVat = inv.tax;
      invBase = inv.subtotal - inv.discount;
    } else {
      const breakdown = calculateVatBreakdown(invTotal, ratePercent, isInclusive);
      invVat = breakdown.vatAmount;
      invBase = breakdown.taxableBase;
    }

    taxableSalesBase += invBase;
    outputVatTotal += invVat;

    // Payment method breakdown
    const method = inv.paymentMethod || 'cash';
    if (paymentBreakdown[method]) {
      paymentBreakdown[method].sales += invTotal;
      paymentBreakdown[method].vat += invVat;
    }
  });

  // 4. Calculate deductible input tax from qualifying expenses
  let grossExpensesTotal = 0;
  let deductibleExpensesBase = 0;
  let inputVatTotal = 0;

  periodExpenses.forEach((exp) => {
    grossExpensesTotal += exp.amount;

    const isDeductibleCategory =
      settings.deductibleExpenseCategories.includes(exp.category);

    if (isDeductibleCategory && ratePercent > 0) {
      // Assuming expense receipt is VAT inclusive
      const breakdown = calculateVatBreakdown(exp.amount, ratePercent, true);
      deductibleExpensesBase += breakdown.taxableBase;
      inputVatTotal += breakdown.vatAmount;
    }
  });

  // Round values
  grossSalesTotal = Math.round(grossSalesTotal * 100) / 100;
  taxableSalesBase = Math.round(taxableSalesBase * 100) / 100;
  outputVatTotal = Math.round(outputVatTotal * 100) / 100;
  grossExpensesTotal = Math.round(grossExpensesTotal * 100) / 100;
  deductibleExpensesBase = Math.round(deductibleExpensesBase * 100) / 100;
  inputVatTotal = Math.round(inputVatTotal * 100) / 100;

  // 5. Net VAT Payable (صافي الضريبة الواجبة السداد)
  const netVatPayable = Math.round((outputVatTotal - inputVatTotal) * 100) / 100;
  const isRefundCredit = netVatPayable < 0;

  return {
    periodKey,
    year: targetYear,
    month: targetMonth,
    monthNameAr: ARABIC_MONTH_NAMES[targetMonth] || String(targetMonth),
    totalInvoicesCount: periodInvoices.length,
    grossSalesTotal,
    taxableSalesBase,
    exemptSalesBase,
    outputVatTotal,
    totalExpensesCount: periodExpenses.length,
    grossExpensesTotal,
    deductibleExpensesBase,
    inputVatTotal,
    netVatPayable: Math.max(0, netVatPayable),
    isRefundCredit,
    paymentBreakdown,
  };
}

/**
 * Exports tax period invoices and summary to CSV
 */
export function exportTaxReportToCSV(
  report: MonthlyTaxReportSummary,
  periodInvoices: Invoice[],
  settings: VatSettings
): void {
  const lines: string[] = [];

  // UTF-8 BOM for proper Arabic Excel display
  const BOM = '\uFEFF';

  lines.push(`"تقرير ضريبة القيمة المضافة الشهري - ${report.monthNameAr} ${report.year}"`);
  lines.push(`"المنشأة:","${settings.businessLegalName}"`);
  lines.push(`"الرقم الضريبي (TIN):","${settings.taxIdentificationNumber}"`);
  lines.push(`"السجل التجاري:","${settings.commercialRegistrationNumber}"`);
  lines.push(`"المأمورية الضريبية:","${settings.taxOfficeName}"`);
  lines.push(`"نسبة الضريبة:","${settings.taxRate}%"`);
  lines.push('');

  lines.push('"خلاصة الإقرار الضريبي"');
  lines.push(`"إجمالي المبيعات الإجمالية","${report.grossSalesTotal} ج.س"`);
  lines.push(`"وعاء المبيعات الخاضع للضريبة","${report.taxableSalesBase} ج.س"`);
  lines.push(`"ضريبة المخرجات المحصلة","${report.outputVatTotal} ج.س"`);
  lines.push(`"إجمالي المصروفات التشغيلية","${report.grossExpensesTotal} ج.س"`);
  lines.push(`"وعاء المصروفات المؤهلة للخصم","${report.deductibleExpensesBase} ج.س"`);
  lines.push(`"ضريبة المدخلات القابلة للخصم","${report.inputVatTotal} ج.س"`);
  lines.push(`"صافي الضريبة الواجبة السداد","${report.netVatPayable} ج.س"`);
  lines.push('');

  lines.push('"سجل فواتير المبيعات الضريبية"');
  lines.push(
    '"رقم الفاتورة","التاريخ","العميل","طريقة الدفع","القيمة الخاضعة للضريبة","ضريبة القيمة المضافة","إجمالي الفاتورة"'
  );

  periodInvoices.forEach((inv) => {
    const breakdown = calculateVatBreakdown(
      inv.total,
      settings.taxRate,
      settings.isPricesTaxInclusive
    );
    const client = inv.customerName || 'عميل نقدي';
    const method =
      inv.paymentMethod === 'bankak'
        ? 'بنكك'
        : inv.paymentMethod === 'fawry'
        ? 'فوري'
        : inv.paymentMethod === 'credit'
        ? 'آجل'
        : 'نقداً';

    lines.push(
      `"${inv.id}","${inv.date}","${client}","${method}","${breakdown.taxableBase}","${breakdown.vatAmount}","${inv.total}"`
    );
  });

  const csvContent = BOM + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `VAT_Report_${report.periodKey}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
