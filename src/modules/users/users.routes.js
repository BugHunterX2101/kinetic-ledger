const express = require("express");
const { z } = require("zod");
const { hashSync } = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const db = require("../../config/db");
const authenticate = require("../../middleware/authenticate");
const authorise = require("../../middleware/authorise");
const { sendError, sendSuccess } = require("../../utils/response");

const router = express.Router();

const roles = ["viewer", "analyst", "admin"];

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(roles),
});

const updateUserSchema = z
  .object({
    role: z.enum(roles).optional(),
    is_active: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

router.use(authenticate);

router.get("/me", (req, res) => {
  const user = db
    .prepare("SELECT id, email, role, is_active, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  return sendSuccess(res, user);
});

router.get("/", authorise(["admin"]), (_req, res) => {
  const users = db
    .prepare("SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC")
    .all();

  return sendSuccess(res, users);
});

router.post("/", authorise(["admin"]), (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "Validation failed", parsed.error.issues);
  }

  const { email, password, role } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return sendError(res, 409, "Email already exists");
  }

  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)"
  ).run(id, email, hashSync(password, 12), role);

  const user = db.prepare("SELECT id, email, role, is_active, created_at FROM users WHERE id = ?").get(id);
  return sendSuccess(res, user, null, 201);
});

router.patch("/:id", authorise(["admin"]), (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "Validation failed", parsed.error.issues);
  }

  const targetUser = db.prepare("SELECT id, role FROM users WHERE id = ?").get(req.params.id);
  if (!targetUser) {
    return sendError(res, 404, "User not found");
  }

  if (req.user.id === targetUser.id && parsed.data.role && parsed.data.role !== "admin") {
    return sendError(res, 403, "Admin cannot demote themselves");
  }

  const updates = [];
  const values = [];

  if (parsed.data.role) {
    updates.push("role = ?");
    values.push(parsed.data.role);
  }
  if (typeof parsed.data.is_active === "boolean") {
    updates.push("is_active = ?");
    values.push(parsed.data.is_active ? 1 : 0);
  }
  if (parsed.data.password) {
    updates.push("password_hash = ?");
    values.push(hashSync(parsed.data.password, 12));
  }

  values.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare("SELECT id, email, role, is_active, created_at FROM users WHERE id = ?")
    .get(req.params.id);

  return sendSuccess(res, updated);
});

router.delete("/:id", authorise(["admin"]), (req, res) => {
  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.id);
  if (!target) {
    return sendError(res, 404, "User not found");
  }

  db.prepare("UPDATE users SET is_active = 0 WHERE id = ?").run(req.params.id);
  return sendSuccess(res, { id: req.params.id, is_active: false });
});

module.exports = router;
