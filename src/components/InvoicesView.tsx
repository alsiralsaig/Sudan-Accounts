import React, { useState } from 'react';
import {
  FileText,
  Search,
  Printer,
  RotateCcw,
  Clock,
  User,
  CreditCard,
  CheckCircle,
  Filter,
  Eye,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Invoice, PaymentMethod } from '../types';

interface InvoicesViewProps {
  onSelectInvoice: (invoiceId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onSelectInvoice }) => {
  const { invoices, returnInvoice, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inv.cashierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = filterPayment === 'all' || inv.paymentMethod === filterPayment;
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white">
              سجل الفواتير والمبيعات اليومية
            </h2>
            <p className="text-xs text-slate-400">
              أرشيف الفواتير المتسلسلة، معاينة وطباعة الإيصالات، وتتبع المدفوعات النقدية وعبر بنكك والآجل.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          إجمالي الفواتير المسجلة: <span className="text-emerald-400 font-bold font-mono">{invoices.length}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث برقم الفاتورة، اسم العميل، أو الكاشير..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option value="all">كل طرق الدفع</option>
            <option value="cash">نقداً (كاش)</option>
            <option value="bankak">تطبيق بنكك</option>
            <option value="fawry">تطبيق فوري</option>
            <option value="credit">آجل (دين)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option value="all">كل الحالات</option>
            <option value="completed">مكتملة</option>
            <option value="returned">مرتجعة</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">العميل</th>
                <th className="p-3">عدد الأصناف</th>
                <th className="p-3">الإجمالي الصافي</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">المتبقي (آجل)</th>
                <th className="p-3">الكاشير</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    {inv.id}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-400">
                    {inv.date}
                  </td>
                  <td className="p-3 text-slate-200 font-medium">
                    {inv.customerName || <span className="text-slate-500">عميل نقدي</span>}
                  </td>
                  <td className="p-3 text-slate-400">
                    {inv.items.length} أصناف
                  </td>
                  <td className="p-3 font-mono font-bold text-white text-sm">
                    {inv.total.toLocaleString('ar-SD')} ج.س
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.paymentMethod === 'bankak'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : inv.paymentMethod === 'fawry'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : inv.paymentMethod === 'credit'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {inv.paymentMethod === 'bankak'
                        ? 'تطبيق بنكك'
                        : inv.paymentMethod === 'fawry'
                        ? 'تطبيق فوري'
                        : inv.paymentMethod === 'credit'
                        ? 'آجل (دين)'
                        : 'كاش'}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    {inv.remainingAmount > 0 ? (
                      <span className="text-rose-400 font-bold">
                        {inv.remainingAmount.toLocaleString('ar-SD')} ج.س
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-300">
                    {inv.cashierName}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {inv.status === 'completed' ? 'مكتملة' : 'مرتجعة'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        title="معاينة وطباعة الفاتورة"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {currentUser.permissions.canProcessReturns ? (
                        inv.status !== 'returned' && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من إرجاع الفاتورة ${inv.id}؟ سيتم استرجاع البضاعة للمخزون.`)) {
                                returnInvoice(inv.id);
                              }
                            }}
                            title="إرجاع الفاتورة"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          title="معطل: واجهة للقراءة فقط لموظفي المبيعات — لا تملك صلاحية إرجاع الفواتير"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            لا توجد فواتير مطابقة لخيارات البحث.
          </div>
        )}
      </div>
    </div>
  );
};
