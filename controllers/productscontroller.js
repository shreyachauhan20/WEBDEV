const Product = require('../models/Product');



exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};



exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, sort, page = 1, limit = 10 } = req.query;
    
    // Filtering
    let query = {};
    if (category) query.category = category;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Pagination setup
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let queryExec = Product.find(query);

    // Sorting
    if (sort) {
      const sortBy = sort.split(',').join(' ');
      queryExec = queryExec.sort(sortBy);
    } else {
      queryExec = queryExec.sort('-createdAt');
    }

    const products = await queryExec.skip(skip).limit(limitNum);
    const total = await Product.countDocuments(query);

    res.status(200).json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};


exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Safely update stock (increment/decrement via PATCH)
// @route   PATCH /api/products/:id/stock
exports.updateStock = async (req, res, next) => {
  try {
    const { change } = req.body; // e.g., positive or negative integer
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newQuantity = product.quantity + Number(change);
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    product.quantity = newQuantity;
    await product.save();

    res.status(200).json({
      message: 'Stock updated',
      product
    });
  } catch (error) {
    next(error);
  }
};



exports.getLowStockReport = async (req, res, next) => {
  try {
    // Finds items where quantity is less than or equal to reorderLevel
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    });

    res.status(200).json({
      lowStockItems: {
        count: lowStockItems.length,
        items: lowStockItems
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Category-wise Inventory Summary (Aggregation Pipeline)
// @route   GET /api/products/summary
exports.getCategorySummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    res.status(200).json({
      categories: summary.length,
      summary
    });
  } catch (error) {
    next(error);
  }
};