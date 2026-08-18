import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  showClose = true,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className={`w-full ${maxWidth} transform overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 text-left align-middle shadow-2xl transition-all duration-300 relative text-slate-100 glow-blue`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">{title}</h3>
              {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Content */}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
