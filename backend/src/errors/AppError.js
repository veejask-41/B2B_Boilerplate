class AppError extends Error {
  constructor(statusCode, message, cause) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

module.exports = { AppError };
