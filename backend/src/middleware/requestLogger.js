const { logInfo } = require('../utils/logger');

module.exports = function requestLogger(req, res, next) {
  const start = Date.now();

  logInfo('Incoming request', {
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    body: req.body,
  });

  res.on('finish', () => {
    logInfo('Request completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
}
