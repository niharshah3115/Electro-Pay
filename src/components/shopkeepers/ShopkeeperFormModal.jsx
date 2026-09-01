import React, { useState, useEffect } from 'react';
import { Store, Phone, DollarSign, Calendar, FileText, Package, Check, Hash } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useBusiness } from '../../context/BusinessContext';
import { getTodayString, calculateDueDate, formatDate } from '../../utils/dateUtils';

export function ShopkeeperFormModal({ isOpen, onClose, initialData = null }) {
  const { shopkeepers = [], addShopkeeper, updateShopkeeper } = useBusiness();

  const [formData, setFormData] = useState({
    shopName: '',
    phone: '',
    billAmount: '',
    deliveryDate: getTodayString(),
    billingType: 'with_bill', // 'with_bill' | 'without_bill'
    invoiceNumber: '',
    challanNumber: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Detect matching existing shopkeeper
  const normInputName = (formData.shopName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanInputPhone = (formData.phone || '').trim().replace(/\D/g, '');

  const matchedShopkeeper = !initialData && (normInputName || cleanInputPhone.length >= 8)
    ? shopkeepers.find((s) => {
        const normS = (s.shopName || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const cleanSPhone = (s.phone || '').trim().replace(/\D/g, '');
        const matchName = normInputName && normS === normInputName;
        const matchPhone = cleanInputPhone.length >= 8 && cleanSPhone.length >= 8 && cleanInputPhone.slice(-10) === cleanSPhone.slice(-10);
        return matchName || matchPhone;
      })
    : null;

  useEffect(() => {
    if (initialData) {
      const isWithoutBill = initialData.billingType === 'without_bill' || !!initialData.challanNumber;
      setFormData({
        shopName: initialData.shopName || '',
        phone: initialData.phone || '',
        billAmount: String(initialData.billAmount || initialData.totalOutstanding || ''),
        deliveryDate: initialData.deliveryDate || initialData.invoiceDate || getTodayString(),
        billingType: isWithoutBill ? 'without_bill' : 'with_bill',
        invoiceNumber: initialData.invoiceNumber || (isWithoutBill ? '' : `INV-${Date.now().toString().slice(-4)}`),
        challanNumber: initialData.challanNumber || (isWithoutBill ? initialData.invoiceNumber || `CH-${Date.now().toString().slice(-4)}` : ''),
      });
    } else {
      setFormData({
        shopName: '',
        phone: '',
        billAmount: '',
        deliveryDate: getTodayString(),
        billingType: 'with_bill',
        invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
        challanNumber: `CH-${Date.now().toString().slice(-4)}`,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-fill phone when typing/selecting existing shopkeeper
      if (field === 'shopName' && !initialData && (!prev.phone || prev.phone.trim() === '')) {
        const normVal = value.trim().toLowerCase().replace(/\s+/g, ' ');
        const found = shopkeepers.find(
          (s) => (s.shopName || '').trim().toLowerCase().replace(/\s+/g, ' ') === normVal
        );
        if (found?.phone) {
          next.phone = found.phone;
        }
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const computedDueDate = calculateDueDate(formData.deliveryDate, 35);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Business / Shop name is required';
    }

    const cleanPhone = formData.phone.trim().replace(/[^0-9+]/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required for Call & WhatsApp reminders';
    } else if (cleanPhone.replace(/\D/g, '').length < 8) {
      newErrors.phone = 'Please enter a valid mobile number';
    }

    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'Goods delivered date is required';
    }

    // Conditional Validation for Bill vs Without Bill
    if (formData.billingType === 'with_bill') {
      if (!formData.invoiceNumber.trim()) {
        newErrors.invoiceNumber = 'Please enter the Tax Invoice / Bill number';
      }
    } else {
      if (!formData.challanNumber.trim()) {
        newErrors.challanNumber = 'Please enter the Without Bill / Challan / Slip number';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const numBillAmount = Number(formData.billAmount) || 0;
      const isWithoutBill = formData.billingType === 'without_bill';
      const activeDocNumber = isWithoutBill
        ? formData.challanNumber.trim()
        : formData.invoiceNumber.trim();

      const payload = {
        id: matchedShopkeeper ? matchedShopkeeper.id : (initialData?.id || undefined),
        shopName: formData.shopName.trim(),
        ownerName: '',
        phone: formData.phone.trim(),
        billAmount: numBillAmount,
        deliveryDate: formData.deliveryDate,
        dueDate: computedDueDate,
        billingType: formData.billingType,
        invoiceNumber: isWithoutBill ? activeDocNumber : formData.invoiceNumber.trim(),
        challanNumber: isWithoutBill ? formData.challanNumber.trim() : '',
      };

      if (initialData?.id) {
        await updateShopkeeper(initialData.id, payload);
      } else {
        await addShopkeeper(payload);
      }
      onClose();
    } catch (err) {
      console.error('Error saving shopkeeper:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialData
          ? 'Edit Shopkeeper & Billing'
          : matchedShopkeeper
          ? `Add Order: ${matchedShopkeeper.shopName}`
          : 'Add Shopkeeper & Goods Order'
      }
      subtitle={
        matchedShopkeeper
          ? `Existing account detected. Adding this order will increase account balance without creating a duplicate account.`
          : 'Enter party details, billing category (With Bill / Without Bill), and goods delivery date.'
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Existing Shopkeeper Detected Banner */}
        {matchedShopkeeper && !initialData && (
          <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-xs text-brand-200 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-brand-300">
              <span className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-brand-400" />
                Existing Account: {matchedShopkeeper.shopName}
              </span>
              <span className="font-sans text-amber-400 font-extrabold">
                Current Due: ₹{(Number(matchedShopkeeper.totalOutstanding) || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Repeat purchase detected. Submitting will add this <strong>₹{Number(formData.billAmount || 0).toLocaleString('en-IN')}</strong> order to their ledger (New Due: <strong className="text-amber-300">₹{((Number(matchedShopkeeper.totalOutstanding) || 0) + Number(formData.billAmount || 0)).toLocaleString('en-IN')}</strong>).
            </p>
          </div>
        )}

        {/* Business / Shop Name with Datalist Autocomplete */}
        <div>
          <Input
            label="Business / Shop Name"
            placeholder="e.g. Rajesh Electricals"
            value={formData.shopName}
            onChange={(e) => handleChange('shopName', e.target.value)}
            error={errors.shopName}
            list="existing-shopkeeper-suggestions"
            autoComplete="off"
            required
          />
          <datalist id="existing-shopkeeper-suggestions">
            {shopkeepers.map((sk) => (
              <option key={sk.id} value={sk.shopName} />
            ))}
          </datalist>
        </div>

        {/* Mobile Phone */}
        <Input
          label="Mobile Phone Number (WhatsApp)"
          placeholder="e.g. 9820123456"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          required
          helperText="Used for 1-click Call & personalized WhatsApp reminders"
        />

        {/* BILLING TYPE SELECTOR: With Bill vs Without Bill */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-bold text-slate-200">
            Goods Billing Category <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Option 1: With Bill */}
            <button
              type="button"
              onClick={() => handleChange('billingType', 'with_bill')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                formData.billingType === 'with_bill'
                  ? 'bg-gradient-to-br from-indigo-950/80 to-brand-950/50 border-brand-400 text-white shadow-lg shadow-brand-500/15 ring-1 ring-brand-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${formData.billingType === 'with_bill' ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">With Bill</span>
                </div>
                {formData.billingType === 'with_bill' && (
                  <span className="w-4 h-4 rounded-full bg-brand-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Official GST Tax Invoice</p>
            </button>

            {/* Option 2: Without Bill */}
            <button
              type="button"
              onClick={() => handleChange('billingType', 'without_bill')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                formData.billingType === 'without_bill'
                  ? 'bg-gradient-to-br from-amber-950/80 to-amber-900/30 border-amber-400 text-white shadow-lg shadow-amber-500/15 ring-1 ring-amber-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <Package className={`w-4 h-4 ${formData.billingType === 'without_bill' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-amber-300">Without Bill</span>
                </div>
                {formData.billingType === 'without_bill' && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Challan / Slip / Estimate</p>
            </button>
          </div>
        </div>

        {/* CONDITIONAL NUMBER INPUT SECTION */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          {formData.billingType === 'with_bill' ? (
            <div className="space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-300 mb-1">
                <FileText className="w-3.5 h-3.5 text-brand-400" />
                <span>With Bill — Tax Invoice Details</span>
              </div>
              <Input
                label="Tax Invoice / Bill Number"
                placeholder="e.g. INV-2024-001 or GST-8492"
                value={formData.invoiceNumber}
                onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                error={errors.invoiceNumber}
                required
                helperText="Official GST Tax Invoice number issued with these goods"
              />
            </div>
          ) : (
            <div className="space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Without Bill — Challan / Slip Details</span>
              </div>
              <Input
                label="Without Bill / Challan / Slip Number"
                placeholder="e.g. CH-102 or SLIP-405 or WB-88"
                value={formData.challanNumber}
                onChange={(e) => handleChange('challanNumber', e.target.value)}
                error={errors.challanNumber}
                required
                helperText="Delivery challan, estimate slip, or rough ledger reference number"
              />
            </div>
          )}
        </div>

        {/* Bill Amount and Delivery Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={formData.billingType === 'with_bill' ? 'Invoice Amount (₹)' : 'Order / Slip Amount (₹)'}
            type="number"
            min="0"
            placeholder="e.g. 25000"
            value={formData.billAmount}
            onChange={(e) => handleChange('billAmount', e.target.value)}
          />

          <Input
            label="Goods Delivered Date"
            type="date"
            value={formData.deliveryDate}
            onChange={(e) => handleChange('deliveryDate', e.target.value)}
            error={errors.deliveryDate}
            required
          />
        </div>

        {/* Credit Due Date Info Pill */}
        {computedDueDate && (
          <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs flex items-center justify-between text-brand-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              <span>35-Day Credit Due Date:</span>
            </span>
            <strong className="text-white font-semibold">{formatDate(computedDueDate)}</strong>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {initialData
              ? 'Update Account'
              : matchedShopkeeper
              ? 'Add Order to Account'
              : 'Save & Register Shopkeeper'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
