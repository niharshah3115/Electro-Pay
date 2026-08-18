import React from 'react';
import { X, Share, PlusSquare, CheckCircle, Zap } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export function IOSInstallModal() {
  const { showIOSModal, setShowIOSModal, isIOS } = usePWA();

  if (!showIOSModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-brand-500/30 p-6 shadow-2xl space-y-6 text-slate-100">
        {/* Close button */}
        <button
          onClick={() => setShowIOSModal(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Install ElectroTrack</h3>
            <p className="text-xs text-brand-300 font-medium">
              {isIOS ? 'iPhone / iPad Installation Guide' : 'Add to Home Screen'}
            </p>
          </div>
        </div>

        {/* Instructions list */}
        <div className="space-y-4 rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
          <p className="text-xs text-slate-300 font-medium">
            To install ElectroTrack on your {isIOS ? 'iPhone or iPad' : 'device'}:
          </p>

          <div className="space-y-3.5 text-xs text-slate-200">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-white">Tap the Share button</span>
                <p className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                  Located at the bottom of Safari <Share className="w-3.5 h-3.5 text-brand-400 inline" />
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-white">Select "Add to Home Screen"</span>
                <p className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                  Scroll down the share sheet <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-white">Tap "Add"</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Top-right corner. ElectroTrack will now launch like a native standalone app!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits badge */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/40 px-3.5 py-2.5 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Fullscreen standalone app
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> 1-tap instant open
          </span>
        </div>

        {/* Action button */}
        <button
          onClick={() => setShowIOSModal(false)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
