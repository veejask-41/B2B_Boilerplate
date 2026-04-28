function toSafeObject(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_error) {
      return '[unserializable]';
    }
  }

  return value;
}

function logInfo(message, metadata = {}) {
  // eslint-disable-next-line no-console
  console.log(`[INFO] ${new Date().toISOString()} ${message}`, toSafeObject(metadata));
}

function logError(message, error, metadata = {}) {
  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${new Date().toISOString()} ${message}`, {
    ...toSafeObject(metadata),
    name: error?.name,
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
  });
}

module.exports = { toSafeObject, logInfo, logError };
