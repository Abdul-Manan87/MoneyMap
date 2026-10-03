/*
   MoneyMap — transactions.js (page logic)
   Renders the table, wires up search/filter/sort, and the add/edit modal.
   All balance math happens in js/data/transactions.js — this file only
   handles what the user sees and clicks.
  */

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('txn-table-body');
  const tableWrap = document.querySelector('.table-wrap');
  const emptyState = document.getElementById('empty-state');
  const noAccountsNotice = document.getElementById('no-accounts-notice');
  const addBtn = document.getElementById('open-add-transaction');

  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortSelect = document.getElementById('sort-select');

  const modal = document.getElementById('txn-modal');
  const modalTitle = document.getElementById('txn-modal-title');
  const form = document.getElementById('txn-form');
  const idField = document.getElementById('txn-id');
  const nameInput = document.getElementById('txn-name');
  const amountInput = document.getElementById('txn-amount');
  const categorySelect = document.getElementById('txn-category');
  const accountSelect = document.getElementById('txn-account');
  const dateInput = document.getElementById('txn-date');
  const saveBtn = document.getElementById('save-txn');
  const typeButtons = document.querySelectorAll('.type-toggle__option');

  let currentType = 'expense';

  init();

  function init() {
    populateCategoryFilter();
    refreshAccountGate();
    render();

    addBtn.addEventListener('click', () => openModal());
    document.getElementById('cancel-txn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    searchInput.addEventListener('input', render);
    categoryFilter.addEventListener('change', render);
    sortSelect.addEventListener('change', render);

    typeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setType(btn.dataset.type));
    });

    form.addEventListener('submit', handleSubmit);
  }

  // ---- Gate: can't log transactions with zero accounts ----
  function refreshAccountGate() {
    const accounts = getAccounts();
    const hasAccounts = accounts.length > 0;
    noAccountsNotice.hidden = hasAccounts;
    addBtn.disabled = !hasAccounts;
    addBtn.style.opacity = hasAccounts ? '1' : '0.5';
    addBtn.style.cursor = hasAccounts ? 'pointer' : 'not-allowed';
  }

  // ---- Render table ----
  function render() {
    refreshAccountGate();

    const all = getTransactions();
    const filtered = filterTransactions(all, {
      search: searchInput.value,
      category: categoryFilter.value,
    });
    const sorted = sortTransactions(filtered, sortSelect.value);

    tableBody.innerHTML = '';
    const hasAny = all.length > 0;
    const hasResults = sorted.length > 0;

    tableWrap.hidden = !hasResults;
    emptyState.querySelector('strong').textContent = hasAny ? 'No matches' : 'No transactions yet';
    emptyState.lastChild.textContent = hasAny
      ? 'Try a different search or filter.'
      : 'Log your first transaction to see it reflected here.';
    emptyState.hidden = hasResults;

    sorted.forEach((t) => tableBody.appendChild(buildRow(t)));
  }

  function buildRow(t) {
    const account = getAccountById(t.accountId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(t.date)}</td>
      <td>${escapeHtml(t.name)}</td>
      <td><span class="category-badge">${escapeHtml(t.category)}</span></td>
      <td>${account ? escapeHtml(account.name) : '—'}</td>
      <td class="txn-amount txn-amount--${t.type}">${t.type === 'income' ? '+' : '−'}${formatCurrency(t.amount)}</td>
      <td>
        <div class="row-actions">
          <button type="button" data-action="edit">Edit</button>
          <button type="button" class="danger" data-action="delete">Delete</button>
        </div>
      </td>
    `;
    tr.querySelector('[data-action="edit"]').addEventListener('click', () => openModal(t));
    tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Delete "${t.name}"? This will reverse its effect on the account balance.`)) {
        deleteTransaction(t.id);
        render();
      }
    });
    return tr;
  }

  function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="all">All categories</option>';
    getAllCategories().forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  function populateCategorySelect(type) {
    categorySelect.innerHTML = '';
    getCategoriesForType(type).forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  function populateAccountSelect() {
    const accounts = getAccounts();
    accountSelect.innerHTML = '';
    accounts.forEach((acc) => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = `${acc.name} (${formatCurrency(acc.balance)})`;
      accountSelect.appendChild(opt);
    });
  }

  function setType(type) {
    currentType = type;
    typeButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.type === type));
    populateCategorySelect(type);
  }

  // ---- Modal open/close ----
  function openModal(transaction) {
    if (getAccounts().length === 0) return; // gated

    form.reset();
    ['field-txn-name', 'field-txn-amount', 'field-txn-account'].forEach((id) =>
      setFieldError(document.getElementById(id), null)
    );

    populateAccountSelect();

    if (transaction) {
      modalTitle.textContent = 'Edit transaction';
      saveBtn.textContent = 'Save changes';
      idField.value = transaction.id;
      nameInput.value = transaction.name;
      amountInput.value = transaction.amount;
      dateInput.value = transaction.date;
      setType(transaction.type);
      categorySelect.value = transaction.category;
      accountSelect.value = transaction.accountId;
    } else {
      modalTitle.textContent = 'Add transaction';
      saveBtn.textContent = 'Add transaction';
      idField.value = '';
      dateInput.value = new Date().toISOString().slice(0, 10);
      setType('expense');
    }

    modal.hidden = false;
    nameInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  // ---- Submit ----
  function handleSubmit(e) {
    e.preventDefault();

    const nameField = document.getElementById('field-txn-name');
    const amountField = document.getElementById('field-txn-amount');
    const accountField = document.getElementById('field-txn-account');

    let valid = true;
    if (!isRequired(nameInput.value)) {
      setFieldError(nameField, 'Give this transaction a name.');
      valid = false;
    } else {
      setFieldError(nameField, null);
    }
    if (!isPositiveNumber(amountInput.value)) {
      setFieldError(amountField, 'Enter an amount greater than 0.');
      valid = false;
    } else {
      setFieldError(amountField, null);
    }
    if (!accountSelect.value) {
      setFieldError(accountField, 'Create an account first.');
      valid = false;
    } else {
      setFieldError(accountField, null);
    }
    if (!valid) return;

    const payload = {
      name: nameInput.value,
      type: currentType,
      amount: amountInput.value,
      category: categorySelect.value,
      accountId: accountSelect.value,
      date: dateInput.value,
    };

    if (idField.value) {
      updateTransaction(idField.value, payload);
    } else {
      addTransaction(payload);
    }

    closeModal();
    render();
  }

  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
