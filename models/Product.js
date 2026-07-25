import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  category_name: { type: String, required: true },
  parent_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  description: String,
  is_active: { type: Boolean, default: true }
});
export const Category = mongoose.model('Category', categorySchema);

const subCategorySchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  sub_category_name: { type: String, required: true },
  description: String,
  is_active: { type: Boolean, default: true }
});
export const SubCategory = mongoose.model('SubCategory', subCategorySchema);

const designerSchema = new mongoose.Schema({
  designer_name: { type: String, required: true },
  email: String,
  phone: String,
  bio: String,
  is_active: { type: Boolean, default: true }
});
export const Designer = mongoose.model('Designer', designerSchema);

const supplierSchema = new mongoose.Schema({
  supplier_name: { type: String, required: true },
  contact_person: String,
  email: String,
  phone: String,
  address: String,
  gstin: String,
  pan: String,
  is_active: { type: Boolean, default: true }
});
export const Supplier = mongoose.model('Supplier', supplierSchema);

const brandSchema = new mongoose.Schema({
  brand_name: { type: String, required: true },
  description: String,
  logo_url: String,
  is_active: { type: Boolean, default: true }
});
export const Brand = mongoose.model('Brand', brandSchema);

const collectionSchema = new mongoose.Schema({
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  collection_name: { type: String, required: true },
  description: String,
  season: String,
  year: String,
  launch_date: Date,
  end_date: Date,
  color: String,
  designs_count: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  is_active: { type: Boolean, default: true }
});
export const Collection = mongoose.model('Collection', collectionSchema);

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  category: String, // String representation for easier front-end queries
  sub_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
  description: String,
  model: String,
  gender: String,
  age_group: String,
  product_type: String,
  designer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer' },
  designer: String, // String rep
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  vendor: String, // String rep
  mrp: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  shelf: String,
  hsn_code: String,
  status: { type: String, default: 'In Stock' },
  
  // New E-commerce specific fields
  image_url: String,
  images: [String],
  rating: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
  tags: [String],
  sizes: [String],
  discount_percent: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Product = mongoose.model('Product', productSchema);
