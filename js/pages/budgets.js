/* ==========================================================================
   MoneyMap — budgets.js (page logic)
   Renders budget cards with live progress bars. Spent/remaining/percent
   all come from js/data/budgets.js — this file never calculates money,
   only displays it.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('budget-grid');
  const emptyState = document.getElementById('empty-state');

  const modal = document.getElementById('budget-modal');
  const modalTitle = document.getElementById('budget-modal-title');
  const form = document.getElementById('budget-form');
  const idField = document.getElementById('budget-id');
  const categorySelect = document.getElementById('budget-category');
  const limitInput = document.getElementById('budget-limit');
  const saveBtn = document.getElementById('save-budget');

  render();

  document.getElementById('open-create-budget').addEventListener('click', () => openModal());
  document.getElementById('cancel-budget').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  form.addEventListener('submit', handleSubmit);

  function render() {
    const budgets = getBudgetsWithProgress();
    grid.innerHTML = '';
    emptyState.hidden = budgets.length > 0;

    budgets.forEach((b) => grid.appendChild(buildCard(b)));
  }

  function buildCard(b) {
    const card = document.createElement('div');
    card.className = 'budget-card';

    const statusLabel = { ok: 'On track', warning: 'Near limit', exceeded: 'Over budget' }[b.status];
    const fillClass = b.status === 'exceeded' ? 'is-danger' : b.status === 'warning' ? 'is-warning' : '';

    card.innerHTML = `
      <div class="budget-card__top">
        <div class="budget-card__category">${escapeHtml(b.category)}</div>
        <span class="budget-card__status" data-status="${b.status}">${statusLabel}</span>
      </div>
      <div class="budget-card__amounts">
        <span class="spent num">${formatCurrency(b.spent)}</span>
        <span class="of">of ${formatCurrency(b.limit)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar__fill ${fillClass}" style="width:${b.percent}%"></div>
      </div>
      <div class="progress-meta">
        <span>${b.percent}% used</span>
        <span>${b.remaining >= 0 ? formatCurrency(b.remaining) + ' left' : formatCurrency(Math.abs(b.remaining)) + ' over'}</span>
      </div>
      <div class="account-card__actions">
        <button class="btn btn--ghost" data-action="edit">Edit limit</button>
        <button class="btn--danger-text" data-action="delete">Delete</button>
      </div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener('click', () => openModal(b));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Delete the ${b.category} budget?`)) {
        deleteBudget(b.id);
        render();
      }
    });

    return card;
  }

  function populateCategorySelect(editingCategory) {
    const budgeted = new Set(getBudgets().map((b) => b.category));
    categorySelect.innerHTML = '';
    EXPENSE_CATEGORIES.forEach((cat) => {
      if (budgeted.has(cat) && cat !== editingCategory) return; // already has a budget
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  function openModal(budget) {
    form.reset();
    setFieldError(document.getElementById('field-budget-limit'), null);

    if (budget) {
      modalTitle.textContent = 'Edit budget';
      saveBtn.textContent = 'Save changes';
      idField.value = budget.id;
      populateCategorySelect(budget.category);
      categorySelect.value = budget.category;
      categorySelect.disabled = true;
      limitInput.value = budget.limit;
    } else {
      modalTitle.textContent = 'New budget';
      saveBtn.textContent = 'Create budget';
      idField.value = '';
      categorySelect.disabled = false;
      populateCategorySelect();
    }

    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const limitField = document.getElementById('field-budget-limit');
    if (!isPositiveNumber(limitInput.value)) {
      setFieldError(limitField, 'Enter an amount greater than 0.');
      return;
    }
    setFieldError(limitField, null);

    if (idField.value) {
      updateBudget(idField.value, { limit: limitInput.value });
    } else {
      if (!categorySelect.value) return; // every expense category already budgeted
      createBudget({ category: categorySelect.value, limit: limitInput.value });
    }

    closeModal();
    render();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
