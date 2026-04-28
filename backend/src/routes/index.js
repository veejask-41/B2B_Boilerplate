const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { basePath } = require('../config');
const { authMiddleware } = require('../middleware/auth');
const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/health', asyncHandler(healthController.getHealth));
router.post('/auth/register', asyncHandler(authController.register));
router.post('/auth/login', asyncHandler(authController.login));
router.post('/products', authMiddleware, asyncHandler(productController.create));
router.get('/products', authMiddleware, asyncHandler(productController.list));
router.get('/products/:id', authMiddleware, asyncHandler(productController.getById));
router.put('/products/:id', authMiddleware, asyncHandler(productController.update));
router.delete('/products/:id', authMiddleware, asyncHandler(productController.remove));

function mountRoutes(app) {
  app.use(basePath, router);
}

module.exports = { mountRoutes };
