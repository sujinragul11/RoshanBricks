const prisma = require('../../../shared/lib/db.js');

/**
 * @typedef {Object} ManufacturerProductPayload
 * @property {string|number} manufacturerId - The manufacturer user ID
 * @property {string} name - Product name
 * @property {string} [category] - Product category
 * @property {string|number} priceRange - Price range
 * @property {string|number} [priceAmount] - Price amount (alternative to priceRange)
 * @property {string} [imageUrl] - Image URL
 * @property {string|number} [qualityRating] - Quality rating
 * @property {string} [offer] - Offer details
 * @property {string|number} [buyersCount] - Number of buyers
 * @property {boolean} [returnExchange] - Return/exchange policy
 * @property {boolean} [cashOnDelivery] - Cash on delivery option
 * @property {Array<any>} [paymentOptions] - Payment options
 * @property {string} [description] - Product description
 * @property {string|number} [stockQuantity] - Stock quantity
 */

/**
 * @typedef {Object} UpdateManufacturerProductPayload
 * @property {string} [name] - Product name
 * @property {string} [category] - Product category
 * @property {string|number} [priceRange] - Price range
 * @property {string|number} [priceAmount] - Price amount
 * @property {string} [imageUrl] - Image URL
 * @property {string|number} [qualityRating] - Quality rating
 * @property {string} [offer] - Offer details
 * @property {string|number} [buyersCount] - Number of buyers
 * @property {boolean} [returnExchange] - Return/exchange policy
 * @property {boolean} [cashOnDelivery] - Cash on delivery option
 * @property {Array<any>} [paymentOptions] - Payment options
 * @property {string} [description] - Product description
 * @property {number} [stockQuantity] - Stock quantity
 * @property {number} [minOrderQuantity] - Minimum order quantity
 * @property {boolean} [isActive] - Active status
 */

/**
 * @typedef {Object} SearchManufacturerProductsQuery
 * @property {string} [name] - Product name to search
 * @property {string} [category] - Product category to search
 * @property {string|number} [minPrice] - Minimum price
 * @property {string|number} [maxPrice] - Maximum price
 */

/**
 * @typedef {Object} WhereClause
 * @property {bigint} manufacturerId
 * @property {Object} [name]
 * @property {Object} [category]
 * @property {PriceRangeFilter} [priceRange]
 */

/**
 * @typedef {Object} PriceRangeFilter
 * @property {string} [gte]
 * @property {string} [lte]
 */

/**
 * Create a new manufacturer product
 * @param {ManufacturerProductPayload} payload
 */
const createManufacturerProduct = async (payload) => {
  try {
    console.log('🟢 CREATE PRODUCT: Received payload:', payload);

    const {
      manufacturerId, // User ID from frontend
      name,
      category,
      priceRange,
      priceAmount,
      imageUrl,
      stockQuantity,
      qualityRating,
      offer,
      buyersCount,
      returnExchange,
      cashOnDelivery,
      paymentOptions,
      description
    } = payload;

    // ✅ Validate required fields
    if (!manufacturerId) throw new Error('Manufacturer userId is required.');
    if (!name?.trim()) throw new Error('Product name is required.');
    
    // ✅ Use priceAmount as fallback if priceRange is not provided
    const finalPriceRange = priceRange || priceAmount;
    if (!finalPriceRange) {
      throw new Error('Price range or price amount is required.');
    }

    console.log('🔍 CREATE PRODUCT: Looking for manufacturer with user ID:', manufacturerId);

    // Extract numeric ID if manufacturerId starts with 'user-'
    let userIdString = manufacturerId;
    if (typeof manufacturerId === 'string' && manufacturerId.startsWith('user-')) {
      userIdString = manufacturerId.replace('user-', '');
    }

    const userIdBigInt = BigInt(userIdString);

    // ✅ FIX: Always ensure user and manufacturer exist
    let user = await prisma.user.findUnique({
      where: { id: userIdBigInt },
    });

    if (!user) {
      console.log('👤 CREATE PRODUCT: User not found, creating default user for id:', manufacturerId);
      user = await prisma.user.create({
        data: {
          id: userIdBigInt,
          phoneNumber: `AUTO_${manufacturerId}`,
          countryCode: '+91',
          userType: 'MANUFACTURER',
          isVerified: true,
          isActive: true,
        },
      });
    }

    // ✅ FIX: Always ensure manufacturer exists
    let manufacturer = await prisma.manufacturer.findUnique({
      where: { userId: userIdBigInt },
    });

    if (!manufacturer) {
      console.log('🏭 CREATE PRODUCT: Manufacturer not found, creating default manufacturer for userId:', manufacturerId);
      manufacturer = await prisma.manufacturer.create({
        data: {
          userId: userIdBigInt,
          companyName: 'Default Company',
          businessType: 'General',
          isVerified: false,
          rating: 4.0,
        },
      });
    }

    console.log('✅ CREATE PRODUCT: Manufacturer found/created with ID:', manufacturer.id);

    // ✅ Parse stock quantity with proper fallback
    const parsedStockQuantity = stockQuantity ? parseInt(String(stockQuantity)) : 10000;

    // ✅ Create the product safely
    const productData = await prisma.manufacturerProduct.create({
      data: {
        manufacturerId: manufacturer.id,
        name: name.trim(),
        category: category || 'General',
        priceRange: finalPriceRange.toString(),
        imageUrl: imageUrl || '',
        qualityRating: qualityRating ? parseFloat(String(qualityRating)) : 4.0,
        offer: offer || '',
        buyersCount: buyersCount ? parseInt(String(buyersCount)) : 0,
        returnExchange: !!returnExchange,
        cashOnDelivery: !!cashOnDelivery,
        paymentOptions: paymentOptions ? JSON.stringify(paymentOptions) : JSON.stringify([]),
        description: description || '',
        stockQuantity: parsedStockQuantity,
        minOrderQuantity: 1,
        isActive: true,
      },
    });

    console.log('✅ CREATE PRODUCT: Product created successfully with ID:', productData.id);

    // Parse and format response data
    let parsedPaymentOptions = [];
    try {
      parsedPaymentOptions = JSON.parse(String(productData.paymentOptions) || '[]');
    } catch {
      parsedPaymentOptions = [];
    }

    return {
      id: productData.id,
      manufacturerId: productData.manufacturerId.toString(),
      name: productData.name,
      category: productData.category,
      priceRange: productData.priceRange,
      priceAmount: parseFloat(String(productData.priceRange || '0')) || 0,
      imageUrl: productData.imageUrl,
      image: productData.imageUrl,
      qualityRating: productData.qualityRating,
      offer: productData.offer,
      buyersCount: productData.buyersCount,
      returnExchange: productData.returnExchange,
      cashOnDelivery: productData.cashOnDelivery,
      paymentOptions: parsedPaymentOptions,
      description: productData.description,
      stockQuantity: productData.stockQuantity,
      minOrderQuantity: productData.minOrderQuantity,
      isActive: productData.isActive,
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt,
    };
  } catch (error) {
    console.error('❌ CREATE PRODUCT: Error:', error.message);
    throw error;
  }
};

/**
 * Get all manufacturer products for a specific manufacturer
 * @param {string|number} userId - The user ID (manufacturer user ID)
 */
const getManufacturerProducts = async (userId) => {
  try {
    console.log('🟢 GET PRODUCTS: Fetching products for user ID:', userId);

    // Extract numeric ID if userId starts with 'user-'
    let userIdString = userId;
    if (typeof userId === 'string' && userId.startsWith('user-')) {
      userIdString = userId.replace('user-', '');
    }

    const userIdBigInt = BigInt(userIdString);

    console.log('🔍 GET PRODUCTS: Looking for manufacturer with user ID:', userIdString);

    // ✅ FIX: Create manufacturer if doesn't exist (same as create function)
    let user = await prisma.user.findUnique({
      where: { id: userIdBigInt },
    });

    if (!user) {
      console.log('👤 GET PRODUCTS: User not found, creating default user');
      user = await prisma.user.create({
        data: {
          id: userIdBigInt,
          phoneNumber: `AUTO_${userId}`,
          countryCode: '+91',
          userType: 'MANUFACTURER',
          isVerified: true,
          isActive: true,
        },
      });
    }

    let manufacturer = await prisma.manufacturer.findUnique({
      where: { userId: userIdBigInt },
    });

    if (!manufacturer) {
      console.log('🏭 GET PRODUCTS: Manufacturer not found, creating default manufacturer');
      manufacturer = await prisma.manufacturer.create({
        data: {
          userId: userIdBigInt,
          companyName: 'Default Company',
          businessType: 'General',
          isVerified: false,
          rating: 4.0,
        },
      });
    }

    console.log('✅ GET PRODUCTS: Manufacturer found/created with ID:', manufacturer.id);

    const products = await prisma.manufacturerProduct.findMany({
      where: { manufacturerId: manufacturer.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log('✅ GET PRODUCTS: Products found:', products.length);

    // Format response data
    const formattedProducts = products.map(product => {
      let parsedPaymentOptions = [];
      try {
        parsedPaymentOptions = JSON.parse(String(product.paymentOptions) || '[]');
      } catch {
        parsedPaymentOptions = [];
      }

      return {
        id: product.id,
        manufacturerId: product.manufacturerId.toString(),
        name: product.name,
        category: product.category,
        priceRange: product.priceRange,
        priceAmount: parseFloat(String(product.priceRange || '0')) || 0,
        imageUrl: product.imageUrl,
        image: product.imageUrl,
        qualityRating: product.qualityRating,
        offer: product.offer,
        buyersCount: product.buyersCount,
        returnExchange: product.returnExchange,
        cashOnDelivery: product.cashOnDelivery,
        paymentOptions: parsedPaymentOptions,
        description: product.description,
        stockQuantity: product.stockQuantity,
        minOrderQuantity: product.minOrderQuantity,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    console.log('🎯 GET PRODUCTS: Formatted products:', formattedProducts);
    return formattedProducts;
  } catch (error) {
    console.error('❌ GET PRODUCTS: Error:', error.message);
    throw error;
  }
};

/**
 * Get manufacturer product by ID
 * @param {string} id
 */
const getManufacturerProductById = async (id) => {
  try {
    console.log('🟢 GET PRODUCT BY ID:', id);
    
    const product = await prisma.manufacturerProduct.findUnique({
      where: { id },
    });

    if (!product) {
      console.log('❌ GET PRODUCT BY ID: Product not found');
      return null;
    }

    // Parse payment options
    let parsedPaymentOptions = [];
    try {
      parsedPaymentOptions = JSON.parse(String(product.paymentOptions) || '[]');
    } catch {
      parsedPaymentOptions = [];
    }

    console.log('✅ GET PRODUCT BY ID: Product found');

    return {
      ...product,
      manufacturerId: product.manufacturerId.toString(),
      paymentOptions: parsedPaymentOptions,
      priceAmount: parseFloat(String(product.priceRange || '0')) || 0,
      image: product.imageUrl,
    };
  } catch (error) {
    console.error('❌ GET PRODUCT BY ID: Error:', error.message);
    throw error;
  }
};

/**
 * Update manufacturer product by ID
 * @param {string} id
 * @param {UpdateManufacturerProductPayload} payload
 */
const updateManufacturerProduct = async (id, payload) => {
  try {
    console.log('🟢 UPDATE PRODUCT: ID:', id, 'Payload:', payload);

    const {
      name,
      category,
      priceRange,
      priceAmount,
      imageUrl,
      qualityRating,
      offer,
      buyersCount,
      returnExchange,
      cashOnDelivery,
      paymentOptions,
      description,
      stockQuantity,
      minOrderQuantity,
      isActive,
    } = payload;

    // Use priceAmount as fallback if priceRange is not provided
    const finalPriceRange = priceRange || priceAmount;

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(category && { category }),
      ...(finalPriceRange && { priceRange: finalPriceRange.toString() }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(qualityRating !== undefined && { qualityRating: parseFloat(String(qualityRating)) }),
      ...(offer !== undefined && { offer }),
      ...(buyersCount !== undefined && { buyersCount: parseInt(String(buyersCount)) }),
      ...(returnExchange !== undefined && { returnExchange: !!returnExchange }),
      ...(cashOnDelivery !== undefined && { cashOnDelivery: !!cashOnDelivery }),
      ...(paymentOptions && { paymentOptions: JSON.stringify(paymentOptions) }),
      ...(description !== undefined && { description }),
      ...(stockQuantity !== undefined && { stockQuantity: parseInt(String(stockQuantity)) }),
      ...(minOrderQuantity !== undefined && { minOrderQuantity: parseInt(String(minOrderQuantity)) }),
      ...(isActive !== undefined && { isActive: !!isActive }),
    };

    console.log('📝 UPDATE PRODUCT: Update data:', updateData);

    const updatedProduct = await prisma.manufacturerProduct.update({
      where: { id },
      data: updateData,
    });

    // Parse payment options for response
    let parsedPaymentOptions = [];
    try {
      parsedPaymentOptions = JSON.parse(String(updatedProduct.paymentOptions) || '[]');
    } catch {
      parsedPaymentOptions = [];
    }

    console.log('✅ UPDATE PRODUCT: Product updated successfully');

    return {
      ...updatedProduct,
      manufacturerId: updatedProduct.manufacturerId.toString(),
      paymentOptions: parsedPaymentOptions,
      priceAmount: parseFloat(String(updatedProduct.priceRange || '0')) || 0,
      image: updatedProduct.imageUrl,
    };
  } catch (error) {
    console.error('❌ UPDATE PRODUCT: Error:', error.message);
    throw error;
  }
};

/**
 * Search manufacturer products
 * @param {string|number} manufacturerId
 * @param {SearchManufacturerProductsQuery} query
 */
const searchManufacturerProducts = async (manufacturerId, query) => {
  try {
    console.log('🔍 SEARCH PRODUCTS: Manufacturer ID:', manufacturerId, 'Query:', query);

    // Extract numeric ID if manufacturerId starts with 'user-'
    let manufacturerIdString = manufacturerId;
    if (typeof manufacturerId === 'string' && manufacturerId.startsWith('user-')) {
      manufacturerIdString = manufacturerId.replace('user-', '');
    }

    const { name, category, minPrice, maxPrice } = query;
    /** @type {WhereClause} */
    const where = {
      manufacturerId: BigInt(manufacturerIdString),
    };

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive',
      };
    }

    if (minPrice || maxPrice) {
      /** @type {PriceRangeFilter} */
      const priceFilter = {};
      if (minPrice) {
        priceFilter.gte = minPrice.toString();
      }
      if (maxPrice) {
        priceFilter.lte = maxPrice.toString();
      }
      where.priceRange = priceFilter;
    }

    const products = await prisma.manufacturerProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    console.log('✅ SEARCH PRODUCTS: Found', products.length, 'products');

    // Format response data
    return products.map(product => {
      let parsedPaymentOptions = [];
      try {
        parsedPaymentOptions = JSON.parse(String(product.paymentOptions) || '[]');
      } catch {
        parsedPaymentOptions = [];
      }

      return {
        ...product,
        manufacturerId: product.manufacturerId.toString(),
        paymentOptions: parsedPaymentOptions,
        priceAmount: parseFloat(String(product.priceRange || '0')) || 0,
        image: product.imageUrl,
      };
    });
  } catch (error) {
    console.error('❌ SEARCH PRODUCTS: Error:', error.message);
    throw error;
  }
};

/**
 * Delete manufacturer product by ID
 * @param {string} id
 */
const deleteManufacturerProduct = async (id) => {
  try {
    console.log('🗑 DELETE PRODUCT: ID:', id);

    const deletedProduct = await prisma.manufacturerProduct.delete({
      where: { id },
    });

    console.log('✅ DELETE PRODUCT: Product deleted successfully');

    return {
      ...deletedProduct,
      manufacturerId: deletedProduct.manufacturerId.toString(),
      priceAmount: parseFloat(String(deletedProduct.priceRange || '0')) || 0,
      image: deletedProduct.imageUrl,
    };
  } catch (error) {
    console.error('❌ DELETE PRODUCT: Error:', error.message);
    throw error;
  }
};

module.exports = {
  createManufacturerProduct,
  getManufacturerProducts,
  getManufacturerProductById,
  updateManufacturerProduct,
  searchManufacturerProducts,
  deleteManufacturerProduct,
};