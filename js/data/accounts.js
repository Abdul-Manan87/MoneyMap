/* MoneyMap — accounts.js (data layer)
   An Account is where the user's money lives — like a bank. The user
   manually adds money into it; every other module (transactions, budgets,
   pots, overview, analytics) reads from here but never edits balance
   directly. That rule lives entirely in this file.

   NOTE: from Module 2 onward, addMoney() and spendFromAccount() will be
   called internally by transactions.js so every balance change is backed
   by a transaction record. Module 1 they adjust balance directly.
   */

const ACCOUNTS_KEY = 'accounts';

const ACCOUNT_TYPES = ['bank', 'cash', 'savings', 'credit'];

function getAccounts() {
  return readCollection(ACCOUNTS_KEY);
}

function getAccountById(accountId) {
  return getAccounts().find((a) => a.id === accountId) || null;
}

/**
 * Create a new account. The user sets a name, a type, and a starting
 * balance — this is the one time a balance is ever typed in directly.
 */
function createAccount({ name, type, startingBalance }) {
  const accounts = getAccounts();

  const newAccount = {
    id: generateId('acc'),
    name: name.trim(),
    type: ACCOUNT_TYPES.includes(type) ? type : 'bank',
    balance: roundMoney(Number(startingBalance) || 0),
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  writeCollection(ACCOUNTS_KEY, accounts);
  return newAccount;
}

/**
 * Add money into an existing account (a deposit).
 * This is the "add money like a bank" action.
 */
function addMoney(accountId, amount) {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === accountId);
  if (!account || !(Number(amount) > 0)) return null;

  account.balance = roundMoney(account.balance + Number(amount));
  writeCollection(ACCOUNTS_KEY, accounts);
  return account;
}

/**
 * Deduct money from an account. Exposed now so Module 2's transactions.js
 * can call it the moment a spend transaction is logged.
 */
function spendFromAccount(accountId, amount) {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === accountId);
  if (!account || !(Number(amount) > 0)) return null;

  account.balance = roundMoney(account.balance - Number(amount));
  writeCollection(ACCOUNTS_KEY, accounts);
  return account;
}

function renameAccount(accountId, newName) {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === accountId);
  if (!account || !newName.trim()) return null;

  account.name = newName.trim();
  writeCollection(ACCOUNTS_KEY, accounts);
  return account;
}

function deleteAccount(accountId) {
  const accounts = getAccounts().filter((a) => a.id !== accountId);
  writeCollection(ACCOUNTS_KEY, accounts);
}

/**
 * Total balance across every account — what Overview will display.
 */
function getTotalBalance() {
  return roundMoney(getAccounts().reduce((sum, a) => sum + a.balance, 0));
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
