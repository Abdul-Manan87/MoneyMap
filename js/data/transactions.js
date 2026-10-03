/* 
   MoneyMap — transactions.js (data layer)
   A Transaction is the only place the user manually enters money data.
   Every transaction is linked to an Account, and adding, editing, or
   deleting one automatically updates that account's balance — the user
   never edits a balance number directly (see accounts.js).
    */

const TRANSACTIONS_KEY = 'transactions';

function getTransactions() {
  return readCollection(TRANSACTIONS_KEY);
}

function getTransactionById(id) {
  return getTransactions().find((t) => t.id === id) || null;
}

function getTransactionsByAccount(accountId) {
  return getTransactions().filter((t) => t.accountId === accountId);
}

function getTransactionsByCategory(category) {
  return getTransactions().filter((t) => t.category === category);
}

/**
 * Add a transaction and apply its effect on the linked account's balance.
 * type is 'income' (adds to the account) or 'expense' (subtracts).
 */
function addTransaction({ name, type, amount, category, accountId, date }) {
  const account = getAccountById(accountId);
  if (!account) return null;

  const transaction = {
    id: generateId('txn'),
    name: name.trim(),
    type: type === 'income' ? 'income' : 'expense',
    amount: Math.abs(Number(amount)) || 0,
    category,
    accountId,
    date: date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };

  applyEffect(transaction);

  const transactions = getTransactions();
  transactions.push(transaction);
  writeCollection(TRANSACTIONS_KEY, transactions);
  return transaction;
}

/**
 * Update a transaction. The old amount is un-applied from its account
 * first, then the new amount is applied — so editing a $20 expense into
 * a $50 expense correctly deducts the extra $30, even if the account
 * changed too.
 */
function updateTransaction(id, updates) {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const original = transactions[index];
  reverseEffect(original);

  const updated = {
    ...original,
    ...updates,
    amount: Math.abs(Number(updates.amount ?? original.amount)) || 0,
  };

  const account = getAccountById(updated.accountId);
  if (!account) {
    // Roll back — re-apply the original so we don't leave the account short.
    applyEffect(original);
    writeCollection(TRANSACTIONS_KEY, transactions);
    return null;
  }

  applyEffect(updated);
  transactions[index] = updated;
  writeCollection(TRANSACTIONS_KEY, transactions);
  return updated;
}

function deleteTransaction(id) {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return;

  reverseEffect(transactions[index]);
  transactions.splice(index, 1);
  writeCollection(TRANSACTIONS_KEY, transactions);
}

/** Apply a transaction's effect on its account (used on add / re-apply). */
function applyEffect(transaction) {
  if (transaction.type === 'income') {
    addMoney(transaction.accountId, transaction.amount);
  } else {
    spendFromAccount(transaction.accountId, transaction.amount);
  }
}

/** Undo a transaction's effect on its account (used on edit / delete). */
function reverseEffect(transaction) {
  if (transaction.type === 'income') {
    spendFromAccount(transaction.accountId, transaction.amount);
  } else {
    addMoney(transaction.accountId, transaction.amount);
  }
}

/* ---- Search / filter / sort helpers ---- */

function filterTransactions(transactions, { search = '', category = 'all' } = {}) {
  const q = search.trim().toLowerCase();
  return transactions.filter((t) => {
    const matchesSearch = !q || t.name.toLowerCase().includes(q);
    const matchesCategory = category === 'all' || t.category === category;
    return matchesSearch && matchesCategory;
  });
}

function sortTransactions(transactions, sortBy = 'date-desc') {
  const list = [...transactions];
  switch (sortBy) {
    case 'date-asc':
      return list.sort((a, b) => a.date.localeCompare(b.date));
    case 'amount-desc':
      return list.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return list.sort((a, b) => a.amount - b.amount);
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'date-desc':
    default:
      return list.sort((a, b) => b.date.localeCompare(a.date));
  }
}
