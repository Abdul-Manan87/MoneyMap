/* ==========================================================================
   MoneyMap — budgets.js (data layer)
   A Budget is a spending limit the user sets per category. "Amount spent"
   is never entered by hand — it's calculated live from this month's
   expense transactions in that category. One budget per category.
   ========================================================================== */

const BUDGETS_KEY = 'budgets';

function getBudgets() {
  return readCollection(BUDGETS_KEY);
}

function getBudgetByCategory(category) {
  return getBudgets().find((b) => b.category === category) || null;
}

/**
 * Create a budget for a category. Returns null if that category
 * already has a budget — use updateBudget to change its limit instead.
 */
function createBudget({ category, limit }) {
  if (getBudgetByCategory(category)) return null;

  const budgets = getBudgets();
  const budget = {
    id: generateId('bud'),
    category,
    limit: Math.abs(Number(limit)) || 0,
    createdAt: new Date().toISOString(),
  };

  budgets.push(budget);
  writeCollection(BUDGETS_KEY, budgets);
  return budget;
}

function updateBudget(id, { limit }) {
  const budgets = getBudgets();
  const budget = budgets.find((b) => b.id === id);
  if (!budget) return null;

  budget.limit = Math.abs(Number(limit)) || 0;
  writeCollection(BUDGETS_KEY, budgets);
  return budget;
}

function deleteBudget(id) {
  const budgets = getBudgets().filter((b) => b.id !== id);
  writeCollection(BUDGETS_KEY, budgets);
}

/**
 * Total spent in a category this calendar month, calculated from
 * expense transactions — never stored, always derived live.
 */
function calculateSpent(category, monthStr = currentMonthStr()) {
  return roundMoney(
    getTransactions()
      .filter((t) => t.type === 'expense' && t.category === category && t.date.startsWith(monthStr))
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

/**
 * Every budget, merged with its live spent/remaining/percent/status —
 * this is what the Budgets page (and later Overview) renders from.
 */
function getBudgetsWithProgress() {
  return getBudgets().map((budget) => {
    const spent = calculateSpent(budget.category);
    const percent = budget.limit > 0 ? Math.min(100, roundMoney((spent / budget.limit) * 100)) : 0;
    let status = 'ok';
    if (spent > budget.limit) status = 'exceeded';
    else if (percent >= 80) status = 'warning';

    return {
      ...budget,
      spent,
      remaining: roundMoney(budget.limit - spent),
      percent,
      status,
    };
  });
}

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
