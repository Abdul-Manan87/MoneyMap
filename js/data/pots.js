/* ==========================================================================
   MoneyMap — pots.js (data layer)
   A Pot works like a small separate account: money moves into it from an
   Account, and from then on you can spend directly from the pot itself
   (like ice cream from a Vacation pot) without touching your main
   account again. Every add, withdraw, and spend is logged in the pot's
   own activity history — saved is always just the sum of that history,
   never edited directly.

   Pot spending is intentionally NOT logged as a normal Transaction and
   does NOT affect Budgets — money already left your everyday budget the
   moment it was added to the pot, so spending it again from the pot
   would double-count it.
   ========================================================================== */

const POTS_KEY = 'pots';

function getPots() {
  return readCollection(POTS_KEY);
}

function getPotById(potId) {
  return getPots().find((p) => p.id === potId) || null;
}

function createPot({ name, goal, accountId }) {
  const account = getAccountById(accountId);
  if (!account) return null;

  const pots = getPots();
  const pot = {
    id: generateId('pot'),
    name: name.trim(),
    goal: Math.abs(Number(goal)) || 0,
    saved: 0,
    accountId,
    activity: [],
    createdAt: new Date().toISOString(),
  };

  pots.push(pot);
  writeCollection(POTS_KEY, pots);
  return pot;
}

/**
 * Move money from the pot's linked account into the pot.
 */
function addToPot(potId, amount) {
  const pots = getPots();
  const pot = pots.find((p) => p.id === potId);
  if (!pot || !(Number(amount) > 0)) return null;

  spendFromAccount(pot.accountId, amount);
  pot.saved = roundMoney(pot.saved + Number(amount));
  logActivity(pot, { type: 'add', name: 'Added money', amount: Number(amount) });
  writeCollection(POTS_KEY, pots);
  return pot;
}

/**
 * Move money from the pot back into its linked account.
 */
function withdrawFromPot(potId, amount) {
  const pots = getPots();
  const pot = pots.find((p) => p.id === potId);
  if (!pot) return null;

  const amt = Math.min(Number(amount) || 0, pot.saved);
  if (amt <= 0) return null;

  addMoney(pot.accountId, amt);
  pot.saved = roundMoney(pot.saved - amt);
  logActivity(pot, { type: 'withdraw', name: 'Withdrew to account', amount: amt });
  writeCollection(POTS_KEY, pots);
  return pot;
}

/**
 * Spend directly from the pot — e.g. ice cream from a Vacation pot.
 * This never touches the linked account (the money already left it when
 * it was added to the pot) and is never logged as a regular Transaction.
 * Returns null if the pot doesn't have enough saved to cover it.
 */
function spendFromPot(potId, { name, amount, category }) {
  const pots = getPots();
  const pot = pots.find((p) => p.id === potId);
  if (!pot) return null;

  const amt = Number(amount) || 0;
  if (amt <= 0 || amt > pot.saved) return null;

  pot.saved = roundMoney(pot.saved - amt);
  logActivity(pot, { type: 'spend', name: name.trim(), category, amount: amt });
  writeCollection(POTS_KEY, pots);
  return pot;
}

/**
 * Delete a pot. Any money still saved in it is returned to its account
 * first — money never just disappears.
 */
function deletePot(potId) {
  const pots = getPots();
  const pot = pots.find((p) => p.id === potId);
  if (!pot) return;

  if (pot.saved > 0) {
    addMoney(pot.accountId, pot.saved);
  }

  writeCollection(POTS_KEY, pots.filter((p) => p.id !== potId));
}

/**
 * A pot's activity, newest first — its own mini transaction history.
 */
function getPotActivity(potId) {
  const pot = getPotById(potId);
  if (!pot || !pot.activity) return [];
  return [...pot.activity].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

function getPotProgress(pot) {
  return pot.goal > 0 ? Math.min(100, roundMoney((pot.saved / pot.goal) * 100)) : 0;
}

function logActivity(pot, { type, name, category, amount }) {
  if (!pot.activity) pot.activity = [];
  pot.activity.push({
    id: generateId('act'),
    type, // 'add' | 'withdraw' | 'spend'
    name,
    category: category || null,
    amount: roundMoney(amount),
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  });
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
