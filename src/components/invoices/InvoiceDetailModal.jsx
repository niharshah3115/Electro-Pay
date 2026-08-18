import React from 'react';
import { Printer, MessageSquare, Phone, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { InvoiceStatusPill } from './InvoiceStatusPill';
import { formatINR } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { generateTelUrl } from '../../utils/whatsappUtils';
import { useBusiness } from '../../context/BusinessContext';

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  onOpenRecordPayment,
  onOpenWhatsApp,
}) {
  const { businessProfile, shopkeepers } = useBusiness();
  if (!invoice) return null;

  const shopkeeper = shopkeepers.find((sk) => sk.id === invoice.shopkeeperId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice #${invoice.invoiceNumber}`}
      subtitle={`Issued on ${formatDate(invoice.invoiceDate)} • Credit Term: ${invoice.creditDays || 39} Days`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Status and Action Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-3">
            <InvoiceStatusPill invoice={invoice} />
            <span className="text-xs text-slate-400 font-medium">
              Due Date: <strong className="text-white">{formatDate(invoice.dueDate)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {invoice.balanceAmount > 0 && onOpenRecordPayment && (
              <Button
                variant="emerald"
                size="xs"
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(invoice.shopkeeperId);
                }}
              >
                Clear Balance
              </Button>
            )}
            {shopkeeper && onOpenWhatsApp && (
              <Button
                variant="whatsapp"
                size="xs"
                icon={MessageSquare}
                onClick={() => {
                  onClose();
                  onOpenWhatsApp({ shopkeeper, invoices: [invoice] });
                }}
              >
                Send Reminder
              </Button>
            )}
            <Button variant="outline" size="xs" icon={Printer} onClick={handlePrint}>
              Print
            </Button>
          </div>
        </div>

        {/* Distributor & Shopkeeper Header Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Distributor (Billed From)</span>
            <p className="font-bold text-white text-sm">{businessProfile.businessName}</p>
            <p className="text-slate-400">{businessProfile.address}</p>
            <p className="text-slate-400">UPI: {businessProfile.upiId} | Phone: {businessProfile.phone}</p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Retailer (Billed To)</span>
            <p className="font-bold text-white text-sm">{invoice.shopkeeperName}</p>
            <p className="text-slate-400">Proprietor: {shopkeeper?.ownerName || 'Retail Customer'}</p>
            <p className="text-slate-400">Phone: {invoice.shopkeeperPhone || shopkeeper?.phone}</p>
            <p className="text-slate-400">Route: {shopkeeper?.areaRoute || 'Market'}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Item Breakdown</h4>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-medium text-white">{item.description}</td>
                      <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center">{item.unit || 'Pcs'}</td>
                      <td className="py-2.5 px-3 text-right">{formatINR(item.rate)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white">{formatINR(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-3 px-3 text-slate-400 text-center">
                      Consolidated Electrical Supplies Bill
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800">
          <div className="text-xs text-slate-400 max-w-xs">
            {invoice.notes && <p><strong>Note:</strong> {invoice.notes}</p>}
            <p className="mt-1">Standard 39-day credit grace applies. Interest may be levied beyond credit maturity.</p>
          </div>

          <div className="w-full sm:w-60 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Gross Total:</span>
              <span className="font-semibold text-white">{formatINR(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-semibold text-emerald-400">- {formatINR(invoice.paidAmount || 0)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
              <span className="text-amber-400">Balance Due:</span>
              <span className="text-amber-400">{formatINR(invoice.balanceAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
