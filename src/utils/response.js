function sendSuccess(res, data, meta = null, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
    meta,
  });
}

function sendError(res, status, message, fields = null) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      message,
      fields,
    },
    meta: null,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
