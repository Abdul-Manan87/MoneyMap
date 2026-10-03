# MoneyMap

A personal finance tracker built with HTML, CSS, and JavaScript. Users add money into Accounts (like a bank), and everything else — budgets, savings pots, bill status, totals, and charts — is calculated automatically from the transactions the user log.

## Tech
HTML5 · CSS3 · JavaScript (ES6+) · LocalStorage · Chart.js

## Project structure
See `css/`, `js/data/` (data layer), `js/pages/` (per-page UI logic), `js/utils/`.

## Build status

- **Module 1** — Project structure, shared data layer (`storage.js`), Accounts (create accounts, add money, view balances)
- **Module 2** — Transactions (linked to accounts, auto-updates balance)
- **Module 3** — Budgets & Pots (auto-calculated progress)
- **Module 4** — Recurring Bills & Overview dashboard
- **Module 5** — Analytics, Settings, polish & deploy

## Running it
No build step needed — open `index.html` in a browser, or serve the folder with any static server (e.g. VS Code Live Server).

## Core rule
The user manually adds money and logs activity. MoneyMap automatically calculates balances, budget usage, pot progress, bill status, and totals — nothing is typed in twice.
