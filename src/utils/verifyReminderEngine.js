/**
 * Automated Verification Test for Payment Reminder Engine
 */

import {
  calculatePaymentReminderPriority,
  compileShopkeeperReminders,
  REMINDER_PRIORITIES,
} from './reminderEngine.js';

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
console.log('⏰ PAYMENT REMINDER ENGINE PRIORITY RULES TEST ⏰');
console.log('====================================================\n');

const referenceDate = '2026-08-18';

// Rule 1: 7+ days remaining -> UPCOMING
console.log('--- 1. Testing Rule: 7+ days remaining -> UPCOMING ---');
const resUpcoming = calculatePaymentReminderPriority('2026-08-28', 15000, referenceDate); // 10 days left
assert(resUpcoming.priority === REMINDER_PRIORITIES.UPCOMING, `10 days remaining evaluates to UPCOMING (Got: ${resUpcoming.priority})`);
assert(resUpcoming.daysRemaining === 10, `daysRemaining is 10`);
assert(!resUpcoming.isOverdue, `isOverdue is false`);

const resUpcoming8 = calculatePaymentReminderPriority('2026-08-26', 15000, referenceDate); // 8 days left
assert(resUpcoming8.priority === REMINDER_PRIORITIES.UPCOMING, `8 days remaining evaluates to UPCOMING (Got: ${resUpcoming8.priority})`);

// Rule 2: 4-7 days remaining -> DUE_SOON
console.log('\n--- 2. Testing Rule: 4-7 days remaining -> DUE_SOON ---');
const resDueSoon7 = calculatePaymentReminderPriority('2026-08-25', 12000, referenceDate); // 7 days left
assert(resDueSoon7.priority === REMINDER_PRIORITIES.DUE_SOON, `7 days remaining evaluates to DUE_SOON (Got: ${resDueSoon7.priority})`);
assert(resDueSoon7.daysRemaining === 7, `daysRemaining is 7`);

const resDueSoon5 = calculatePaymentReminderPriority('2026-08-23', 12000, referenceDate); // 5 days left
assert(resDueSoon5.priority === REMINDER_PRIORITIES.DUE_SOON, `5 days remaining evaluates to DUE_SOON (Got: ${resDueSoon5.priority})`);

const resDueSoon4 = calculatePaymentReminderPriority('2026-08-22', 12000, referenceDate); // 4 days left
assert(resDueSoon4.priority === REMINDER_PRIORITIES.DUE_SOON, `4 days remaining evaluates to DUE_SOON (Got: ${resDueSoon4.priority})`);

// Rule 3: 1-3 days remaining -> CALL_SOON
console.log('\n--- 3. Testing Rule: 1-3 days remaining -> CALL_SOON ---');
const resCallSoon3 = calculatePaymentReminderPriority('2026-08-21', 18000, referenceDate); // 3 days left
assert(resCallSoon3.priority === REMINDER_PRIORITIES.CALL_SOON, `3 days remaining evaluates to CALL_SOON (Got: ${resCallSoon3.priority})`);
assert(resCallSoon3.daysRemaining === 3, `daysRemaining is 3`);

const resCallSoon2 = calculatePaymentReminderPriority('2026-08-20', 18000, referenceDate); // 2 days left
assert(resCallSoon2.priority === REMINDER_PRIORITIES.CALL_SOON, `2 days remaining evaluates to CALL_SOON (Got: ${resCallSoon2.priority})`);

const resCallSoon1 = calculatePaymentReminderPriority('2026-08-19', 18000, referenceDate); // 1 day left
assert(resCallSoon1.priority === REMINDER_PRIORITIES.CALL_SOON, `1 day remaining evaluates to CALL_SOON (Got: ${resCallSoon1.priority})`);

// Rule 4: 0 days remaining -> DUE_TODAY
console.log('\n--- 4. Testing Rule: 0 days -> DUE_TODAY ---');
const resDueToday = calculatePaymentReminderPriority('2026-08-18', 25000, referenceDate); // 0 days
assert(resDueToday.priority === REMINDER_PRIORITIES.DUE_TODAY, `0 days evaluates to DUE_TODAY (Got: ${resDueToday.priority})`);
assert(resDueToday.daysRemaining === 0, `daysRemaining is 0`);
assert(resDueToday.isDueToday, `isDueToday is true`);

// Rule 5: 1+ days past due -> OVERDUE
console.log('\n--- 5. Testing Rule: 1+ days past due -> OVERDUE ---');
const resOverdue1 = calculatePaymentReminderPriority('2026-08-17', 30000, referenceDate); // 1 day overdue
assert(resOverdue1.priority === REMINDER_PRIORITIES.OVERDUE, `1 day past due evaluates to OVERDUE (Got: ${resOverdue1.priority})`);
assert(resOverdue1.daysOverdue === 1, `daysOverdue is 1`);
assert(resOverdue1.isOverdue, `isOverdue is true`);

const resOverdue10 = calculatePaymentReminderPriority('2026-08-08', 50000, referenceDate); // 10 days overdue
assert(resOverdue10.priority === REMINDER_PRIORITIES.OVERDUE, `10 days past due evaluates to OVERDUE (Got: ${resOverdue10.priority})`);
assert(resOverdue10.daysOverdue === 10, `daysOverdue is 10`);

// Rule 6: Unpaid Balances Only
console.log('\n--- 6. Testing: Only unpaid balances generate reminders ---');
const resPaidZero = calculatePaymentReminderPriority('2026-08-10', 0, referenceDate);
assert(resPaidZero === null, `Zero balance (₹0) returns null (no reminder generated)`);

// 7. Testing Array Compilation & Sorting
console.log('\n--- 7. Testing Array Compilation & Priority Sorting ---');
const mockShopkeepers = [
  { id: 'sk_1', shopName: 'Upcoming Shop', totalOutstanding: 10000, dueDate: '2026-08-30' }, // UPCOMING (12D)
  { id: 'sk_2', shopName: 'Overdue Shop', totalOutstanding: 20000, dueDate: '2026-08-10' },  // OVERDUE (8D)
  { id: 'sk_3', shopName: 'Due Today Shop', totalOutstanding: 15000, dueDate: '2026-08-18' },// DUE_TODAY (0D)
  { id: 'sk_4', shopName: 'Call Soon Shop', totalOutstanding: 5000, dueDate: '2026-08-20' }, // CALL_SOON (2D)
  { id: 'sk_5', shopName: 'Due Soon Shop', totalOutstanding: 8000, dueDate: '2026-08-23' },  // DUE_SOON (5D)
  { id: 'sk_6', shopName: 'Paid Shop', totalOutstanding: 0, dueDate: '2026-08-10' },       // PAID (Skipped)
];

const compiled = compileShopkeeperReminders(mockShopkeepers, referenceDate);

assert(compiled.length === 5, `Compiled 5 unpaid reminders (1 fully paid shopkeeper omitted)`);
assert(compiled[0].priority === REMINDER_PRIORITIES.OVERDUE, `1st item is OVERDUE`);
assert(compiled[1].priority === REMINDER_PRIORITIES.DUE_TODAY, `2nd item is DUE_TODAY`);
assert(compiled[2].priority === REMINDER_PRIORITIES.CALL_SOON, `3rd item is CALL_SOON`);
assert(compiled[3].priority === REMINDER_PRIORITIES.DUE_SOON, `4th item is DUE_SOON`);
assert(compiled[4].priority === REMINDER_PRIORITIES.UPCOMING, `5th item is UPCOMING`);

console.log('\n====================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
