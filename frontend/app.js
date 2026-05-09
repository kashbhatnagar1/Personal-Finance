const API = "http://localhost:5001/api";

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

let currentMonth = currentMonthString();
let pendingDeleteId = null;
let expenses = [];

// ── Init ──────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const picker = document.getElementById("month-picker");
  picker.value = currentMonth;
  picker.addEventListener("change", (e) => {
    currentMonth = e.target.value;
    loadExpenses();
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
