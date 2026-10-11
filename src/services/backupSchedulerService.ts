/**
 * خدمة جدولة النسخ الاحتياطي — منطق نقي بدون DOM.
 * تُستخدم من AppContext (الجدولة التلقائية) وواجهة النسخ الاحتياطي والبانر التحذيري.
 */
import { BackupScheduleConfig } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** يقرأ التواريخ المخزنة (ISO أو 'YYYY-MM-DD HH:MM' القديمة) — يرجع null إذا غير صالحة */
export function parseBackupDate(value?: string): Date | null {
  if (!value) return null;
  const normalized = value.trim().replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/** هل حان موعد النسخة الاحتياطية حسب الجدولة؟ */
export function isBackupDue(schedule: BackupScheduleConfig, now: Date = new Date()): boolean {
  if (!schedule.enabled || schedule.frequency === 'disabled') return false;
  const last = parseBackupDate(schedule.lastBackupDate);
  if (!last) return true; // لم يتم نسخ احتياطي قط → مستحق فوراً
  const intervalMs =
    schedule.frequency === 'daily' ? DAY_MS : schedule.frequency === 'weekly' ? 7 * DAY_MS : 30 * DAY_MS;
  return now.getTime() - last.getTime() >= intervalMs;
}

/** عدد الأيام منذ آخر نسخة (null = لا توجد نسخة) */
export function daysSinceBackup(value?: string, now: Date = new Date()): number | null {
  const last = parseBackupDate(value);
  if (!last) return null;
  return Math.floor((now.getTime() - last.getTime()) / DAY_MS);
}

/** تنسيق التواريخ للعرض بأرقام عربية مفهومة */
export function formatBackupDate(value?: string): string {
  const d = parseBackupDate(value);
  if (!d) return value || 'لا توجد نسخة بعد';
  return d.toLocaleString('ar-SD', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** وصف مدة الانسحاق للبانر: «اليوم» / «منذ يومين» / «منذ 5 أيام» */
export function backupAgeLabel(value?: string, now: Date = new Date()): string {
  const days = daysSinceBackup(value, now);
  if (days === null) return 'لا توجد نسخة احتياطية بعد';
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days === 2) return 'منذ يومين';
  if (days <= 10) return `منذ ${days} أيام`;
  return `منذ ${days} يوماً`;
}
