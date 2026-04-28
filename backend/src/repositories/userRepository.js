const { query } = require('../infrastructure/database');

async function insertOwner(client, email, passwordHash, businessId) {
  const result = await client.query(
    `INSERT INTO users (email, password_hash, role, business_id)
     VALUES ($1, $2, 'owner', $3)
     RETURNING id`,
    [email, passwordHash, businessId],
  );
  return result.rows[0].id;
}

async function findByEmail(email) {
  const result = await query(
    `SELECT id, password_hash, role, business_id
     FROM users
     WHERE email = $1`,
    [email],
  );
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0];
}

module.exports = { insertOwner, findByEmail };
