import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  MapPin,
  AlertCircle,
  Zap,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Wallet,
  CreditCard,
  Building2,
  FileSpreadsheet,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PaymentReceiptModal } from '../components/payments/PaymentReceiptModal';
import { formatINR } from '../utils/currencyUtils';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';

export function ReportsPage() {
  const { shopkeepers = [], payments = [] } = useBusiness();
  const { success } = useToast();

  // Helper for current YYYY-MM
  const getCurrentMonthString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  // State for Month Filter and Tab
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [monthlyTab, setMonthlyTab] = useState('receipts'); // 'receipts' | 'shopkeepers'
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const formatShortMonth = (monthStr) => {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  };

  // Filter payments for the selected month
  const monthPayments = useMemo(() => {
    return payments.filter((p) => {
      const pDate = p.paymentDate || p.createdAt || '';
      return pDate.startsWith(selectedMonth);
    });
  }, [payments, selectedMonth]);

  // Monthly KPIs
  const monthlyTotalCollected = useMemo(() => {
    return monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [monthPayments]);

  const monthlyReceiptsCount = monthPayments.length;

  // Monthly Breakdown by Payment Mode
  const monthlyModeStats = useMemo(() => {
    const stats = {
      upi: { label: 'UPI / QR', total: 0, count: 0, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
      cash: { label: 'Cash Payment', total: 0, count: 0, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
      bank_transfer: { label: 'Bank / NEFT / RTGS', total: 0, count: 0, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
      cheque: { label: 'Cheque', total: 0, count: 0, icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    };

    monthPayments.forEach((p) => {
      const mode = (p.paymentMethod || p.paymentMode || 'upi').toLowerCase();
      const target = stats[mode] || stats.upi;
      target.total += Number(p.amount) || 0;
      target.count += 1;
    });

    return stats;
  }, [monthPayments]);

  // Party-wise aggregation for the selected month
  const monthlyShopkeeperStats = useMemo(() => {
    const map = new Map();

    monthPayments.forEach((p) => {
      const key = p.shopkeeperId || p.shopkeeperName || 'unknown';
      const sk = shopkeepers.find((s) => s.id === p.shopkeeperId);
      const name = sk?.shopName || p.shopkeeperName || 'General Retailer';
      const phone = sk?.phone || p.shopkeeperPhone || '—';

      if (!map.has(key)) {
        map.set(key, {
          shopkeeperId: p.shopkeeperId,
          shopName: name,
          phone,
          totalPaidInMonth: 0,
          receiptsCount: 0,
          latestDate: p.paymentDate,
          currentOutstanding: sk?.totalOutstanding || 0,
        });
      }

      const entry = map.get(key);
      entry.totalPaidInMonth += Number(p.amount) || 0;
      entry.receiptsCount += 1;
      if (new Date(p.paymentDate) > new Date(entry.latestDate)) {
        entry.latestDate = p.paymentDate;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalPaidInMonth - a.totalPaidInMonth);
  }, [monthPayments, shopkeepers]);

  // 6-Month Rolling Collection Trends
  const sixMonthTrends = useMemo(() => {
    const trends = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${y}-${m}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      const total = payments
        .filter((p) => (p.paymentDate || p.createdAt || '').startsWith(monthKey))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      trends.push({ monthKey, label, total });
    }

    const maxTotal = Math.max(...trends.map((t) => t.total), 1);
    return trends.map((t) => ({ ...t, pct: Math.round((t.total / maxTotal) * 100) }));
  }, [payments]);

  // Route-wise aggregation (Overall)
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

  // Top Debtors Ranking (Overall)
  const topDebtors = useMemo(() => {
    return [...shopkeepers]
      .filter((s) => (Number(s.totalOutstanding) || 0) > 0)
      .sort((a, b) => (Number(b.totalOutstanding) || 0) - (Number(a.totalOutstanding) || 0))
      .slice(0, 10);
  }, [shopkeepers]);

  // Overall totals
  const totalOutstanding = shopkeepers.reduce((acc, s) => acc + (Number(s.totalOutstanding) || 0), 0);
  const totalPaidOverall = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const recoveryRate = totalOutstanding + totalPaidOverall > 0
    ? ((totalPaidOverall / (totalOutstanding + totalPaidOverall)) * 100).toFixed(1)
    : 100;

  // Export Monthly Collections as CSV
  const handleExportMonthlyCSV = () => {
    if (monthPayments.length === 0) {
      success('No Records', `No collection receipts found for ${formatMonthName(selectedMonth)}.`);
      return;
    }

    const headers = ['Receipt #', 'Date', 'Shop Name', 'Invoice / Bill Ref', 'Payment Method', 'Notes / Reference', 'Amount Collected (INR)'];
    const rows = monthPayments.map((p) => {
      const sk = shopkeepers.find((s) => s.id === p.shopkeeperId);
      const sName = sk?.shopName || p.shopkeeperName || 'General Party';
      const method = (p.paymentMethod || p.paymentMode || 'upi').replace('_', ' ').toUpperCase();
      return [
        `"${p.receiptNumber || 'REC'}"`,
        `"${formatDate(p.paymentDate)}"`,
        `"${sName}"`,
        `"${p.invoiceNumber || 'GENERAL'}"`,
        `"${method}"`,
        `"${(p.notes || p.referenceNumber || '').replace(/"/g, '""')}"`,
        Number(p.amount) || 0,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ElectroTrack_Collections_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Monthly CSV Exported', `Downloaded collections report for ${formatMonthName(selectedMonth)}.`);
  };

  // Export Complete Receivables Statement as CSV
  const handleExportGeneralCSV = () => {
    const headers = ['Shop Name', 'Mobile Phone', 'Delivery Route', 'Bill Amount (INR)', 'Credit Days', 'Due Amount (INR)', 'Total Paid (INR)', 'Status'];
    const rows = shopkeepers.map((sk) => [
      `"${sk.shopName}"`,
      `"${sk.phone}"`,
      `"${sk.areaRoute || ''}"`,
      sk.billAmount || 0,
      sk.creditDays || 39,
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

    success('Receivables CSV Exported', 'Receivables report downloaded successfully.');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
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
            Track monthly collections, analyze payment methods, inspect route performance, and export audit sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportGeneralCSV}
          >
            Export All Receivables
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 MONTHLY COLLECTION INTELLIGENCE SECTION */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-slate-900/90 border border-brand-500/25 p-6 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Title & Month Picker Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  Monthly Collection Report
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {formatMonthName(selectedMonth)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed recoveries and receipts recorded during {formatMonthName(selectedMonth)}.
              </p>
            </div>
          </div>

          {/* Month Controller & Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Month Selector Buttons */}
            <div className="inline-flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-white px-2 py-1 focus:outline-none cursor-pointer"
              />

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setSelectedMonth(getCurrentMonthString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedMonth === getCurrentMonthString()
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              This Month
            </button>

            <Button
              variant="emerald"
              size="sm"
              icon={FileSpreadsheet}
              onClick={handleExportMonthlyCSV}
            >
              Export {formatShortMonth(selectedMonth)} CSV
            </Button>
          </div>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Recovered in Month */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Collected ({formatShortMonth(selectedMonth)})
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-sans tracking-tight">
              {formatINR(monthlyTotalCollected)}
            </div>
            <p className="text-xs text-slate-400">
              Across <strong className="text-white">{monthlyReceiptsCount}</strong> payment receipts
            </p>
          </div>

          {/* 2. Unique Paying Retailers */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Paying Retailers
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              {monthlyShopkeeperStats.length}
            </div>
            <p className="text-xs text-slate-400">
              Shops that made payments this month
            </p>
          </div>

          {/* 3. Average Payment Receipt */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Average Receipt Amount
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-300 font-sans tracking-tight">
              {formatINR(monthlyReceiptsCount > 0 ? Math.round(monthlyTotalCollected / monthlyReceiptsCount) : 0)}
            </div>
            <p className="text-xs text-slate-400">
              Per collection transaction
            </p>
          </div>

          {/* 4. Total Market Due Reference */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Current Market Due
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-sans tracking-tight">
              {formatINR(totalOutstanding)}
            </div>
            <p className="text-xs text-slate-400">
              Across total {shopkeepers.length} active retailers
            </p>
          </div>
        </div>

        {/* 6-Month Visual Collection Trend Bar Chart & Payment Modes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 6-Month Comparison Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  6-Month Collection Trend
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Click any month to inspect</span>
            </div>

            <div className="grid grid-cols-6 gap-2 pt-4 items-end h-36">
              {sixMonthTrends.map((t) => {
                const isSelected = t.monthKey === selectedMonth;
                return (
                  <div
                    key={t.monthKey}
                    onClick={() => setSelectedMonth(t.monthKey)}
                    className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors truncate max-w-full">
                      {t.total > 0 ? formatINR(t.total) : '₹0'}
                    </div>
                    <div className="w-full bg-slate-900 rounded-t-lg h-24 flex items-end p-0.5 overflow-hidden">
                      <div
                        style={{ height: `${Math.max(t.pct, 6)}%` }}
                        className={`w-full rounded-t transition-all duration-500 ${
                          isSelected
                            ? 'bg-gradient-to-t from-brand-600 to-brand-400 shadow-lg shadow-brand-500/30'
                            : 'bg-slate-700/80 group-hover:bg-slate-600'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-bold transition-colors ${
                        isSelected ? 'text-brand-300' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Breakdown for Selected Month */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Payment Modes ({formatShortMonth(selectedMonth)})
              </h3>
            </div>

            <div className="space-y-2 pt-1">
              {Object.entries(monthlyModeStats).map(([key, item]) => {
                const Icon = item.icon;
                const share = monthlyTotalCollected > 0 ? Math.round((item.total / monthlyTotalCollected) * 100) : 0;

                return (
                  <div
                    key={key}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${item.bg}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <div>
                        <div className="text-xs font-bold text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.count} receipts ({share}%)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-extrabold font-sans ${item.color}`}>
                        {formatINR(item.total)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Transactions & Retailer Breakdown Tabs */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonthlyTab('receipts')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  monthlyTab === 'receipts'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>All Receipts in {formatShortMonth(selectedMonth)} ({monthlyReceiptsCount})</span>
              </button>

              <button
                onClick={() => setMonthlyTab('shopkeepers')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  monthlyTab === 'shopkeepers'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Party-Wise Summary ({monthlyShopkeeperStats.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Showing records for <strong className="text-white">{formatMonthName(selectedMonth)}</strong>
            </div>
          </div>

          {/* View 1: All Monthly Receipts Table */}
          {monthlyTab === 'receipts' && (
            <div className="space-y-3">
              {monthPayments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                  <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    No payment receipts recorded for {formatMonthName(selectedMonth)}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Receipt #</th>
                        <th className="py-3.5 px-4">Payment Date</th>
                        <th className="py-3.5 px-4">Retailer / Shop Name</th>
                        <th className="py-3.5 px-4">Invoice / Bill Ref</th>
                        <th className="py-3.5 px-4">Mode</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">Notes / Ref</th>
                        <th className="py-3.5 px-4 text-right">Amount Paid</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {monthPayments.map((p) => {
                        const sk = shopkeepers.find((s) => s.id === p.shopkeeperId);
                        const sName = sk?.shopName || p.shopkeeperName || 'General Party';
                        const method = (p.paymentMethod || p.paymentMode || 'upi').toLowerCase();

                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                              {p.receiptNumber || 'REC'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                              {formatDate(p.paymentDate)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                              {sName}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-brand-300 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-[11px]">
                                #{p.invoiceNumber || 'GENERAL'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="uppercase font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                                {method.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-400 hidden md:table-cell truncate max-w-[160px]">
                              {p.notes || p.referenceNumber || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 font-sans text-sm whitespace-nowrap">
                              {formatINR(p.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedPayment(p)}
                                className="text-xs font-semibold text-brand-400 hover:underline cursor-pointer"
                              >
                                View Voucher
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* View 2: Party-Wise Monthly Summary Table */}
          {monthlyTab === 'shopkeepers' && (
            <div className="space-y-3">
              {monthlyShopkeeperStats.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    No party collections recorded for {formatMonthName(selectedMonth)}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">#</th>
                        <th className="py-3.5 px-4">Retailer / Shop Name</th>
                        <th className="py-3.5 px-4">Mobile Phone</th>
                        <th className="py-3.5 px-4 text-center">Receipts Count</th>
                        <th className="py-3.5 px-4">Latest Payment</th>
                        <th className="py-3.5 px-4 text-right">Current Due</th>
                        <th className="py-3.5 px-4 text-right">Paid in {formatShortMonth(selectedMonth)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {monthlyShopkeeperStats.map((sk, idx) => (
                        <tr key={sk.shopkeeperId || idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">{sk.shopName}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{sk.phone}</td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                            {sk.receiptsCount}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{formatDate(sk.latestDate)}</td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-amber-400 font-sans">
                            {formatINR(sk.currentOutstanding)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 font-sans text-sm whitespace-nowrap">
                            {formatINR(sk.totalPaidInMonth)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OVERALL MARKET METRICS & ROUTE PERFORMANCE */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Overall Market & Route Analysis</h2>
            <p className="text-xs text-slate-400">Lifetime distribution metrics and route recoveries.</p>
          </div>
        </div>

        {/* Snapshot KPI Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Recovery Rate</span>
            <div className="text-2xl font-extrabold text-white">{recoveryRate}%</div>
            <p className="text-xs text-slate-400">{formatINR(totalPaidOverall)} total collections recorded</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase">Total Market Due</span>
            <div className="text-2xl font-extrabold text-amber-400 font-sans">{formatINR(totalOutstanding)}</div>
            <p className="text-xs text-slate-400">{topDebtors.length} shopkeepers with balance</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-brand-400 uppercase">Active Delivery Routes</span>
            <div className="text-2xl font-extrabold text-white">{routeStats.length} Markets</div>
            <p className="text-xs text-slate-400">{shopkeepers.length} retailers across regions</p>
          </div>
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

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />
    </div>
  );
}

