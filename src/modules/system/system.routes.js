const express = require("express");
const { randomUUID } = require("node:crypto");
const { z } = require("zod");

const db = require("../../config/db");
const authenticate = require("../../middleware/authenticate");
const authorise = require("../../middleware/authorise");
const { sendSuccess, sendError } = require("../../utils/response");

const router = express.Router();

// Apply authentication to all system routes (consistent with other route modules)
router.use(authenticate);

const supportTickets = [];
const deployments = [];

const supportTicketSchema = z.object({
  subject: z.string().min(5).max(120),
  message: z.string().min(10).max(1000),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
});

router.get("/logs", authorise(["analyst", "admin"]), (req, res) => {
  const limitRaw = Number(req.query.limit || 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 20;

  const recentRecords = db
    .prepare(
      `SELECT created_at, type, category, amount, status, ledger_hash
       FROM financial_records
       WHERE is_deleted = 0
       ORDER BY datetime(created_at) DESC
       LIMIT ?`
    )
    .all(limit);

  const recordLogs = recentRecords.map((record) => ({
    timestamp: record.created_at,
    level: record.status === "flagged" ? "warn" : "info",
    event: `record.${record.type}`,
    message: `${record.category} ${Number(record.amount).toFixed(2)} (${record.ledger_hash || "n/a"})`,
  }));

  const deploymentLogs = deployments.map((deployment) => ({
    timestamp: deployment.finished_at,
    level: deployment.status === "completed" ? "info" : "error",
    event: "deploy.node",
    message: `${deployment.target} ${deployment.version} by ${deployment.requested_by}`,
  }));

  const systemLog = {
    timestamp: new Date().toISOString(),
    level: "info",
    event: "support.queue",
    message: `open_tickets=${supportTickets.filter((ticket) => ticket.status === "open").length}`,
  };

  const logs = [...deploymentLogs, ...recordLogs, systemLog]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return sendSuccess(res, logs);
});

router.post("/support-ticket", (req, res) => {
  const parsed = supportTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "Invalid support ticket payload", parsed.error.flatten());
  }

  const ticket = {
    id: randomUUID(),
    subject: parsed.data.subject,
    message: parsed.data.message,
    priority: parsed.data.priority,
    status: "open",
    created_by: req.user.email,
    created_at: new Date().toISOString(),
  };

  supportTickets.unshift(ticket);
  return sendSuccess(res, ticket, null, 201);
});

router.get("/support-ticket", (req, res) => {
  const data =
    req.user.role === "admin"
      ? supportTickets
      : supportTickets.filter((ticket) => ticket.created_by === req.user.email);

  return sendSuccess(res, data.slice(0, 50));
});

router.post("/deploy", authorise(["admin"]), (req, res) => {
  const target = typeof req.body?.target === "string" && req.body.target.trim() ? req.body.target.trim() : "node-alpha";

  const deployment = {
    deployment_id: randomUUID(),
    target,
    version: "v4.2.0",
    status: "completed",
    requested_by: req.user.email,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  };

  deployments.unshift(deployment);
  return sendSuccess(res, deployment, null, 202);
});

module.exports = router;
