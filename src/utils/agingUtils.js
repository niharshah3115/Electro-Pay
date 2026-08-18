import { AGING_BUCKETS } from '../constants/creditConfig.js';
import { getDaysElapsed } from './dateUtils.js';

/**
 * Categorizes an invoice into its aging bracket based on days elapsed since invoice date
 */
export function getAgingBucketForInvoice(invoice) {
  const days = getDaysElapsed(invoice.invoiceDate);
  const balance = Number(invoice.balanceAmount) || 0;

  if (balance <= 0) {
    return { bucket: 'settled', label: 'Settled', color: 'slate', days };
  }

  if (days <= 30) {
    return { ...AGING_BUCKETS.CURRENT, days };
  } else if (days <= 35) {
    return { ...AGING_BUCKETS.APPROACHING, days };
  } else if (days <= 54) {
    return { ...AGING_BUCKETS.OVERDUE_L1, days };
  } else if (days <= 69) {
    return { ...AGING_BUCKETS.OVERDUE_L2, days };
  } else {
    return { ...AGING_BUCKETS.CRITICAL, days };
  }
}

/**
 * Aggregates all outstanding balances across aging buckets for reports & charts
 */
export function calculateAgingBreakdown(invoices = []) {
  const breakdown = {
    current: { ...AGING_BUCKETS.CURRENT, count: 0, amount: 0, invoices: [] },
    approaching: { ...AGING_BUCKETS.APPROACHING, count: 0, amount: 0, invoices: [] },
    overdue_l1: { ...AGING_BUCKETS.OVERDUE_L1, count: 0, amount: 0, invoices: [] },
    overdue_l2: { ...AGING_BUCKETS.OVERDUE_L2, count: 0, amount: 0, invoices: [] },
    critical: { ...AGING_BUCKETS.CRITICAL, count: 0, amount: 0, invoices: [] },
  };

  let totalOutstanding = 0;
  let totalInvoices = 0;

  invoices.forEach(inv => {
    const balance = Number(inv.balanceAmount) || 0;
    if (balance <= 0) return;

    totalOutstanding += balance;
    totalInvoices += 1;

    const days = getDaysElapsed(inv.invoiceDate);

    if (days <= 30) {
      breakdown.current.count += 1;
      breakdown.current.amount += balance;
      breakdown.current.invoices.push(inv);
    } else if (days <= 35) {
      breakdown.approaching.count += 1;
      breakdown.approaching.amount += balance;
      breakdown.approaching.invoices.push(inv);
    } else if (days <= 54) {
      breakdown.overdue_l1.count += 1;
      breakdown.overdue_l1.amount += balance;
      breakdown.overdue_l1.invoices.push(inv);
    } else if (days <= 69) {
      breakdown.overdue_l2.count += 1;
      breakdown.overdue_l2.amount += balance;
      breakdown.overdue_l2.invoices.push(inv);
    } else {
      breakdown.critical.count += 1;
      breakdown.critical.amount += balance;
      breakdown.critical.invoices.push(inv);
    }
  });

  return {
    breakdown,
    totalOutstanding,
    totalInvoices,
  };
}
