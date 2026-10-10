/* ==========================================================================
   MoneyMap — pots.js (data layer)
   A Pot is a savings goal — money set aside from a specific Account.
   Adding to a pot pulls money out of that account; withdrawing puts it
   back. Progress is always calculated from pot.saved vs pot.goal, never
   typed in directly.
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

function getPotProgress(pot) {
  return pot.goal > 0 ? Math.min(100, roundMoney((pot.saved / pot.goal) * 100)) : 0;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
