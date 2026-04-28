const { query } = require('../infrastructure/database');
const { AppError } = require('../errors/AppError');

async function check() {
  try {
    await query('SELECT 1');
  } catch (error) {
    throw new AppError(500, 'Database is unavailable', error);
  }
}

module.exports = { check };
