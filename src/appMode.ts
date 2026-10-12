/**
 * نظام التطبيقين — نفس الموقع، تطبيقين منفصلين:
 *
 *   الإدارة:  sudan-accounts.vercel.app/       ← المالك: كل شيء (أرباح، مصروفات، موظفين، سحابة)
 *   العمال:   sudan-accounts.vercel.app/staff  ← الكاشير: نقطة بيع + فواتير + مخزون بس
 *
 * كل تطبيق له أيقونة واسم تثبيت خاص (manifest منفصل) — أندرويد بيثبتهم كتطبيقين حقيقيين،
 * والآيفون «Add to Home Screen» لكل لينك بيعمل أيقونة مستقلة.
 */

export type AppMode = 'admin' | 'staff';

function detectMode(): AppMode {
  if (typeof window === 'undefined') return 'admin';
  const p = window.location.pathname.replace(/\/+$/, '');
  return p === '/staff' || p.startsWith('/staff/') ? 'staff' : 'admin';
}

export const APP_MODE: AppMode = detectMode();
export const IS_STAFF_APP = APP_MODE === 'staff';
