export const PAYMENT_MODES = [
  { id: 'cash', label: 'Cash', icon: 'Banknote', color: 'amber', description: 'Direct cash collection' },
  { id: 'upi', label: 'UPI', icon: 'QrCode', color: 'emerald', description: 'PhonePe, GPay, Paytm, BHIM' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'Building2', color: 'purple', description: 'NEFT, RTGS, IMPS' },
  { id: 'cheque', label: 'Cheque', icon: 'FileText', color: 'blue', description: 'Bank clearing cheque' },
  { id: 'other', label: 'Other', icon: 'Wallet', color: 'slate', description: 'Adjustment, voucher, or other' },
];

export const PAYMENT_STATUSES = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
};

export function calculatePaymentStatus(totalBilled, totalPaid) {
  const billed = Number(totalBilled) || 0;
  const paid = Number(totalPaid) || 0;
  const remaining = Math.max(0, billed - paid);

  if (billed > 0 && remaining === 0 && paid > 0) {
    return { status: PAYMENT_STATUSES.PAID, label: 'Paid', badgeVariant: 'emerald' };
  }
  if (paid > 0 && remaining > 0) {
    return { status: PAYMENT_STATUSES.PARTIALLY_PAID, label: 'Partially Paid', badgeVariant: 'amber' };
  }
  return { status: PAYMENT_STATUSES.UNPAID, label: 'Unpaid / Due', badgeVariant: 'rose' };
}
