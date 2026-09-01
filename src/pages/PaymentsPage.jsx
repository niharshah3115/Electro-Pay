import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Receipt, Plus, QrCode, Banknote, FileText, Building2, Wallet, Eye, Trash2 } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { PaymentReceiptModal } from '../components/payments/PaymentReceiptModal';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatINR } from '../utils/currencyUtils';
import { formatDate } from '../utils/dateUtils';

export function PaymentsPage() {
  const { payments = [], deletePayment } = useBusiness();
  const { onOpenRecordPayment = () => {} } = useOutletContext() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [activeModeFilter, setActiveModeFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filterPills = [
    { id: 'all', label: 'All Payments', count: payments.length },
    { id: 'cash', label: 'Cash', count: payments.filter((p) => (p.paymentMethod || p.paymentMode) === 'cash').length },
    { id: 'upi', label: 'UPI', count: payments.filter((p) => (p.paymentMethod || p.paymentMode) === 'upi').length },
    { id: 'bank_transfer', label: 'Bank Transfer', count: payments.filter((p) => (p.paymentMethod || p.paymentMode) === 'bank_transfer').length },
    { id: 'cheque', label: 'Cheque', count: payments.filter((p) => (p.paymentMethod || p.paymentMode) === 'cheque').length },
    { id: 'other', label: 'Other', count: payments.filter((p) => (p.paymentMethod || p.paymentMode) === 'other').length },
  ];

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const query = searchQuery.toLowerCase().trim();
      const method = payment.paymentMethod || payment.paymentMode || 'upi';
      const matchSearch =
        !query ||
        payment.receiptNumber?.toLowerCase().includes(query) ||
        payment.shopkeeperName?.toLowerCase().includes(query) ||
        payment.invoiceNumber?.toLowerCase().includes(query) ||
        payment.referenceNumber?.toLowerCase().includes(query) ||
        payment.notes?.toLowerCase().includes(query);

      if (!matchSearch) return false;
      if (activeModeFilter !== 'all' && method !== activeModeFilter) return false;

      return true;
    });
  }, [payments, searchQuery, activeModeFilter]);

  const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const upiCollected = payments.filter((p) => (p.paymentMethod || p.paymentMode) === 'upi').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cashCollected = payments.filter((p) => (p.paymentMethod || p.paymentMode) === 'cash').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    setIsDeleting(true);
    try {
      await deletePayment(paymentToDelete.id);
      setPaymentToDelete(null);
    } catch (err) {
      console.error('Error deleting payment:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Payment Collections & Receipts
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {payments.length} Receipts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track which payment amount was given on which date against which invoice / bill number.
          </p>
        </div>

        <Button
          variant="emerald"
          size="md"
          icon={Plus}
          onClick={() => onOpenRecordPayment()}
        >
          Record Payment
        </Button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Recoveries</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 font-sans">{formatINR(totalCollected)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">UPI Collections</span>
            <div className="text-xl font-bold text-brand-400 mt-0.5 font-sans">{formatINR(upiCollected)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Cash Collections</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5 font-sans">{formatINR(cashCollected)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Banknote className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Mode Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by receipt #, shopkeeper, invoice #, notes, reference..."
        filters={filterPills}
        activeFilter={activeModeFilter}
        onFilterChange={setActiveModeFilter}
      />

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Payment Records Found"
          description={
            searchQuery
              ? `No collections matched "${searchQuery}".`
              : 'Record your first retailer payment to automatically update ledger balances.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Record Payment'}
          onAction={() => {
            if (searchQuery) setSearchQuery('');
            else onOpenRecordPayment();
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Shopkeeper & Business</th>
                <th className="py-3 px-4">Invoice / Bill #</th>
                <th className="py-3 px-4">Given On Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 hidden md:table-cell">Notes / Ref</th>
                <th className="py-3 px-4 text-right">Amount Given</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredPayments.map((payment) => {
                const method = payment.paymentMethod || payment.paymentMode || 'upi';
                let ModeIcon = QrCode;
                if (method === 'cash') ModeIcon = Banknote;
                if (method === 'cheque') ModeIcon = FileText;
                if (method === 'bank_transfer') ModeIcon = Building2;
                if (method === 'other') ModeIcon = Wallet;

                return (
                  <tr key={payment.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                      {payment.receiptNumber || 'REC'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-white text-xs">{payment.shopkeeperName || payment.shopName || 'Shopkeeper'}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-brand-300 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-[11px]">
                        #{payment.invoiceNumber || 'INV-GENERAL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 uppercase font-semibold text-slate-300 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px]">
                        <ModeIcon className="w-3 h-3 text-brand-400" />
                        {method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 hidden md:table-cell truncate max-w-[180px]">
                      {payment.notes ? (
                        <span className="text-slate-200">{payment.notes}</span>
                      ) : (
                        payment.referenceNumber || '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 font-sans text-sm whitespace-nowrap">
                      {formatINR(payment.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View Receipt Voucher"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Voucher</span>
                        </button>
                        <button
                          onClick={() => setPaymentToDelete(payment)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Payment & Revert Balance"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />

      {/* Delete Payment Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payment Collection"
        message={
          paymentToDelete
            ? `Are you sure you want to delete payment receipt #${paymentToDelete.receiptNumber} of ₹${Number(paymentToDelete.amount || 0).toLocaleString('en-IN')} for "${paymentToDelete.shopkeeperName}" (Invoice #${paymentToDelete.invoiceNumber || 'INV-GENERAL'})? This will restore the retailer's outstanding due balance.`
            : ''
        }
        confirmText="Delete Payment"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
