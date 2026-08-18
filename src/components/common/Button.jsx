import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] select-none rounded-xl';

  const variants = {
    primary:
      'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-lg shadow-brand-500/25 focus:ring-brand-400 border border-brand-400/30',
    secondary:
      'bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 border border-slate-700 focus:ring-slate-500 shadow-sm',
    emerald:
      'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 focus:ring-emerald-400 border border-emerald-400/30',
    amber:
      'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold shadow-lg shadow-amber-500/25 focus:ring-amber-400 border border-amber-400/30',
    rose:
      'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-lg shadow-rose-600/25 focus:ring-rose-400 border border-rose-400/30',
    outline:
      'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:ring-slate-500',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 focus:ring-slate-500',
    whatsapp:
      'bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-slate-950 font-semibold shadow-lg shadow-[#25D366]/25 focus:ring-[#25D366]/50 border border-[#25D366]/40',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg',
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 gap-2 rounded-xl',
    lg: 'text-base px-5 py-2.5 gap-2.5 rounded-xl font-semibold',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}
