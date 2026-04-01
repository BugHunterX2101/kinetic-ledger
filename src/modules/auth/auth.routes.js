const express = require("express");
const jwt = require("jsonwebtoken");
const { compareSync } = require("bcryptjs");
const { z } = require("zod");
const db = require("../../config/db");
const env = require("../../config/env");
const { sendError, sendSuccess } = require("../../utils/response");

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "Validation failed", parsed.error.issues);
  }

  const { email, password } = parsed.data;
  const user = db
    .prepare("SELECT id, email, password_hash, role, is_active FROM users WHERE email = ?")
    .get(email);

  if (!user || !compareSync(password, user.password_hash)) {
    return sendError(res, 401, "Invalid credentials");
  }

  if (!user.is_active) {
    return sendError(res, 403, "User is inactive");
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return sendSuccess(res, {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = router;
