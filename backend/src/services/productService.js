const { AppError } = require('../errors/AppError');
const productRepository = require('../repositories/productRepository');

async function create(businessId, body) {
  const { name, sku, price, quantity, category } = body;

  try {
    const productId = await productRepository.insert({
      name,
      sku,
      price,
      quantity,
      category,
      businessId,
    });
    return { product_id: productId };
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'sku already exists');
    }
    throw new AppError(500, 'Failed to create product', error);
  }
}

async function listByBusiness(businessId) {
  try {
    const products = await productRepository.findAllByBusiness(businessId);
    return { products };
  } catch (error) {
    throw new AppError(500, 'Failed to fetch products', error);
  }
}

async function getById(id, businessId) {
  try {
    const product = await productRepository.findByIdForBusiness(id, businessId);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return product;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'Failed to fetch product', error);
  }
}

async function updatePartial(id, businessId, body) {
  const { name, price, quantity, category } = body;

  if (
    name === undefined &&
    price === undefined &&
    quantity === undefined &&
    category === undefined
  ) {
    throw new AppError(
      400,
      'At least one field is required: name, price, quantity, category',
    );
  }

  try {
    const updated = await productRepository.updatePartial({
      id,
      businessId,
      name,
      price,
      quantity,
      category,
    });
    if (!updated) {
      throw new AppError(404, 'Product not found');
    }
    return { status: 'updated' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'Failed to update product', error);
  }
}

async function remove(id, businessId) {
  try {
    const deleted = await productRepository.deleteByIdForBusiness(id, businessId);
    if (!deleted) {
      throw new AppError(404, 'Product not found');
    }
    return { status: 'deleted' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'Failed to delete product', error);
  }
}

module.exports = {
  create,
  listByBusiness,
  getById,
  updatePartial,
  remove,
};
