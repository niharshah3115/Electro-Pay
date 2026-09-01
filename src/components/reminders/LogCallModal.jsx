import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useBusiness } from '../../context/BusinessContext';
import { CALL_OUTCOMES } from '../../constants/callOutcomes';
import { getTodayString } from '../../utils/dateUtils';
import { formatINR } from '../../utils/currencyUtils';

export function LogCallModal({ isOpen, onClose, shopkeeper }) {
  const { logCall } = useBusiness();

  const [outcome, setOutcome] = useState('promised_to_pay');
  const [promisedDate, setPromisedDate] = useState('');
  const [promisedAmount, setPromisedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && shopkeeper) {
      setOutcome('promised_to_pay');
      // Set default promise date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPromisedDate(tomorrow.toISOString().split('T')[0]);
      setPromisedAmount(String(shopkeeper.totalOutstanding || ''));
      setNotes('');
    }
  }, [isOpen, shopkeeper]);

  if (!shopkeeper) return null;

  const currentOutcomeObj = CALL_OUTCOMES.find((o) => o.id === outcome);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      logCall({
        shopkeeperId: shopkeeper.id,
        outcome,
        promisedDate: currentOutcomeObj?.requiresDate ? promisedDate : null,
        promisedAmount: promisedAmount ? Number(promisedAmount) : null,
        notes,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Call Outcome: ${shopkeeper.shopName}`}
      subtitle={`Phone: ${shopkeeper.phone} • Balance: ${formatINR(
        shopkeeper.totalOutstanding || 0
      )}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Outcome Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Call Result / Outcome</label>
          <div className="grid grid-cols-1 gap-2">
            {CALL_OUTCOMES.map((item) => {
              const isSelected = outcome === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setOutcome(item.id)}
                  className={`flex items-start justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-brand-500/15 border-brand-400 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Promised Date / Follow-up Date */}
        {currentOutcomeObj?.requiresDate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <Input
              label="Follow-up / Promised Date"
              type="date"
              value={promisedDate}
              onChange={(e) => setPromisedDate(e.target.value)}
              required
            />

            {outcome === 'promised_to_pay' && (
              <Input
                label="Promised Amount (₹)"
                type="number"
                min="0"
                value={promisedAmount}
                onChange={(e) => setPromisedAmount(e.target.value)}
                placeholder="e.g. 25000"
              />
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Call Discussion Summary</label>
          <textarea
            rows={2}
            placeholder="e.g. Spoke with Manoj Bhai. Will transfer via NEFT Friday morning."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Save Call Log & Set Reminder
          </Button>
        </div>
      </form>
    </Modal>
  );
}
