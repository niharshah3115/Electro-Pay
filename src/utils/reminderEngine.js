/**
 * Pure reusable calculation engine for Payment Reminders
 * Independent from UI components.
 */

import { calculateDueDate, getTodayString, formatDate } from './dateUtils.js';
import { DEFAULT_CREDIT_DAYS } from '../constants/creditConfig.js';

export const REMINDER_PRIORITIES = {
  OVERDUE: 'OVERDUE',
  DUE_TODAY: 'DUE_TODAY',
  CALL_SOON: 'CALL_SOON',
  DUE_SOON: 'DUE_SOON',
  UPCOMING: 'UPCOMING',
};

/**
 * Calculates reminder priority and timing based on reference date (today).
 *
 * Rules:
 * - 7+ days remaining: UPCOMING
 * - 4-7 days remaining: DUE_SOON
 * - 1-3 days remaining: CALL_SOON
 * - 0 days: DUE_TODAY
 * - 1+ days past due: OVERDUE
 *
 * @param {string|Date} dueDateStr - YYYY-MM-DD
 * @param {number} outstandingAmount - Unpaid balance
 * @param {string|Date} [referenceDateStr] - Today or custom reference date
 * @returns {object|null} Calculation result or null if fully paid
 */
export function calculatePaymentReminderPriority(dueDateStr, outstandingAmount, referenceDateStr) {
  const balance = Number(outstandingAmount) || 0;
  if (balance <= 0) return null; // Only unpaid balances generate reminders

  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  ref.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  if (isNaN(due.getTime())) {
    return {
      priority: REMINDER_PRIORITIES.UPCOMING,
      label: 'Upcoming',
      badgeVariant: 'sky',
      diffDays: 99,
      daysRemaining: 99,
      daysOverdue: 0,
      timingText: 'Upcoming',
      isOverdue: false,
      isDueToday: false,
    };
  }

  const diffTime = due.getTime() - ref.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return {
      priority: REMINDER_PRIORITIES.OVERDUE,
      label: 'Overdue',
      badgeVariant: 'rose',
      diffDays,
      daysRemaining: 0,
      daysOverdue,
      timingText: `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`,
      isOverdue: true,
      isDueToday: false,
    };
  }

  if (diffDays === 0) {
    return {
      priority: REMINDER_PRIORITIES.DUE_TODAY,
      label: 'Due Today',
      badgeVariant: 'amber',
      diffDays: 0,
      daysRemaining: 0,
      daysOverdue: 0,
      timingText: 'Due today',
      isOverdue: false,
      isDueToday: true,
    };
  }

  if (diffDays >= 1 && diffDays <= 3) {
    return {
      priority: REMINDER_PRIORITIES.CALL_SOON,
      label: 'Call Soon (1-3 Days)',
      badgeVariant: 'amber',
      diffDays,
      daysRemaining: diffDays,
      daysOverdue: 0,
      timingText: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`,
      isOverdue: false,
      isDueToday: false,
    };
  }

  if (diffDays >= 4 && diffDays <= 7) {
    return {
      priority: REMINDER_PRIORITIES.DUE_SOON,
      label: 'Due Soon (4-7 Days)',
      badgeVariant: 'sky',
      diffDays,
      daysRemaining: diffDays,
      daysOverdue: 0,
      timingText: `${diffDays} days remaining`,
      isOverdue: false,
      isDueToday: false,
    };
  }

  // 7+ days remaining
  return {
    priority: REMINDER_PRIORITIES.UPCOMING,
    label: 'Upcoming (7+ Days)',
    badgeVariant: 'slate',
    diffDays,
    daysRemaining: diffDays,
    daysOverdue: 0,
    timingText: `${diffDays} days remaining`,
    isOverdue: false,
    isDueToday: false,
  };
}

/**
 * Transforms an array of shopkeepers with unpaid balances into prioritized reminder items.
 *
 * @param {Array} shopkeepers
 * @param {string} [referenceDateStr]
 * @returns {Array} List of reminder items with calculated priorities
 */
export function compileShopkeeperReminders(shopkeepers = [], referenceDateStr = getTodayString()) {
  const reminders = [];

  for (const sk of shopkeepers) {
    const outstanding = Number(sk.totalOutstanding) || 0;
    if (outstanding <= 0) continue; // Skip zero balance

    // Determine delivery and due date
    const creditDays = Number(sk.creditDays) || DEFAULT_CREDIT_DAYS;
    const deliveryDate = sk.deliveryDate || sk.invoiceDate || sk.createdAt?.split('T')[0] || referenceDateStr;
    const dueDate = sk.dueDate || calculateDueDate(deliveryDate, creditDays);

    const timing = calculatePaymentReminderPriority(dueDate, outstanding, referenceDateStr);
    if (!timing) continue;

    reminders.push({
      shopkeeperId: sk.id,
      shopkeeper: sk,
      phone: sk.phone,
      shopName: sk.shopName,
      ownerName: sk.ownerName || 'Proprietor',
      invoiceNumber: sk.invoiceNumber || `INV-${sk.id.slice(-6)}`,
      outstandingAmount: outstanding,
      totalBillAmount: (outstanding + (Number(sk.totalPaidAmount) || 0)) || Number(sk.billAmount) || outstanding,
      totalPaidAmount: Number(sk.totalPaidAmount) || 0,
      deliveryDate,
      invoiceDate: deliveryDate,
      dueDate,
      creditDays,
      ...timing,
    });
  }

  // Sort order: OVERDUE > DUE_TODAY > CALL_SOON > DUE_SOON > UPCOMING
  const rank = {
    [REMINDER_PRIORITIES.OVERDUE]: 0,
    [REMINDER_PRIORITIES.DUE_TODAY]: 1,
    [REMINDER_PRIORITIES.CALL_SOON]: 2,
    [REMINDER_PRIORITIES.DUE_SOON]: 3,
    [REMINDER_PRIORITIES.UPCOMING]: 4,
  };

  return reminders.sort((a, b) => {
    const diffRank = (rank[a.priority] ?? 99) - (rank[b.priority] ?? 99);
    if (diffRank !== 0) return diffRank;
    return b.outstandingAmount - a.outstandingAmount;
  });
}
