import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Product } from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env') });

const FASHION_DATA = [
  {
    sku: 'SKU-001',
    product_name: 'Embroidered Silk Lehenga',
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
    discount_percent: 20,
    rating: 4.9,
    rating_count: 142,
    tags: ['BESTSELLER', 'TOP RATED']
  },
  {
    sku: 'SKU-002',
    product_name: 'Royal Chanderi Silk Kurta Set',
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
    discount_percent: 20,
    rating: 4.8,
    rating_count: 89,
    tags: ['TRENDING']
  },
  {
    sku: 'SKU-003',
    product_name: 'Designer Bandhgala Sherwani',
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
    discount_percent: 20,
    rating: 4.9,
    rating_count: 67,
    tags: ['EXCLUSIVE']
  },
  {
    sku: 'SKU-004',
    product_name: 'Handcrafted Anarkali Suit',
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
    discount_percent: 20,
    rating: 4.7,
    rating_count: 112,
    tags: ['NEW ARRIVAL']
  },
  {
    sku: 'SKU-005',
    product_name: 'Slim-Fit Linen Formal Shirt',
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
    discount_percent: 28,
    rating: 4.6,
    rating_count: 205,
    tags: ['POPULAR']
  },
  {
    sku: 'SKU-006',
    product_name: 'Sequin Embellished Evening Gown',
    category: 'Western',
    model: 'M-2026-06',
    designer: 'Gaurav Gupta',
    vendor: 'Couture House',
    mrp: 125000,
    costPrice: 50000,
    purchasePrice: 60000,
    sellingPrice: 99000,
    stock: 12,
    sold: 14,
    status: 'In Stock',
    shelf: 'A1-209',
    gender: 'Women',
    description: 'Sculptural metallic sequin mermaid gown with cascading side train.',
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['XS', 'S', 'M'],
    discount_percent: 20,
    rating: 5.0,
    rating_count: 45,
    tags: ['COUTURE']
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    for (const item of FASHION_DATA) {
      await Product.updateOne(
        { sku: item.sku },
        { $set: item },
        { upsert: true }
      );
    }
    console.log('Successfully seeded fashion items into database!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
