/**
 * نافذة «بيانات المتجر» — تعديل اسم المتجر والهاتف والعنوان.
 *
 * قبل كده ما كانش فيه أي مكان في الواجهة بيعدّل اسم المتجر فعلياً
 * (الاسم كان يتغير من الاستعادة/المزامنة فقط و«يرجع» للقديم) — هذه النافذة
 * تعطي تحكماً حقيقياً ودائماً، والتغييرات بتتسجل تلقائياً في المزامنة السحابية.
 */
import React, { useState, useEffect } from 'react';
import { X, Save, Store, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    storeName,
    setStoreName,
    storePhone,
    setStorePhone,
    storeAddress,
    setStoreAddress,
    currentUser,
  } = useApp();

  const [name, setName] = useState(storeName);
  const [phone, setPhone] = useState(storePhone);
  const [address, setAddress] = useState(storeAddress);
  const [saved, setSaved] = useState(false);

  // إعادة تحميل القيم عند كل فتح
  useEffect(() => {
    if (isOpen) {
      setName(storeName);
      setPhone(storePhone);
      setAddress(storeAddress);
      setSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  // المالك فقط يقدر يعدّل بيانات المتجر
  const canEdit = currentUser.role === 'owner';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    setStoreName(cleanName);
    setStorePhone(phone.trim());
    setStoreAddress(address.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4" dir="rtl">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center">
              <Store className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">بيانات المتجر</h3>
              <p className="text-[11px] text-slate-400">الاسم اللي بيظهر على الفواتير والتطبيق</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">اسم المتجر *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="مثال: بقالة ومحلات النور"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">رقم الهاتف</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              placeholder="0912345678"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm text-left outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">العنوان</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={100}
              placeholder="السوق المركزي، الخرطوم"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={!canEdit || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-2.5 text-sm transition cursor-pointer"
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'اتحفظ ✓' : 'حفظ التغييرات'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>

          {!canEdit && (
            <p className="text-[11px] text-amber-400/90 text-center">
              ⚠️ تعديل بيانات المتجر متاح للمالك/المدير فقط
            </p>
          )}

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            التغييرات بتتحفظ فوراً على هذا الجهاز وبترتفع للسحابة تلقائياً لو المزامنة مفعّلة ☁️
          </p>
        </form>
      </div>
    </div>
  );
};
