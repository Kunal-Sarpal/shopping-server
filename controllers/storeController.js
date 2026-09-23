import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { ProductVariant, Colour, Size, ProductSpecification } from '../models/ProductVariant.js';
import { InventoryLot } from '../models/Inventory.js';
import { resolveImageUrl, resolveImages } from '../config/s3.js';

const STORE_FALLBACK_PRODUCTS = [
  {
    _id: 'fb-001',
    sku: 'SKU-001',
    product_name: 'Embroidered Silk Lehenga',
    category: 'Ethnic Wear',
    gender: 'Women',
    mrp: 150000,
    sellingPrice: 120000,
    discount_percent: 20,
    rating: 4.9,
    rating_count: 142,
    tags: ['BESTSELLER', 'TOP RATED'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Exquisite hand-embroidered raw silk lehenga with intricate Zardozi work and matching net dupatta.',
    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: 'fb-002',
    sku: 'SKU-002',
    product_name: 'Royal Chanderi Silk Kurta Set',
    category: 'Ethnic Wear',
    gender: 'Women',
    mrp: 45000,
    sellingPrice: 36000,
    discount_percent: 20,
    rating: 4.8,
    rating_count: 89,
    tags: ['TRENDING'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Woven Chanderi silk kurta with hand-painted floral motifs and zari woven border.',
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: 'fb-003',
    sku: 'SKU-003',
    product_name: 'Designer Bandhgala Sherwani',
    category: 'Formals',
    gender: 'Men',
    mrp: 85000,
    sellingPrice: 68000,
    discount_percent: 20,
    rating: 4.9,
    rating_count: 67,
    tags: ['EXCLUSIVE'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    description: 'Classic embroidered velvet bandhgala jacket with tailored silk trousers.',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: 'fb-004',
    sku: 'SKU-004',
    product_name: 'Handcrafted Anarkali Suit',
    category: 'Ethnic Wear',
    gender: 'Women',
    mrp: 52000,
    sellingPrice: 41600,
    discount_percent: 20,
    rating: 4.7,
    rating_count: 112,
    tags: ['NEW ARRIVAL'],
    sizes: ['S', 'M', 'L'],
    description: 'Flowing floor-length Gota Patti Anarkali suit with organza dupatta.',
    image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: 'fb-005',
    sku: 'SKU-005',
    product_name: 'Slim-Fit Linen Formal Shirt',
    category: 'Casuals',
    gender: 'Men',
    mrp: 6999,
    sellingPrice: 4999,
    discount_percent: 28,
    rating: 4.6,
    rating_count: 205,
    tags: ['POPULAR'],
    sizes: ['38', '40', '42', '44'],
    description: '100% Pure Italian Linen breathable slim-fit formal shirt.',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: 'fb-006',
    sku: 'SKU-006',
    product_name: 'Sequin Embellished Evening Gown',
    category: 'Western',
    gender: 'Women',
    mrp: 125000,
    sellingPrice: 99000,
    discount_percent: 20,
    rating: 5.0,
    rating_count: 45,
    tags: ['COUTURE'],
    sizes: ['XS', 'S', 'M'],
    description: 'Sculptural metallic sequin mermaid gown with cascading side train.',
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

export const getStoreProducts = async (req, res) => {
  try {
    const { gender, category, sizes, search, sort, ids, page = 1, limit = 20 } = req.query;
    
    let products = [];
    let total = 0;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (ids) {
        const validIds = ids.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length > 0) query._id = { $in: validIds };
      }
      if (gender) query.gender = { $in: gender.split(',') };
      if (category) query.category = { $in: category.split(',') };
      if (sizes) query.sizes = { $in: sizes.split(',') };
      if (search) query.product_name = { $regex: search, $options: 'i' };

      let sortQuery = { created_at: -1 };
      if (sort === 'price_asc') sortQuery = { sellingPrice: 1 };
      if (sort === 'price_desc') sortQuery = { sellingPrice: -1 };
      if (sort === 'rating') sortQuery = { rating: -1 };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const dbProducts = await Product.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit));

      if (dbProducts.length > 0) {
        products = await Promise.all(dbProducts.map(async (p) => {
          const resolvedImages = await resolveImages(p.images || [], req);
          const resolvedImageUrl = await resolveImageUrl(p.image_url, req);
          const obj = p.toObject();
          obj.images = resolvedImages;
          obj.image_url = resolvedImageUrl;
          obj.sizes = Array.isArray(p.sizes) ? p.sizes : (typeof p.sizes === 'string' ? p.sizes.split(',').map(s => s.trim()).filter(Boolean) : ['S', 'M', 'L', 'XL']);
          obj.stock = parseInt(p.stock) || 0;
          return obj;
        }));
        total = await Product.countDocuments(query);
      }
    }

    // Fallback if DB empty or offline
    if (products.length === 0) {
      let filtered = [...STORE_FALLBACK_PRODUCTS];
      if (ids) {
        const idList = ids.split(',');
        filtered = filtered.filter(p => idList.includes(p._id));
      }
      if (gender) {
        const genderArr = gender.split(',');
        filtered = filtered.filter(p => genderArr.includes(p.gender));
      }
      if (category) {
        const catArr = category.split(',');
        filtered = filtered.filter(p => catArr.includes(p.category));
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(p => p.product_name.toLowerCase().includes(s));
      }

      if (sort === 'price_asc') filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
      if (sort === 'price_desc') filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
      if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);

      total = filtered.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      products = filtered.slice(skip, skip + parseInt(limit));
    }

    res.json({
      products,
      total,
      page: parseInt(page),
      totalPages: Math.max(1, Math.ceil(total / parseInt(limit)))
    });
  } catch (err) {
    console.error('Store Products Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStoreProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const dbProduct = await Product.findById(id);
      if (dbProduct) {
        const resolvedImages = await resolveImages(dbProduct.images || [], req);
        const resolvedImageUrl = await resolveImageUrl(dbProduct.image_url, req);
        product = dbProduct.toObject();
        product.images = resolvedImages;
        product.image_url = resolvedImageUrl;
        product.sizes = Array.isArray(dbProduct.sizes) 
          ? dbProduct.sizes 
          : (typeof dbProduct.sizes === 'string' ? dbProduct.sizes.split(',').map(s => s.trim()).filter(Boolean) : ['S', 'M', 'L', 'XL']);

        // Check for ERP variants matching this product
        let variants = await ProductVariant.find({
          $or: [
            { product_id: dbProduct._id },
            { sku: new RegExp(`^${dbProduct.sku}`, 'i') }
          ],
          is_active: true
        })
        .populate('colour_id')
        .populate('size_id')
        .populate('spec_id')
        .lean();

        if (variants.length > 0) {
          // Query live inventory lots for these variants to show real-time stock
          const variantIds = variants.map(v => v._id);
          const lots = await InventoryLot.find({
            variant_id: { $in: variantIds },
            status: 'AVAILABLE'
          }).lean();

          variants = variants.map(v => {
            const varLots = lots.filter(l => String(l.variant_id) === String(v._id));
            const availableStock = varLots.reduce((sum, l) => sum + (l.available_quantity || 0), 0);
            const stockQty = availableStock > 0 ? availableStock : (v.stock_quantity || 0);
            return {
              ...v,
              stock_quantity: stockQty,
              is_in_stock: stockQty > 0
            };
          });

          product.variants = variants;

          // Unique Colours
          const colourMap = new Map();
          variants.forEach(v => {
            if (v.colour_id && !colourMap.has(String(v.colour_id._id))) {
              colourMap.set(String(v.colour_id._id), {
                _id: v.colour_id._id,
                name: v.colour_id.name,
                code: v.colour_id.code,
                hex_code: v.colour_id.hex_code || '#1C1B19'
              });
            } else if (v.colour_name && !colourMap.has(v.colour_name)) {
              colourMap.set(v.colour_name, {
                _id: v.colour_name,
                name: v.colour_name,
                code: v.colour_name.slice(0, 3).toUpperCase(),
                hex_code: '#1C1B19'
              });
            }
          });
          product.colours = Array.from(colourMap.values());

          // Unique Sizes
          const sizeMap = new Map();
          variants.forEach(v => {
            if (v.size_id && !sizeMap.has(String(v.size_id._id))) {
              sizeMap.set(String(v.size_id._id), {
                _id: v.size_id._id,
                name: v.size_id.name,
                code: v.size_id.code,
                sort_order: v.size_id.sort_order || 0,
                chest: v.size_id.chest,
                length: v.size_id.length,
                shoulder: v.size_id.shoulder,
                sleeve: v.size_id.sleeve,
                is_in_stock: v.is_in_stock,
                stock: v.stock_quantity
              });
            } else if (v.size_name && !sizeMap.has(v.size_name)) {
              sizeMap.set(v.size_name, {
                _id: v.size_name,
                name: v.size_name,
                code: v.size_name,
                sort_order: 0,
                is_in_stock: v.is_in_stock,
                stock: v.stock_quantity
              });
            }
          });
          product.available_sizes = Array.from(sizeMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          if (product.available_sizes.length > 0) {
            product.sizes = product.available_sizes.map(s => s.name);
          }

          if (variants[0]?.spec_id) {
            product.specification = variants[0].spec_id;
          }
        }

        // Also fetch specification if attached directly or by category
        if (!product.specification) {
          const spec = await ProductSpecification.findOne({
            $or: [{ product_id: dbProduct._id }, { name: new RegExp(dbProduct.name, 'i') }]
          }).lean();
          if (spec) product.specification = spec;
        }

        // Also fetch size measurements from Master Size table for standard sizes
        if (!product.available_sizes || product.available_sizes.length === 0) {
          const masterSizes = await Size.find({ name: { $in: product.sizes } }).lean();
          if (masterSizes.length > 0) {
            product.available_sizes = product.sizes.map(sName => {
              const ms = masterSizes.find(m => m.name.toLowerCase() === sName.toLowerCase());
              return {
                name: sName,
                code: ms?.code || sName,
                chest: ms?.chest || 0,
                length: ms?.length || 0,
                shoulder: ms?.shoulder || 0,
                sleeve: ms?.sleeve || 0,
                is_in_stock: (parseInt(product.stock) || 0) > 0
              };
            });
          }
        }
      }
    }

    if (!product) {
      product = STORE_FALLBACK_PRODUCTS.find(p => p._id === id) || STORE_FALLBACK_PRODUCTS[0];
    }

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
