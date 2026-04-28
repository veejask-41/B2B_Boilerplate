const { AppError } = require('../errors/AppError');
const { logError } = require('../utils/logger');

module.exports = function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logError(err.message, err.cause || err, {
        path: req.originalUrl,
        method: req.method,
      });
    }
    return res.status(err.statusCode).json({ error: err.message });
  }

  logError('Unhandled error', err, { path: req.originalUrl, method: req.method });
  return res.status(500).json({ error: 'Internal server error' });
};
