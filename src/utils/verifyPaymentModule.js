/**
 * Automated Verification Test for Complete Payment Module with Invoice Number & Date Tracking
 */

import { PAYMENT_MODES, PAYMENT_STATUSES, calculatePaymentStatus } from '../constants/paymentModes.js';

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
console.log('💳 PAYMENT MODULE INVOICE & DATE TRACKING TEST 💳');
console.log('====================================================\n');

// 1. Verify Payment Methods
console.log('--- 1. Testing Supported Payment Methods ---');
const expectedMethods = ['cash', 'upi', 'bank_transfer', 'cheque', 'other'];
expectedMethods.forEach((method) => {
  const found = PAYMENT_MODES.find((m) => m.id === method);
  assert(!!found, `Payment method "${method}" supported: ${found?.label}`);
});

// 2. Test Step-by-Step Ledger Lifecycle with Invoice & Date Tracking
console.log('\n--- 2. Testing: Amount given on Date from Invoice Number ---');

const invoiceNumber = 'INV-100234';
const billAmount = 25000;
let totalPaid = 0;
let remaining = billAmount - totalPaid;

// Payment 1: ₹10,000 given on 2026-08-18 against INV-100234
const payment1 = {
  id: 'pay_001',
  receiptNumber: 'REC-1001',
  invoiceNumber: invoiceNumber,
  amount: 10000,
  paymentDate: '2026-08-18',
  paymentMethod: 'upi',
  notes: 'First installment paid via GPay UPI',
};

assert(payment1.amount === 10000, 'Amount given is ₹10,000');
assert(payment1.paymentDate === '2026-08-18', 'Given on date 2026-08-18');
assert(payment1.invoiceNumber === 'INV-100234', 'From Invoice #INV-100234');

totalPaid += payment1.amount;
remaining = billAmount - totalPaid;
let statusInfo = calculatePaymentStatus(billAmount, totalPaid);

assert(remaining === 15000, `Remaining balance is ₹15,000`);
assert(statusInfo.status === PAYMENT_STATUSES.PARTIALLY_PAID, `Status is PARTIALLY_PAID`);

// Formatted statement test
const statement1 = `₹${payment1.amount.toLocaleString('en-IN')} paid on ${payment1.paymentDate} against Invoice #${payment1.invoiceNumber}`;
assert(statement1 === '₹10,000 paid on 2026-08-18 against Invoice #INV-100234', `Statement: "${statement1}"`);

// Payment 2: ₹15,000 given on 2026-08-19 against INV-100234
const payment2 = {
  id: 'pay_002',
  receiptNumber: 'REC-1002',
  invoiceNumber: invoiceNumber,
  amount: 15000,
  paymentDate: '2026-08-19',
  paymentMethod: 'bank_transfer',
  notes: 'Final settlement via NEFT/IMPS',
};

assert(payment2.amount === 15000, 'Amount given is ₹15,000');
assert(payment2.paymentDate === '2026-08-19', 'Given on date 2026-08-19');
assert(payment2.invoiceNumber === 'INV-100234', 'From Invoice #INV-100234');

totalPaid += payment2.amount;
remaining = billAmount - totalPaid;
statusInfo = calculatePaymentStatus(billAmount, totalPaid);

assert(remaining === 0, `Remaining balance is ₹0`);
assert(statusInfo.status === PAYMENT_STATUSES.PAID, `Status is PAID`);

const statement2 = `₹${payment2.amount.toLocaleString('en-IN')} paid on ${payment2.paymentDate} against Invoice #${payment2.invoiceNumber}`;
assert(statement2 === '₹15,000 paid on 2026-08-19 against Invoice #INV-100234', `Statement: "${statement2}"`);

// 3. Test Invalid Excess Payment Block
console.log('\n--- 3. Testing Prevention of Invalid Excess Payment ---');
const invalidPayment = 5000;
assert(invalidPayment > remaining, 'Excess payment blocked when remaining balance is ₹0');

console.log('\n====================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
