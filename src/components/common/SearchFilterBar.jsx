import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search by name, phone, invoice...',
  filters = [],
  activeFilter,
  onFilterChange,
  extraActions,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs / Pills */}
      {filters.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 border border-brand-400/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Optional Extra Actions */}
      {extraActions && <div className="flex items-center gap-2 shrink-0">{extraActions}</div>}
    </div>
  );
}
