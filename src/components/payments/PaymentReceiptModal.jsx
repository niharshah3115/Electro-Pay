import React, { useState } from 'react';
import { Printer, CheckCircle2, QrCode, Banknote, FileText, Building2, Wallet, Trash2, Calendar, FileCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatINR, numberToWords } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { useBusiness } from '../../context/BusinessContext';

export function PaymentReceiptModal({ isOpen, onClose, payment }) {
  const { businessProfile, deletePayment } = useBusiness();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!payment) return null;

  const mode = payment.paymentMethod || payment.paymentMode || 'upi';
  let ModeIcon = QrCode;
  if (mode === 'cash') ModeIcon = Banknote;
  if (mode === 'cheque') ModeIcon = FileText;
  if (mode === 'bank_transfer') ModeIcon = Building2;
  if (mode === 'other') ModeIcon = Wallet;

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePayment(payment.id);
      setShowConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error deleting payment:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Payment Receipt Voucher"
        subtitle={`Receipt #${payment.receiptNumber || 'REC'} • Issued on ${formatDate(payment.paymentDate)}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          {/* Receipt Header Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">Payment Received</span>
                <h4 className="text-2xl font-extrabold text-white font-sans">{formatINR(payment.amount)}</h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
                Print
              </Button>
              <button
                onClick={() => setShowConfirm(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Delete Payment Receipt"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Explicit Payment-to-Invoice Statement Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-brand-500/25 flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 block">Payment Allocation:</span>
              <p className="text-white font-bold">
                <strong className="text-emerald-400 font-extrabold">{formatINR(payment.amount)}</strong> was given on{' '}
                <strong className="text-brand-300 font-bold">{formatDate(payment.paymentDate)}</strong> against Invoice{' '}
                <strong className="font-mono text-amber-300">#{payment.invoiceNumber || 'INV-GENERAL'}</strong>
              </p>
            </div>
          </div>

          {/* Amount in words */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 italic">
            <strong>Amount in words:</strong> {numberToWords(payment.amount)}
          </div>

          {/* Distributor & Retailer Details */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Received By (Distributor)</span>
              <p className="font-bold text-white mt-0.5">{businessProfile?.businessName || 'Distributor'}</p>
              <p className="text-slate-400">UPI: {businessProfile?.upiId || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Received From (Shopkeeper)</span>
              <p className="font-bold text-white mt-0.5">{payment.shopkeeperName || payment.shopName || 'Shopkeeper'}</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Date: {formatDate(payment.paymentDate)}</p>
            </div>
          </div>

          {/* Payment Meta */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Invoice / Bill #:</span>
              <span className="font-mono font-bold text-white">#{payment.invoiceNumber || 'INV-GENERAL'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Payment Method:</span>
              <span className="font-semibold text-white uppercase flex items-center gap-1">
                <ModeIcon className="w-3.5 h-3.5 text-brand-400" />
                {mode.replace('_', ' ')}
              </span>
            </div>

            {payment.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-slate-400">Reference / UTR / Cheque:</span>
                <span className="font-mono text-white">{payment.referenceNumber}</span>
              </div>
            )}

            {payment.notes && (
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Notes:</span>
                <span className="text-slate-200 text-right max-w-xs">{payment.notes}</span>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Payment Receipt?"
        message={`Are you sure you want to delete receipt #${payment.receiptNumber} for ₹${Number(payment.amount).toLocaleString('en-IN')}? This will restore the outstanding balance.`}
        confirmText="Delete Receipt"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </>
  );
}
