/**
 * نافذة السحابة — ربط المحل بمزامنة Postgres (Neon / Supabase).
 *
 * أوفلاين أولاً: الشغل كله محلي، والسحابة نسخة حية بترتفع وتنزل.
 * من هنا: تسجيل المحل، ربط أجهزة جديدة، مزامنة يدوية، تنزيل نسخة،
 * تاريخ النسخ، فك الارتباط — وكلها مش تعمل حاجة لو السحابة ما مضبوطة.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Unlink,
  History,
  Link2,
  UserPlus,
  X,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  loadSession,
  saveSession,
  updateSession,
  pingCloud,
  registerStoreCloud,
  linkDeviceCloud,
  pushNow,
  pullLatest,
  historyCloud,
  unlinkDevice,
  startAutoSync,
  onSyncStatus,
  deviceLabel,
  type SyncStatus,
} from '../services/cloudSyncClient';

interface CloudSyncModalProps {
  onClose: () => void;
}

type Tab = 'register' | 'link';

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ onClose }) => {
  const { storeName: currentStoreName, restoreDatabaseFromJSONString } = useApp();

  const [session, setSession] = useState(loadSession());
  const [status, setStatus] = useState<SyncStatus>({ state: 'unconfigured' });
  const [ping, setPing] = useState<{ configured: boolean; ok: boolean; provider?: string; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [history, setHistory] = useState<Array<{ id: number; clientAt: string; device: string; sizeBytes: number }>>([]);

  // نماذج التسجيل والربط
  const [tab, setTab] = useState<Tab>('link');
  const [regStoreName, setRegStoreName] = useState(currentStoreName);
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [linkPassword, setLinkPassword] = useState('');

  useEffect(() => {
    const off = onSyncStatus((s) => setStatus(s));
    return () => { off(); };
  }, []);

  const refreshPing = useCallback(async () => {
    setBusy(true);
    setPing(await pingCloud());
    setBusy(false);
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!session) return;
    try {
      setHistory(await historyCloud(8));
    } catch { /* تجاهل */ }
  }, [session]);

  useEffect(() => { void refreshPing(); }, [refreshPing]);
  useEffect(() => { void refreshHistory(); }, [refreshHistory]);

  const flash = (kind: 'ok' | 'err' | 'info', text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  };

  /* ════════ التسجيل ════════ */
  const doRegister = async () => {
    setBusy(true);
    try {
      const res = await registerStoreCloud({
        storeName: regStoreName, ownerName: regOwnerName, email: regEmail, password: regPassword,
      });
      saveSession({
        storeCode: res.storeCode,
        storeName: res.storeName,
        token: res.token,
        deviceLabel: deviceLabel(),
        linkedAt: new Date().toISOString(),
        baseSnapshotAt: null,
        lastPushAt: null,
        lastPullAt: null,
        autoSync: true,
      });
      // أول رفع للسحابة — خزّن بيانات الجهاز ده فوراً
      const pushRes = await pushNow('manual');
      setSession(loadSession());
      startAutoSync();
      flash('ok', `اتسجل المحل ✓ كودو: ${res.storeCode} — احفظو، بيه بتربط الأجهزة التانية`);
    } catch (err: any) {
      flash('err', err?.message || 'فشل التسجيل');
    } finally {
      setBusy(false);
    }
  };

  /* ════════ ربط جهاز ════════ */
  const doLink = async () => {
    setBusy(true);
    try {
      const res = await linkDeviceCloud({ storeCode: linkCode, password: linkPassword });
      saveSession({
        storeCode: res.storeCode,
        storeName: res.storeName,
        token: res.token,
        deviceLabel: deviceLabel(),
        linkedAt: new Date().toISOString(),
        baseSnapshotAt: null,
        lastPushAt: null,
        lastPullAt: null,
        autoSync: true,
      });
      setSession(loadSession());
      if (res.latest?.data) {
        // فيه نسخة على السحابة — نزّلها فوراً على الجهاز الجديد
        const r = await pullLatest(true);
        if (r.ok && r.applied) {
          flash('ok', 'اتربط الجهاز ✓ ونزّلنا بيانات المحل من السحابة');
        } else {
          flash('ok', 'اتربط الجهاز ✓');
        }
      } else {
        // السحابة فاضية — ارفع بيانات الجهاز ده كأول نسخة
        await pushNow('manual');
        flash('ok', 'اتربط الجهاز ✓ ورفعنا بياناتك أول نسخة على السحابة');
      }
      startAutoSync();
    } catch (err: any) {
      flash('err', err?.message || 'فشل الربط');
    } finally {
      setBusy(false);
    }
  };

  /* ════════ أزرار الحالة ════════ */
  const doPush = async () => {
    setBusy(true);
    const r = await pushNow('manual');
    setBusy(false);
    setSession(loadSession());
    flash(r.ok ? (r.conflict ? 'info' : 'ok') : 'err', r.message || (r.ok ? 'اترفعت نسخة جديدة للسحابة ✓' : 'فشل الرفع'));
    void refreshHistory();
  };

  const doPull = async () => {
    if (!confirm('تنزيل نسخة السحابة بيكتب فوق البيانات المحلية الحالية (بنعمل نقطة أمان محلية قبلها) — تابع؟')) return;
    setBusy(true);
    const r = await pullLatest(true);
    setBusy(false);
    setSession(loadSession());
    if (r.ok && r.hasSnapshot) {
      flash('ok', 'نزّلنا نسخة السحابة وطبقناها ✓');
      void refreshHistory();
    } else {
      flash('info', r.message || 'ما فيه نسخة على السحابة بعد');
    }
  };

  const doUnlink = () => {
    if (!confirm('فك الربط؟ بياناتك المحلية بتفضل زي ما هي — بس ما بترتفع للسحابة بعد اليوم')) return;
    unlinkDevice();
    setSession(null);
    setHistory([]);
    setStatus({ state: 'unconfigured' });
    flash('info', 'اتفك الربط — التطبيق شغال محلي بالكامل');
  };

  const toggleAutoSync = () => {
    const next = updateSession({ autoSync: !session?.autoSync });
    setSession(next);
    if (next?.autoSync) startAutoSync();
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('ar-SD', { dateStyle: 'short', timeStyle: 'short' }); } catch { return iso; }
  };
  const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.round(b / 1024)}KB`);

  const statusBadge = () => {
    switch (status.state) {
      case 'syncing': return { text: 'بيزامن...', cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40', Icon: Loader2 };
      case 'synced': return { text: 'متزامن ✓', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', Icon: CheckCircle2 };
      case 'conflict': return { text: 'تعارض — راجع', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40', Icon: AlertTriangle };
      case 'offline': return { text: 'أوفلاين', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/40', Icon: WifiOff };
      case 'error': return { text: 'غلطة', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40', Icon: AlertTriangle };
      case 'linked-idle': return { text: 'مرتبط', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', Icon: Cloud };
      default: return { text: 'محلي', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/40', Icon: Cloud };
    }
  };
  const badge = statusBadge();
  const BadgeIcon = badge.Icon;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 overflow-y-auto" dir="rtl">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-8">
        {/* الرأس */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-slate-100">السحابة — مزامنة بين الأجهزة</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300" aria-label="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          {/* حالة السحابة على السيرفر */}
          <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
            <span className="text-slate-400 text-xs">
              {ping === null ? 'بفحص السيرفر...' : !ping.configured
                ? 'السحابة ما مضبوطة على السيرفر (DATABASE_URL)'
                : ping.ok
                  ? `متصل بـ ${ping.provider || 'Postgres'} ✓`
                  : `فشل الاتصال: ${ping.error || 'سبب غير معروف'}`}
            </span>
            <button onClick={refreshPing} className="text-slate-400 hover:text-emerald-400" aria-label="إعادة فحص">
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {toast && (
            <div className={`rounded-lg px-3 py-2 text-xs border ${
              toast.kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : toast.kind === 'err' ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              : 'bg-sky-500/10 border-sky-500/40 text-sky-300'}`}>
              {toast.text}
            </div>
          )}

          {session ? (
            /* ════════ مربوط — لوحة التحكم ════════ */
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-100">{session.storeName}</p>
                  <p className="text-xs text-slate-500">
                    كود المحل: <span className="font-mono text-sky-300">{session.storeCode}</span> • {session.deviceLabel}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border ${badge.cls}`}>
                  <BadgeIcon className={`w-3.5 h-3.5 ${status.state === 'syncing' ? 'animate-spin' : ''}`} />
                  {badge.text}
                </span>
              </div>

              {status.state === 'conflict' && (
                <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 rounded-lg px-3 py-2 text-xs">
                  فيه نسخة أحدث على السحابة من جهاز تاني — اضغط «نزّل من السحابة» لو عايزها، أو «ارفع الآن» لو بتاعتك هي الصح.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div>آخر رفع: <span className="text-slate-300">{fmtDate(session.lastPushAt)}</span></div>
                <div>آخر تنزيل: <span className="text-slate-300">{fmtDate(session.lastPullAt)}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={doPush}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 text-xs transition-colors"
                >
                  <CloudUpload className="w-4 h-4" />
                  ارفع الآن
                </button>
                <button
                  onClick={doPull}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 text-xs transition-colors"
                >
                  <CloudDownload className="w-4 h-4" />
                  نزّل من السحابة
                </button>
              </div>

              <label className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2 cursor-pointer">
                <span className="text-slate-300 text-xs">المزامنة التلقائية (كل 5 دقائق وبعد كل تغيير)</span>
                <input type="checkbox" checked={session.autoSync} onChange={toggleAutoSync} className="accent-emerald-500 w-4 h-4" />
              </label>

              {/* التاريخ */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
                  <History className="w-3.5 h-3.5" />
                  نسخ السحابة (آخر {history.length || 0})
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {history.length === 0 && <p className="text-slate-600 text-[11px]">ما فيه نسخ بعد — اضغط «ارفع الآن» لأول نسخة</p>}
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between bg-slate-800/40 rounded px-2.5 py-1.5 text-[11px]">
                      <span className="text-slate-300">{fmtDate(h.clientAt)}</span>
                      <span className="text-slate-500">{h.device} • {fmtSize(h.sizeBytes)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={doUnlink}
                className="w-full flex items-center justify-center gap-2 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 rounded-lg py-2 text-xs font-bold transition-colors"
              >
                <Unlink className="w-4 h-4" />
                فك ربط الجهاز ده
              </button>

              <p className="text-[10px] text-slate-600 leading-relaxed">
                الشغل كله محلي (أوفلاين أولاً) — السحابة نسخة حية بترجع ليك لو الجهاز ضاع أو تبادلتو.
                كود المحل <span className="font-mono text-sky-400">{session.storeCode}</span> وكلمة السر بتاع المالك — بيها بتربطط أي جهاز جديد.
              </p>
            </>
          ) : (
            /* ════════ مش مربوط — تسجيل أو ربط ════════ */
            <>
              {ping?.ok ? (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTab('link')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold border transition-colors ${tab === 'link' ? 'bg-sky-600 border-sky-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      ربط جهاز بمحل موجود
                    </button>
                    <button
                      onClick={() => setTab('register')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold border transition-colors ${tab === 'register' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      تسجيل محل جديد
                    </button>
                  </div>

                  {tab === 'register' ? (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">اسم المحل</label>
                        <input value={regStoreName} onChange={(e) => setRegStoreName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">اسم المالك</label>
                        <input value={regOwnerName} onChange={(e) => setRegOwnerName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">البريد الإلكتروني (للتسجيل بس)</label>
                        <input type="email" dir="ltr" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">كلمة السر (6 حروف على الأقل)</label>
                        <input type="password" dir="ltr" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <button onClick={doRegister} disabled={busy}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 text-sm transition-colors">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        سجّل المحعل واربط الجهاز ده
                      </button>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        بعد التسجيل بيطلع ليك «كود المحل» — بيه وبكلمة السر بتربط أي جهاز تاني (كمبيوتر المحاسبة، تاب الكاشير...).
                        بيانات الجهاز ده بترتفع أول نسخة تلقائياً.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">كود المحل (زي AMNA-7K2Q)</label>
                        <input value={linkCode} onChange={(e) => setLinkCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" dir="ltr"
                          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono text-center outline-none focus:border-sky-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">كلمة سر المالك</label>
                        <input type="password" dir="ltr" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && doLink()}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" />
                      </div>
                      <button onClick={doLink} disabled={busy}
                        className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 text-sm transition-colors">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                        اربط الجهاز ده
                      </button>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        لو الجهاز ده فيه بيانات محلية والسحابة فيها نسخة أحدث — نسخة السحابة بتنزل فوقها (بنعمل نقطة أمان قبلها).
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <Cloud className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs leading-relaxed">
                    السحابة ما مضبوطة على السيرفر بعد.<br />
                    المطلوب: حساب مجاني من <span className="text-sky-400">Neon</span> أو <span className="text-sky-400">Supabase</span>
                    + ضيف رابط القاعدة <span className="font-mono text-emerald-400">DATABASE_URL</span> في متغيرات البيئة بتاعة Vercel.
                  </p>
                  <p className="text-slate-600 text-[10px] mt-2">الخطوات بالتفصيل في README المشروع — والتطبيق يشتغل محلي كويس بدونها.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
