const { query } = require('../infrastructure/database');

async function insert({ name, sku, price, quantity, category, businessId }) {
  const result = await query(
    `INSERT INTO products (name, sku, price, quantity, category, business_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [name, sku, price, quantity, category, businessId],
  );
  return result.rows[0].id;
}

async function findAllByBusiness(businessId) {
  const result = await query(
    `SELECT id, name, sku, price, quantity, category
     FROM products
     WHERE business_id = $1
     ORDER BY created_at DESC`,
    [businessId],
  );
  return result.rows;
}

async function findByIdForBusiness(id, businessId) {
  const result = await query(
    `SELECT id, name, sku, price, quantity, category
     FROM products
     WHERE id = $1 AND business_id = $2`,
    [id, businessId],
  );
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0];
}

async function updatePartial({ id, businessId, name, price, quantity, category }) {
  const result = await query(
    `UPDATE products
     SET name = COALESCE($1, name),
         price = COALESCE($2, price),
         quantity = COALESCE($3, quantity),
         category = COALESCE($4, category),
         updated_at = NOW()
     WHERE id = $5 AND business_id = $6
     RETURNING id`,
    [name ?? null, price ?? null, quantity ?? null, category ?? null, id, businessId],
  );
  return result.rowCount > 0;
}

async function deleteByIdForBusiness(id, businessId) {
  const result = await query('DELETE FROM products WHERE id = $1 AND business_id = $2 RETURNING id', [
    id,
    businessId,
  ]);
  return result.rowCount > 0;
}

module.exports = {
  insert,
  findAllByBusiness,
  findByIdForBusiness,
  updatePartial,
  deleteByIdForBusiness,
};
