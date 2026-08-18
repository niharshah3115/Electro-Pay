import React, { useState, useEffect } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, Phone, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useBusiness } from '../../context/BusinessContext';
import { useToast } from '../../context/ToastContext';
import { compileTemplate, generateWhatsAppUrl, generatePersonalizedReminderMessage, cleanPhoneNumber } from '../../utils/whatsappUtils';
import { formatINR } from '../../utils/currencyUtils';

export function WhatsAppMessagePreviewModal({ isOpen, onClose, data }) {
  const { businessProfile, reminderTemplates = [] } = useBusiness();
  const { success, error } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState('standard_reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const shopkeeper = data?.shopkeeper;
  const timing = data?.timing || {};

  useEffect(() => {
    if (isOpen && shopkeeper) {
      const template = reminderTemplates.find((t) => t.id === selectedTemplateId) || reminderTemplates[0];
      if (template) {
        const totalBilled = (Number(shopkeeper.totalOutstanding) || 0) + (Number(shopkeeper.totalPaidAmount) || 0) || Number(shopkeeper.billAmount) || 0;
        const compiled = compileTemplate(template.text, {
          shopName: shopkeeper.shopName,
          ownerName: shopkeeper.ownerName || shopkeeper.shopName || 'Sir',
          invoiceNumber: shopkeeper.invoiceNumber || `INV-${shopkeeper.id ? shopkeeper.id.slice(-4) : '1025'}`,
          totalOverdue: shopkeeper.totalOutstanding,
          dueAmount: shopkeeper.totalOutstanding,
          paidAmount: shopkeeper.totalPaidAmount || 0,
          totalAmount: totalBilled,
          billAmount: totalBilled,
          dueDate: shopkeeper.dueDate || 'today',
          deliveryDate: shopkeeper.deliveryDate || 'N/A',
          daysOverdue: timing.daysOverdue || 0,
          upiId: businessProfile?.upiId || '',
          businessName: businessProfile?.businessName || 'ElectroTrack Distributor',
        });
        setCustomMessage(compiled);
      } else {
        const defaultMsg = generatePersonalizedReminderMessage(shopkeeper, timing);
        setCustomMessage(defaultMsg);
      }
    }
  }, [isOpen, shopkeeper, selectedTemplateId, reminderTemplates, businessProfile, timing]);

  if (!shopkeeper) return null;

  const phone = shopkeeper.phone || shopkeeper.whatsapp || '';
  const cleanPhone = cleanPhoneNumber(phone);
  const totalOutstanding = Number(shopkeeper.totalOutstanding) || 0;
  const invoiceNumber = shopkeeper.invoiceNumber || `INV-${shopkeeper.id ? shopkeeper.id.slice(-4) : '1025'}`;

  const handleTemplateSelect = (tplId) => {
    setSelectedTemplateId(tplId);
    const template = reminderTemplates.find((t) => t.id === tplId);
    if (template) {
      const totalBilled = (Number(shopkeeper.totalOutstanding) || 0) + (Number(shopkeeper.totalPaidAmount) || 0) || Number(shopkeeper.billAmount) || 0;
      const compiled = compileTemplate(template.text, {
        shopName: shopkeeper.shopName,
        ownerName: shopkeeper.ownerName || shopkeeper.shopName || 'Sir',
        invoiceNumber: invoiceNumber,
        totalOverdue: totalOutstanding,
        dueAmount: totalOutstanding,
        paidAmount: shopkeeper.totalPaidAmount || 0,
        totalAmount: totalBilled,
        billAmount: totalBilled,
        dueDate: shopkeeper.dueDate || 'today',
        deliveryDate: shopkeeper.deliveryDate || 'N/A',
        daysOverdue: timing.daysOverdue || 0,
        upiId: businessProfile?.upiId || '',
        businessName: businessProfile?.businessName || 'ElectroTrack Distributor',
      });
      setCustomMessage(compiled);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      success('Copied!', 'Message copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
    }
  };

  const handleSendWhatsApp = () => {
    if (!phone) {
      error('No Phone Number', 'This shopkeeper does not have a phone number configured.');
      return;
    }

    const url = generateWhatsAppUrl(phone, customMessage);
    window.open(url, '_blank');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Personalized WhatsApp Payment Reminder"
      subtitle={`Shopkeeper: ${shopkeeper.ownerName || 'Customer'} • Business: ${shopkeeper.shopName}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Recipient Details Highlight */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Customer WhatsApp: <strong className="font-mono text-white">+{cleanPhone || phone}</strong></span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">Due Amount</span>
            <span className="text-amber-400 font-extrabold font-sans">{formatINR(totalOutstanding)}</span>
          </div>
        </div>

        {/* Template Selector Pills */}
        {reminderTemplates.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Choose Message Style</label>
            <div className="flex flex-wrap gap-2">
              {reminderTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplateSelect(tpl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedTemplateId === tpl.id
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editable Message Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Personalized Message Preview
            </label>
            <button
              onClick={handleCopy}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <textarea
            rows={7}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none font-sans leading-relaxed shadow-inner"
          />

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>ℹ️</span>
            <span>Clicking the button below generates a URL-encoded link and opens WhatsApp. Messages are never sent automatically.</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="emerald"
            icon={ExternalLink}
            onClick={handleSendWhatsApp}
            className="bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold"
          >
            Open WhatsApp ({shopkeeper.phone})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
