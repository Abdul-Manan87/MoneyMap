/* 
   MoneyMap — validators.js
   */

function isRequired(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

/*
  Shows/hides the .field__error message under an input and toggles the
  .has-error class used by components.css.
 */
function setFieldError(fieldEl, message) {
  const errorEl = fieldEl.querySelector('.field__error');
  if (message) {
    fieldEl.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  } else {
    fieldEl.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }
}
