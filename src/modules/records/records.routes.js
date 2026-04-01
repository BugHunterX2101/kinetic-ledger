const express = require("express");
const { randomUUID } = require("node:crypto");
const { z } = require("zod");
const db = require("../../config/db");
const authenticate = require("../../middleware/authenticate");
const authorise = require("../../middleware/authorise");
const { sendError, sendSuccess } = require("../../utils/response");

const router = express.Router();

const createRecordSchema = z.object({
  amount: z.number().refine((v) => v !== 0, "must be non-zero"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1).max(100),
  date: z.string().date(),
  notes: z.string().max(500).optional().nullable(),
  ledger_hash: z.string().max(120).optional().nullable(),
  counterparty: z.string().max(120).optional().nullable(),
  status: z.enum(["verified", "flagged", "pending"]).optional(),
});

const updateRecordSchema = createRecordSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

router.use(authenticate);

router.get("/", authorise(["viewer", "analyst", "admin"]), (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const perPage = Math.min(Math.max(Number(req.query.per_page || 20), 1), 100);
  const offset = (page - 1) * perPage;

  const filters = [];
  const values = [];

  const isViewer = req.user.role === "viewer";
  const hasFiltering = req.query.type || req.query.category || req.query.from || req.query.to || req.query.q;
  if (isViewer && hasFiltering) {
    return sendError(res, 403, "Viewer cannot use filtering/search");
  }

  filters.push("is_deleted = 0");

  if (req.query.type) {
    filters.push("type = ?");
    values.push(req.query.type);
  }
  if (req.query.category) {
    filters.push("category = ?");
    values.push(req.query.category);
  }
  if (req.query.from) {
    filters.push("date >= ?");
    values.push(req.query.from);
  }
  if (req.query.to) {
    filters.push("date <= ?");
    values.push(req.query.to);
  }
  if (req.query.q) {
    filters.push("(COALESCE(ledger_hash, '') LIKE ? OR COALESCE(counterparty, '') LIKE ? OR COALESCE(notes, '') LIKE ?)");
    const q = `%${req.query.q}%`;
    values.push(q, q, q);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  if (req.query.format === "csv") {
    const exportRows = db
      .prepare(
        `SELECT status, ledger_hash, date, counterparty, category, type, amount, notes
         FROM financial_records
         ${where}
         ORDER BY date DESC, created_at DESC`
      )
      .all(...values);

    const header = "status,ledger_hash,date,counterparty,category,type,amount,notes";
    const lines = exportRows.map((row) => {
      const escaped = [
        row.status,
        row.ledger_hash,
        row.date,
        row.counterparty,
        row.category,
        row.type,
        row.amount,
        row.notes,
      ].map((value) => {
        const normalized = value == null ? "" : String(value);
        return `"${normalized.replace(/"/g, '""')}"`;
      });
      return escaped.join(",");
    });

    const csv = [header, ...lines].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=records_export.csv");
    return res.status(200).send(csv);
  }

  const total = db.prepare(`SELECT COUNT(*) AS total FROM financial_records ${where}`).get(...values).total;

  const rows = db
    .prepare(
      `SELECT id, amount, type, category, date, notes, ledger_hash, counterparty, status, created_by, created_at, updated_at
       FROM financial_records
       ${where}
       ORDER BY date DESC, created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...values, perPage, offset);

  return sendSuccess(res, rows, {
    total,
    page,
    per_page: perPage,
  });
});

router.post("/", authorise(["admin"]), (req, res) => {
  const parsed = createRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 422, "Validation failed", parsed.error.issues);
  }

  const payload = parsed.data;
  const id = randomUUID();

  db.prepare(
    `INSERT INTO financial_records (
      id, amount, type, category, date, notes, ledger_hash, counterparty, status, is_deleted, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).run(
    id,
    payload.amount,
    payload.type,
    payload.category,
    payload.date,
    payload.notes || null,
    payload.ledger_hash || null,
    payload.counterparty || null,
    payload.status || "verified",
    req.user.id
  );

  const created = db.prepare("SELECT * FROM financial_records WHERE id = ?").get(id);
  return sendSuccess(res, created, null, 201);
});

router.patch("/:id", authorise(["admin"]), (req, res) => {
  const parsed = updateRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 422, "Validation failed", parsed.error.issues);
  }

  const existing = db
    .prepare("SELECT id FROM financial_records WHERE id = ? AND is_deleted = 0")
    .get(req.params.id);
  if (!existing) {
    return sendError(res, 404, "Record not found");
  }

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(parsed.data)) {
    updates.push(`${key} = ?`);
    values.push(value);
  }
  updates.push("updated_at = CURRENT_TIMESTAMP");

  values.push(req.params.id);
  db.prepare(`UPDATE financial_records SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = db.prepare("SELECT * FROM financial_records WHERE id = ?").get(req.params.id);
  return sendSuccess(res, updated);
});

router.delete("/:id", authorise(["admin"]), (req, res) => {
  const existing = db
    .prepare("SELECT id FROM financial_records WHERE id = ? AND is_deleted = 0")
    .get(req.params.id);
  if (!existing) {
    return sendError(res, 404, "Record not found");
  }

  db.prepare("UPDATE financial_records SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  return sendSuccess(res, { id: req.params.id, is_deleted: true });
});

module.exports = router;
