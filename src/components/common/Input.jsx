import React from 'react';

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  required,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          id={inputId}
          required={required}
          className={`block w-full rounded-xl border bg-slate-950/60 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-3.5 py-2.5 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-700/80 hover:border-slate-600 focus:border-brand-500'
          } ${className}`}
          {...props}
        />
      </div>

      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  helperText,
  options = [],
  className = '',
  id,
  required,
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <select
        id={selectId}
        required={required}
        className={`block w-full rounded-xl border bg-slate-950/80 text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
          error
            ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-700/80 hover:border-slate-600 focus:border-brand-500'
        } ${className}`}
        {...props}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))}
      </select>

      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
}
