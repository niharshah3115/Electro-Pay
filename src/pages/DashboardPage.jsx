import React, { useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Wallet,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  Receipt,
  Phone,
  MessageSquare,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building2,
  CalendarCheck,
  Flame,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatINR } from '../utils/currencyUtils';
import { formatDate, getTodayString } from '../utils/dateUtils';
import { generateTelUrl } from '../utils/whatsappUtils';
import { compileShopkeeperReminders, REMINDER_PRIORITIES } from '../utils/reminderEngine';
import { PWAInstallBanner } from '../components/pwa/PWAInstallBanner';

export function DashboardPage() {
  const { shopkeepers = [], payments = [] } = useBusiness();
  const {
    onOpenAddShopkeeper = () => {},
    onOpenRecordPayment = () => {},
    onOpenLogCall = () => {},
    onOpenWhatsApp = () => {},
  } = useOutletContext() || {};

  const todayStr = getTodayString();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 1. Compile prioritized reminder queue from real Firestore data
  const attentionReminders = useMemo(() => {
    const allReminders = compileShopkeeperReminders(shopkeepers, todayStr);
    return allReminders.filter(
      (r) =>
        r.priority === REMINDER_PRIORITIES.OVERDUE ||
        r.priority === REMINDER_PRIORITIES.DUE_TODAY ||
        r.priority === REMINDER_PRIORITIES.CALL_SOON ||
        r.priority === REMINDER_PRIORITIES.DUE_SOON ||
        r.priority === REMINDER_PRIORITIES.UPCOMING
    );
  }, [shopkeepers, todayStr]);

  // 2. Real Firestore Financial KPI Calculations
  // 1) Total Outstanding
  const totalOutstanding = useMemo(() => {
    return shopkeepers.reduce((sum, sk) => sum + (Number(sk.totalOutstanding) || 0), 0);
  }, [shopkeepers]);

  // 2) Due Today
  const dueTodayAmount = useMemo(() => {
    return attentionReminders
      .filter((r) => r.priority === REMINDER_PRIORITIES.DUE_TODAY)
      .reduce((sum, r) => sum + (Number(r.outstandingAmount) || 0), 0);
  }, [attentionReminders]);

  // 3) Due This Week (0 to 7 days remaining, not overdue)
  const dueThisWeekAmount = useMemo(() => {
    return attentionReminders
      .filter(
        (r) =>
          (r.priority === REMINDER_PRIORITIES.DUE_TODAY ||
            r.priority === REMINDER_PRIORITIES.CALL_SOON ||
            r.priority === REMINDER_PRIORITIES.DUE_SOON) &&
          !r.isOverdue
      )
      .reduce((sum, r) => sum + (Number(r.outstandingAmount) || 0), 0);
  }, [attentionReminders]);

  // 4) Overdue
  const overdueAmount = useMemo(() => {
    return attentionReminders
      .filter((r) => r.priority === REMINDER_PRIORITIES.OVERDUE)
      .reduce((sum, r) => sum + (Number(r.outstandingAmount) || 0), 0);
  }, [attentionReminders]);

  // 5) Total Shopkeepers
  const totalShopkeepersCount = shopkeepers.length;

  // 6) Monthly Sales (Total billed in current calendar month)
  const monthlySales = useMemo(() => {
    return shopkeepers
      .filter((sk) => {
        const dateStr = sk.deliveryDate || sk.invoiceDate || sk.createdAt;
        if (!dateStr) return true;
        const d = new Date(dateStr);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, sk) => sum + ((Number(sk.totalOutstanding) || 0) + (Number(sk.totalPaidAmount) || 0) || Number(sk.billAmount) || 0), 0);
  }, [shopkeepers, currentMonth, currentYear]);

  // 7) Monthly Collections (Total payments recorded in current calendar month)
  const monthlyCollections = useMemo(() => {
    return payments
      .filter((p) => {
        if (!p.paymentDate) return true;
        const d = new Date(p.paymentDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments, currentMonth, currentYear]);

  // Recent 5 collections for side history
  const recentPayments = useMemo(() => {
    return [...payments].slice(0, 5);
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 border border-brand-500/20 shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs uppercase font-bold text-brand-400 tracking-wider">
              Real-time Firestore Connected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Distributor Collections Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            35-day credit terms, real-time balances, and prioritized reminder call queue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <Button
            variant="outline"
            size="md"
            icon={Plus}
            onClick={onOpenAddShopkeeper}
          >
            Add Shopkeeper
          </Button>

          <Button
            variant="emerald"
            size="md"
            icon={Receipt}
            onClick={() => onOpenRecordPayment()}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Core Financial KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 1. Total Outstanding */}
        <StatCard
          title="Total Outstanding"
          value={formatINR(totalOutstanding)}
          subtitle={`${attentionReminders.length} accounts with balance`}
          icon={Wallet}
          variant={totalOutstanding > 0 ? 'amber' : 'emerald'}
        />

        {/* 2. Due Today */}
        <StatCard
          title="Due Today"
          value={formatINR(dueTodayAmount)}
          subtitle="Matures today (35th day)"
          icon={CalendarCheck}
          variant={dueTodayAmount > 0 ? 'amber' : 'emerald'}
        />

        {/* 3. Due This Week */}
        <StatCard
          title="Due This Week"
          value={formatINR(dueThisWeekAmount)}
          subtitle="Next 7 days maturity"
          icon={Clock}
          variant="brand"
        />

        {/* 4. Overdue */}
        <StatCard
          title="Overdue"
          value={formatINR(overdueAmount)}
          subtitle="Past 35-day credit limit"
          icon={AlertTriangle}
          variant={overdueAmount > 0 ? 'rose' : 'emerald'}
        />

        {/* 5. Total Shopkeepers */}
        <Link to="/shopkeepers">
          <StatCard
            title="Total Shopkeepers"
            value={totalShopkeepersCount}
            subtitle="Registered retailer accounts"
            icon={Users}
            variant="purple"
          />
        </Link>

        {/* 6. Monthly Sales */}
        <StatCard
          title="Monthly Sales"
          value={formatINR(monthlySales)}
          subtitle="Current calendar month"
          icon={TrendingUp}
          variant="emerald"
        />

        {/* 7. Monthly Collections */}
        <StatCard
          title="Monthly Collections"
          value={formatINR(monthlyCollections)}
          subtitle="Collected payments this month"
          icon={Receipt}
          variant="emerald"
        />
      </div>

      {/* Main Section: Payments Requiring Attention & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Payments Requiring Attention */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Payments Requiring Attention</h2>
                <p className="text-xs text-slate-400">
                  Sorted by priority: 1. Overdue • 2. Due Today • 3. Due within 3 days • 4. Due within 7 days
                </p>
              </div>
            </div>

            <Link
              to="/reminders"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>Full Reminders Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {attentionReminders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">All Dues Cleared!</p>
              <p className="text-xs text-slate-400 mt-1">Zero pending payment balances requiring attention.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionReminders.map((item) => {
                let badgeVariant = 'slate';
                let badgeText = `${item.daysRemaining}D Left`;

                if (item.priority === REMINDER_PRIORITIES.OVERDUE) {
                  badgeVariant = 'rose';
                  badgeText = `OVERDUE (${item.daysOverdue}D)`;
                } else if (item.priority === REMINDER_PRIORITIES.DUE_TODAY) {
                  badgeVariant = 'amber';
                  badgeText = 'DUE TODAY';
                } else if (item.priority === REMINDER_PRIORITIES.CALL_SOON) {
                  badgeVariant = 'amber';
                  badgeText = `CALL SOON (${item.daysRemaining}D)`;
                } else if (item.priority === REMINDER_PRIORITIES.DUE_SOON) {
                  badgeVariant = 'sky';
                  badgeText = `DUE SOON (${item.daysRemaining}D)`;
                }

                return (
                  <div
                    key={item.shopkeeperId}
                    className={`p-4 rounded-2xl bg-slate-900/80 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${
                      item.priority === REMINDER_PRIORITIES.OVERDUE
                        ? 'border-rose-500/40 hover:border-rose-500/60 bg-gradient-to-r from-rose-950/15 to-slate-900/80'
                        : item.priority === REMINDER_PRIORITIES.DUE_TODAY
                        ? 'border-amber-500/40 hover:border-amber-500/60 bg-gradient-to-r from-amber-950/15 to-slate-900/80'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Left Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-sm">
                          {item.shopName}
                        </span>
                        <Badge variant={badgeVariant} dot size="sm">
                          {badgeText}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span className="font-mono text-slate-300 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-brand-400" />
                          {item.phone}
                        </span>
                        <span>•</span>
                        <span>
                          Delivered: <strong className="text-slate-200">{formatDate(item.deliveryDate)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Due: <strong className="text-slate-200">{formatDate(item.dueDate)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right Amount & Quick 1-Click Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Pending Due</span>
                        <span className="text-base font-extrabold text-amber-400 font-sans">
                          {formatINR(item.outstandingAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* 1. CALL Button */}
                        <a
                          href={generateTelUrl(item.phone)}
                          onClick={() => setTimeout(() => onOpenLogCall(item.shopkeeper), 1000)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-400 border border-slate-700 transition-colors text-xs font-bold shadow-sm"
                          title="Call Shopkeeper"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>

                        {/* 2. WHATSAPP Button */}
                        <button
                          onClick={() => onOpenWhatsApp({ shopkeeper: item.shopkeeper, timing: item })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 transition-colors text-xs font-bold shadow-sm cursor-pointer"
                          title="Send Personalized WhatsApp Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {/* 3. COLLECT Button */}
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => onOpenRecordPayment(item.shopkeeperId)}
                        >
                          Collect
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Payment Collections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Recent Collections</h2>
                <p className="text-xs text-slate-400">Real payment receipts</p>
              </div>
            </div>

            <Link
              to="/payments"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No collections recorded yet.</p>
              <Button
                variant="emerald"
                size="sm"
                className="mt-3"
                onClick={() => onOpenRecordPayment()}
              >
                Record Payment
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block">{p.shopkeeperName || p.shopName || 'Shopkeeper'}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-brand-300">#{p.receiptNumber}</span>
                      <span>•</span>
                      <span>{formatDate(p.paymentDate)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-emerald-400 font-sans text-sm block">
                      {formatINR(p.amount)}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                      {p.paymentMethod || p.paymentMode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
