import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Product } from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const seedStore = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Fetch from fakestoreapi
    const res = await fetch('https://fakestoreapi.com/products');
    const fakeProducts = await res.json();

    const formattedProducts = fakeProducts.map(p => {
      // Map category
      let gender = 'Men';
      let mappedCategory = 'T-Shirt';
      if (p.category === "women's clothing") {
        gender = 'Women';
        mappedCategory = 'Top';
      } else if (p.category === 'jewelery' || p.category === 'electronics') {
        gender = 'Unisex';
        mappedCategory = 'Accessories';
      }

      const mrp = p.price * 120; // roughly converting to INR and adding markup
      const sellingPrice = p.price * 80;

      return {
        sku: `FS-${p.id}-${Date.now()}`,
        product_name: p.title,
        description: p.description,
        category: mappedCategory,
        gender: gender,
        mrp: Math.round(mrp),
        sellingPrice: Math.round(sellingPrice),
        discount_percent: Math.round(((mrp - sellingPrice) / mrp) * 100),
        image_url: p.image,
        images: [p.image],
        rating: p.rating.rate,
        rating_count: p.rating.count,
        tags: ['BESTSELLER', p.rating.rate > 4 ? 'TOP RATED' : 'TRENDING'],
        sizes: ['S', 'M', 'L', 'XL'],
        status: 'In Stock'
      };
    });

    await Product.insertMany(formattedProducts);
    console.log(`Successfully seeded ${formattedProducts.length} storefront products!`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding store:', err);
    process.exit(1);
  }
};

seedStore();
