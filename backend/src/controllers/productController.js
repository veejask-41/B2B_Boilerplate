const productService = require('../services/productService');

async function create(req, res) {
  const { name, sku, price, quantity, category } = req.body;

  if (!name || !sku || price === undefined || quantity === undefined || !category) {
    return res.status(400).json({ error: 'name, sku, price, quantity and category are required' });
  }

  const result = await productService.create(req.user.business_id, req.body);
  return res.status(201).json(result);
}

async function list(req, res) {
  const result = await productService.listByBusiness(req.user.business_id);
  return res.json(result);
}

async function getById(req, res) {
  const product = await productService.getById(req.params.id, req.user.business_id);
  return res.json(product);
}

async function update(req, res) {
  const result = await productService.updatePartial(req.params.id, req.user.business_id, req.body);
  return res.json(result);
}

async function remove(req, res) {
  const result = await productService.remove(req.params.id, req.user.business_id);
  return res.json(result);
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
};
