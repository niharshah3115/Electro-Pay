import React from 'react';
import { calculateAgingBreakdown } from '../../utils/agingUtils';
import { formatINR } from '../../utils/currencyUtils';

export function AgingBreakdownChart({ invoices = [] }) {
  const { breakdown, totalOutstanding, totalInvoices } = calculateAgingBreakdown(invoices);

  const buckets = [
    {
      key: 'current',
      title: '0 - 30 Days',
      subtitle: 'On Track (Normal Credit)',
      amount: breakdown.current.amount,
      count: breakdown.current.count,
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      badgeClass: 'bg-emerald-500/10 text-emerald-400',
      action: 'No action needed',
    },
    {
      key: 'approaching',
      title: '31 - 39 Days',
      subtitle: 'Approaching Due Date',
      amount: breakdown.approaching.amount,
      count: breakdown.approaching.count,
      barColor: 'bg-amber-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      badgeClass: 'bg-amber-500/10 text-amber-400',
      action: 'Send gentle reminder',
    },
    {
      key: 'overdue_l1',
      title: '1 - 15 Days Overdue',
      subtitle: '40 - 54 Days Elapsed',
      amount: breakdown.overdue_l1.amount,
      count: breakdown.overdue_l1.count,
      barColor: 'bg-orange-500',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/20',
      badgeClass: 'bg-orange-500/10 text-orange-400',
      action: 'Phone follow-up',
    },
    {
      key: 'overdue_l2',
      title: '16 - 30 Days Overdue',
      subtitle: '55 - 69 Days Elapsed',
      amount: breakdown.overdue_l2.amount,
      count: breakdown.overdue_l2.count,
      barColor: 'bg-rose-500',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/20',
      badgeClass: 'bg-rose-500/10 text-rose-400',
      action: 'Urgent collection visit',
    },
    {
      key: 'critical',
      title: '30+ Days Overdue',
      subtitle: '70+ Days (Critical Risk)',
      amount: breakdown.critical.amount,
      count: breakdown.critical.count,
      barColor: 'bg-red-600',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      badgeClass: 'bg-red-600/20 text-red-400',
      action: 'Supply hold & recovery',
    },
  ];

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">39-Day Credit Aging Analysis</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time market receivables aging breakdown across {totalInvoices} unpaid invoices
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding</span>
          <p className="text-xl font-extrabold text-white font-sans">{formatINR(totalOutstanding)}</p>
        </div>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex shadow-inner border border-slate-800">
          {buckets.map((b) => {
            const pct = totalOutstanding > 0 ? (b.amount / totalOutstanding) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={b.key}
                className={`${b.barColor} h-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${b.title}: ${formatINR(b.amount)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {buckets.map((b) => {
          const pct = totalOutstanding > 0 ? ((b.amount / totalOutstanding) * 100).toFixed(1) : 0;
          return (
            <div
              key={b.key}
              className={`p-3.5 rounded-xl bg-slate-950/70 border ${b.borderColor} flex flex-col justify-between space-y-3 transition-all hover:bg-slate-950`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{b.title}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.badgeClass}`}>
                    {b.count} {b.count === 1 ? 'bill' : 'bills'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{b.subtitle}</p>
              </div>

              <div>
                <div className={`text-base font-extrabold font-sans ${b.textColor}`}>{formatINR(b.amount)}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>{pct}% of market</span>
                  <span className="font-semibold text-slate-300">{b.action}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
