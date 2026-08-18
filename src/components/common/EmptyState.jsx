import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 shadow-lg shadow-brand-500/10">
          <Icon className="w-7 h-7" />
        </div>
      )}

      <h4 className="text-base sm:text-lg font-bold text-white mb-1.5">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
