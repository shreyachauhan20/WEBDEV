const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockReport,
  getCategorySummary
} = require('../controllers/productscontroller');


router.get('/low-stock', getLowStockReport);
router.get('/summary', getCategorySummary);


router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

// Stock specific adjustment route
router.patch('/:id/stock', updateStock);

exports.productRoutes = router;