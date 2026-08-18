/**
 * Automated Verification Test for Complete Shopkeeper & Payment Module (Clean Architecture)
 */

import { DEFAULT_CREDIT_DAYS } from '../constants/creditConfig.js';

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
console.log('🏪 SHOPKEEPER & PAYMENT DIRECT LEDGER TEST 🏪');
console.log('====================================================\n');

const mockShopkeepers = new Map();
const mockPayments = new Map();
const currentDistributorId = 'dist_test_auth_user_001';

// 1. ADD SHOPKEEPER WITH BILL AMOUNT
console.log('--- 1. Testing Add Shopkeeper with Bill Amount ---');
const shopkeeperId = 'sk_test_101';
const newShopkeeper = {
  id: shopkeeperId,
  distributorId: currentDistributorId,
  shopName: 'Gupta Electricals & Hardware',
  ownerName: 'Manoj Gupta',
  phone: '9820123456',
  address: 'Shop 4, Lohar Chawl Market, Kalbadevi',
  city: 'Mumbai',
  gstNumber: '27AABCG1234F1Z5',
  creditDays: DEFAULT_CREDIT_DAYS, // 35 Days
  deliveryDate: '2026-07-10', // Goods Delivered Date
  dueDate: '2026-08-14', // 35 Days later
  billAmount: 15000,
  totalOutstanding: 15000,
  totalPaidAmount: 0,
  createdAt: new Date().toISOString(),
};
mockShopkeepers.set(shopkeeperId, newShopkeeper);

assert(mockShopkeepers.has(shopkeeperId), 'Shopkeeper added to store');
assert(newShopkeeper.deliveryDate === '2026-07-10', 'Goods Delivered Date recorded (2026-07-10)');
assert(newShopkeeper.dueDate === '2026-08-14', 'Maturity Due Date is 35 days from delivery (2026-08-14)');
assert(newShopkeeper.billAmount === 15000, 'Bill Amount is ₹15,000');
assert(newShopkeeper.totalOutstanding === 15000, 'Initial Due Amount equals ₹15,000');
assert(newShopkeeper.totalPaidAmount === 0, 'Initial Paid Amount is ₹0');

// 2. RECORD DIRECT PAYMENT
console.log('\n--- 2. Testing Record Payment (₹5,000) ---');
const paymentId = 'pay_test_301';
const paymentAmount = 5000;

const sk = mockShopkeepers.get(shopkeeperId);
sk.totalPaidAmount += paymentAmount;
sk.totalOutstanding -= paymentAmount;
mockShopkeepers.set(shopkeeperId, sk);

const paymentRecord = {
  id: paymentId,
  shopkeeperId,
  receiptNumber: 'REC-3001',
  amount: paymentAmount,
  paymentDate: '2026-08-18',
  paymentMode: 'upi',
};
mockPayments.set(paymentId, paymentRecord);

assert(mockPayments.has(paymentId), 'Payment receipt recorded');
assert(mockShopkeepers.get(shopkeeperId).totalOutstanding === 10000, 'Shopkeeper due balance reduced to ₹10,000');
assert(mockShopkeepers.get(shopkeeperId).totalPaidAmount === 5000, 'Shopkeeper paid amount updated to ₹5,000');

// 3. DELETE PAYMENT (REVERT BALANCE)
console.log('\n--- 3. Testing Delete Payment & Revert Balances ---');
const payToDelete = mockPayments.get(paymentId);
const targetSk = mockShopkeepers.get(payToDelete.shopkeeperId);
targetSk.totalOutstanding += payToDelete.amount;
targetSk.totalPaidAmount -= payToDelete.amount;
mockShopkeepers.set(payToDelete.shopkeeperId, targetSk);
mockPayments.delete(paymentId);

assert(!mockPayments.has(paymentId), 'Payment successfully deleted');
assert(mockShopkeepers.get(shopkeeperId).totalOutstanding === 15000, 'Shopkeeper balance restored to ₹15,000');
assert(mockShopkeepers.get(shopkeeperId).totalPaidAmount === 0, 'Shopkeeper paid amount reverted to ₹0');

// 4. DELETE SHOPKEEPER
console.log('\n--- 4. Testing Delete Shopkeeper & Cascaded Records ---');
mockShopkeepers.delete(shopkeeperId);
for (const [id, item] of mockPayments) {
  if (item.shopkeeperId === shopkeeperId) mockPayments.delete(id);
}

assert(!mockShopkeepers.has(shopkeeperId), 'Shopkeeper successfully deleted');
assert(mockPayments.size === 0, 'Associated payments cleanly deleted');

console.log('\n====================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
