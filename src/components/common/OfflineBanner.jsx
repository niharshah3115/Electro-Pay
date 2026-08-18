import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export function OfflineBanner() {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <aside
      aria-label="Offline Alert"
      role="status"
      className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold shadow-lg flex items-center justify-center gap-2 border-b border-amber-400 z-50 sticky top-0 animate-fade-in select-none"
    >
      <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
      <span>
        You're offline. Some data may not be available until your connection is restored.
      </span>
    </aside>
  );
}
