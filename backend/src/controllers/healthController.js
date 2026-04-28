const healthService = require('../services/healthService');

async function getHealth(_req, res) {
  await healthService.check();
  res.json({ status: 'ok' });
}

module.exports = { getHealth };
