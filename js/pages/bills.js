/* ==========================================================================
   MoneyMap — bills.js (page logic)
   Renders bills sorted by soonest due date, with a status pill computed
   fresh from js/data/bills.js every render. "Pay now" calls payBill(),
   which logs a real transaction — this file just re-renders after.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('bill-list');
  const emptyState = document.getElementById('empty-state');
  const noAccountsNotice = document.getElementById('no-accounts-notice');
  const createBtn = document.getElementById('open-create-bill');

  const modal = document.getElementById('bill-modal');
  const modalTitle = document.getElementById('bill-modal-title');
  const form = document.getElementById('bill-form');
  const idField = document.getElementById('bill-id');
  const nameInput = document.getElementById('bill-name');
  const amountInput = document.getElementById('bill-amount');
  const dayInput = document.getElementById('bill-day');
  const categorySelect = document.getElementById('bill-category');
  const accountSelect = document.getElementById('bill-account');
  const saveBtn = document.getElementById('save-bill');

  const STATUS_LABEL = { upcoming: 'Upcoming', 'due-soon': 'Due soon', overdue: 'Overdue', paid: 'Paid' };

  render();

  createBtn.addEventListener('click', () => openModal());
  document.getElementById('cancel-bill').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  form.addEventListener('submit', handleSubmit);

  function refreshAccountGate() {
    const hasAccounts = getAccounts().length > 0;
    noAccountsNotice.hidden = hasAccounts;
    createBtn.disabled = !hasAccounts;
    createBtn.style.opacity = hasAccounts ? '1' : '0.5';
    createBtn.style.cursor = hasAccounts ? 'pointer' : 'not-allowed';
  }

  function render() {
    refreshAccountGate();
    const bills = getBillsWithStatus();
    list.innerHTML = '';
    emptyState.hidden = bills.length > 0;
    bills.forEach((b) => list.appendChild(buildRow(b)));
  }

  function buildRow(bill) {
    const account = getAccountById(bill.accountId);
    const row = document.createElement('div');
    row.className = 'bill-row';
    row.dataset.status = bill.status;

    row.innerHTML = `
      <div class="bill-row__info">
        <div class="bill-row__name">${escapeHtml(bill.name)}</div>
        <div class="bill-row__meta">Due on day ${bill.dueDay} · ${escapeHtml(bill.category)} · from ${account ? escapeHtml(account.name) : 'deleted account'}</div>
      </div>
      <div class="bill-row__right">
        <span class="bill-row__amount num">${formatCurrency(bill.amount)}</span>
        <span class="bill-status" data-status="${bill.status}">${STATUS_LABEL[bill.status]}</span>
        <div class="bill-row__actions">
          ${bill.status !== 'paid' ? '<button type="button" class="btn btn--primary" data-action="pay" style="padding:6px 12px;font-size:13px;">Pay now</button>' : ''}
          <button type="button" data-action="edit">Edit</button>
          <button type="button" class="danger" data-action="delete">Delete</button>
        </div>
      </div>
    `;

    const payBtn = row.querySelector('[data-action="pay"]');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        if (confirm(`Mark "${bill.name}" as paid? This logs a ${formatCurrency(bill.amount)} expense from ${account ? account.name : 'its account'}.`)) {
          payBill(bill.id);
          render();
        }
      });
    }

    row.querySelector('[data-action="edit"]').addEventListener('click', () => openModal(bill));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Delete "${bill.name}"?`)) {
        deleteBill(bill.id);
        render();
      }
    });

    return row;
  }

  function populateSelects() {
    categorySelect.innerHTML = '';
    EXPENSE_CATEGORIES.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });

    accountSelect.innerHTML = '';
    getAccounts().forEach((acc) => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = `${acc.name} (${formatCurrency(acc.balance)})`;
      accountSelect.appendChild(opt);
    });
  }

  function openModal(bill) {
    if (getAccounts().length === 0) return;

    form.reset();
    ['field-bill-name', 'field-bill-amount', 'field-bill-day'].forEach((id) =>
      setFieldError(document.getElementById(id), null)
    );
    populateSelects();

    if (bill) {
      modalTitle.textContent = 'Edit bill';
      saveBtn.textContent = 'Save changes';
      idField.value = bill.id;
      nameInput.value = bill.name;
      amountInput.value = bill.amount;
      dayInput.value = bill.dueDay;
      categorySelect.value = bill.category;
      accountSelect.value = bill.accountId;
    } else {
      modalTitle.textContent = 'New bill';
      saveBtn.textContent = 'Create bill';
      idField.value = '';
    }

    modal.hidden = false;
    nameInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const nameField = document.getElementById('field-bill-name');
    const amountField = document.getElementById('field-bill-amount');
    const dayField = document.getElementById('field-bill-day');

    let valid = true;
    if (!isRequired(nameInput.value)) {
      setFieldError(nameField, 'Give this bill a name.');
      valid = false;
    } else setFieldError(nameField, null);

    if (!isPositiveNumber(amountInput.value)) {
      setFieldError(amountField, 'Enter an amount greater than 0.');
      valid = false;
    } else setFieldError(amountField, null);

    const day = Number(dayInput.value);
    if (!day || day < 1 || day > 31) {
      setFieldError(dayField, 'Enter a day between 1 and 31.');
      valid = false;
    } else setFieldError(dayField, null);

    if (!valid) return;

    const payload = {
      name: nameInput.value,
      amount: amountInput.value,
      dueDay: dayInput.value,
      category: categorySelect.value,
      accountId: accountSelect.value,
    };

    if (idField.value) {
      updateBill(idField.value, payload);
    } else {
      createBill(payload);
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
