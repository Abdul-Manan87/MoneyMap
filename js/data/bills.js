/* ==========================================================================
   MoneyMap — bills.js (data layer)
   A Recurring Bill repeats every month on a fixed day. Its status
   (upcoming / due soon / overdue / paid) is never set by hand — it's
   calculated every time the app opens by comparing today's date to the
   bill's due day. "Pay now" logs a real expense Transaction (so it hits
   the linked account and shows up in Transactions/Budgets too) and marks
   the bill paid for the current month only — next month it automatically
   goes back to "upcoming" with no manual reset needed.
   ========================================================================== */

const BILLS_KEY = 'bills';
const DUE_SOON_WINDOW_DAYS = 3;

function getBills() {
  return readCollection(BILLS_KEY);
}

function getBillById(id) {
  return getBills().find((b) => b.id === id) || null;
}

function createBill({ name, amount, dueDay, category, accountId }) {
  const account = getAccountById(accountId);
  if (!account) return null;

  const bills = getBills();
  const bill = {
    id: generateId('bill'),
    name: name.trim(),
    amount: Math.abs(Number(amount)) || 0,
    dueDay: clampDueDay(dueDay),
    category,
    accountId,
    lastPaidMonth: null, // "YYYY-MM" of the month it was last paid, or null
    createdAt: new Date().toISOString(),
  };

  bills.push(bill);
  writeCollection(BILLS_KEY, bills);
  return bill;
}

function updateBill(id, updates) {
  const bills = getBills();
  const bill = bills.find((b) => b.id === id);
  if (!bill) return null;

  Object.assign(bill, updates);
  if (updates.amount !== undefined) bill.amount = Math.abs(Number(updates.amount)) || 0;
  if (updates.dueDay !== undefined) bill.dueDay = clampDueDay(updates.dueDay);

  writeCollection(BILLS_KEY, bills);
  return bill;
}

function deleteBill(id) {
  writeCollection(BILLS_KEY, getBills().filter((b) => b.id !== id));
}

/**
 * Log this bill's payment as a real expense Transaction, linked to the
 * bill's account and category. Automatically hits the account balance
 * (via addTransaction -> spendFromAccount) and shows up in Transactions
 * and any matching Budget.
 */
function payBill(id) {
  const bill = getBillById(id);
  if (!bill) return null;

  const transaction = addTransaction({
    name: bill.name,
    type: 'expense',
    amount: bill.amount,
    category: bill.category,
    accountId: bill.accountId,
    date: new Date().toISOString().slice(0, 10),
  });
  if (!transaction) return null;

  updateBill(id, { lastPaidMonth: currentMonthStr() });
  return transaction;
}

/**
 * Status is always derived from today's date — never stored.
 */
function getBillStatus(bill) {
  if (bill.lastPaidMonth === currentMonthStr()) return 'paid';

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), Math.min(bill.dueDay, daysInMonth));
  const diffDays = Math.round((dueDate - stripTime(today)) / 86400000);

  if (diffDays < 0) return 'overdue';
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return 'due-soon';
  return 'upcoming';
}

function getBillsWithStatus() {
  return getBills()
    .map((bill) => ({ ...bill, status: getBillStatus(bill), daysUntilDue: daysUntilDue(bill) }))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

function daysUntilDue(bill) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), Math.min(bill.dueDay, daysInMonth));
  return Math.round((dueDate - stripTime(today)) / 86400000);
}

function clampDueDay(day) {
  const n = Math.round(Number(day)) || 1;
  return Math.min(Math.max(n, 1), 31);
}

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
