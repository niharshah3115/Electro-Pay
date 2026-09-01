import React from 'react';
import { Phone, MessageSquare, AlertTriangle, Clock, Calendar, Store, MapPin, Receipt, FileText, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currencyUtils';
import { generateTelUrl } from '../../utils/whatsappUtils';
import { formatDate } from '../../utils/dateUtils';
import { REMINDER_PRIORITIES } from '../../utils/reminderEngine';

export function CallQueueCard({
  item,
  onOpenLogCall,
  onOpenWhatsApp,
  onOpenRecordPayment,
}) {
  const {
    shopkeeper,
    shopName,
    phone,
    invoiceNumber,
    outstandingAmount,
    totalBillAmount,
    dueDate,
    daysRemaining,
    daysOverdue,
    priority,
    timingText,
    badgeVariant,
  } = item;

  let priorityBadge = <Badge variant={badgeVariant || 'slate'} dot>{item.label || priority}</Badge>;
  let cardBorder = 'border-slate-800 hover:border-slate-700 bg-slate-900/90';

  if (priority === REMINDER_PRIORITIES.OVERDUE) {
    priorityBadge = (
      <Badge variant="rose" dot className="animate-pulse">
        OVERDUE ({daysOverdue}D)
      </Badge>
    );
    cardBorder = 'border-rose-500/40 hover:border-rose-500/60 bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-900';
  } else if (priority === REMINDER_PRIORITIES.DUE_TODAY) {
    priorityBadge = (
      <Badge variant="amber" dot className="animate-bounce">
        DUE TODAY
      </Badge>
    );
    cardBorder = 'border-amber-500/40 hover:border-amber-500/60 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900';
  } else if (priority === REMINDER_PRIORITIES.CALL_SOON) {
    priorityBadge = (
      <Badge variant="amber" dot>
        CALL SOON ({daysRemaining}D Left)
      </Badge>
    );
    cardBorder = 'border-amber-500/30 hover:border-amber-500/50';
  } else if (priority === REMINDER_PRIORITIES.DUE_SOON) {
    priorityBadge = (
      <Badge variant="sky" dot>
        DUE SOON ({daysRemaining}D Left)
      </Badge>
    );
    cardBorder = 'border-sky-500/30 hover:border-sky-500/50';
  } else if (priority === REMINDER_PRIORITIES.UPCOMING) {
    priorityBadge = (
      <Badge variant="slate" dot>
        UPCOMING ({daysRemaining}D Left)
      </Badge>
    );
  }

  const handleCallClick = () => {
    setTimeout(() => {
      onOpenLogCall(shopkeeper);
    }, 1500);
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-xl transition-all duration-200 ${cardBorder} space-y-4`}>
      {/* Header Info: Business Name */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Store className="w-4 h-4 text-brand-400" />
            <span className="text-base font-black text-white tracking-tight">
              {shopName}
            </span>
            {priorityBadge}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-mono text-slate-300">
              <Phone className="w-3 h-3 text-brand-400" />
              {phone}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Outstanding Amount</span>
          <div className="text-lg font-extrabold text-amber-400 font-sans">
            {formatINR(outstandingAmount)}
          </div>
        </div>
      </div>

      {/* Invoice & Timing Breakdown Box */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Invoice # */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Invoice #:</span>
            <span className="font-mono font-bold text-brand-300">#{invoiceNumber}</span>
          </div>

          {/* Delivered Date */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Goods Delivered:</span>
            <span className="font-semibold text-slate-200">
              {formatDate(item.deliveryDate || item.invoiceDate)}
            </span>
          </div>

          {/* Due Date */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Due Date (35D):</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatDate(dueDate)}
            </span>
          </div>

          {/* Days Remaining / Overdue */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Timing:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                priority === REMINDER_PRIORITIES.OVERDUE
                  ? 'text-rose-400'
                  : priority === REMINDER_PRIORITIES.DUE_TODAY
                  ? 'text-amber-400'
                  : 'text-sky-300'
              }`}
            >
              <Clock className="w-3 h-3 shrink-0" />
              {timingText}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: CALL, WHATSAPP, VIEW INVOICE */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. CALL Button */}
          <a
            href={generateTelUrl(phone)}
            onClick={handleCallClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-brand-400" />
            <span>CALL</span>
          </a>

          {/* 2. WHATSAPP Button */}
          <button
            onClick={() => onOpenWhatsApp({ shopkeeper })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 transition-colors shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WHATSAPP</span>
          </button>
        </div>

        {/* Record Payment shortcut */}
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
  );
}
