import React, { useState } from 'react';
import {
  Printer,
  Share2,
  X,
  FileText,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  User,
  RotateCcw,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';

interface InvoiceReceiptModalProps {
  invoiceId: string | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoiceId,
  onClose,
}) => {
  const {
    invoices,
    storeName,
    storePhone,
    storeAddress,
    returnInvoice,
    currentUser,
  } = useApp();

  const [receiptType, setReceiptType] = useState<'thermal' | 'a4'>('thermal');
  const [returnConfirm, setReturnConfirm] = useState(false);

  if (!invoiceId) return null;

  const invoice = invoices.find((inv) => inv.id === invoiceId);
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const itemsText = invoice.items
      .map(
        (it) =>
          `• ${it.productName} (${it.quantity} ${it.unit}): ${(it.totalPrice).toLocaleString('ar-SD')} ج.س`
      )
      .join('\n');

    const message = `🧾 فاتورة مبيعات: ${storeName}
رقم الفاتورة: ${invoice.id}
التاريخ: ${invoice.date}
${invoice.customerName ? `العميل: ${invoice.customerName}\n` : ''}
الأصناف:
${itemsText}

الإجمالي: ${invoice.total.toLocaleString('ar-SD')} ج.س
طريقة الدفع: ${invoice.paymentMethod === 'bankak' ? 'تطبيق بنكك' : invoice.paymentMethod === 'fawry' ? 'تطبيق فوري' : invoice.paymentMethod === 'credit' ? 'آجل' : 'نقداً'}
${invoice.remainingAmount > 0 ? `المتبقي آجل: ${invoice.remainingAmount.toLocaleString('ar-SD')} ج.س\n` : ''}
شكراً لتعاملكم معنا! 🇸🇩`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleReturn = () => {
    returnInvoice(invoice.id, 'إرجاع بطلب من العميل');
    setReturnConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="no-print bg-slate-950 p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">قالب الطباعة:</span>
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setReceiptType('thermal')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  receiptType === 'thermal'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                طابعة حرارية (80mm)
              </button>
              <button
                type="button"
                onClick={() => setReceiptType('a4')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  receiptType === 'a4'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                مقاس A4 رسمي
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">واتساب</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/60 flex justify-center">
          <div
            id="printable-receipt"
            className={`${
              receiptType === 'thermal'
                ? 'w-full max-w-[340px] font-mono text-slate-900 bg-white p-4 rounded-xl shadow-lg border border-slate-200'
                : 'w-full max-w-xl font-sans text-slate-900 bg-white p-6 rounded-xl shadow-lg border border-slate-200'
            }`}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{storeName}</h2>
              <div className="text-[11px] text-slate-600 space-y-0.5 mt-1">
                <p className="flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 inline" /> {storeAddress}
                </p>
                <p className="flex items-center justify-center gap-1 font-mono">
                  <Phone className="w-3 h-3 inline" /> {storePhone}
                </p>
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الفاتورة:</span>
                <span className="font-bold font-mono">{invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono text-[11px]">{invoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الكاشير:</span>
                <span>{invoice.cashierName}</span>
              </div>
              {invoice.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">العميل:</span>
                  <span className="font-bold">{invoice.customerName}</span>
                </div>
              )}
              {invoice.status === 'returned' && (
                <div className="bg-rose-100 text-rose-800 text-center font-bold py-1 rounded text-xs mt-1">
                  ⚠️ هذه الفاتورة تم إرجاعها
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                    <th className="pb-1">الصنف</th>
                    <th className="pb-1 text-center">الكمية</th>
                    <th className="pb-1 text-center">السعر</th>
                    <th className="pb-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1.5 font-medium leading-tight">
                        {item.productName}
                        <span className="block text-[10px] text-slate-500">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                      <td className="py-1.5 text-center font-mono text-[11px]">
                        {item.unitPrice.toLocaleString('ar-SD')}
                      </td>
                      <td className="py-1.5 text-left font-bold font-mono">
                        {item.totalPrice.toLocaleString('ar-SD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-medium">
                  {invoice.subtotal.toLocaleString('ar-SD')} ج.س
                </span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>الخصم:</span>
                  <span className="font-mono font-medium">
                    -{invoice.discount.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-emerald-800">
                  {invoice.total.toLocaleString('ar-SD')} ج.س
                </span>
              </div>

              <div className="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-200">
                <span>طريقة الدفع:</span>
                <span className="font-bold">
                  {invoice.paymentMethod === 'bankak'
                    ? '📱 تطبيق بنكك (بنك الخرطوم)'
                    : invoice.paymentMethod === 'fawry'
                    ? '💳 تطبيق فوري (بنك فيصل)'
                    : invoice.paymentMethod === 'credit'
                    ? '⏳ آجل (دين)'
                    : '💵 نقداً (كاش)'}
                </span>
              </div>

              {invoice.remainingAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold bg-rose-50 p-1 rounded">
                  <span>المبلغ المتبقي (آجل):</span>
                  <span className="font-mono">
                    {invoice.remainingAmount.toLocaleString('ar-SD')} ج.س
                  </span>
                </div>
              )}
            </div>

            {/* QR / Footer */}
            <div className="text-center pt-3 border-t-2 border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">
                شكراً لزيارتكم! نسعد بخدمتكم دائماً
              </p>
              <p>نظام محاسبي ذكي مصمم للسوق السوداني 🇸🇩</p>
              <p className="font-mono text-[9px] text-slate-400">
                الرقم المرجعي: {invoice.id}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="no-print bg-slate-950 p-3 sm:p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          {currentUser.permissions.canProcessReturns && invoice.status !== 'returned' ? (
            <div>
              {returnConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">تأكيد إرجاع البضاعة للمخزون؟</span>
                  <button
                    onClick={handleReturn}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded font-bold"
                  >
                    نعم، إرجاع
                  </button>
                  <button
                    onClick={() => setReturnConfirm(false)}
                    className="bg-slate-800 text-slate-300 px-2 py-1 rounded"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReturnConfirm(true)}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  إرجاع الفاتورة واستعادة المخزون
                </button>
              )}
            </div>
          ) : (
            <div></div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
