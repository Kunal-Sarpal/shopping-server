import { Product } from '../models/Product.js';

const FALLBACK_PRODUCTS = [
  {
    product_id: 'fb-001',
    sku: 'SKU-001',
    name: 'Embroidered Silk Lehenga',
    category: 'Ethnic Wear',
    model: 'M-2026-01',
    designer: 'Manish Malhotra',
    vendor: 'Fabrics India Ltd.',
    mrp: 150000,
    costPrice: 65000,
    purchasePrice: 75000,
    sellingPrice: 120000,
    stock: 15,
    sold: 8,
    status: 'In Stock',
    shelf: 'A1-102',
    gender: 'Women',
    description: 'Exquisite hand-embroidered raw silk lehenga with intricate Zardozi work and matching net dupatta.',
    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    discount_percent: 20
  },
  {
    product_id: 'fb-002',
    sku: 'SKU-002',
    name: 'Royal Chanderi Silk Kurta Set',
    category: 'Ethnic Wear',
    model: 'M-2026-02',
    designer: 'Sabyasachi Heritage',
    vendor: 'Fabrics India Ltd.',
    mrp: 45000,
    costPrice: 18000,
    purchasePrice: 22000,
    sellingPrice: 36000,
    stock: 5,
    sold: 12,
    status: 'Low Stock',
    shelf: 'A2-201',
    gender: 'Women',
    description: 'Woven Chanderi silk kurta with hand-painted floral motifs and zari woven border.',
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    discount_percent: 20
  },
  {
    product_id: 'fb-003',
    sku: 'SKU-003',
    name: 'Designer Bandhgala Sherwani',
    category: 'Formals',
    model: 'M-2026-03',
    designer: 'Tarun Tahiliani',
    vendor: 'Heritage Textiles',
    mrp: 85000,
    costPrice: 35000,
    purchasePrice: 42000,
    sellingPrice: 68000,
    stock: 10,
    sold: 4,
    status: 'In Stock',
    shelf: 'B1-105',
    gender: 'Men',
    description: 'Classic embroidered velvet bandhgala jacket with tailored silk trousers.',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    discount_percent: 20
  },
  {
    product_id: 'fb-004',
    sku: 'SKU-004',
    name: 'Handcrafted Anarkali Suit',
    category: 'Ethnic Wear',
    model: 'M-2026-04',
    designer: 'Anita Dongre',
    vendor: 'Jaipur Crafts',
    mrp: 52000,
    costPrice: 22000,
    purchasePrice: 26000,
    sellingPrice: 41600,
    stock: 22,
    sold: 15,
    status: 'In Stock',
    shelf: 'A3-304',
    gender: 'Women',
    description: 'Flowing floor-length Gota Patti Anarkali suit with organza dupatta.',
    image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    discount_percent: 20
  },
  {
    product_id: 'fb-005',
    sku: 'SKU-005',
    name: 'Slim-Fit Linen Formal Shirt',
    category: 'Casuals',
    model: 'M-2026-05',
    designer: 'Raymond Made to Measure',
    vendor: 'Bombay Shirting',
    mrp: 6999,
    costPrice: 2200,
    purchasePrice: 2800,
    sellingPrice: 4999,
    stock: 35,
    sold: 28,
    status: 'In Stock',
    shelf: 'C2-101',
    gender: 'Men',
    description: '100% Pure Italian Linen breathable slim-fit formal shirt.',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['38', '40', '42', '44'],
    discount_percent: 28
  },
  {
    product_id: 'fb-006',
    sku: 'SKU-006',
    name: 'Sequin Embellished Evening Gown',
    category: 'Western',
    model: 'M-2026-06',
    designer: 'Gaurav Gupta',
    vendor: 'Couture House',
    mrp: 125000,
    costPrice: 50000,
    purchasePrice: 60000,
    sellingPrice: 99000,
    stock: 0,
    sold: 14,
    status: 'Out of Stock',
    shelf: 'A1-209',
    gender: 'Women',
    description: 'Sculptural metallic sequin mermaid gown with cascading side train.',
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['XS', 'S', 'M'],
    discount_percent: 20
  }
];

// GET /api/products — list with filters & pagination
export const getProducts = async (req, res) => {
  try {
    const { search, category, status, designer, page = 1, limit = 10 } = req.query;

    let products = [];
    let total = 0;
    let categoriesList = [];
    let designersList = [];

    // Try MongoDB query if connected
    if (Product.db && Product.db.readyState === 1) {
      let query = {};
      if (search) {
        query.$or = [
          { sku: { $regex: search, $options: 'i' } },
          { product_name: { $regex: search, $options: 'i' } }
        ];
      }
      if (category && category !== 'All') query.category = category;
      if (status && status !== 'All') query.status = status;
      if (designer && designer !== 'All') query.designer = designer;

      total = await Product.countDocuments(query);
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const dbProducts = await Product.find(query)
        .sort({ _id: -1 })
        .skip(offset)
        .limit(parseInt(limit));

      if (dbProducts.length > 0) {
        products = dbProducts.map(p => ({
          product_id: p._id,
          sku: p.sku,
          name: p.product_name,
          category: p.category,
          model: p.model,
          designer: p.designer,
          vendor: p.vendor,
          mrp: p.mrp,
          costPrice: p.costPrice,
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          stock: p.stock,
          sold: p.sold,
          status: p.status,
          shelf: p.shelf,
          gender: p.gender || 'Women',
          description: p.description || '',
          image_url: p.image_url || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
          images: (p.images && p.images.length > 0) ? p.images : [p.image_url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'],
          sizes: p.sizes || ['S', 'M', 'L', 'XL'],
          discount_percent: p.discount_percent || 0
        }));

        categoriesList = await Product.distinct('category');
        designersList = await Product.distinct('designer');
      }
    }

    // Fallback if DB empty or offline
    if (products.length === 0) {
      let filtered = [...FALLBACK_PRODUCTS];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
      }
      if (category && category !== 'All') filtered = filtered.filter(p => p.category === category);
      if (status && status !== 'All') filtered = filtered.filter(p => p.status === status);
      if (designer && designer !== 'All') filtered = filtered.filter(p => p.designer === designer);

      total = filtered.length;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      products = filtered.slice(offset, offset + parseInt(limit));

      categoriesList = Array.from(new Set(FALLBACK_PRODUCTS.map(p => p.category)));
      designersList = Array.from(new Set(FALLBACK_PRODUCTS.map(p => p.designer)));
    }

    res.json({
      products,
      total,
      page: parseInt(page),
      totalPages: Math.max(1, Math.ceil(total / parseInt(limit))),
      filters: {
        categories: ['All', ...categoriesList.filter(Boolean)],
        designers: ['All', ...designersList.filter(Boolean)],
        statuses: ['All', 'In Stock', 'Low Stock', 'Out of Stock'],
      },
    });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/products — create product
export const createProduct = async (req, res) => {
  try {
    const {
      sku, name, category, model, designer, vendor, mrp, costPrice, purchasePrice, sellingPrice, stock, shelf,
      gender = 'Women', description = '', image_url = '', images = [], sizes = ['S', 'M', 'L', 'XL']
    } = req.body;

    const stockVal = parseInt(stock) || 0;
    const status = stockVal === 0 ? 'Out of Stock' : stockVal < 25 ? 'Low Stock' : 'In Stock';

    const parsedImages = Array.isArray(images) && images.length > 0 
      ? images.filter(Boolean) 
      : (image_url ? [image_url] : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80']);
      
    const primaryImageUrl = parsedImages[0] || image_url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80';
    const mrpNum = parseFloat(mrp) || parseFloat(sellingPrice) || 0;
    const sellingPriceNum = parseFloat(sellingPrice) || 0;
    const discount = mrpNum > sellingPriceNum ? Math.round(((mrpNum - sellingPriceNum) / mrpNum) * 100) : 0;

    let createdId = `local-${Date.now()}`;

    if (Product.db && Product.db.readyState === 1) {
      const newProduct = await Product.create({
        sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
        product_name: name,
        category,
        model,
        designer,
        vendor,
        mrp: mrpNum,
        costPrice: parseFloat(costPrice) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: sellingPriceNum,
        stock: stockVal,
        shelf,
        status,
        gender,
        description,
        image_url: primaryImageUrl,
        images: parsedImages,
        sizes: Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim()),
        discount_percent: discount
      });
      createdId = newProduct._id;
    } else {
      FALLBACK_PRODUCTS.unshift({
        product_id: createdId,
        sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
        name,
        category: category || 'Ethnic Wear',
        model: model || 'M-2026',
        designer: designer || 'In-House Designer',
        vendor: vendor || 'FashionCo Supply',
        mrp: mrpNum,
        costPrice: parseFloat(costPrice) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: sellingPriceNum,
        stock: stockVal,
        sold: 0,
        status,
        shelf: shelf || 'A1',
        gender: gender || 'Women',
        description,
        image_url: primaryImageUrl,
        images: parsedImages,
        sizes: Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim()),
        discount_percent: discount
      });
    }

    res.status(201).json({ message: 'Product added successfully', productId: createdId });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

// DELETE /api/products/:id — delete product from DB or fallback memory store
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = false;

    if (Product.db && Product.db.readyState === 1) {
      try {
        const doc = await Product.findByIdAndDelete(id);
        if (doc) deleted = true;
      } catch (e) {
        await Product.deleteOne({ sku: id });
        deleted = true;
      }
    }

    const idx = FALLBACK_PRODUCTS.findIndex(p => p.product_id === id || p.sku === id || p._id === id);
    if (idx !== -1) {
      FALLBACK_PRODUCTS.splice(idx, 1);
      deleted = true;
    }

    res.json({ success: true, message: 'Product deleted successfully', id });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
};

