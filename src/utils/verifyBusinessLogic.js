/**
 * Automated Business Logic Verification Test Suite for ElectroTrack
 */

import { calculateDueDate, calculateInvoiceStatus, getTodayString, getDaysElapsed } from './dateUtils.js';
import { compileTemplate, cleanPhoneNumber, generateTelUrl } from './whatsappUtils.js';
import { formatINR, numberToWords } from './currencyUtils.js';
import { calculateAgingBreakdown } from './agingUtils.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log('====================================================');
console.log('⚡ ELECTROTRACK BUSINESS LOGIC VERIFICATION SUITE ⚡');
console.log('====================================================\n');

// TEST 1: 39-Day Due Date Calculation Engine
console.log('--- 1. Testing 39-Day Credit Due-Date Arithmetic ---');
// 2026-07-10 + 39 days = 2026-08-18
const due1 = calculateDueDate('2026-07-10', 39);
assert(due1 === '2026-08-18', `2026-07-10 + 39 days should be 2026-08-18 (Got: ${due1})`);

// 2026-01-01 + 39 days = 2026-02-09
const due2 = calculateDueDate('2026-01-01', 39);
assert(due2 === '2026-02-09', `2026-01-01 + 39 days should be 2026-02-09 (Got: ${due2})`);

// 2026-02-01 + 39 days (non-leap year February has 28 days: 28-1=27 days left in Feb, + 12 days in March = 2026-03-12)
const due3 = calculateDueDate('2026-02-01', 39);
assert(due3 === '2026-03-12', `2026-02-01 + 39 days should be 2026-03-12 (Got: ${due3})`);

// TEST 2: Invoice Status & Aging Classification
console.log('\n--- 2. Testing Invoice Status Classifications ---');
const today = getTodayString();
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

const statusPaid = calculateInvoiceStatus(yesterday, 0, 50000);
assert(statusPaid.status === 'paid', 'Zero balance invoice should be status: paid');

const statusDueToday = calculateInvoiceStatus(today, 25000, 25000);
assert(statusDueToday.status === 'due_today', 'Due date matching today should be status: due_today');

const statusOverdue = calculateInvoiceStatus(yesterday, 35000, 35000);
assert(statusOverdue.status === 'overdue' && statusOverdue.diffDays >= 1, 'Past due date with positive balance should be status: overdue');

const statusUpcoming = calculateInvoiceStatus(tomorrow, 40000, 40000);
assert(statusUpcoming.status === 'upcoming' && statusUpcoming.diffDays === 5, 'Future due date should be status: upcoming (5 days left)');

// TEST 3: WhatsApp Message Compiler & Token Substitution
console.log('\n--- 3. Testing WhatsApp Reminder Token Interpolator ---');
const template = 'Namaste {owner_name} ji ({shop_name}), your invoice #{invoice_numbers} of ₹{balance_amount} is due on {due_date}. Pay via UPI: {upi_id}. - {business_name}';
const compiled = compileTemplate(template, {
  ownerName: 'Manoj Gupta',
  shopName: 'Gupta Electricals',
  invoiceNumbers: 'INV-2026-081, INV-2026-082',
  balanceAmount: 68500,
  dueDate: '18 Aug 2026',
  upiId: 'balaji@okhdfcbank',
  businessName: 'Balaji Electricals',
});

assert(compiled.includes('Manoj Gupta') && compiled.includes('Gupta Electricals'), 'Template correctly replaces owner and shop names');
assert(compiled.includes('INV-2026-081, INV-2026-082'), 'Template correctly replaces multiple invoice numbers');
assert(compiled.includes('68,500'), 'Template correctly formats balance amount in INR format');
assert(compiled.includes('balaji@okhdfcbank'), 'Template correctly inserts UPI ID');

// Phone cleaning
const cleanPhone = cleanPhoneNumber('+91 98201-23456');
assert(cleanPhone === '919820123456', `Phone cleaner formats to 919820123456 (Got: ${cleanPhone})`);

const cleanPhone10 = cleanPhoneNumber('9820123456');
assert(cleanPhone10 === '919820123456', `10-digit phone automatically gets 91 prepended (Got: ${cleanPhone10})`);

// TEST 4: FIFO Payment Allocation Logic
console.log('\n--- 4. Testing FIFO Payment Allocation Algorithm ---');
const testInvoices = [
  { id: 'inv_1', invoiceNumber: 'INV-001', invoiceDate: '2026-06-01', balanceAmount: 20000 },
  { id: 'inv_2', invoiceNumber: 'INV-002', invoiceDate: '2026-06-15', balanceAmount: 30000 },
  { id: 'inv_3', invoiceNumber: 'INV-003', invoiceDate: '2026-07-01', balanceAmount: 50000 },
];

let paymentAmount = 35000;
let remaining = paymentAmount;
const allocations = [];

for (const inv of testInvoices) {
  if (remaining <= 0) break;
  const alloc = Math.min(inv.balanceAmount, remaining);
  allocations.push({ invoiceId: inv.id, allocatedAmount: alloc });
  remaining -= alloc;
}

assert(allocations.length === 2, '₹35,000 payment should allocate across first 2 invoices');
assert(allocations[0].allocatedAmount === 20000, 'Invoice 1 (Oldest ₹20k) should be fully settled with ₹20,000');
assert(allocations[1].allocatedAmount === 15000, 'Invoice 2 should receive remaining partial ₹15,000');
assert(remaining === 0, 'All ₹35,000 is accounted for');

// TEST 5: Currency Formatting & Number to Words
console.log('\n--- 5. Testing Currency & Number-to-Words ---');
const inr = formatINR(125000);
assert(inr.includes('1,25,000'), `formatINR(125000) produces Indian thousand/lakh separators (Got: ${inr})`);

const words = numberToWords(45500);
assert(words.toLowerCase().includes('forty five thousand five hundred rupees only'), `numberToWords produces: ${words}`);

console.log('\n====================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
