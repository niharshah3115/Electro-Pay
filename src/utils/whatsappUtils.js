/**
 * Utilities for WhatsApp payment reminders & mobile phone calling
 */

/**
 * Cleans phone number to international E.164 format for India
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Generates tel: URL for mobile dialing
 */
export function generateTelUrl(phone) {
  if (!phone) return '#';
  const digits = String(phone).replace(/[\s\-\(\)]/g, '');
  return `tel:${digits}`;
}

/**
 * Generates the standardized personalized WhatsApp payment reminder message
 * Example:
 * Hello Rajesh,
 *
 * Your payment of ₹25,000 for invoice INV-1025 is due today.
 *
 * Kindly arrange the payment at your earliest convenience.
 *
 * Thank you.
 */
export function generatePersonalizedReminderMessage(shopkeeper, timing = {}) {
  const customerName = shopkeeper.shopName || shopkeeper.ownerName || 'Customer';
  const dueAmount = Number(shopkeeper.totalOutstanding) || 0;
  const isWithoutBill = shopkeeper.billingType === 'without_bill' || !!shopkeeper.challanNumber;
  const docTypeLabel = isWithoutBill ? 'Challan/Slip' : 'Invoice';
  const docNumber = isWithoutBill
    ? (shopkeeper.challanNumber || shopkeeper.invoiceNumber || 'CH-1001')
    : (shopkeeper.invoiceNumber || `INV-${shopkeeper.id ? shopkeeper.id.slice(-4) : '1001'}`);

  let dueStatusText = 'is due today';
  if (timing?.isOverdue) {
    dueStatusText = `is overdue by ${timing.daysOverdue || 1} day${(timing.daysOverdue || 1) === 1 ? '' : 's'}`;
  } else if (timing?.daysRemaining > 0) {
    dueStatusText = `is due in ${timing.daysRemaining} day${timing.daysRemaining === 1 ? '' : 's'}`;
  } else if (timing?.isDueToday) {
    dueStatusText = 'is due today';
  }

  return `Hello ${customerName},

Your payment of ₹${dueAmount.toLocaleString('en-IN')} for ${docTypeLabel} ${docNumber} ${dueStatusText}.

Kindly arrange the payment at your earliest convenience.

Thank you.`;
}

/**
 * Replaces tokens in WhatsApp template
 * Tokens:
 * {shop_name}, {owner_name}, {invoice_number}, {invoice_numbers}, {total_overdue},
 * {balance_amount}, {due_amount}, {paid_amount}, {total_amount}, {due_date}, {delivery_date}, {days_overdue}, {upi_id}, {business_name}
 */
export function compileTemplate(templateText, data = {}) {
  if (!templateText) return '';

  const due = Number(data.dueAmount || data.totalOverdue || data.balanceAmount) || 0;
  const paid = Number(data.paidAmount) || 0;
  const total = Number(data.totalAmount) || (due + paid);

  let compiled = templateText;
  const replacements = {
    '{shop_name}': data.shopName || 'Shop',
    '{owner_name}': data.ownerName || data.shopName || 'Customer',
    '{invoice_number}': data.invoiceNumber || data.invoiceNumbers || 'N/A',
    '{invoice_numbers}': data.invoiceNumbers || data.invoiceNumber || 'N/A',
    '{total_overdue}': due.toLocaleString('en-IN'),
    '{balance_amount}': due.toLocaleString('en-IN'),
    '{due_amount}': due.toLocaleString('en-IN'),
    '{paid_amount}': paid.toLocaleString('en-IN'),
    '{total_amount}': total.toLocaleString('en-IN'),
    '{due_date}': data.dueDate || 'Today',
    '{delivery_date}': data.deliveryDate || 'N/A',
    '{days_overdue}': data.daysOverdue || 0,
    '{upi_id}': data.upiId || 'distributor@upi',
    '{business_name}': data.businessName || 'ElectroTrack Distributor',
  };

  for (const [key, value] of Object.entries(replacements)) {
    compiled = compiled.replaceAll(key, value);
  }

  return compiled;
}

/**
 * Generates WhatsApp click-to-chat URL with properly URL-encoded text
 * Does not automatically send messages - requires user click.
 */
export function generateWhatsAppUrl(phone, message) {
  const clean = cleanPhoneNumber(phone);
  if (!clean) return '#';
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}
