import React, { useState } from 'react';
import { Eye, MessageSquare, Receipt, Trash2, ArrowUpDown } from 'lucide-react';
import { InvoiceStatusPill } from './InvoiceStatusPill';
import { Button } from '../common/Button';
import { formatINR } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { useBusiness } from '../../context/BusinessContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function InvoiceTable({
  invoices = [],
  onViewInvoice,
  onOpenRecordPayment,
  onOpenWhatsApp,
}) {
  const { deleteInvoice, shopkeepers } = useBusiness();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortField, setSortField] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'totalAmount' || sortField === 'balanceAmount' || sortField === 'paidAmount') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else if (sortField === 'invoiceDate' || sortField === 'dueDate') {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
    } else {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 select-none">
            <tr>
              <th
                onClick={() => handleSort('invoiceNumber')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Invoice #</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('shopkeeperName')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Shopkeeper</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('invoiceDate')}
                className="py-3 px-4 cursor-pointer hover:text-white hidden sm:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Bill Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('dueDate')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date (39D)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('totalAmount')}
                className="py-3 px-4 cursor-pointer hover:text-white text-right hidden md:table-cell"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Bill Total</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('balanceAmount')}
                className="py-3 px-4 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Balance Due</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th className="py-3 px-4 text-center">Status</th>

              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {sortedInvoices.map((invoice) => {
              const shopkeeper = shopkeepers.find((sk) => sk.id === invoice.shopkeeperId);

              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Invoice # */}
                  <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                    <button
                      onClick={() => onViewInvoice(invoice)}
                      className="hover:text-brand-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <span>{invoice.invoiceNumber}</span>
                    </button>
                  </td>

                  {/* Shopkeeper */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200 truncate max-w-[170px] sm:max-w-[220px]">
                      {invoice.shopkeeperName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {shopkeeper?.areaRoute || invoice.shopkeeperPhone}
                    </div>
                  </td>

                  {/* Bill Date */}
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap hidden sm:table-cell">
                    {formatDate(invoice.invoiceDate, 'short')}
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-200">{formatDate(invoice.dueDate, 'short')}</div>
                    <div className="text-[10px] text-slate-400">{invoice.creditDays || 39} Days credit</div>
                  </td>

                  {/* Bill Total & Amount Received */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap hidden md:table-cell">
                    <div className="font-semibold text-slate-200">{formatINR(invoice.totalAmount)}</div>
                    {invoice.paidAmount > 0 ? (
                      <div className="text-[11px] text-emerald-400 font-medium">
                        ₹{invoice.paidAmount.toLocaleString('en-IN')} received
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500">₹0 received</div>
                    )}
                  </td>

                  {/* Balance Due */}
                  <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                    <span className={invoice.balanceAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {formatINR(invoice.balanceAmount)}
                    </span>
                    {invoice.balanceAmount > 0 && invoice.paidAmount > 0 && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        ({Math.round(((invoice.totalAmount - invoice.balanceAmount) / invoice.totalAmount) * 100)}% received)
                      </div>
                    )}
                  </td>

                  {/* Status Pill */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <InvoiceStatusPill invoice={invoice} />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="View Details"
                        onClick={() => onViewInvoice(invoice)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {invoice.balanceAmount > 0 && onOpenRecordPayment && (
                        <button
                          title="Record Payment"
                          onClick={() => onOpenRecordPayment(invoice.shopkeeperId)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 transition-colors"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      )}

                      {invoice.balanceAmount > 0 && shopkeeper && onOpenWhatsApp && (
                        <button
                          title="WhatsApp Reminder"
                          onClick={() => onOpenWhatsApp({ shopkeeper, invoices: [invoice] })}
                          className="p-1.5 rounded-lg text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        title="Delete Invoice"
                        onClick={() => setDeleteTarget(invoice)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteInvoice(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Invoice?"
        message={`Are you sure you want to remove Invoice #${deleteTarget?.invoiceNumber} (${formatINR(
          deleteTarget?.totalAmount || 0
        )})? This will adjust ${deleteTarget?.shopkeeperName}'s outstanding balance.`}
      />
    </>
  );
}
