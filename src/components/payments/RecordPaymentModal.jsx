import React, { useState, useEffect, useMemo } from 'react';
import { QrCode, Banknote, FileText, Building2, Wallet, AlertCircle, CheckCircle2, Calendar, FileCheck2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useBusiness } from '../../context/BusinessContext';
import { formatINR } from '../../utils/currencyUtils';
import { formatDate, getTodayString } from '../../utils/dateUtils';
import { PAYMENT_MODES, calculatePaymentStatus } from '../../constants/paymentModes';

export function RecordPaymentModal({ isOpen, onClose, prefilledShopkeeperId = null }) {
  const { shopkeepers = [], recordPayment } = useBusiness();

  const [shopkeeperId, setShopkeeperId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayString());
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedShopkeeper = useMemo(() => {
    return shopkeepers.find((sk) => sk.id === shopkeeperId);
  }, [shopkeepers, shopkeeperId]);

  useEffect(() => {
    if (isOpen) {
      const initialId = prefilledShopkeeperId || (shopkeepers.length > 0 ? shopkeepers[0].id : '');
      setShopkeeperId(initialId);
      setPaymentDate(getTodayString());
      setPaymentMethod('upi');
      setReferenceNumber('');
      setReceiptNumber(`REC-${Date.now().toString().slice(-6)}`);
      setNotes('');
      setErrors({});

      const targetSk = shopkeepers.find((sk) => sk.id === initialId);
      if (targetSk) {
        setInvoiceNumber(targetSk.invoiceNumber || `INV-${targetSk.id.slice(-6)}`);
        if (Number(targetSk.totalOutstanding) > 0) {
          setAmount(String(targetSk.totalOutstanding));
        } else {
          setAmount('');
        }
      } else {
        setInvoiceNumber('');
        setAmount('');
      }
    }
  }, [isOpen, prefilledShopkeeperId, shopkeepers]);

  const paymentNum = Number(amount) || 0;
  const currentOutstanding = Number(selectedShopkeeper?.totalOutstanding) || 0;
  const currentPaid = Number(selectedShopkeeper?.totalPaidAmount) || 0;
  const totalBilled = (currentOutstanding + currentPaid) || Number(selectedShopkeeper?.billAmount) || 0;

  // New simulated figures
  const newDue = Math.max(0, currentOutstanding - paymentNum);
  const newTotalPaid = currentPaid + paymentNum;
  const simulatedStatus = calculatePaymentStatus(totalBilled, newTotalPaid);

  const isInvalidAmount = paymentNum > currentOutstanding;

  const handleSelectShopkeeper = (newId) => {
    setShopkeeperId(newId);
    const sk = shopkeepers.find((s) => s.id === newId);
    if (sk) {
      setInvoiceNumber(sk.invoiceNumber || `INV-${sk.id.slice(-6)}`);
      if (Number(sk.totalOutstanding) > 0) {
        setAmount(String(sk.totalOutstanding));
      } else {
        setAmount('');
      }
    }
    setErrors({});
  };

  // Quick Payment Shortcuts
  const setFullPayment = () => {
    if (currentOutstanding > 0) {
      setAmount(String(currentOutstanding));
      setErrors({});
    }
  };

  const setPartialPayment = (percentage) => {
    if (currentOutstanding > 0) {
      const partialVal = Math.round((currentOutstanding * percentage) / 100);
      setAmount(String(partialVal));
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!shopkeeperId) {
      newErrors.shopkeeperId = 'Please select a shopkeeper';
    }
    if (paymentNum <= 0) {
      newErrors.amount = 'Please enter a valid payment amount greater than ₹0';
    } else if (paymentNum > currentOutstanding) {
      newErrors.amount = `Payment amount (₹${paymentNum.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${currentOutstanding.toLocaleString('en-IN')})`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await recordPayment({
        shopkeeperId,
        amount: paymentNum,
        paymentDate,
        invoiceNumber: invoiceNumber.trim() || 'INV-GENERAL',
        paymentMethod,
        referenceNumber,
        receiptNumber,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setErrors({ form: err.message || 'Failed to record payment' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment Collection"
      subtitle="Track which amount is given on which date from which invoice number."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Shopkeeper and Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Received From (Shopkeeper)"
            value={shopkeeperId}
            onChange={(e) => handleSelectShopkeeper(e.target.value)}
            error={errors.shopkeeperId}
            required
          >
            <option value="">-- Choose Account --</option>
            {shopkeepers.map((sk) => (
              <option key={sk.id} value={sk.id}>
                {sk.ownerName ? `${sk.ownerName} (${sk.shopName})` : sk.shopName} — Due: ₹{Number(sk.totalOutstanding || 0).toLocaleString('en-IN')}
              </option>
            ))}
          </Select>

          <div>
            <Input
              label="Payment Amount (₹)"
              type="number"
              min="1"
              max={currentOutstanding || undefined}
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors({});
              }}
              error={errors.amount}
              required
              helperText={
                selectedShopkeeper
                  ? `Remaining Due Balance: ${formatINR(currentOutstanding)}`
                  : ''
              }
            />

            {/* Quick Full / Partial Shortcut Buttons */}
            {selectedShopkeeper && currentOutstanding > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={setFullPayment}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                >
                  Full Payment (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setPartialPayment(50)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  50% Partial
                </button>
                <button
                  type="button"
                  onClick={() => setPartialPayment(25)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  25% Partial
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Document Number (Invoice vs Challan) & Payment Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={
              (selectedShopkeeper?.billingType === 'without_bill' || !!selectedShopkeeper?.challanNumber)
                ? 'Without Bill / Challan / Slip #'
                : 'Tax Invoice / Bill Number'
            }
            placeholder={
              (selectedShopkeeper?.billingType === 'without_bill' || !!selectedShopkeeper?.challanNumber)
                ? 'e.g. CH-102 or SLIP-405'
                : 'e.g. INV-100234'
            }
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            helperText={
              (selectedShopkeeper?.billingType === 'without_bill' || !!selectedShopkeeper?.challanNumber)
                ? 'Challan or slip number against which this payment is given'
                : 'Official Tax Invoice against which this payment is given'
            }
            required
          />

          <Input
            label="Payment Date (Given On)"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        {/* Live Explicit Summary Banner: "Which amount is given on which date from which invoice number" */}
        {selectedShopkeeper && paymentNum > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950/40 border border-brand-500/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-brand-400 font-bold">
              <FileCheck2 className="w-4 h-4" />
              <span>Transaction Summary:</span>
            </div>

            <p className="text-sm font-semibold text-white">
              <span className="text-emerald-400 font-extrabold">{formatINR(paymentNum)}</span> is being recorded on{' '}
              <span className="text-brand-300 font-bold">{formatDate(paymentDate)}</span> against{' '}
              {(selectedShopkeeper?.billingType === 'without_bill' || !!selectedShopkeeper?.challanNumber) ? 'Challan/Slip ' : 'Invoice '}
              <span className="font-mono text-amber-300 font-bold">
                #{invoiceNumber || ((selectedShopkeeper?.billingType === 'without_bill' || !!selectedShopkeeper?.challanNumber) ? 'CH-GENERAL' : 'INV-GENERAL')}
              </span>
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>Remaining Due: <strong className="text-amber-400">{formatINR(newDue)}</strong></span>
              <span>Updated Status: <strong className="text-emerald-400">{simulatedStatus.status}</strong></span>
            </div>
          </div>
        )}

        {/* 5 Payment Methods Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Payment Method</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PAYMENT_MODES.map((mode) => {
              const isSelected = paymentMethod === mode.id;
              let Icon = QrCode;
              if (mode.id === 'cash') Icon = Banknote;
              if (mode.id === 'bank_transfer') Icon = Building2;
              if (mode.id === 'cheque') Icon = FileText;
              if (mode.id === 'other') Icon = Wallet;

              return (
                <button
                  type="button"
                  key={mode.id}
                  onClick={() => setPaymentMethod(mode.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all select-none cursor-pointer ${
                    isSelected
                      ? 'bg-brand-500/20 border-brand-400 text-brand-300 shadow-md shadow-brand-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="text-[11px]">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reference Number */}
        <Input
          label="Transaction Ref / UTR / Cheque # (Optional)"
          placeholder="e.g. UPI/12345678 or Cheque #88219"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />

        {/* Optional Notes */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">Payment Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="e.g. Partial advance received at Lohar Chawl shop"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl bg-slate-950/90 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none shadow-inner"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="emerald" loading={submitting} disabled={isInvalidAmount || paymentNum <= 0}>
            Record Payment ({formatINR(paymentNum)})
          </Button>
        </div>
      </form>
    </Modal>
  );
}
