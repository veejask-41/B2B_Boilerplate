const authService = require('../services/authService');

async function register(req, res) {
  const { email, password, business_name } = req.body;

  if (!email || !password || !business_name) {
    return res.status(400).json({ error: 'email, password and business_name are required' });
  }

  const result = await authService.register({ email, password, business_name });
  return res.status(201).json(result);
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = await authService.login({ email, password });
  return res.json(result);
}

module.exports = { register, login };
