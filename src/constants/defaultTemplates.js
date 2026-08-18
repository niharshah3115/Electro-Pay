export const DEFAULT_WHATSAPP_TEMPLATES = [
  {
    id: 'standard_reminder',
    title: 'Personalized Payment Due (Standard)',
    language: 'English',
    category: 'due_today',
    text: `Hello {owner_name},

Your payment of ₹{due_amount} for invoice {invoice_number} is due today.

Kindly arrange the payment at your earliest convenience.

Thank you.`,
  },
  {
    id: 'due_today',
    title: 'Payment Reminder with UPI Details',
    language: 'Hinglish / English',
    category: 'due_today',
    text: `Hello {owner_name},

Your payment of ₹{due_amount} for invoice {invoice_number} is pending.

Kindly arrange the payment to UPI: *{upi_id}* at your earliest convenience.

Thank you,
*{business_name}*`,
  },
  {
    id: 'overdue_urgent',
    title: 'Overdue Alert (Urgent)',
    language: 'English',
    category: 'overdue',
    text: `Hello {owner_name},

Your payment of ₹{due_amount} for invoice {invoice_number} is overdue.

Kindly arrange the payment at your earliest convenience to avoid any disruption in supply.

Thank you.`,
  },
  {
    id: 'statement_summary',
    title: 'Account Ledger Summary',
    language: 'English',
    category: 'statement',
    text: `Hello {owner_name},

Statement of Account for *{shop_name}*:
• Total Bill Amount: *₹{total_amount}*
• Total Paid: *₹{paid_amount}*
• Pending Balance Due: *₹{due_amount}* (Invoice {invoice_number})

Kindly arrange the payment at your earliest convenience.

Thank you.`,
  },
];
