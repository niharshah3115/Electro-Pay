/**
 * Automated Verification Test for WhatsApp Payment Reminders
 */

import {
  generatePersonalizedReminderMessage,
  cleanPhoneNumber,
  generateWhatsAppUrl,
  compileTemplate,
} from './whatsappUtils.js';

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
console.log('💬 WHATSAPP PAYMENT REMINDER GENERATOR TEST 💬');
console.log('====================================================\n');

// 1. Test Exact Message Generation
console.log('--- 1. Testing Exact Personalized Message Generator ---');
const sampleShopkeeper = {
  shopName: 'Rajesh Electricals',
  ownerName: 'Rajesh',
  phone: '9820123456',
  invoiceNumber: 'INV-1025',
  totalOutstanding: 25000,
};

const timingDueToday = { isDueToday: true, daysRemaining: 0, daysOverdue: 0 };
const message = generatePersonalizedReminderMessage(sampleShopkeeper, timingDueToday);

const expectedMessage = `Hello Rajesh,

Your payment of ₹25,000 for invoice INV-1025 is due today.

Kindly arrange the payment at your earliest convenience.

Thank you.`;

assert(message === expectedMessage, 'Generated message matches exact required template');
console.log('Generated Message Output:\n--------------------');
console.log(message);
console.log('--------------------');

// 2. Test Phone Number Cleaning
console.log('\n--- 2. Testing Phone Number Formatting for WhatsApp ---');
assert(cleanPhoneNumber('9820123456') === '919820123456', '10-digit phone 9820123456 formatted to 919820123456');
assert(cleanPhoneNumber('+91 98201-23456') === '919820123456', 'Formatted +91 98201-23456 cleaned to 919820123456');
assert(cleanPhoneNumber('919820123456') === '919820123456', 'Full 12-digit number preserved as 919820123456');

// 3. Test URL Encoding & WhatsApp Link Generation
console.log('\n--- 3. Testing WhatsApp Click-to-Chat URL Encoding ---');
const waUrl = generateWhatsAppUrl(sampleShopkeeper.phone, message);

assert(waUrl.startsWith('https://wa.me/919820123456?text='), 'URL starts with https://wa.me/919820123456?text=');
assert(!waUrl.includes(' '), 'URL contains no raw unencoded spaces');
assert(!waUrl.includes('\n'), 'URL contains no raw unencoded newlines');

// Verify decoding matches the original message
const extractedTextParam = waUrl.split('?text=')[1];
const decodedMessage = decodeURIComponent(extractedTextParam);
assert(decodedMessage === message, 'Decoded URL text perfectly matches original message');

// 4. Test Template Engine with Multiple Tokens
console.log('\n--- 4. Testing Template Token Replacements ---');
const template = 'Hello {owner_name}, your payment of ₹{due_amount} for invoice {invoice_number} is due today.';
const compiled = compileTemplate(template, {
  ownerName: sampleShopkeeper.ownerName,
  dueAmount: sampleShopkeeper.totalOutstanding,
  invoiceNumber: sampleShopkeeper.invoiceNumber,
});

assert(
  compiled === 'Hello Rajesh, your payment of ₹25,000 for invoice INV-1025 is due today.',
  `Template correctly compiled: "${compiled}"`
);

console.log('\n====================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
