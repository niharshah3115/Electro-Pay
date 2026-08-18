import { DEFAULT_CREDIT_DAYS, INVOICE_STATUS } from '../constants/creditConfig.js';

/**
 * Calculates due date by adding creditDays (default 39) to invoiceDate
 * @param {string|Date} invoiceDateStr - YYYY-MM-DD
 * @param {number} creditDays - default 39
 * @returns {string} - YYYY-MM-DD
 */
export function calculateDueDate(invoiceDateStr, creditDays = DEFAULT_CREDIT_DAYS) {
  if (!invoiceDateStr) return '';
  const date = new Date(invoiceDateStr);
  if (isNaN(date.getTime())) return '';
  
  // Add credit days
  date.setDate(date.getDate() + Number(creditDays));
  return date.toISOString().split('T')[0];
}

/**
 * Returns today's date in YYYY-MM-DD string format
 */
export function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Formats a YYYY-MM-DD date into Indian English format (e.g. 18 Aug 2026 or 18/08/2026)
 */
export function formatDate(dateStr, format = 'medium') {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  if (format === 'short') {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats date and time
 */
export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '—';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Calculates days elapsed between invoice date and today
 */
export function getDaysElapsed(invoiceDateStr) {
  if (!invoiceDateStr) return 0;
  const start = new Date(invoiceDateStr);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Determines exact status based on dueDate and balanceAmount
 * Returns { status, diffDays, label, badgeColor }
 */
export function calculateInvoiceStatus(dueDateStr, balanceAmount, totalAmount) {
  const balance = Number(balanceAmount) || 0;
  if (balance <= 0) {
    return {
      status: INVOICE_STATUS.PAID,
      diffDays: 0,
      label: 'Paid',
      badgeColor: 'emerald',
      isOverdue: false,
      isDueToday: false,
      isUpcoming: false,
    };
  }

  if (!dueDateStr) {
    return {
      status: INVOICE_STATUS.UPCOMING,
      diffDays: 0,
      label: 'Active',
      badgeColor: 'blue',
      isOverdue: false,
      isDueToday: false,
      isUpcoming: true,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    // Overdue
    return {
      status: INVOICE_STATUS.OVERDUE,
      diffDays,
      label: `${diffDays}d Overdue`,
      badgeColor: diffDays > 30 ? 'red' : diffDays > 15 ? 'rose' : 'orange',
      isOverdue: true,
      isDueToday: false,
      isUpcoming: false,
    };
  } else if (diffDays === 0) {
    return {
      status: INVOICE_STATUS.DUE_TODAY,
      diffDays: 0,
      label: 'Due Today',
      badgeColor: 'amber',
      isOverdue: false,
      isDueToday: true,
      isUpcoming: false,
    };
  } else {
    const daysLeft = Math.abs(diffDays);
    return {
      status: INVOICE_STATUS.UPCOMING,
      diffDays: daysLeft,
      label: `Due in ${daysLeft}d`,
      badgeColor: daysLeft <= 5 ? 'amber' : 'sky',
      isOverdue: false,
      isDueToday: false,
      isUpcoming: true,
    };
  }
}
