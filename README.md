# MoneyMap

A personal finance tracker built with HTML, CSS, and JavaScript. Users add money into Accounts (like a bank), and everything else — budgets, savings pots, bill status, totals, and charts — is calculated automatically from the transactions the user log.

**Live demo:** https://abdul-manan87.github.io/MoneyMap/

## Tech
HTML5 · CSS3 · JavaScript (ES6+) · LocalStorage · Chart.js

## Project structure
See `css/`, `js/data/` (data layer), `js/pages/` (per-page UI logic), `js/utils/`.

## Build status

- Module 1 — Project structure, shared data layer (`storage.js`), Accounts (create accounts, add money, view balances)
- Module 2 — Transactions (linked to accounts, auto-updates balance on add/edit/delete, search/filter/sort)
- Module 3 — Budgets (limits with live spend tracking, warns before an expense pushes you over) & Pots (savings goals that work like mini-accounts, with a full activity history)
- Module 4 — Recurring Bills (status computed from today's date, "Pay now" logs a real transaction) & Overview dashboard (aggregates every other module live)
- Module 5 — Analytics (spending-by-category and income-vs-expense charts via Chart.js) & Settings (currency preference, reset all data)

All 8 sections are built: Overview, Accounts, Transactions, Budgets, Pots, Recurring Bills, Analytics, Settings.

## Running it
No build step needed. Open `index.html` in a browser, or serve the folder with any static server (e.g. VS Code Live Server). Analytics charts load Chart.js from a CDN, so that page needs an internet connection; every other page works offline.

## Core rule
The user manually adds money and logs activity. MoneyMap automatically calculates balances, budget usage, pot progress, bill status, and totals — nothing is typed in twice.
