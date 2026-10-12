/**
 * بوابة تسجيل الدخول — قفل التطبيق برمز (PIN) لكل موظف.
 *
 * • لو أي موظف عنده PIN مضبوط: التطبيق يبدأ مقفول — اختار اسمك وادخل برمزك.
 * • التبديل بين المستخدمين من النافبار بيمر من نفس البوابة.
 * • لو ما في PINs مضبوطة خالص: التطبيق يتصرف زي زمان بالظبط (ما في قفل).
 *   المالك يضبط الرموز من شاشة الموظفين.
 */
import React, { useState } from 'react';
import { Lock, LogIn, ShieldCheck, X, Link2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CloudSyncModal } from './CloudSyncModal';
import type { UserProfile } from '../types';

interface LoginGateProps {
  /** المستخدم المطلوب (للتبديل من النافبار) — لو فاضي، اختيار حر */
  targetUser?: UserProfile | null;
  onSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
  title?: string;
  /** وضع التطبيق: admin = الكل، staff = العمال بس (بدون المالك) وما يتجاوزش أبداً */
  mode?: 'admin' | 'staff';
}

export const LoginGate: React.FC<LoginGateProps> = ({ targetUser, onSuccess, onCancel, title, mode = 'admin' }) => {
  const { staffList } = useApp();
  const withPin = mode === 'staff'
    ? staffList.filter((u) => u.role !== 'owner' && u.pin && u.pin.length >= 4)
    : staffList.filter((u) => u.pin && u.pin.length >= 4);
  const [selectedId, setSelectedId] = useState<string>(targetUser?.id || withPin[0]?.id || '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showCloud, setShowCloud] = useState(false);

  if (!withPin.length) {
    if (mode === 'staff') {
      /* تطبيق العمال من غير رموز مضبوطة = مقفول تماماً — المدير يفعّلها من تطبيق الإدارة */
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4" dir="rtl">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
            <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-100 mb-2">تطبيق العمال لسه ما مفعّل</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              المدير يفتح <span className="text-emerald-400 font-bold">تطبيق الإدارة</span> → شاشة الموظفين →
              يضيف العاملين ويحط لكل واحد <span className="text-emerald-400 font-bold">رمز دخول (PIN)</span>.
              من تلك اللحظة تطبيق العمال بيفتح ليهم.
            </p>

            <button
              onClick={() => setShowCloud(true)}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl py-2.5 text-sm transition-colors cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              ربط هذا الجهاز بالمتجر
            </button>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              عندك <span className="text-sky-300 font-bold">كود المحل</span>؟ اضغط الزر وادخل
              الكود + <span className="text-sky-300 font-bold">كلمة سر المالك</span> —
              الموظفين والبيانات كلها بتنزل هنا فوراً من السحابة.
            </p>

            {showCloud && (
              <div className="fixed inset-0 z-[200]">
                <CloudSyncModal onClose={() => setShowCloud(false)} />
              </div>
            )}
          </div>
        </div>
      );
    }
    // ما في رموز — سايح زي زمان
    onSuccess(targetUser || staffList[0]);
    return null;
  }

  const selected = staffList.find((u) => u.id === selectedId) || withPin[0];

  const submit = () => {
    if (!selected) return;
    if (!selected.pin) {
      onSuccess(selected);
      return;
    }
    if (pin === selected.pin) {
      onSuccess(selected);
    } else {
      setError('الرمز غلط — جرّب تاني');
      setPin('');
    }
  };

  const roleLabel = (role: string) =>
    role === 'owner' ? 'مالك' : role === 'cashier' ? 'كاشير' : 'أمين مخزن';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4" dir="rtl">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <img src="/pwa-192x192.png" alt="شعار حساباتي السودان" width={56} height={56}
          className="w-14 h-14 rounded-2xl mx-auto mb-3 border border-emerald-500/30" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Lock className="w-5 h-5" />
            <h3 className="font-bold text-slate-100">{title || 'مين الماسك الجهاز؟'}</h3>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-300" aria-label="إغلاق">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <label className="block text-xs text-slate-400 mb-1">المستخدم</label>
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setPin(''); setError(''); }}
          disabled={Boolean(targetUser)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-emerald-500 disabled:opacity-60"
        >
          {withPin.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({roleLabel(u.role)})
            </option>
          ))}
          {targetUser && !targetUser.pin && (
            <option value={targetUser.id}>{targetUser.name} (بدون رمز)</option>
          )}
        </select>

        {selected?.pin ? (
          <>
            <label className="block text-xs text-slate-400 mb-1">الرمز السري</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-lg tracking-[0.5em] text-center outline-none focus:border-emerald-500 mb-2"
              autoFocus
            />
          </>
        ) : (
          <p className="text-xs text-amber-400 mb-2">المستخدم ده ما عنده رمز — بيدخل مباشرة</p>
        )}

        {error && <p className="text-rose-400 text-xs mb-2">{error}</p>}

        <button
          onClick={submit}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg py-2.5 text-sm transition-colors"
        >
          <LogIn className="w-4 h-4" />
          دخول
        </button>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5" />
          الرموز بيتحكم فيها المالك من شاشة الموظفين — وبتتزامن مع السحابة
        </div>
      </div>
    </div>
  );
};
