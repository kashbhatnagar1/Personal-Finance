const API = "https://web-production-401eb.up.railway.app/api";

const CATEGORY_ICONS = {
  "Housing": "🏠",
  "Food & Dining": "🍔",
  "Transport": "🚗",
  "Health": "💊",
  "Entertainment": "🎬",
  "Shopping": "🛍️",
  "Utilities": "💡",
  "Other": "📦",
};

const CATEGORY_COLORS = {
  "Housing": "bg-blue-100 text-blue-700",
  "Food & Dining": "bg-orange-100 text-orange-700",
  "Transport": "bg-yellow-100 text-yellow-700",
  "Health": "bg-green-100 text-green-700",
  "Entertainment": "bg-purple-100 text-purple-700",
  "Shopping": "bg-pink-100 text-pink-700",
  "Utilities": "bg-cyan-100 text-cyan-700",
  "Other": "bg-gray-100 text-gray-600",
};

const CHART_COLORS = {
  "Housing": "#6366f1",
  "Food & Dining": "#f97316",
  "Transport": "#eab308",
  "Health": "#22c55e",
  "Entertainment": "#a855f7",
  "Shopping": "#ec4899",
  "Utilities": "#06b6d4",
  "Other": "#94a3b8",
};

let currentMonth = currentMonthString();
let pendingDeleteId = null;
let expenses = [];
let chartInstance = null;

// ── Init ──────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const picker = document.getElementById("month-picker");
  const dashPicker = document.getElementById("dash-month-picker");
  picker.value = currentMonth;
  dashPicker.value = currentMonth;

  picker.addEventListener("change", (e) => {
    currentMonth = e.target.value;
    dashPicker.value = currentMonth;
    loadExpenses();
  });
  dashPicker.addEventListener("change", (e) => {
    currentMonth = e.target.value;
    picker.value = currentMonth;
    loadDashboard();
  });
  showPage("transactions");
});

function currentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Navigation ────────────────────────────────────────────

function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(`page-${name}`).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.remove("bg-indigo-50", "text-indigo-700");
    b.classList.add("text-gray-600", "hover:bg-gray-100");
  });
  const active = document.getElementById(`nav-${name}`);
  active.classList.add("bg-indigo-50", "text-indigo-700");
  active.classList.remove("text-gray-600", "hover:bg-gray-100");

  if (name === "transactions") loadExpenses();
  if (name === "dashboard") loadDashboard();
}

// ── API calls ─────────────────────────────────────────────

async function loadExpenses() {
  const res = await fetch(`${API}/expenses?month=${currentMonth}`);
  expenses = await res.json();
  renderExpenses();
}

async function submitExpense(e) {
  e.preventDefault();
  const id = document.getElementById("expense-id").value;
  const payload = {
    amount: parseFloat(document.getElementById("field-amount").value),
    category: document.getElementById("field-category").value,
    date: document.getElementById("field-date").value,
    note: document.getElementById("field-note").value,
  };

  if (id) {
    await fetch(`${API}/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } else {
    await fetch(`${API}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  closeModal();
  loadExpenses();
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  await fetch(`${API}/expenses/${pendingDeleteId}`, { method: "DELETE" });
  closeDeleteModal();
  loadExpenses();
}

// ── Render ────────────────────────────────────────────────

function renderExpenses() {
  const list = document.getElementById("expense-list");
  const empty = document.getElementById("empty-state");

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById("total-spent").textContent = formatCurrency(total);
  document.getElementById("total-count").textContent = expenses.length;

  if (expenses.length === 0) {
    list.innerHTML = "";
    list.appendChild(empty);
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  list.innerHTML = expenses.map(exp => `
    <div class="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-indigo-200 transition fade-in">
      <div class="flex items-center gap-4">
        <span class="text-2xl">${CATEGORY_ICONS[exp.category] || "📦"}</span>
        <div>
          <div class="flex items-center gap-2">
            <span class="${CATEGORY_COLORS[exp.category] || "bg-gray-100 text-gray-600"} text-xs font-medium px-2 py-0.5 rounded-full">
              ${exp.category}
            </span>
            ${exp.note ? `<span class="text-sm text-gray-500">${escapeHtml(exp.note)}</span>` : ""}
          </div>
          <p class="text-xs text-gray-400 mt-1">${formatDate(exp.date)}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="font-semibold text-gray-800">${formatCurrency(exp.amount)}</span>
        <div class="flex gap-1">
          <button onclick="openModal(${JSON.stringify(exp).replace(/"/g, '&quot;')})"
            class="text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition text-sm">✏️</button>
          <button onclick="openDeleteModal(${exp.id})"
            class="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition text-sm">🗑️</button>
        </div>
      </div>
    </div>
  `).join("");
}

// ── Modal helpers ─────────────────────────────────────────

function openModal(expense = null) {
  document.getElementById("modal-title").textContent = expense ? "Edit Expense" : "Add Expense";
  document.getElementById("expense-id").value = expense ? expense.id : "";
  document.getElementById("field-amount").value = expense ? expense.amount : "";
  document.getElementById("field-category").value = expense ? expense.category : "";
  document.getElementById("field-date").value = expense ? expense.date : todayString();
  document.getElementById("field-note").value = expense ? (expense.note || "") : "";
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("field-amount").focus();
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("expense-form").reset();
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  document.getElementById("delete-modal").classList.remove("hidden");
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById("delete-modal").classList.add("hidden");
}

// Close modals on backdrop click
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});
document.getElementById("delete-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeDeleteModal();
});

// ── Dashboard ─────────────────────────────────────────────

async function loadDashboard() {
  const [expensesData, incomeData] = await Promise.all([
    fetch(`${API}/expenses?month=${currentMonth}`).then(r => r.json()),
    fetch(`${API}/income?month=${currentMonth}`).then(r => r.json()),
  ]);
  renderDashboard(expensesData, incomeData);
}

function renderDashboard(expensesData, incomeData) {
  const totalSpent = expensesData.reduce((s, e) => s + e.amount, 0);
  const income = incomeData.amount || 0;
  const net = income - totalSpent;

  document.getElementById("dash-total-spent").textContent = formatCurrency(totalSpent);
  document.getElementById("dash-income").textContent = formatCurrency(income);

  const netEl = document.getElementById("dash-net");
  netEl.textContent = formatCurrency(net);
  netEl.className = `text-2xl font-bold mt-1 ${net >= 0 ? "text-green-600" : "text-red-500"}`;

  const byCategory = {};
  for (const e of expensesData) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  renderDonutChart(sorted, totalSpent);
  renderCategoryBreakdown(sorted, totalSpent);
}

function renderDonutChart(sorted, totalSpent) {
  const container = document.getElementById("chart-container");

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  if (sorted.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400">No data this month</p>';
    return;
  }

  container.innerHTML = '<canvas id="category-chart"></canvas>';
  const ctx = document.getElementById("category-chart").getContext("2d");

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: sorted.map(([cat]) => cat),
      datasets: [{
        data: sorted.map(([, amt]) => amt),
        backgroundColor: sorted.map(([cat]) => CHART_COLORS[cat] || "#94a3b8"),
        borderWidth: 2,
        borderColor: "#fff",
      }],
    },
    options: {
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatCurrency(ctx.raw)} (${((ctx.raw / totalSpent) * 100).toFixed(1)}%)`,
          },
        },
      },
    },
  });
}

function renderCategoryBreakdown(sorted, totalSpent) {
  const el = document.getElementById("category-breakdown");

  if (sorted.length === 0) {
    el.innerHTML = '<p class="text-sm text-gray-400 text-center py-8">No expenses this month</p>';
    return;
  }

  el.innerHTML = sorted.map(([cat, amt]) => {
    const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0;
    const color = CHART_COLORS[cat] || "#94a3b8";
    return `
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-gray-700 flex items-center gap-1.5">
            <span>${CATEGORY_ICONS[cat] || "📦"}</span>
            <span>${cat}</span>
          </span>
          <span class="text-sm font-medium text-gray-800">${formatCurrency(amt)}</span>
        </div>
        <div class="h-1.5 bg-gray-100 rounded-full">
          <div class="h-1.5 rounded-full" style="width:${pct.toFixed(1)}%; background:${color}"></div>
        </div>
        <p class="text-xs text-gray-400 mt-0.5 text-right">${pct.toFixed(1)}%</p>
      </div>
    `;
  }).join("");
}

function toggleIncomeEdit() {
  const form = document.getElementById("income-edit-form");
  form.classList.toggle("hidden");
  if (!form.classList.contains("hidden")) document.getElementById("income-input").focus();
}

async function saveIncome() {
  const amount = parseFloat(document.getElementById("income-input").value);
  if (isNaN(amount) || amount < 0) return;
  await fetch(`${API}/income`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, month: currentMonth }),
  });
  document.getElementById("income-edit-form").classList.add("hidden");
  document.getElementById("income-input").value = "";
  loadDashboard();
}

// ── Utils ─────────────────────────────────────────────────

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

function formatDate(str) {
  return new Date(str + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
