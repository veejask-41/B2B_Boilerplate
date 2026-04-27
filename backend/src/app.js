const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();

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

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
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
});

const basePath = '/api/v1';
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

function createToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get(`${basePath}/health`, async (_req, res) => {
  try {
    await db.query('SELECT 1');
    return res.json({ status: 'ok' });
  } catch (error) {
    logError('Health check failed', error);
    return res.status(500).json({ error: 'Database is unavailable' });
  }
});

app.post(`${basePath}/auth/register`, async (req, res) => {
  const { email, password, business_name } = req.body;

  if (!email || !password || !business_name) {
    return res.status(400).json({ error: 'email, password and business_name are required' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const businessResult = await client.query(
      `INSERT INTO businesses (name)
       VALUES ($1)
       RETURNING id`,
      [business_name],
    );

    const businessId = businessResult.rows[0].id;
    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, business_id)
       VALUES ($1, $2, 'owner', $3)
       RETURNING id`,
      [email, passwordHash, businessId],
    );

    await client.query('COMMIT');

    const userId = userResult.rows[0].id;
    const token = createToken({ user_id: userId, business_id: businessId, role: 'owner' });

    return res.status(201).json({ user_id: userId, token });
  } catch (error) {
    await client.query('ROLLBACK');
    logError('Failed to register user', error, { body: { email, business_name } });

    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    return res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client.release();
  }
});

app.post(`${basePath}/auth/login`, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await db.query(
      `SELECT id, password_hash, role, business_id
       FROM users
       WHERE email = $1`,
      [email],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken({
      user_id: user.id,
      business_id: user.business_id,
      role: user.role,
    });

    return res.json({ token });
  } catch (error) {
    logError('Failed to login user', error, { body: { email } });
    return res.status(500).json({ error: 'Failed to login user' });
  }
});

app.post(`${basePath}/products`, authMiddleware, async (req, res) => {
  const { name, sku, price, quantity, category } = req.body;

  if (!name || !sku || price === undefined || quantity === undefined || !category) {
    return res
      .status(400)
      .json({ error: 'name, sku, price, quantity and category are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO products (name, sku, price, quantity, category, business_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [name, sku, price, quantity, category, req.user.business_id],
    );

    return res.status(201).json({ product_id: result.rows[0].id });
  } catch (error) {
    logError('Failed to create product', error, { body: req.body, user: req.user });

    if (error.code === '23505') {
      return res.status(409).json({ error: 'sku already exists' });
    }

    return res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get(`${basePath}/products`, authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, sku, price, quantity, category
       FROM products
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [req.user.business_id],
    );

    return res.json({ products: result.rows });
  } catch (error) {
    logError('Failed to fetch products', error, { user: req.user });
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get(`${basePath}/products/:id`, authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id, name, sku, price, quantity, category
       FROM products
       WHERE id = $1 AND business_id = $2`,
      [id, req.user.business_id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    logError('Failed to fetch product', error, { productId: id, user: req.user });
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.put(`${basePath}/products/:id`, authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity, category } = req.body;

  if (name === undefined && price === undefined && quantity === undefined && category === undefined) {
    return res
      .status(400)
      .json({ error: 'At least one field is required: name, price, quantity, category' });
  }

  try {
    const result = await db.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           quantity = COALESCE($3, quantity),
           category = COALESCE($4, category),
           updated_at = NOW()
       WHERE id = $5 AND business_id = $6
       RETURNING id`,
      [name ?? null, price ?? null, quantity ?? null, category ?? null, id, req.user.business_id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ status: 'updated' });
  } catch (error) {
    logError('Failed to update product', error, { productId: id, body: req.body, user: req.user });
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete(`${basePath}/products/:id`, authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 AND business_id = $2 RETURNING id',
      [id, req.user.business_id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ status: 'deleted' });
  } catch (error) {
    logError('Failed to delete product', error, { productId: id, user: req.user });
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = app;
