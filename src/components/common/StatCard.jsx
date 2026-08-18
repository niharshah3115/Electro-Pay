import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'brand',
  actionLabel,
  onAction,
  className = '',
}) {
  const colorSchemes = {
    brand: {
      border: 'border-brand-500/20 hover:border-brand-500/40',
      bgGlow: 'from-brand-500/10 via-transparent to-transparent',
      iconBg: 'bg-brand-500/15 text-brand-400 border border-brand-500/30',
      textAccent: 'text-brand-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bgGlow: 'from-amber-500/10 via-transparent to-transparent',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      textAccent: 'text-amber-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bgGlow: 'from-emerald-500/10 via-transparent to-transparent',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      textAccent: 'text-emerald-400',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      bgGlow: 'from-rose-500/10 via-transparent to-transparent',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      textAccent: 'text-rose-400',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bgGlow: 'from-purple-500/10 via-transparent to-transparent',
      iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
      textAccent: 'text-purple-400',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.brand;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/80 p-5 border ${scheme.border} backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${className}`}
    >
      <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${scheme.bgGlow} rounded-full blur-2xl pointer-events-none -mr-10 -mt-10`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-white">{value}</h3>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {trend && (
            <span className={`font-semibold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.positive ? '↑' : '↓'} {trend.text}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className={`text-xs font-semibold ${scheme.textAccent} hover:underline focus:outline-none`}
          >
            {actionLabel} →
          </button>
        )}
      </div>
    </div>
  );
}
