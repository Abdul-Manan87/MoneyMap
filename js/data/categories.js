/* 
   MoneyMap — categories.js
    */

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
