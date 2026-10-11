import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Download,
  Upload,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TradeDictionaryItem } from '../types';

export const DictionaryView: React.FC = () => {
  const { dictionary, addDictionaryItem, deleteDictionaryItem, products } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testPhrase, setTestPhrase] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const [newDialect, setNewDialect] = useState('');
  const [newStandard, setNewStandard] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newNote, setNewNote] = useState('');

  const filteredDictionary = dictionary.filter((d) => {
    return (
      d.dialectTerm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.standardTerm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.productName && d.productName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDialect || !newStandard) return;

    const matchedProd = products.find((p) => p.id === newProductId);

    addDictionaryItem({
      dialectTerm: newDialect.trim(),
      standardTerm: newStandard.trim(),
      productId: newProductId || undefined,
      productName: matchedProd?.nameAr,
      note: newNote,
      verified: true,
    });

    setNewDialect('');
    setNewStandard('');
    setNewProductId('');
    setNewNote('');
    setIsAddModalOpen(false);
  };

  const handleTestMatch = () => {
    if (!testPhrase.trim()) return;
    const match = dictionary.find((d) => testPhrase.includes(d.dialectTerm));
    if (match) {
      setTestResult(
        `✅ تم العثور على مطابقة: "${match.dialectTerm}" تعني "${match.standardTerm}" ${
          match.productName ? `(مرتبط بـ: ${match.productName})` : ''
        }`
      );
    } else {
      setTestResult('⚠️ لم يتم العثور على مصطلح مطابق في القاموس، يمكنك إضافته الآن.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dictionary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sudanese_trade_dictionary_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white">
              قاموس المصطلحات التجارية السودانية
            </h2>
            <p className="text-xs text-slate-400">
              المعجم الذكي لترجمة لهجة التاجر والزبون السوداني إلى منتجات وأوزان دقيقة في المخزون.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير القاموس (JSON)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مصطلح جديد</span>
          </button>
        </div>
      </div>

      {/* Interactive Match Testing Tool */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          تجربة مطابقة المصطلحات واللهجة المحلية:
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={testPhrase}
            onChange={(e) => setTestPhrase(e.target.value)}
            placeholder="اكتب كلمة أو عبارة سودانية (مثال: رطل سكر، باغة زيت، بنكك)..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleTestMatch}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
          >
            فحص المطابقة
          </button>
        </div>
        {testResult && (
          <div className="text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
            {testResult}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="ابحث في مصطلحات اللهجة السودانية أو المنتج المطابق..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="p-3">المصطلح باللهجة السودانية</th>
                <th className="p-3">المعنى التجاري القياسي</th>
                <th className="p-3">المنتج المرتبط بالمخزون</th>
                <th className="p-3">ملاحظات العرف السوقي</th>
                <th className="p-3 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDictionary.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-bold text-white text-sm">
                    <span className="bg-slate-950 border border-slate-700/80 px-2 py-0.5 rounded text-emerald-400">
                      «{item.dialectTerm}»
                    </span>
                  </td>
                  <td className="p-3 text-slate-200 font-medium">{item.standardTerm}</td>
                  <td className="p-3 text-cyan-300">
                    {item.productName || <span className="text-slate-500">عام</span>}
                  </td>
                  <td className="p-3 text-slate-400">{item.note || '-'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteDictionaryItem(item.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 space-y-4 text-slate-100 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-white">إضافة مصطلح تجاري سوداني جديد</h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">المصطلح بالعامية السودانية:</label>
                <input
                  type="text"
                  required
                  value={newDialect}
                  onChange={(e) => setNewDialect(e.target.value)}
                  placeholder="مثال: رطل سكر، باكت دقيق، شوال بصل"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">المعنى القياسي الموازي:</label>
                <input
                  type="text"
                  required
                  value={newStandard}
                  onChange={(e) => setNewStandard(e.target.value)}
                  placeholder="مثال: سكر كنانة - وحدة رطل (450 جم)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  ربط بمنتج محدد من المخزون (اختياري):
                </label>
                <select
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                >
                  <option value="">عام / غير محدد</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ملاحظة توضيحية:</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="مثال: شائع في أسواق الخرطوم والجزيرة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  حفظ في القاموس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
