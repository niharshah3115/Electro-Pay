import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Zap, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useBusiness } from '../../context/BusinessContext';
import { calculateDueDate, getTodayString, formatDate } from '../../utils/dateUtils';
import { formatINR } from '../../utils/currencyUtils';
import { DEFAULT_CREDIT_DAYS } from '../../constants/creditConfig';

export function InvoiceFormModal({ isOpen, onClose, prefilledShopkeeperId = null }) {
  const { shopkeepers, addInvoice, businessProfile } = useBusiness();

  const [shopkeeperId, setShopkeeperId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(getTodayString());
  const [creditDays, setCreditDays] = useState(DEFAULT_CREDIT_DAYS);
  const [calculatedDueDate, setCalculatedDueDate] = useState('');
  const [items, setItems] = useState([
    { description: 'Polycab 2.5 sq mm Copper Wire', quantity: 10, unit: 'Coil', rate: 2200, amount: 22000 },
  ]);
  const [totalAmount, setTotalAmount] = useState(22000);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      const today = getTodayString();
      const defaultDays = businessProfile.defaultCreditDays || DEFAULT_CREDIT_DAYS;
      const initialShopkeeper = prefilledShopkeeperId || (shopkeepers.length > 0 ? shopkeepers[0].id : '');

      setShopkeeperId(initialShopkeeper);
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setInvoiceDate(today);
      setCreditDays(defaultDays);
      setCalculatedDueDate(calculateDueDate(today, defaultDays));
      setPaidAmount(0);
      setNotes('');
      setErrors({});
    }
  }, [isOpen, prefilledShopkeeperId, shopkeepers, businessProfile.defaultCreditDays]);

  // Recalculate due date whenever invoiceDate or creditDays changes
  useEffect(() => {
    if (invoiceDate && creditDays) {
      const computed = calculateDueDate(invoiceDate, Number(creditDays));
      setCalculatedDueDate(computed);
    }
  }, [invoiceDate, creditDays]);

  // When shopkeeper changes, check if they have custom credit days
  const handleShopkeeperChange = (id) => {
    setShopkeeperId(id);
    const selected = shopkeepers.find((sk) => sk.id === id);
    if (selected && selected.creditDays) {
      setCreditDays(selected.creditDays);
      setCalculatedDueDate(calculateDueDate(invoiceDate, selected.creditDays));
    }
  };

  // Recalculate totals from line items
  const handleItemChange = (index, field, value) => {
    const nextItems = [...items];
    const item = { ...nextItems[index], [field]: value };

    if (field === 'quantity' || field === 'rate') {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      item.amount = qty * rate;
    }

    nextItems[index] = item;
    setItems(nextItems);

    const sum = nextItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    setTotalAmount(sum);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: 1, unit: 'Pcs', rate: 0, amount: 0 },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    const nextItems = items.filter((_, i) => i !== index);
    setItems(nextItems);
    const sum = nextItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    setTotalAmount(sum);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!shopkeeperId) {
      newErrors.shopkeeperId = 'Please select a shopkeeper';
    }
    if (!invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }
    if (totalAmount <= 0) {
      newErrors.totalAmount = 'Invoice amount must be greater than ₹0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      addInvoice({
        shopkeeperId,
        invoiceNumber,
        invoiceDate,
        creditDays: Number(creditDays),
        totalAmount,
        paidAmount: Number(paidAmount) || 0,
        items,
        notes,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const balanceAmount = Math.max(0, totalAmount - (Number(paidAmount) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Electrical Supply Invoice"
      subtitle="Automatically applies 39-day credit maturity and schedules payment tracking."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Top Meta Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Select Retail Shopkeeper"
              value={shopkeeperId}
              onChange={(e) => handleShopkeeperChange(e.target.value)}
              error={errors.shopkeeperId}
              required
            >
              <option value="">-- Choose Shopkeeper --</option>
              {shopkeepers.map((sk) => (
                <option key={sk.id} value={sk.id}>
                  {sk.shopName} - Due: ₹{(sk.totalOutstanding || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Invoice Number"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            error={errors.invoiceNumber}
            required
          />
        </div>

        {/* 39-Day Credit Cycle Engine Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/80 via-slate-900 to-brand-950/80 border border-brand-500/30 shadow-inner">
          <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Automated 39-Day Credit Due Date Calculation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Invoice (Bill) Date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />

            <Input
              label="Credit Days"
              type="number"
              min="1"
              max="120"
              value={creditDays}
              onChange={(e) => setCreditDays(e.target.value)}
              helperText="Default: 39 days"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-amber-400">Payment Due Date (+{creditDays}D)</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-amber-500/40 text-amber-300 font-bold text-sm">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{formatDate(calculatedDueDate) || 'Calculating...'}</span>
              </div>
              <p className="text-[11px] text-slate-400">Auto-matures on {calculatedDueDate}</p>
            </div>
          </div>
        </div>

        {/* Itemized Goods List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Electrical Goods / Items</h4>
            <button
              type="button"
              onClick={addItemRow}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
              >
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="e.g. Polycab 2.5mm Wire / Havells Switch"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Rate ₹"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    disabled={items.length <= 1}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Summary & Advance Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="space-y-3">
            <Input
              label="Advance Paid at Billing (₹)"
              type="number"
              min="0"
              max={totalAmount}
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              helperText="Optional initial token or part payment"
            />

            <Input
              label="Dispatch Notes / Vehicle No."
              placeholder="e.g. Dispatched via tempo MH-02-AB-1234"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-col justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Bill Amount:</span>
                <span className="font-semibold text-white">{formatINR(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Advance Paid:</span>
                <span className="font-semibold text-emerald-400">- {formatINR(paidAmount || 0)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Credit Balance Due</span>
                <p className="text-[10px] text-amber-400 font-medium">Due in {creditDays} days ({calculatedDueDate})</p>
              </div>
              <span className="text-xl font-extrabold text-amber-400 font-sans">
                {formatINR(balanceAmount)}
              </span>
            </div>
          </div>
        </div>

        {errors.totalAmount && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.totalAmount}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Create & Schedule 39-Day Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
