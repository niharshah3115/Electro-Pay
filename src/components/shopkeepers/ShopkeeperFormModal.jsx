import React, { useState, useEffect } from 'react';
import { User, Store, Phone, DollarSign, Calendar } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useBusiness } from '../../context/BusinessContext';
import { getTodayString, calculateDueDate, formatDate } from '../../utils/dateUtils';

export function ShopkeeperFormModal({ isOpen, onClose, initialData = null }) {
  const { addShopkeeper, updateShopkeeper } = useBusiness();

  const [formData, setFormData] = useState({
    ownerName: '',
    shopName: '',
    phone: '',
    billAmount: '',
    deliveryDate: getTodayString(),
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ownerName: initialData.ownerName || '',
        shopName: initialData.shopName || '',
        phone: initialData.phone || '',
        billAmount: String(initialData.billAmount || initialData.totalOutstanding || ''),
        deliveryDate: initialData.deliveryDate || initialData.invoiceDate || getTodayString(),
      });
    } else {
      setFormData({
        ownerName: '',
        shopName: '',
        phone: '',
        billAmount: '',
        deliveryDate: getTodayString(),
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const computedDueDate = calculateDueDate(formData.deliveryDate, 35);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Shopkeeper's name is required";
    }
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const numBillAmount = Number(formData.billAmount) || 0;

      const payload = {
        ownerName: formData.ownerName.trim(),
        shopName: formData.shopName.trim(),
        phone: formData.phone.trim(),
        billAmount: numBillAmount,
        deliveryDate: formData.deliveryDate,
        dueDate: computedDueDate,
        invoiceNumber: initialData?.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      };

      if (initialData) {
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
      title={initialData ? 'Edit Shopkeeper' : 'Add Shopkeeper'}
      subtitle="Enter the shopkeeper's name, business name, phone number, and goods delivered date."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Shopkeeper Name */}
        <Input
          label="Shopkeeper's Name"
          placeholder="e.g. Rajesh Kumar"
          value={formData.ownerName}
          onChange={(e) => handleChange('ownerName', e.target.value)}
          error={errors.ownerName}
          required
        />

        {/* Business Name */}
        <Input
          label="Business / Shop Name"
          placeholder="e.g. Rajesh Electricals"
          value={formData.shopName}
          onChange={(e) => handleChange('shopName', e.target.value)}
          error={errors.shopName}
          required
        />

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Bill Amount */}
          <Input
            label="Bill Amount (₹)"
            type="number"
            min="0"
            placeholder="e.g. 25000"
            value={formData.billAmount}
            onChange={(e) => handleChange('billAmount', e.target.value)}
          />

          {/* Goods Delivered Date */}
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
            {initialData ? 'Update Shopkeeper' : 'Add Shopkeeper'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
