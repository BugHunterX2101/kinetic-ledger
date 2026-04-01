const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("node:path");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const recordsRoutes = require("./modules/records/records.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const systemRoutes = require("./modules/system/system.routes");
const { sendError, sendSuccess } = require("./utils/response");

const app = express();

app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/v1/health", (_req, res) => sendSuccess(res, { status: "ok" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/records", recordsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/system", systemRoutes);

app.get("/favicon.ico", (_req, res) => {
  res.redirect(302, "/favicon.svg");
});

app.use(express.static(path.join(process.cwd(), "public"), { index: false }));
app.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});
app.get("/hero", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "hero.html"));
});
app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "hero.html"));
});

app.use((_req, res) => sendError(res, 404, "Endpoint not found"));

app.use((err, _req, res, _next) => {
  return sendError(res, err.status || 500, err.message || "Internal server error");
});

module.exports = app;
