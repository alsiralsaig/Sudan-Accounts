import { CustomerCreditAccount, CustomerCreditTransaction } from '../types';

/**
 * Generates a direct WhatsApp link to share a debt reminder / statement
 * with the customer.
 */
export function generateCustomerWhatsAppReminder(
  customer: CustomerCreditAccount,
  storeName: string,
  storePhone: string
): string {
  // Normalize phone number for Sudan
  let cleanPhone = customer.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '249' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('249')) {
    cleanPhone = '249' + cleanPhone;
  }

  const message = `السلام عليكم ورحمة الله وبركاته،
الأخ/الأخت المحترم/ة: ${customer.name}
تحية طيبة من *${storeName}* 🇸🇩

نود تذكيركم بكشف الحساب والمديونية الحالية طرف متجرنا:
📌 *الرصيد المستحق الحالي:* ${customer.currentBalance.toLocaleString('ar-SD')} ج.س
${customer.lastPaymentDate ? `🗓️ *تاريخ آخر دفعة مسددة:* ${customer.lastPaymentDate}` : ''}
${customer.notes ? `📝 *ملاحظات:* ${customer.notes}` : ''}

يمكنكم السداد نقداً بالمتجر أو عبر تحويل تطبيق بنكك (بنك الخرطوم) أو فوري.
للتواصل والاستفسار: ${storePhone}

شكراً لحسن تعاملكم ودمتم بخير.`;

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Exports customer credit transactions statement to CSV
 */
export function exportCustomerStatementToCSV(
  customer: CustomerCreditAccount,
  transactions: CustomerCreditTransaction[]
): void {
  const headers = [
    'المعرف',
    'التاريخ',
    'نوع الحركة',
    'المبلغ (ج.س)',
    'الرصيد بعد الحركة',
    'طريقة الدفع / المرجع',
    'رقم الفاتورة / الإيصال',
    'الموظف المسجل',
    'البيان والملاحظات',
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type === 'debt' ? 'دين جديد (شراء آجل)' : 'سداد دفعة نقدية',
    t.amount,
    t.balanceAfter,
    t.paymentMethod || 'آجل',
    t.invoiceId || t.receiptNumber || '-',
    `"${t.recordedBy || '-'}"`,
    `"${(t.notes || '-').replace(/"/g, '""')}"`,
  ]);

  const summaryRows = [
    [],
    ['اسم الزبون', `"${customer.name}"`],
    ['رقم الهاتف', `"${customer.phone}"`],
    ['العنوان', `"${customer.address || '-'}"`],
    ['سقف الدين المعتمد', customer.creditLimit],
    ['الرصيد الإجمالي المستحق', customer.currentBalance],
    ['تاريخ التقرير', new Date().toLocaleDateString('ar-SD')],
  ];

  const csvContent =
    '\uFEFF' +
    [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      ...summaryRows.map((r) => r.join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `كشف_حساب_شكك_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
