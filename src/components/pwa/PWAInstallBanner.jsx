import React from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';
import { Button } from '../common/Button';

export function PWAInstallBanner() {
  const { isInstalled, bannerDismissed, dismissBanner, promptInstall, isIOS } = usePWA();

  // If already installed or dismissed, do not render
  if (isInstalled || bannerDismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-950 via-slate-900 to-slate-900 border border-brand-500/30 p-4 sm:p-5 shadow-xl transition-all">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300 shrink-0 shadow-inner">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                📱 Install ElectroTrack App
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                PWA Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Install on your phone or desktop for faster 1-tap access and standalone app experience.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={dismissBanner}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors text-xs cursor-pointer"
            title="Dismiss banner"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>

          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={promptInstall}
            className="font-black tracking-wide shadow-lg shadow-brand-500/25"
          >
            {isIOS ? 'HOW TO INSTALL' : 'INSTALL APP'}
          </Button>
        </div>
      </div>
    </div>
  );
}
