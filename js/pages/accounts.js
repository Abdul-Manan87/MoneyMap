/*
   MoneyMap — accounts.js (page logic)
   Renders the Accounts page and wires up the two modals: "New account"
   and "Add money". All actual data changes go through js/data/accounts.js
   — this file only handles the UI.
   */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('account-grid');
  const emptyState = document.getElementById('empty-state');
  const totalBalanceEl = document.getElementById('total-balance');

  const createModal = document.getElementById('create-modal');
  const createForm = document.getElementById('create-account-form');
  const addMoneyModal = document.getElementById('add-money-modal');
  const addMoneyForm = document.getElementById('add-money-form');
  const addMoneyAccountName = document.getElementById('add-money-account-name');

  let activeAccountId = null; // which account "Add money" is currently open for

  render();

  // ---- Render ----
  function render() {
    const accounts = getAccounts();
    totalBalanceEl.textContent = formatCurrency(getTotalBalance());

    grid.innerHTML = '';
    emptyState.hidden = accounts.length > 0;

    accounts.forEach((account) => {
      grid.appendChild(buildAccountCard(account));
    });
  }

  function buildAccountCard(account) {
    const card = document.createElement('div');
    card.className = 'account-card';
    card.dataset.type = account.type;

    card.innerHTML = `
      <div class="account-card__top">
        <div>
          <div class="account-card__name">${escapeHtml(account.name)}</div>
          <div class="account-card__type">${account.type}</div>
        </div>
        <button class="btn--danger-text" data-action="delete" title="Delete account">Delete</button>
      </div>
      <div class="account-card__balance num">${formatCurrency(account.balance)}</div>
      <div class="account-card__actions">
        <button class="btn btn--primary" data-action="add-money">+ Add money</button>
      </div>
    `;

    card.querySelector('[data-action="add-money"]').addEventListener('click', () => {
      openAddMoneyModal(account);
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Delete "${account.name}"? This cannot be undone.`)) {
        deleteAccount(account.id);
        render();
      }
    });

    return card;
  }

  // ---- Create account modal ----
  document.getElementById('open-create-account').addEventListener('click', () => {
    createForm.reset();
    ['field-name', 'field-balance'].forEach((id) => setFieldError(document.getElementById(id), null));
    createModal.hidden = false;
    document.getElementById('acc-name').focus();
  });

  document.getElementById('cancel-create').addEventListener('click', () => {
    createModal.hidden = true;
  });

  createForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameField = document.getElementById('field-name');
    const balanceField = document.getElementById('field-balance');
    const name = document.getElementById('acc-name').value;
    const type = document.getElementById('acc-type').value;
    const balance = document.getElementById('acc-balance').value;

    let valid = true;
    if (!isRequired(name)) {
      setFieldError(nameField, 'Give this account a name.');
      valid = false;
    } else {
      setFieldError(nameField, null);
    }
    if (balance !== '' && Number(balance) < 0) {
      setFieldError(balanceField, 'Enter an amount of 0 or more.');
      valid = false;
    } else {
      setFieldError(balanceField, null);
    }
    if (!valid) return;

    createAccount({ name, type, startingBalance: balance || 0 });
    createModal.hidden = true;
    render();
  });

  // ---- Add money modal ----
  function openAddMoneyModal(account) {
    activeAccountId = account.id;
    addMoneyAccountName.textContent = account.name;
    addMoneyForm.reset();
    setFieldError(document.getElementById('field-amount'), null);
    addMoneyModal.hidden = false;
    document.getElementById('add-amount').focus();
  }

  document.getElementById('cancel-add-money').addEventListener('click', () => {
    addMoneyModal.hidden = true;
  });

  addMoneyForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const amountField = document.getElementById('field-amount');
    const amount = document.getElementById('add-amount').value;

    if (!isPositiveNumber(amount)) {
      setFieldError(amountField, 'Enter an amount greater than 0.');
      return;
    }

    addMoney(activeAccountId, amount);
    addMoneyModal.hidden = true;
    render();
  });

  // Close modals on overlay click
  [createModal, addMoneyModal].forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.hidden = true;
    });
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
