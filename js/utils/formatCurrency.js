/* 
   MoneyMap — formatCurrency.js
   One formatting function so every page displays money the same way.
   */

function formatCurrency(amount, currency = getCurrentCurrency()) {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Reads the user's chosen currency from Settings (built in Module 5).
 * Defaults to USD until Settings exists / a value is saved.
 */
function getCurrentCurrency() {
  return localStorage.getItem('moneymap_currency') || 'USD';
}
