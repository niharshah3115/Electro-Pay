import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PhoneCall, AlertTriangle, Calendar, Clock, CheckCircle2, Bell } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { CallQueueCard } from '../components/reminders/CallQueueCard';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR } from '../utils/currencyUtils';
import { getTodayString } from '../utils/dateUtils';
import { compileShopkeeperReminders, REMINDER_PRIORITIES } from '../utils/reminderEngine';

export function CallQueuePage() {
  const { shopkeepers = [] } = useBusiness();
  const {
    onOpenRecordPayment = () => {},
    onOpenLogCall = () => {},
    onOpenWhatsApp = () => {},
  } = useOutletContext() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const todayStr = getTodayString();

  // Compile reminders using the reusable reminder engine
  const allReminders = useMemo(() => {
    return compileShopkeeperReminders(shopkeepers, todayStr);
  }, [shopkeepers, todayStr]);

  // Priority counts
  const overdueList = allReminders.filter((i) => i.priority === REMINDER_PRIORITIES.OVERDUE);
  const dueTodayList = allReminders.filter((i) => i.priority === REMINDER_PRIORITIES.DUE_TODAY);
  const dueWithin3DaysList = allReminders.filter((i) => i.priority === REMINDER_PRIORITIES.CALL_SOON);
  const dueWithin7DaysList = allReminders.filter((i) => i.priority === REMINDER_PRIORITIES.DUE_SOON);

  // Financial totals
  const overdueTotal = overdueList.reduce((sum, i) => sum + i.outstandingAmount, 0);
  const dueTodayTotal = dueTodayList.reduce((sum, i) => sum + i.outstandingAmount, 0);
  const due3DaysTotal = dueWithin3DaysList.reduce((sum, i) => sum + i.outstandingAmount, 0);
  const due7DaysTotal = dueWithin7DaysList.reduce((sum, i) => sum + i.outstandingAmount, 0);
  const totalUnpaidDues = allReminders.reduce((sum, i) => sum + i.outstandingAmount, 0);

  const filterPills = [
    { id: 'all', label: 'All Unpaid Reminders', count: allReminders.length },
    { id: 'overdue', label: 'Overdue Payments', count: overdueList.length },
    { id: 'due_today', label: 'Due Today (0D)', count: dueTodayList.length },
    { id: 'due_3_days', label: 'Due within 3 Days (1-3D)', count: dueWithin3DaysList.length },
    { id: 'due_7_days', label: 'Due within 7 Days (4-7D)', count: dueWithin7DaysList.length },
  ];

  const filteredReminders = useMemo(() => {
    return allReminders.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.shopName?.toLowerCase().includes(q) ||
        item.ownerName?.toLowerCase().includes(q) ||
        item.phone?.includes(q) ||
        item.invoiceNumber?.toLowerCase().includes(q) ||
        item.shopkeeper.areaRoute?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (activeFilter === 'overdue') return item.priority === REMINDER_PRIORITIES.OVERDUE;
      if (activeFilter === 'due_today') return item.priority === REMINDER_PRIORITIES.DUE_TODAY;
      if (activeFilter === 'due_3_days') return item.priority === REMINDER_PRIORITIES.CALL_SOON;
      if (activeFilter === 'due_7_days') return item.priority === REMINDER_PRIORITIES.DUE_SOON;

      return true;
    });
  }, [allReminders, searchQuery, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Payment Reminders & Due Priorities
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {allReminders.length} Unpaid Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated priority engine based on 39-day credit due dates: Overdue, Due Today, 1-3 Days, and 4-7 Days.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400 block font-semibold">Total Market Due</span>
          <span className="text-xl font-extrabold text-amber-400 font-sans">{formatINR(totalUnpaidDues)}</span>
        </div>
      </div>

      {/* 4 Category Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Overdue */}
        <div
          onClick={() => setActiveFilter('overdue')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'overdue'
              ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase">Overdue Payments</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {overdueList.length}
            </span>
          </div>
          <div className="text-xl font-extrabold text-white mt-1.5 font-sans">{formatINR(overdueTotal)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">1+ days past credit term</p>
        </div>

        {/* Due Today */}
        <div
          onClick={() => setActiveFilter('due_today')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'due_today'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase">Due Today</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {dueTodayList.length}
            </span>
          </div>
          <div className="text-xl font-extrabold text-white mt-1.5 font-sans">{formatINR(dueTodayTotal)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">0 days remaining</p>
        </div>

        {/* Due in 3 Days */}
        <div
          onClick={() => setActiveFilter('due_3_days')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'due_3_days'
              ? 'bg-amber-950/30 border-amber-400 shadow-lg shadow-amber-400/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase">Due within 3 Days</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
              {dueWithin3DaysList.length}
            </span>
          </div>
          <div className="text-xl font-extrabold text-white mt-1.5 font-sans">{formatINR(due3DaysTotal)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">1-3 days remaining</p>
        </div>

        {/* Due in 7 Days */}
        <div
          onClick={() => setActiveFilter('due_7_days')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'due_7_days'
              ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase">Due within 7 Days</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
              {dueWithin7DaysList.length}
            </span>
          </div>
          <div className="text-xl font-extrabold text-white mt-1.5 font-sans">{formatINR(due7DaysTotal)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">4-7 days remaining</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search reminders by shop name, owner, invoice #, route..."
        filters={filterPills}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Reminder Cards Grid */}
      {filteredReminders.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Payment Reminders Found"
          description={
            searchQuery || activeFilter !== 'all'
              ? 'No unpaid accounts matched your current search filters.'
              : 'Zero pending due balances! All shopkeepers have cleared their accounts.'
          }
          actionLabel={searchQuery || activeFilter !== 'all' ? 'Clear Filters' : 'Refresh'}
          onAction={() => {
            if (searchQuery || activeFilter !== 'all') {
              setSearchQuery('');
              setActiveFilter('all');
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReminders.map((item) => (
            <CallQueueCard
              key={item.shopkeeperId}
              item={item}
              onOpenLogCall={onOpenLogCall}
              onOpenWhatsApp={onOpenWhatsApp}
              onOpenRecordPayment={onOpenRecordPayment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
