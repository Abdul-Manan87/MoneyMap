/* ==========================================================================
   MoneyMap — settings.js (page logic)
   Currency is a display preference (read by formatCurrency.js on every
   page). Reset wipes every MoneyMap key via storage.js's resetAllData().
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const currencySelect = document.getElementById('currency-select');
  const saveIndicator = document.getElementById('save-indicator');

  const resetModal = document.getElementById('reset-modal');
  const resetInput = document.getElementById('reset-confirm-input');

  // ---- Currency ----
  currencySelect.value = localStorage.getItem('moneymap_currency') || 'USD';

  currencySelect.addEventListener('change', () => {
    localStorage.setItem('moneymap_currency', currencySelect.value);
    saveIndicator.classList.add('is-visible');
    setTimeout(() => saveIndicator.classList.remove('is-visible'), 1500);
  });

  // ---- Reset data ----
  document.getElementById('open-reset').addEventListener('click', () => {
    resetInput.value = '';
    setFieldError(document.getElementById('field-reset-confirm'), null);
    resetModal.hidden = false;
    resetInput.focus();
  });

  document.getElementById('cancel-reset').addEventListener('click', () => {
    resetModal.hidden = true;
  });

  resetModal.addEventListener('click', (e) => {
    if (e.target === resetModal) resetModal.hidden = true;
  });

  document.getElementById('confirm-reset').addEventListener('click', () => {
    const field = document.getElementById('field-reset-confirm');
    if (resetInput.value.trim() !== 'RESET') {
      setFieldError(field, 'Type RESET exactly to confirm.');
      return;
    }
    resetAllData();
    window.location.href = 'overview.html';
  });
});
