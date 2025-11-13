const { Router } = require('express');
const {
  createManufacturerProduct,
  getManufacturerProducts,
  getManufacturerProductById,
  updateManufacturerProduct,
  deleteManufacturerProduct,
  searchManufacturerProducts,
} = require('./manufacturer-product.service.js');

const router = Router();

// ✅ Add manufacturer product to DB
router.post('/', async (req, res) => {
  try {
    console.log('📍 POST /api/manufacturer-products - Body:', req.body);
    const newProduct = await createManufacturerProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('❌ POST /api/manufacturer-products - Error:', error.message);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// ✅ Get all manufacturer products for a user
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('📍 GET /api/manufacturer-products/user/:userId - User ID:', req.params.userId);
    const products = await getManufacturerProducts(req.params.userId);
    res.json(products);
  } catch (error) {
    console.error('❌ GET /api/manufacturer-products/user/:userId - Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// ✅ Get manufacturer product by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('📍 GET /api/manufacturer-products/:id - ID:', req.params.id);
    const product = await getManufacturerProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('❌ GET /api/manufacturer-products/:id - Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// ✅ Update manufacturer product
router.put('/:id', async (req, res) => {
  try {
    console.log('📍 PUT /api/manufacturer-products/:id - ID:', req.params.id, 'Body:', req.body);
    const updated = await updateManufacturerProduct(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('❌ PUT /api/manufacturer-products/:id - Error:', error.message);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// ✅ Delete manufacturer product
router.delete('/:id', async (req, res) => {
  try {
    console.log('📍 DELETE /api/manufacturer-products/:id - ID:', req.params.id);
    await deleteManufacturerProduct(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ DELETE /api/manufacturer-products/:id - Error:', error.message);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

// ✅ Search manufacturer products
router.get('/search/:manufacturerId', async (req, res) => {
  try {
    console.log('📍 GET /api/manufacturer-products/search/:manufacturerId - Manufacturer ID:', req.params.manufacturerId, 'Query:', req.query);
    const products = await searchManufacturerProducts(req.params.manufacturerId, req.query);
    res.json(products);
  } catch (error) {
    console.error('❌ GET /api/manufacturer-products/search/:manufacturerId - Error:', error.message);
    res.status(500).json({ message: 'Failed to search products', error: error.message });
  }
});

module.exports = router;