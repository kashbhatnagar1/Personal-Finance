from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": r"^https://[a-z0-9-]+\.netlify\.app$"}})

DB_PATH = os.path.join(os.path.dirname(__file__), "finance.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                note TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL UNIQUE,
                amount REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS income (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                month TEXT NOT NULL UNIQUE
            );
        """)


# ── Expenses ──────────────────────────────────────────────

@app.route("/api/expenses", methods=["GET"])
def list_expenses():
    month = request.args.get("month")  # YYYY-MM
    with get_db() as conn:
        if month:
            rows = conn.execute(
                "SELECT * FROM expenses WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC",
                (month,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM expenses ORDER BY date DESC").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/expenses", methods=["POST"])
def create_expense():
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO expenses (amount, category, date, note) VALUES (?, ?, ?, ?)",
            (data["amount"], data["category"], data["date"], data.get("note", ""))
        )
        row = conn.execute("SELECT * FROM expenses WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    data = request.json
    with get_db() as conn:
        conn.execute(
            "UPDATE expenses SET amount=?, category=?, date=?, note=? WHERE id=?",
            (data["amount"], data["category"], data["date"], data.get("note", ""), expense_id)
        )
        row = conn.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    return jsonify(dict(row))


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    with get_db() as conn:
        conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    return "", 204


# ── Budgets ───────────────────────────────────────────────

@app.route("/api/budgets", methods=["GET"])
def list_budgets():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM budgets").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/budgets", methods=["POST"])
def upsert_budget():
    data = request.json
    with get_db() as conn:
        conn.execute(
            "INSERT INTO budgets (category, amount) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET amount=excluded.amount",
            (data["category"], data["amount"])
        )
        row = conn.execute("SELECT * FROM budgets WHERE category = ?", (data["category"],)).fetchone()
    return jsonify(dict(row)), 201


# ── Income ────────────────────────────────────────────────

@app.route("/api/income", methods=["GET"])
def list_income():
    month = request.args.get("month")
    with get_db() as conn:
        if month:
            row = conn.execute("SELECT * FROM income WHERE month = ?", (month,)).fetchone()
            return jsonify(dict(row) if row else {})
        rows = conn.execute("SELECT * FROM income").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/income", methods=["POST"])
def upsert_income():
    data = request.json
    with get_db() as conn:
        conn.execute(
            "INSERT INTO income (amount, month) VALUES (?, ?) ON CONFLICT(month) DO UPDATE SET amount=excluded.amount",
            (data["amount"], data["month"])
        )
        row = conn.execute("SELECT * FROM income WHERE month = ?", (data["month"],)).fetchone()
    return jsonify(dict(row)), 201


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5001)
