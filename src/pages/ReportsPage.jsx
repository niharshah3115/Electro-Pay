import React, { useMemo } from 'react';
import { BarChart3, Download, TrendingUp, Users, MapPin, AlertCircle, Zap } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatINR } from '../utils/currencyUtils';
import { useToast } from '../context/ToastContext';

export function ReportsPage() {
  const { shopkeepers = [], payments = [] } = useBusiness();
  const { success } = useToast();

  // Route-wise aggregation
  const routeStats = useMemo(() => {
    const map = {};

    shopkeepers.forEach((sk) => {
      const route = sk.areaRoute || 'General Market';
      if (!map[route]) {
        map[route] = {
          route,
          shopkeepersCount: 0,
          totalOutstanding: 0,
          totalPaid: 0,
        };
      }
      map[route].shopkeepersCount += 1;
      map[route].totalOutstanding += Number(sk.totalOutstanding) || 0;
      map[route].totalPaid += Number(sk.totalPaidAmount) || 0;
    });

    return Object.values(map).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [shopkeepers]);

  // Top Debtors Ranking
  const topDebtors = useMemo(() => {
    return [...shopkeepers]
      .filter((s) => (Number(s.totalOutstanding) || 0) > 0)
      .sort((a, b) => (Number(b.totalOutstanding) || 0) - (Number(a.totalOutstanding) || 0))
      .slice(0, 10);
  }, [shopkeepers]);

  // Export Complete Statement as CSV
  const handleExportCSV = () => {
    const headers = ['Shop Name', 'Proprietor', 'Mobile Phone', 'Delivery Route', 'Bill Amount (INR)', 'Credit Days', 'Due Amount (INR)', 'Total Paid (INR)', 'Status'];
    const rows = shopkeepers.map((sk) => [
      `"${sk.shopName}"`,
      `"${sk.ownerName || ''}"`,
      `"${sk.phone}"`,
      `"${sk.areaRoute || ''}"`,
      sk.billAmount || 0,
      sk.creditDays || 35,
      sk.totalOutstanding || 0,
      sk.totalPaidAmount || 0,
      (Number(sk.totalOutstanding) || 0) > 0 ? 'PENDING_DUE' : 'CLEAR',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ElectroTrack_Receivables_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('CSV Exported', 'Receivables report downloaded successfully.');
  };

  const totalOutstanding = shopkeepers.reduce((acc, s) => acc + (Number(s.totalOutstanding) || 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const recoveryRate = totalOutstanding + totalPaid > 0 ? ((totalPaid / (totalOutstanding + totalPaid)) * 100).toFixed(1) : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Collection & Due Reports
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
              Receivables Intelligence
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyze 39-day credit health, route-wise collection performance, and export market data.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          icon={Download}
          onClick={handleExportCSV}
        >
          Export CSV Report
        </Button>
      </div>

      {/* Snapshot KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Collection Efficiency</span>
          <div className="text-2xl font-extrabold text-white">{recoveryRate}%</div>
          <p className="text-xs text-slate-400">{formatINR(totalPaid)} collected from total trade</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase">Total Market Due</span>
          <div className="text-2xl font-extrabold text-amber-400 font-sans">{formatINR(totalOutstanding)}</div>
          <p className="text-xs text-slate-400">{topDebtors.length} shopkeepers with balance</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-bold text-brand-400 uppercase">Delivery Routes</span>
          <div className="text-2xl font-extrabold text-white">{routeStats.length} Markets</div>
          <p className="text-xs text-slate-400">{shopkeepers.length} retailers across regions</p>
        </div>
      </div>

      {/* Route-Wise Breakdown Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-bold text-white">Route-Wise Credit & Collections Summary</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Market / Delivery Route</th>
                <th className="py-3.5 px-4 text-center">Retailers</th>
                <th className="py-3.5 px-4 text-right">Total Recoveries</th>
                <th className="py-3.5 px-4 text-right">Pending Due</th>
                <th className="py-3.5 px-4 text-right">Collection %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {routeStats.map((r) => {
                const totalBilled = r.totalOutstanding + r.totalPaid;
                const percent = totalBilled > 0 ? Math.round((r.totalPaid / totalBilled) * 100) : 100;
                return (
                  <tr key={r.route} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{r.route}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{r.shopkeepersCount}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 font-sans">{formatINR(r.totalPaid)}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-amber-400 font-sans">{formatINR(r.totalOutstanding)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-white font-mono">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 Outstanding Debtors */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Top 10 Outstanding Accounts</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Shop Name</th>
                <th className="py-3.5 px-4">Proprietor</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Delivery Route</th>
                <th className="py-3.5 px-4 text-right">Paid Amount</th>
                <th className="py-3.5 px-4 text-right">Due Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topDebtors.map((sk, idx) => (
                <tr key={sk.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{sk.shopName}</td>
                  <td className="py-3.5 px-4 text-slate-400">{sk.ownerName || '—'}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{sk.phone}</td>
                  <td className="py-3.5 px-4 text-slate-400">{sk.areaRoute || 'General Area'}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-sans">{formatINR(sk.totalPaidAmount || 0)}</td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-amber-400 font-sans text-sm">{formatINR(sk.totalOutstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
