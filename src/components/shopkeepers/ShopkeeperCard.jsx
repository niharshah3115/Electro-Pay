import React, { useState } from 'react';
import { Phone, MessageSquare, Receipt, Store, Trash2, Edit2, CheckCircle2, Calendar, FileText, Package } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatINR } from '../../utils/currencyUtils';
import { generateTelUrl } from '../../utils/whatsappUtils';
import { formatDate } from '../../utils/dateUtils';
import { useBusiness } from '../../context/BusinessContext';

export function ShopkeeperCard({
  shopkeeper,
  onOpenRecordPayment,
  onOpenLogCall,
  onOpenWhatsApp,
  onOpenEdit,
}) {
  const { deleteShopkeeper } = useBusiness();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Amounts
  const outstanding = Number(shopkeeper.totalOutstanding) || 0;
  const totalPaid = Number(shopkeeper.totalPaidAmount) || 0;
  const totalBillAmount = (outstanding + totalPaid) || Number(shopkeeper.billAmount) || 0;

  const isWithoutBill = shopkeeper.billingType === 'without_bill' || !!shopkeeper.challanNumber;
  const docNumber = isWithoutBill
    ? (shopkeeper.challanNumber || shopkeeper.invoiceNumber || 'CH-GENERAL')
    : (shopkeeper.invoiceNumber || 'INV-GENERAL');

  const handleCallClick = () => {
    setTimeout(() => {
      onOpenLogCall(shopkeeper);
    }, 1200);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteShopkeeper(shopkeeper.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting shopkeeper:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
        {/* Top Header: Business Name */}
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              {/* Business Name */}
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-brand-400 shrink-0" />
                <h3 className="text-base font-black text-white tracking-tight">
                  {shopkeeper.shopName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {outstanding <= 0 ? (
                <Badge variant="emerald" dot size="sm">
                  PAID
                </Badge>
              ) : (
                <Badge variant="amber" dot size="sm">
                  DUE
                </Badge>
              )}

              {onOpenEdit && (
                <button
                  onClick={() => onOpenEdit(shopkeeper)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit Shopkeeper"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete Shopkeeper"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* With Bill / Without Bill Badge Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            {isWithoutBill ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Package className="w-3 h-3 text-amber-400" />
                <span>Without Bill: <strong className="text-white font-mono">#{docNumber}</strong></span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-brand-500/15 text-brand-300 border border-brand-500/30">
                <FileText className="w-3 h-3 text-brand-400" />
                <span>Invoice: <strong className="text-white font-mono">#{docNumber}</strong></span>
              </span>
            )}
          </div>

          {/* Phone & Delivery Date Row */}
          <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 font-mono text-slate-300">
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              <span>{shopkeeper.phone}</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
              <Calendar className="w-3 h-3 text-brand-400" />
              <span>Delivered: <strong className="text-white">{formatDate(shopkeeper.deliveryDate || shopkeeper.invoiceDate)}</strong></span>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Bill</span>
              <span className="font-bold text-white font-sans text-sm">{formatINR(totalBillAmount)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Total Paid</span>
              <span className="font-bold text-emerald-400 font-sans text-sm">{formatINR(totalPaid)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-slate-400 font-medium">Pending Due:</span>
              <span className={`font-black font-sans text-base ml-1.5 ${outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatINR(outstanding)}
              </span>
            </div>

            {shopkeeper.dueDate && (
              <span className="text-[11px] text-slate-400">
                Due (35D): <strong className="text-slate-200">{formatDate(shopkeeper.dueDate)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: CALL, WHATSAPP, COLLECT */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            {/* CALL */}
            <a
              href={generateTelUrl(shopkeeper.phone)}
              onClick={handleCallClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors shadow-sm cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              <span>Call</span>
            </a>

            {/* WHATSAPP */}
            <button
              onClick={() => onOpenWhatsApp({ shopkeeper })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 transition-colors shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* COLLECT PAYMENT */}
          <Button
            variant="emerald"
            size="sm"
            icon={Receipt}
            onClick={() => onOpenRecordPayment(shopkeeper.id)}
          >
            Collect
          </Button>
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Shopkeeper?"
        message={`Are you sure you want to delete "${shopkeeper.shopName}"? This will remove their ledger records.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </>
  );
}
