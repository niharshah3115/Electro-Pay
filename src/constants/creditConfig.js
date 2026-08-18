/**
 * Core business rules for electrical goods distribution credit management
 */

export const DEFAULT_CREDIT_DAYS = 35;

export const AGING_BUCKETS = {
  CURRENT: {
    id: 'current',
    label: '0 - 25 Days (On Track)',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    minDays: 0,
    maxDays: 25,
  },
  APPROACHING: {
    id: 'approaching',
    label: '26 - 35 Days (Approaching Due)',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    minDays: 26,
    maxDays: 35,
  },
  OVERDUE_L1: {
    id: 'overdue_l1',
    label: '1 - 15 Days Overdue',
    color: 'orange',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    minDays: 36,
    maxDays: 50,
  },
  OVERDUE_L2: {
    id: 'overdue_l2',
    label: '16 - 30 Days Overdue',
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    minDays: 51,
    maxDays: 65,
  },
  CRITICAL: {
    id: 'critical',
    label: '30+ Days Overdue (Critical)',
    color: 'red',
    badgeClass: 'bg-red-600/20 text-red-400 border-red-500/30',
    minDays: 66,
    maxDays: 9999,
  },
};

export const INVOICE_STATUS = {
  PAID: 'paid',
  DUE_TODAY: 'due_today',
  UPCOMING: 'upcoming',
  OVERDUE: 'overdue',
};
