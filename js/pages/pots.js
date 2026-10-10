/* ==========================================================================
   MoneyMap — pots.js (page logic)
   Renders pot cards with live progress bars. Adding/withdrawing money
   always goes through js/data/pots.js, which also updates the linked
   account — this file only handles what's on screen.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('pot-grid');
  const emptyState = document.getElementById('empty-state');
  const noAccountsNotice = document.getElementById('no-accounts-notice');
  const createBtn = document.getElementById('open-create-pot');

  const createModal = document.getElementById('create-pot-modal');
  const createForm = document.getElementById('create-pot-form');
  const accountSelect = document.getElementById('pot-account');

  const fundsModal = document.getElementById('pot-funds-modal');
  const fundsForm = document.getElementById('pot-funds-form');
  const fundsTitle = document.getElementById('pot-funds-title');
  const fundsAmountInput = document.getElementById('pot-funds-amount');
  const fundsSaveBtn = document.getElementById('save-pot-funds');

  let activePotId = null;
  let fundsMode = 'add'; // 'add' | 'withdraw'

  render();

  createBtn.addEventListener('click', openCreateModal);
  document.getElementById('cancel-create-pot').addEventListener('click', () => (createModal.hidden = true));
  createModal.addEventListener('click', (e) => {
    if (e.target === createModal) createModal.hidden = true;
  });
  createForm.addEventListener('submit', handleCreateSubmit);

  document.getElementById('cancel-pot-funds').addEventListener('click', () => (fundsModal.hidden = true));
  fundsModal.addEventListener('click', (e) => {
    if (e.target === fundsModal) fundsModal.hidden = true;
  });
  fundsForm.addEventListener('submit', handleFundsSubmit);

  function refreshAccountGate() {
    const hasAccounts = getAccounts().length > 0;
    noAccountsNotice.hidden = hasAccounts;
    createBtn.disabled = !hasAccounts;
    createBtn.style.opacity = hasAccounts ? '1' : '0.5';
    createBtn.style.cursor = hasAccounts ? 'pointer' : 'not-allowed';
  }

  function render() {
    refreshAccountGate();
    const pots = getPots();
    grid.innerHTML = '';
    emptyState.hidden = pots.length > 0;
    pots.forEach((p) => grid.appendChild(buildCard(p)));
  }

  function buildCard(pot) {
    const account = getAccountById(pot.accountId);
    const percent = getPotProgress(pot);
    const isComplete = pot.saved >= pot.goal && pot.goal > 0;

    const card = document.createElement('div');
    card.className = 'pot-card';
    card.innerHTML = `
      <div class="pot-card__top">
        <div>
          <div class="pot-card__name">${escapeHtml(pot.name)}</div>
          <div class="pot-card__source">from ${account ? escapeHtml(account.name) : 'deleted account'}</div>
        </div>
        <button class="btn--danger-text" data-action="delete">Delete</button>
      </div>
      <div class="pot-card__amount num">${formatCurrency(pot.saved)} <span class="goal">of ${formatCurrency(pot.goal)}</span></div>
      <div class="progress-bar">
        <div class="progress-bar__fill" style="width:${percent}%"></div>
      </div>
      <div class="progress-meta">
        <span>${percent}% saved</span>
      </div>
      ${isComplete ? '<span class="pot-card__complete">Goal reached 🎉</span>' : ''}
      <div class="pot-card__actions">
        <button class="btn btn--primary" data-action="add">+ Add money</button>
        <button class="btn btn--ghost" data-action="withdraw">Withdraw</button>
      </div>
    `;

    card.querySelector('[data-action="add"]').addEventListener('click', () => openFundsModal(pot, 'add'));
    card.querySelector('[data-action="withdraw"]').addEventListener('click', () => openFundsModal(pot, 'withdraw'));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      const warn = pot.saved > 0 ? ` The ${formatCurrency(pot.saved)} saved will be returned to ${account ? account.name : 'its account'}.` : '';
      if (confirm(`Delete "${pot.name}"?${warn}`)) {
        deletePot(pot.id);
        render();
      }
    });

    return card;
  }

  // ---- Create pot ----
  function openCreateModal() {
    if (getAccounts().length === 0) return;
    createForm.reset();
    setFieldError(document.getElementById('field-pot-name'), null);
    setFieldError(document.getElementById('field-pot-goal'), null);

    accountSelect.innerHTML = '';
    getAccounts().forEach((acc) => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = `${acc.name} (${formatCurrency(acc.balance)})`;
      accountSelect.appendChild(opt);
    });

    createModal.hidden = false;
    document.getElementById('pot-name').focus();
  }

  function handleCreateSubmit(e) {
    e.preventDefault();
    const nameField = document.getElementById('field-pot-name');
    const goalField = document.getElementById('field-pot-goal');
    const name = document.getElementById('pot-name').value;
    const goal = document.getElementById('pot-goal').value;

    let valid = true;
    if (!isRequired(name)) {
      setFieldError(nameField, 'Give this pot a name.');
      valid = false;
    } else setFieldError(nameField, null);

    if (!isPositiveNumber(goal)) {
      setFieldError(goalField, 'Enter an amount greater than 0.');
      valid = false;
    } else setFieldError(goalField, null);

    if (!valid) return;

    createPot({ name, goal, accountId: accountSelect.value });
    createModal.hidden = true;
    render();
  }

  // ---- Add / withdraw funds ----
  function openFundsModal(pot, mode) {
    activePotId = pot.id;
    fundsMode = mode;
    fundsTitle.textContent = mode === 'add' ? `Add money to ${pot.name}` : `Withdraw from ${pot.name}`;
    fundsSaveBtn.textContent = mode === 'add' ? 'Add' : 'Withdraw';
    fundsForm.reset();
    setFieldError(document.getElementById('field-pot-funds-amount'), null);
    fundsModal.hidden = false;
    fundsAmountInput.max = mode === 'withdraw' ? pot.saved : '';
    fundsAmountInput.focus();
  }

  function handleFundsSubmit(e) {
    e.preventDefault();
    const field = document.getElementById('field-pot-funds-amount');
    const amount = fundsAmountInput.value;
    const pot = getPotById(activePotId);

    if (!isPositiveNumber(amount)) {
      setFieldError(field, 'Enter an amount greater than 0.');
      return;
    }
    if (fundsMode === 'withdraw' && Number(amount) > pot.saved) {
      setFieldError(field, `You can withdraw at most ${formatCurrency(pot.saved)}.`);
      return;
    }
    setFieldError(field, null);

    if (fundsMode === 'add') {
      addToPot(activePotId, amount);
    } else {
      withdrawFromPot(activePotId, amount);
    }

    fundsModal.hidden = true;
    render();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
