import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showBackOnlineToast, setShowBackOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnlineToast(true);
      setTimeout(() => setShowBackOnlineToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showBackOnlineToast) {
    return (
      <div className="no-print fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xl animate-in slide-in-from-bottom-2 fade-in">
        <Wifi className="w-4 h-4 text-emerald-200" />
        <span>تمت استعادة الاتصال بالإنترنت بنجاح! 🟢</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div className="no-print fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl border border-amber-400/40 animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
      <div>
        <span>وضع عدم الاتصال (Offline)</span>
        <span className="block text-[10px] text-amber-100 font-normal">
          النظام يعمل بكامل طاقته محلياً مع حفظ البيانات في جهازك ⚡
        </span>
      </div>
    </div>
  );
};
