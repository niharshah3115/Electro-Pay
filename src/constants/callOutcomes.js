export const CALL_OUTCOMES = [
  {
    id: 'promised_to_pay',
    label: 'Promised to Pay',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    requiresDate: true,
    description: 'Shopkeeper agreed to pay on a specific date',
  },
  {
    id: 'paid_online',
    label: 'Paid Online / Sending Proof',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    requiresDate: false,
    description: 'Shopkeeper claims payment was already initiated',
  },
  {
    id: 'busy_no_answer',
    label: 'Busy / Did Not Answer',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    requiresDate: true,
    description: 'No response or requested to call back later',
  },
  {
    id: 'cheque_ready',
    label: 'Cheque Ready for Pickup',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    requiresDate: true,
    description: 'Cheque is signed, collection agent needs to visit',
  },
  {
    id: 'disputed_amount',
    label: 'Disputed Bill / Goods Return',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    requiresDate: false,
    description: 'Party claims rates mismatch, damaged goods, or pending credit note',
  },
];
