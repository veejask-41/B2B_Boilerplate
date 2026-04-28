const bcrypt = require('bcryptjs');
const { pool } = require('../infrastructure/database');
const { AppError } = require('../errors/AppError');
const businessRepository = require('../repositories/businessRepository');
const userRepository = require('../repositories/userRepository');
const { signToken } = require('../utils/jwt');

async function register({ email, password, business_name }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const businessId = await businessRepository.insert(client, business_name);
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await userRepository.insertOwner(client, email, passwordHash, businessId);

    await client.query('COMMIT');

    const token = signToken({ user_id: userId, business_id: businessId, role: 'owner' });
    return { user_id: userId, token };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      throw new AppError(409, 'Email already exists');
    }

    throw new AppError(500, 'Failed to register user', error);
  } finally {
    client.release();
  }
}

async function login({ email, password }) {
  try {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = signToken({
      user_id: user.id,
      business_id: user.business_id,
      role: user.role,
    });

    return { token };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'Failed to login user', error);
  }
}

module.exports = { register, login };
