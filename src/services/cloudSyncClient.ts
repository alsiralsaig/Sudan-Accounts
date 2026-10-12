/**
 * محرك المزامنة السحابية — «أوفلاين أولاً».
 *
 * الشغل اليومي كله في localStorage زي ما هو — والسحابة (Neon / Supabase) نسخة حية:
 *   • بيرفع لقطة كاملة بعد أي تغيير (مهلة 20 ثانية) وعلى فترات (5 دقائق).
 *   • لو لقى نسخة أحدث من السحابة والجهاز ما غيّر شي → بينزّلها تلقائياً.
 *   • لو الجهاز غيّر والسحابة أحدث (جهاز تاني اشتغل) → بينبّه بدون ما يمسح حاجة.
 *
 * كل حاجة اختيارية: لو ما مربوط، التطبيق يعمل بالضبط زي زمان.
 */

const CLOUD_KEY = 'hisabati_cloud';

/** مفاتيح البيانات اللي بتتزامن (نفس اللي AppContext بيكتبها) */
const SYNCED_KEYS = [
  'hisabati_products',
  'hisabati_invoices',
  'hisabati_expenses',
  'hisabati_staff',
  'hisabati_dictionary',
  'hisabati_audit',
  'hisabati_movements',
  'hisabati_read_notifications',
  'hisabati_dismissed_notifications',
] as const;

export interface CloudSession {
  storeCode: string;
  storeName: string;
  token: string;
  deviceLabel: string;
  linkedAt: string;
  /** وقت آخر لقطة من السحابة اتطبقت على الجهاز ده */
  baseSnapshotAt: string | null;
  lastPushAt: string | null;
  lastPullAt: string | null;
  autoSync: boolean;
}

export type SyncStatus =
  | { state: 'unconfigured' }
  | { state: 'offline'; message: string }
  | { state: 'error'; message: string }
  | { state: 'syncing' }
  | { state: 'synced'; at: string }
  | { state: 'conflict'; message: string }
  | { state: 'linked-idle' };

/* ══════════════════ إدارة الجلسة ══════════════════ */

export function loadSession(): CloudSession | null {
  try {
    const raw = localStorage.getItem(CLOUD_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.token && s?.storeCode ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: CloudSession | null): void {
  if (!s) localStorage.removeItem(CLOUD_KEY);
  else localStorage.setItem(CLOUD_KEY, JSON.stringify(s));
}

export function updateSession(patch: Partial<CloudSession>): CloudSession | null {
  const cur = loadSession();
  if (!cur) return null;
  const next = { ...cur, ...patch };
  saveSession(next);
  return next;
}

export function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'هاتف أندرويد';
  if (/iphone|ipad/i.test(ua)) return 'هاتف آيفون';
  if (/windows/i.test(ua)) return 'كمبيوتر ويندوز';
  return 'جهاز';
}

/* ══════════════════ بناء اللقطة والتوقيع ══════════════════ */

export interface SnapshotPayload {
  version: 1;
  data: Record<string, unknown>;
  meta: Record<string, unknown>;
}

/** لقطة كاملة من localStorage — بنفس صيغة نسخة الاحتياط المحلية (restoreDatabaseFromJSONString) */
export function buildSnapshot(): SnapshotPayload {
  const read = (key: string): unknown => {
    const raw = localStorage.getItem(key);
    if (raw === null) return undefined;
    try { return JSON.parse(raw); } catch { return undefined; }
  };
  const staffList = read('hisabati_staff') as unknown[] | undefined;
  const settings = read('hisabati_store_settings') as Record<string, unknown> | undefined;
  const data: Record<string, unknown> = {
    products: read('hisabati_products'),
    invoices: read('hisabati_invoices'),
    expenses: read('hisabati_expenses'),
    staffList: staffList ?? [],
    dictionary: read('hisabati_dictionary'),
    auditLogs: read('hisabati_audit'),
    stockMovements: read('hisabati_movements'),
    readNotificationIds: read('hisabati_read_notifications'),
    dismissedNotificationIds: read('hisabati_dismissed_notifications'),
    storeSettings: settings ?? {},
  };
  return {
    version: 1,
    data,
    meta: {
      counts: {
        products: Array.isArray(data.products) ? (data.products as unknown[]).length : 0,
        invoices: Array.isArray(data.invoices) ? (data.invoices as unknown[]).length : 0,
        expenses: Array.isArray(data.expenses) ? (data.expenses as unknown[]).length : 0,
        staff: Array.isArray(staffList) ? staffList.length : 0,
      },
      app: 'hisabati-sudan',
    },
  };
}

/** بصمة رخيصة للبيانات — عشان نعرف الجهاز «اتوسخ» بتغييرات بعد آخر رفع */
function signature(): string {
  let h = 5381;
  for (const key of SYNCED_KEYS) {
    const raw = localStorage.getItem(key) || '';
    h = ((h << 5) + h + raw.length) | 0;
    // عينة من آخر 200 حرف — بتلقط التعديلات والإضافات
    const tail = raw.slice(-200);
    for (let i = 0; i < tail.length; i++) h = ((h << 5) + h + tail.charCodeAt(i)) | 0;
  }
  return String(h);
}

/** تطبيق لقطة من السحابة على localStorage (احتياطي — الطبيعي عبر auto-apply handler) */
export function applySnapshot(snap: { data: Record<string, unknown> }): { applied: number } {
  const map: Array<[string, string]> = [
    ['products', 'hisabati_products'],
    ['invoices', 'hisabati_invoices'],
    ['expenses', 'hisabati_expenses'],
    ['staffList', 'hisabati_staff'],
    ['dictionary', 'hisabati_dictionary'],
    ['auditLogs', 'hisabati_audit'],
    ['stockMovements', 'hisabati_movements'],
    ['readNotificationIds', 'hisabati_read_notifications'],
    ['dismissedNotificationIds', 'hisabati_dismissed_notifications'],
    ['storeSettings', 'hisabati_store_settings'],
  ];
  let applied = 0;
  for (const [field, key] of map) {
    if (snap.data?.[field] !== undefined && snap.data[field] !== null) {
      localStorage.setItem(key, JSON.stringify(snap.data[field]));
      applied++;
    }
  }
  return { applied };
}

/* ══════════════════ التطبيق التلقائي داخل التطبيق ══════════════════ */

let autoApplyHandler: ((data: Record<string, unknown>) => void) | null = null;

/** التطبيق بيسجلها — عشان تنزيل السحابة يحدث الواجهة الحية مباشرة */
export function setAutoApplyHandler(fn: ((data: Record<string, unknown>) => void) | null): void {
  autoApplyHandler = fn;
}

function applyRemote(data: Record<string, unknown>): void {
  if (autoApplyHandler) {
    autoApplyHandler(data);
  } else {
    applySnapshot({ data });
    location.reload(); // مفيش handler — اكتب وخلي الصفحة تقرا من جديد
  }
}

/* ══════════════════ نداءات السحابة ══════════════════ */

async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`/api/cloud${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `خطأ من السيرفر (${res.status})`);
    (err as any).status = res.status;
    throw err;
  }
  return body;
}

function authHeaders(): Record<string, string> {
  const s = loadSession();
  return s ? { Authorization: `Bearer ${s.token}` } : {};
}

export async function pingCloud(): Promise<{ configured: boolean; ok: boolean; provider?: string; error?: string }> {
  try {
    return await api('/ping');
  } catch (err: any) {
    return { configured: false, ok: false, error: err?.message || 'السيرفر ما رد' };
  }
}

export async function registerStoreCloud(input: {
  storeName: string; ownerName: string; email: string; password: string;
}): Promise<{ storeCode: string; storeName: string; token: string }> {
  return api('/register', { method: 'POST', body: JSON.stringify(input) });
}

export async function linkDeviceCloud(input: {
  storeCode: string; password: string;
}): Promise<{
  storeCode: string; storeName: string; ownerName: string; token: string;
  latest: { clientAt: string; data: Record<string, unknown> } | null;
}> {
  return api('/link', { method: 'POST', body: JSON.stringify(input) });
}

/* ══════════════════ حلقة المزامنة ══════════════════ */

type Listener = (status: SyncStatus, info?: { message?: string }) => void;

const listeners = new Set<Listener>();
export function onSyncStatus(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(status: SyncStatus, info?: { message?: string }) {
  listeners.forEach((fn) => fn(status, info));
}

let timer: ReturnType<typeof setInterval> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastSig: string | null = null;
let lastErrorAt = 0;
let inFlight = false;

/** رفع اللقطة الحالية */
export async function pushNow(reason: 'auto' | 'manual' = 'manual'): Promise<{ ok: boolean; conflict?: boolean; message?: string }> {
  const s = loadSession();
  if (!s) return { ok: false, message: 'الجهاز ما مربوط بالسحابة' };
  if (inFlight) return { ok: false, message: 'مزامنة شغالة حالياً' };
  if (!navigator.onLine) return { ok: false, message: 'ما في نت — هنرفع أول ما الشبكة ترجع' };
  inFlight = true;
  emit({ state: 'syncing' });
  try {
    const snap = buildSnapshot();
    const result = await api('/push', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        data: snap.data,
        meta: snap.meta,
        clientAt: new Date().toISOString(),
        device: s.deviceLabel,
        pushedBy: 'المالك',
        baseSnapshotAt: s.baseSnapshotAt,
      }),
    });
    lastSig = signature();
    updateSession({ lastPushAt: new Date().toISOString(), baseSnapshotAt: result.latestAt || new Date().toISOString() });
    if (result.conflict) {
      emit({ state: 'conflict', message: 'فيه نسخة أحدث من جهاز تاني على السحابة — راجع نافذة السحابة' });
      return { ok: true, conflict: true, message: 'اترفعت — بس فيه نسخة أحدث من جهاز تاني' };
    }
    emit({ state: 'synced', at: new Date().toISOString() });
    return { ok: true };
  } catch (err: any) {
    lastErrorAt = Date.now();
    const message = err?.message || 'فشل الرفع';
    if (err?.status === 401) {
      saveSession(null);
      stopAutoSync();
    }
    emit({ state: 'error', message });
    return { ok: false, message };
  } finally {
    inFlight = false;
  }
}

/** تنزيل أحدث لقطة (وتطبيقها لو apply=true) */
export async function pullLatest(apply: boolean): Promise<{
  ok: boolean; hasSnapshot?: boolean; clientAt?: string; applied?: number; message?: string;
}> {
  const s = loadSession();
  if (!s) return { ok: false, message: 'الجهاز ما مربوط بالسحابة' };
  if (inFlight) return { ok: false, message: 'مزامنة شغلة حالياً' };
  if (!navigator.onLine) return { ok: false, message: 'ما في نت' };
  inFlight = true;
  emit({ state: 'syncing' });
  try {
    const meta = await api('/latest', { headers: authHeaders() });
    if (!meta?.hasSnapshot) {
      emit({ state: 'synced', at: new Date().toISOString() });
      return { ok: true, hasSnapshot: false };
    }
    if (!apply) {
      emit({ state: 'synced', at: new Date().toISOString() });
      return { ok: true, hasSnapshot: true, clientAt: meta.clientAt };
    }
    const full = await api('/latest?full=1', { headers: authHeaders() });
    applyRemote(full.data);
    lastSig = signature();
    updateSession({ lastPullAt: new Date().toISOString(), baseSnapshotAt: full.clientAt });
    emit({ state: 'synced', at: new Date().toISOString() });
    return { ok: true, hasSnapshot: true, clientAt: full.clientAt, applied: 1 };
  } catch (err: any) {
    const message = err?.message || 'فشل التنزيل';
    if (err?.status === 401) {
      saveSession(null);
      stopAutoSync();
    }
    emit({ state: 'error', message });
    return { ok: false, message };
  } finally {
    inFlight = false;
  }
}

/** دورة المزامنة الذكية — بتشتغل كل 5 دقائق */
async function syncCycle(): Promise<void> {
  const s = loadSession();
  if (!s || !s.autoSync) return;
  if (!navigator.onLine) {
    emit({ state: 'offline', message: 'ما في نت — المزامنة واقفة مؤقتاً' });
    return;
  }
  const curSig = signature();
  const dirty = lastSig !== null && curSig !== lastSig;
  try {
    if (dirty) {
      await pushNow('auto');
      return;
    }
    // الجهاز نضيف — لو السحابة أحدث، انزّلها
    const meta = await api('/latest', { headers: authHeaders() });
    if (meta?.hasSnapshot && s.baseSnapshotAt && Date.parse(meta.clientAt) > Date.parse(s.baseSnapshotAt)) {
      await pullLatest(true);
    } else if (meta?.hasSnapshot && !s.baseSnapshotAt) {
      // أول مزامنة بعد الربط — الجهاز فاضي؟ خد السحابة. عنده حاجة؟ ارفعها.
      const hasLocal = (localStorage.getItem('hisabati_products') || '').length > 10;
      if (!hasLocal) await pullLatest(true);
      else await pushNow('auto');
    } else {
      emit({ state: 'synced', at: s.lastPushAt || s.lastPullAt || new Date().toISOString() });
    }
  } catch {
    // انتهت المهلة أو الشبكة قطعت — الدورة الجاية تعالج
  }
}

/** جدولة الرفع بعد تغيير — بيتندها من كل مكان */
export function schedulePush(): void {
  const s = loadSession();
  if (!s || !s.autoSync) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (navigator.onLine) void pushNow('auto');
  }, 20000); // 20 ثانية بعد آخر تغيير
}

/** مراقبة تغييرات localStorage (نافذة واحدة — storage event بيشتغل بين التابات بس) */
function watchLocalChanges(): void {
  if ((watchLocalChanges as any)._running) return;
  (watchLocalChanges as any)._running = true;
  setInterval(() => {
    const s = loadSession();
    if (!s || !s.autoSync) return;
    const curSig = signature();
    if (lastSig !== null && curSig !== lastSig) {
      schedulePush();
    }
  }, 10000);
}

/** تشغيل المزامنة التلقائية */
export function startAutoSync(): void {
  const s = loadSession();
  if (!s) return;
  lastSig = signature();
  if (timer) clearInterval(timer);
  timer = setInterval(() => void syncCycle(), 5 * 60 * 1000); // كل 5 دقائق
  watchLocalChanges();
  window.addEventListener('online', () => {
    emit({ state: 'linked-idle' });
    void syncCycle();
  });
  window.addEventListener('offline', () => {
    emit({ state: 'offline', message: 'ما في نت — الشغل المحلي مستمر والسحابة هترجع مع النت' });
  });
  void syncCycle();
}

export function stopAutoSync(): void {
  if (timer) { clearInterval(timer); timer = null; }
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  emit({ state: 'unconfigured' });
}

/** الحالة الحالية للعرض */
export function currentStatus(): SyncStatus {
  const s = loadSession();
  if (!s) return { state: 'unconfigured' };
  if (!navigator.onLine) return { state: 'offline', message: 'أوفلاين — الشغل مستمر' };
  return { state: 'linked-idle' };
}

/** فك الارتباط */
export function unlinkDevice(): void {
  stopAutoSync();
  saveSession(null);
}

/** التاريخ المحفوظ في السحابة */
export async function historyCloud(limit = 10): Promise<Array<{
  id: number; clientAt: string; device: string; sizeBytes: number; meta: Record<string, unknown>;
}>> {
  const res = await api(`/history?limit=${limit}`, { headers: authHeaders() });
  return res.snapshots || [];
}
