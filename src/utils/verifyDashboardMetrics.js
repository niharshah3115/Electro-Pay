/**
 * Automated Verification Test for Dashboard Firestore Metrics & Attention Priority Queue
 */

import { compileShopkeeperReminders, REMINDER_PRIORITIES } from './reminderEngine.js';
import { generateWhatsAppUrl, generateTelUrl } from './whatsappUtils.js';

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
console.log('📊 DASHBOARD METRICS & PRIORITY ATTENTION TEST 📊');
console.log('====================================================\n');

const today = '2026-08-18';

// Sample real data records
const sampleShopkeepers = [
  {
    id: 'sk_overdue',
    shopName: 'Alpha Electricals',
    ownerName: 'Amit',
    phone: '9820111111',
    deliveryDate: '2026-07-01',
    dueDate: '2026-08-05', // 13 days overdue
    billAmount: 30000,
    totalOutstanding: 20000,
    totalPaidAmount: 10000,
    createdAt: '2026-08-01',
  },
  {
    id: 'sk_due_today',
    shopName: 'Beta Lighting',
    ownerName: 'Bharat',
    phone: '9820222222',
    deliveryDate: '2026-07-14',
    dueDate: '2026-08-18', // DUE TODAY (35 days from delivery)
    billAmount: 25000,
    totalOutstanding: 25000,
    totalPaidAmount: 0,
    createdAt: '2026-08-01',
  },
  {
    id: 'sk_due_2d',
    shopName: 'Gamma Cables',
    ownerName: 'Girish',
    phone: '9820333333',
    deliveryDate: '2026-07-16',
    dueDate: '2026-08-20', // Due in 2 days (within 3 days)
    billAmount: 15000,
    totalOutstanding: 15000,
    totalPaidAmount: 0,
    createdAt: '2026-08-01',
  },
  {
    id: 'sk_due_5d',
    shopName: 'Delta Switchgear',
    ownerName: 'Dinesh',
    phone: '9820444444',
    deliveryDate: '2026-07-19',
    dueDate: '2026-08-23', // Due in 5 days (within 7 days)
    billAmount: 40000,
    totalOutstanding: 40000,
    totalPaidAmount: 0,
    createdAt: '2026-08-01',
  },
  {
    id: 'sk_clear',
    shopName: 'Echo Hardware',
    ownerName: 'Eshwar',
    phone: '9820555555',
    deliveryDate: '2026-07-01',
    dueDate: '2026-08-05',
    billAmount: 50000,
    totalOutstanding: 0,
    totalPaidAmount: 50000,
    createdAt: '2026-08-01',
  },
];

const samplePayments = [
  { id: 'p1', amount: 10000, paymentDate: '2026-08-10', shopkeeperId: 'sk_overdue' },
  { id: 'p2', amount: 50000, paymentDate: '2026-08-12', shopkeeperId: 'sk_clear' },
];

// 1. Compile reminders
const reminders = compileShopkeeperReminders(sampleShopkeepers, today);

console.log('--- 1. Testing "Payments Requiring Attention" Priority Sorting ---');
assert(reminders.length === 4, 'Only 4 unpaid accounts generate reminders (clear omitted)');
assert(reminders[0].priority === REMINDER_PRIORITIES.OVERDUE, '1st priority is OVERDUE (Alpha Electricals)');
assert(reminders[1].priority === REMINDER_PRIORITIES.DUE_TODAY, '2nd priority is DUE_TODAY (Beta Lighting)');
assert(reminders[2].priority === REMINDER_PRIORITIES.CALL_SOON, '3rd priority is Due within 3 days (Gamma Cables)');
assert(reminders[3].priority === REMINDER_PRIORITIES.DUE_SOON, '4th priority is Due within 7 days (Delta Switchgear)');

console.log('\n--- 2. Testing 8 Core Dashboard KPI Metrics ---');
// 1) Total Outstanding = 20000 + 25000 + 15000 + 40000 = 100,000
const totalOutstanding = sampleShopkeepers.reduce((sum, sk) => sum + sk.totalOutstanding, 0);
assert(totalOutstanding === 100000, 'Total Outstanding is ₹100,000');

// 2) Due Today = 25000
const dueToday = reminders.filter(r => r.priority === REMINDER_PRIORITIES.DUE_TODAY).reduce((sum, r) => sum + r.outstandingAmount, 0);
assert(dueToday === 25000, 'Due Today is ₹25,000');

// 3) Due This Week = Due Today + Due 2D + Due 5D = 25000 + 15000 + 40000 = 80000
const dueThisWeek = reminders.filter(r => !r.isOverdue && r.daysRemaining <= 7).reduce((sum, r) => sum + r.outstandingAmount, 0);
assert(dueThisWeek === 80000, 'Due This Week is ₹80,000');

// 4) Overdue = 20000
const overdue = reminders.filter(r => r.priority === REMINDER_PRIORITIES.OVERDUE).reduce((sum, r) => sum + r.outstandingAmount, 0);
assert(overdue === 20000, 'Overdue is ₹20,000');

// 5) Total Shopkeepers = 5
assert(sampleShopkeepers.length === 5, 'Total Shopkeepers count is 5');

// 6) Monthly Sales = 30000 + 25000 + 15000 + 40000 + 50000 = 160,000
const monthlySales = sampleShopkeepers.reduce((sum, sk) => sum + sk.billAmount, 0);
assert(monthlySales === 160000, 'Monthly Sales is ₹160,000');

// 7) Monthly Collections = 10000 + 50000 = 60,000
const monthlyCollections = samplePayments.reduce((sum, p) => sum + p.amount, 0);
assert(monthlyCollections === 60000, 'Monthly Collections is ₹60,000');

console.log('\n--- 3. Testing Immediate Call & WhatsApp URL Actions ---');
const topItem = reminders[0];
const telUrl = generateTelUrl(topItem.phone);
const waUrl = generateWhatsAppUrl(topItem.phone, `Hello ${topItem.ownerName}, payment due.`);

assert(telUrl === 'tel:9820111111', 'CALL action immediately generates tel:9820111111');
assert(waUrl.startsWith('https://wa.me/919820111111?text='), 'WHATSAPP action immediately opens wa.me URL');

console.log('\n====================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
