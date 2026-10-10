/* ==========================================================================
   MoneyMap — categories.js
   One shared list of categories so Transactions, Budgets, and Analytics
   (Modules 2, 3, 5) all use the exact same names — a Budget for "Food"
   only works if Transactions uses the category "Food" too.
   ========================================================================== */

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Other',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Gift',
  'Other Income',
];

function getCategoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

function getAllCategories() {
  return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
}
