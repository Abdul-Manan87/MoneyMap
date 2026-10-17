/* ==========================================================================
   MoneyMap — overview.js (page logic)
   This page stores nothing of its own. Every number here is read fresh
   from the other data modules (accounts, transactions, budgets, pots,
   bills) and rendered — that's the whole point of Overview.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderTotalBalance();
  renderRecentTransactions();
  renderUpcomingBills();
  renderBudgetProgress();
  renderPotsProgress();
});

function renderTotalBalance() {
  document.getElementById('total-balance').textContent = formatCurrency(getTotalBalance());
}

function renderRecentTransactions() {
  const list = document.getElementById('recent-transactions');
  const empty = document.getElementById('txn-empty');
  const recent = sortTransactions(getTransactions(), 'date-desc').slice(0, 5);

  list.innerHTML = '';
  empty.hidden = recent.length > 0;

  recent.forEach((t) => {
    const account = getAccountById(t.accountId);
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="mini-list__label">
        <span class="mini-list__name">${escapeHtml(t.name)}</span>
        <span class="mini-list__meta">${escapeHtml(t.category)} · ${account ? escapeHtml(account.name) : '—'}</span>
      </span>
      <span class="mini-list__value ${t.type} num">${t.type === 'income' ? '+' : '−'}${formatCurrency(t.amount)}</span>
    `;
    list.appendChild(li);
  });
}

function renderUpcomingBills() {
  const list = document.getElementById('upcoming-bills');
  const empty = document.getElementById('bills-empty');
  const bills = getBillsWithStatus()
    .filter((b) => b.status !== 'paid')
    .slice(0, 5);

  const STATUS_LABEL = { upcoming: 'Upcoming', 'due-soon': 'Due soon', overdue: 'Overdue' };

  list.innerHTML = '';
  empty.hidden = bills.length > 0;

  bills.forEach((b) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="mini-list__label">
        <span class="mini-list__name">${escapeHtml(b.name)}</span>
        <span class="mini-list__meta">Due on day ${b.dueDay}</span>
      </span>
      <span class="mini-status" data-status="${b.status}">${STATUS_LABEL[b.status]}</span>
    `;
    list.appendChild(li);
  });
}

function renderBudgetProgress() {
  const container = document.getElementById('budget-progress');
  const empty = document.getElementById('budgets-empty');
  const budgets = getBudgetsWithProgress();

  container.innerHTML = '';
  empty.hidden = budgets.length > 0;

  budgets.forEach((b) => {
    const fillClass = b.status === 'exceeded' ? 'is-danger' : b.status === 'warning' ? 'is-warning' : '';
    const item = document.createElement('div');
    item.innerHTML = `
      <div class="mini-progress-item__top">
        <span class="name">${escapeHtml(b.category)}</span>
        <span class="value num">${formatCurrency(b.spent)} / ${formatCurrency(b.limit)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar__fill ${fillClass}" style="width:${b.percent}%"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderPotsProgress() {
  const container = document.getElementById('pots-progress');
  const empty = document.getElementById('pots-empty');
  const pots = getPots();

  container.innerHTML = '';
  empty.hidden = pots.length > 0;

  pots.forEach((p) => {
    const percent = getPotProgress(p);
    const item = document.createElement('div');
    item.innerHTML = `
      <div class="mini-progress-item__top">
        <span class="name">${escapeHtml(p.name)}</span>
        <span class="value num">${formatCurrency(p.saved)} / ${formatCurrency(p.goal)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar__fill" style="width:${percent}%"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
