const { sendError } = require("../utils/response");

function authorise(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Unauthorized");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, "Forbidden: insufficient role");
    }

    return next();
  };
}

module.exports = authorise;
