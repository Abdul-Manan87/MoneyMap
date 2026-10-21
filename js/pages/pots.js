/* ==========================================================================
   MoneyMap — pots.js (page logic)
   Renders pot cards with live progress bars and an expandable activity
   history. Add / withdraw / spend all go through js/data/pots.js — this
   file only handles what's on screen.
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

  const spendModal = document.getElementById('spend-pot-modal');
  const spendForm = document.getElementById('spend-pot-form');
  const spendPotName = document.getElementById('spend-pot-name');
  const spendNameInput = document.getElementById('spend-name');
  const spendCategorySelect = document.getElementById('spend-category');
  const spendAmountInput = document.getElementById('spend-amount');
  const spendAvailable = document.getElementById('spend-available');

  let activePotId = null;
  let fundsMode = 'add'; // 'add' | 'withdraw'
  const expandedPots = new Set(); // which pot cards have activity open

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

  document.getElementById('cancel-spend-pot').addEventListener('click', () => (spendModal.hidden = true));
  spendModal.addEventListener('click', (e) => {
    if (e.target === spendModal) spendModal.hidden = true;
  });
  spendForm.addEventListener('submit', handleSpendSubmit);

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
    const isOpen = expandedPots.has(pot.id);

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
        <button class="btn btn--ghost" data-action="spend">Spend</button>
      </div>
      <button type="button" class="pot-card__toggle" data-action="toggle-activity">
        ${isOpen ? 'Hide activity ▴' : 'View activity ▾'}
      </button>
      ${isOpen ? buildActivityHtml(pot.id) : ''}
    `;

    card.querySelector('[data-action="add"]').addEventListener('click', () => openFundsModal(pot, 'add'));
    card.querySelector('[data-action="withdraw"]').addEventListener('click', () => openFundsModal(pot, 'withdraw'));
    card.querySelector('[data-action="spend"]').addEventListener('click', () => openSpendModal(pot));
    card.querySelector('[data-action="toggle-activity"]').addEventListener('click', () => {
      if (expandedPots.has(pot.id)) expandedPots.delete(pot.id);
      else expandedPots.add(pot.id);
      render();
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      const warn = pot.saved > 0 ? ` The ${formatCurrency(pot.saved)} saved will be returned to ${account ? account.name : 'its account'}.` : '';
      if (confirm(`Delete "${pot.name}"?${warn}`)) {
        deletePot(pot.id);
        expandedPots.delete(pot.id);
        render();
      }
    });

    return card;
  }

  function buildActivityHtml(potId) {
    const entries = getPotActivity(potId);
    if (entries.length === 0) {
      return '<div class="pot-activity"><p class="pot-activity__empty">No activity yet.</p></div>';
    }

    const ACTION_LABEL = { add: 'Added money', withdraw: 'Withdrew to account', spend: null };
    const rows = entries
      .map((e) => {
        const isOut = e.type === 'withdraw' || e.type === 'spend';
        const label = e.type === 'spend' ? escapeHtml(e.name) : ACTION_LABEL[e.type];
        const meta = e.type === 'spend' && e.category ? escapeHtml(e.category) : formatDate(e.date);
        return `
          <div class="pot-activity__row">
            <span class="pot-activity__label">
              <span class="pot-activity__name">${label}</span>
              <span class="pot-activity__date">${e.type === 'spend' ? `${meta} · ${formatDate(e.date)}` : meta}</span>
            </span>
            <span class="pot-activity__amount ${isOut ? 'out' : 'in'} num">${isOut ? '−' : '+'}${formatCurrency(e.amount)}</span>
          </div>
        `;
      })
      .join('');

    return `<div class="pot-activity">${rows}</div>`;
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

  // ---- Spend from pot ----
  function openSpendModal(pot) {
    activePotId = pot.id;
    spendPotName.textContent = pot.name;
    spendForm.reset();
    ['field-spend-name', 'field-spend-amount'].forEach((id) => setFieldError(document.getElementById(id), null));

    spendCategorySelect.innerHTML = '';
    EXPENSE_CATEGORIES.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      spendCategorySelect.appendChild(opt);
    });

    spendAvailable.textContent = `Available in this pot: ${formatCurrency(pot.saved)}`;
    spendAmountInput.max = pot.saved;
    spendModal.hidden = false;
    spendNameInput.focus();
  }

  function handleSpendSubmit(e) {
    e.preventDefault();
    const nameField = document.getElementById('field-spend-name');
    const amountField = document.getElementById('field-spend-amount');
    const pot = getPotById(activePotId);

    let valid = true;
    if (!isRequired(spendNameInput.value)) {
      setFieldError(nameField, 'Give this a name.');
      valid = false;
    } else setFieldError(nameField, null);

    if (!isPositiveNumber(spendAmountInput.value)) {
      setFieldError(amountField, 'Enter an amount greater than 0.');
      valid = false;
    } else if (Number(spendAmountInput.value) > pot.saved) {
      setFieldError(amountField, `Only ${formatCurrency(pot.saved)} available in this pot.`);
      valid = false;
    } else setFieldError(amountField, null);

    if (!valid) return;

    spendFromPot(activePotId, {
      name: spendNameInput.value,
      amount: spendAmountInput.value,
      category: spendCategorySelect.value,
    });

    expandedPots.add(activePotId); // so the new entry is visible right away
    spendModal.hidden = true;
    render();
  }

  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
