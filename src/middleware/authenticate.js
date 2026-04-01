const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { sendError } = require("../utils/response");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch (error) {
    return sendError(res, 401, "Invalid or expired token");
  }
}

module.exports = authenticate;
