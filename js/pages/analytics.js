/* ==========================================================================
   MoneyMap — analytics.js (page logic)
   Every number and chart here is derived live from getTransactions().
   Nothing on this page is stored — it's a read-only view of history.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const transactions = getTransactions();

  renderStats(transactions);
  renderCategoryChart(transactions);
  renderTrendChart(transactions);
});

function renderStats(transactions) {
  const thisMonth = monthStr(0);
  const lastMonth = monthStr(-1);

  const spentThisMonth = sumExpenses(transactions, thisMonth);
  const spentLastMonth = sumExpenses(transactions, lastMonth);

  document.getElementById('stat-this-month').textContent = formatCurrency(spentThisMonth);
  document.getElementById('stat-last-month').textContent = formatCurrency(spentLastMonth);

  const changeEl = document.getElementById('stat-change');
  if (spentLastMonth === 0) {
    changeEl.textContent = spentThisMonth > 0 ? 'New spending' : '—';
  } else {
    const pct = Math.round(((spentThisMonth - spentLastMonth) / spentLastMonth) * 100);
    changeEl.textContent = `${pct > 0 ? '+' : ''}${pct}%`;
    changeEl.classList.toggle('is-up', pct > 0);
    changeEl.classList.toggle('is-down', pct < 0);
  }

  const byCategory = groupByCategory(transactions, thisMonth);
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('stat-top-category').textContent = top ? top[0] : '—';
}

function renderCategoryChart(transactions) {
  const canvas = document.getElementById('category-chart');
  const emptyMsg = document.getElementById('category-chart-empty');
  const byCategory = groupByCategory(transactions, monthStr(0));
  const labels = Object.keys(byCategory);

  if (labels.length === 0) {
    canvas.hidden = true;
    emptyMsg.hidden = false;
    return;
  }

  const palette = {
    Food: '#1f6f54',
    Transport: '#2f6fa8',
    Shopping: '#a87d2f',
    'Bills & Utilities': '#8a4fae',
    Entertainment: '#af4a2f',
    Health: '#4a90a4',
    Other: '#6b6f6c',
  };

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: labels.map((l) => byCategory[l]),
          backgroundColor: labels.map((l) => palette[l] || '#6b6f6c'),
          borderColor: cssVar('--surface'),
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: cssVar('--ink-muted'), boxWidth: 12, padding: 12, font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

function renderTrendChart(transactions) {
  const canvas = document.getElementById('trend-chart');
  const emptyMsg = document.getElementById('trend-chart-empty');

  if (transactions.length === 0) {
    canvas.hidden = true;
    emptyMsg.hidden = false;
    return;
  }

  const months = [];
  for (let i = 5; i >= 0; i--) months.push(monthStr(-i));

  const income = months.map((m) => sumByType(transactions, m, 'income'));
  const expense = months.map((m) => sumByType(transactions, m, 'expense'));

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months.map(monthLabel),
      datasets: [
        { label: 'Income', data: income, backgroundColor: cssVar('--accent'), borderRadius: 4 },
        { label: 'Expenses', data: expense, backgroundColor: cssVar('--negative'), borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: cssVar('--ink-muted') } },
        y: {
          beginAtZero: true,
          grid: { color: cssVar('--border') },
          ticks: { color: cssVar('--ink-muted'), callback: (v) => formatCurrency(v) },
        },
      },
      plugins: {
        legend: { position: 'bottom', labels: { color: cssVar('--ink-muted'), boxWidth: 12 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } },
      },
    },
  });
}

/* ---- Helpers ---- */

function sumExpenses(transactions, monthPrefix) {
  return roundMoney(
    transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(monthPrefix))
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

function sumByType(transactions, monthPrefix, type) {
  return roundMoney(
    transactions
      .filter((t) => t.type === type && t.date.startsWith(monthPrefix))
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

function groupByCategory(transactions, monthPrefix) {
  const result = {};
  transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(monthPrefix))
    .forEach((t) => {
      result[t.category] = roundMoney((result[t.category] || 0) + t.amount);
    });
  return result;
}

function monthStr(offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

function monthLabel(monthPrefix) {
  const [year, month] = monthPrefix.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
