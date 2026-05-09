# Personal Finance App — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-05-09  
**Status:** Draft

---

## 1. Overview

A simple single-user web application to track personal expenses, set monthly budgets, and get a clear picture of income vs. spending — without unnecessary complexity.

---

## 2. Goals

- Make it effortless to log daily expenses
- Give a clear monthly snapshot of where money is going
- Stay within budget across spending categories
- No account setup, no third-party integrations, no steep learning curve

---

## 3. Non-Goals

- Bank/CSV import
- Investment or savings tracking
- Multi-user / shared accounts
- Mobile app (web only, but mobile-responsive)
- Recurring transaction automation
- Notifications or alerts

---

## 4. Users

Single user — no authentication required. The app is for personal use on a trusted device.

---

## 5. Core Features

### 5.1 Expense Logging
- Add an expense with: amount, category, date, and optional note
- Edit or delete any existing expense
- Expenses are stored persistently (backend database)

### 5.2 Categories
Fixed set of spending categories:
- Housing
- Food & Dining
- Transport
- Health
- Entertainment
- Shopping
- Utilities
- Other

### 5.3 Monthly Dashboard
- Total spent this month
- Breakdown by category (amount + % of total)
- Simple bar or donut chart showing category distribution
- Month selector to view past months

### 5.4 Budget Tracking
- Set a monthly budget per category (optional)
- Visual indicator showing spent vs. budget for each category
- Summary of total budgeted vs. total spent

### 5.5 Income Entry
- Log monthly income (single figure per month, not itemized)
- Show net = income − total expenses for the month

---

## 6. Technical Scope

| Layer     | Choice                        |
|-----------|-------------------------------|
| Frontend  | React (Vite)                  |
| Styling   | Tailwind CSS                  |
| Charts    | Recharts                      |
| Backend   | Node.js + Express             |
| Database  | SQLite (simple, file-based)   |
| API       | REST                          |

> SQLite keeps setup minimal — no database server required.

---

## 7. Pages / Screens

1. **Dashboard** — monthly summary, category breakdown chart, income vs. expenses
2. **Transactions** — list of all expenses for the selected month, with add/edit/delete
3. **Budgets** — set and view monthly budgets per category

---

## 8. Data Model (simplified)

**Expense**
- id, amount, category, date, note, created_at

**Budget**
- id, category, amount, month (YYYY-MM)

**Income**
- id, amount, month (YYYY-MM)

---

## 9. Decisions

- **Budgets carry over automatically** — a category budget set in one month applies to all future months unless explicitly changed
- **No recurring expenses** — all expenses are entered manually every time
- **Past months are editable** — any expense, budget, or income entry can be edited regardless of month

---

## 10. Success Criteria

- User can log an expense in under 10 seconds
- Monthly spending overview is visible at a glance
- Data persists across browser sessions and page refreshes
