const express = require("express");
const db = require("../../config/db");
const authenticate = require("../../middleware/authenticate");
const authorise = require("../../middleware/authorise");
const { sendSuccess } = require("../../utils/response");

const router = express.Router();

router.use(authenticate);

router.get("/summary", authorise(["viewer", "analyst", "admin"]), (_req, res) => {
  const income =
    db
      .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM financial_records WHERE is_deleted = 0 AND type = 'income'")
      .get().total || 0;
  const expenses =
    db
      .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM financial_records WHERE is_deleted = 0 AND type = 'expense'")
      .get().total || 0;

  return sendSuccess(res, {
    total_income: Number(income.toFixed(2)),
    total_expenses: Number(expenses.toFixed(2)),
    net_balance: Number((income - expenses).toFixed(2)),
  });
});

router.get("/by-category", authorise(["analyst", "admin"]), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT
        category,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM financial_records
       WHERE is_deleted = 0
       GROUP BY category
       ORDER BY category ASC`
    )
    .all();

  return sendSuccess(res, rows);
});

router.get("/trends", authorise(["analyst", "admin"]), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT
        strftime('%Y-%m', date) AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM financial_records
       WHERE is_deleted = 0 AND date >= date('now', '-12 months')
       GROUP BY month
       ORDER BY month ASC`
    )
    .all();

  return sendSuccess(res, rows);
});

router.get("/recent", authorise(["viewer", "analyst", "admin"]), (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
  const rows = db
    .prepare(
      `SELECT id, amount, type, category, date, notes, ledger_hash, counterparty, status
       FROM financial_records
       WHERE is_deleted = 0
       ORDER BY date DESC, created_at DESC
       LIMIT ?`
    )
    .all(limit);

  return sendSuccess(res, rows);
});

module.exports = router;
