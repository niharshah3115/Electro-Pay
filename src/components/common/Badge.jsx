import React from 'react';

export function Badge({
  children,
  variant = 'brand',
  size = 'md',
  dot = false,
  className = '',
}) {
  const variants = {
    brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    orange: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    red: 'bg-red-600/20 text-red-300 border-red-500/35',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  };

  const dotColors = {
    brand: 'bg-brand-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    orange: 'bg-orange-400',
    rose: 'bg-rose-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400',
    sky: 'bg-sky-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-md gap-1.5',
    md: 'text-xs px-2.5 py-1 font-medium rounded-lg gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold rounded-lg gap-2',
  };

  return (
    <span
      className={`inline-flex items-center border font-sans tracking-wide ${variants[variant] || variants.brand} ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || 'bg-brand-400'}`} />}
      {children}
    </span>
  );
}
