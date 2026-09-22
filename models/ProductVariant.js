import mongoose from 'mongoose';

// 1. Colour Master
const colourSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, uppercase: true, trim: true },
  hex_code: { type: String, default: '#000000', trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Colour = mongoose.model('Colour', colourSchema);

// 2. Size Master (with Garment Measurement Metadata)
const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // XS, S, M, L, XL, XXL, etc.
  sort_order: { type: Number, default: 0 },
  chest: { type: Number, default: 0 }, // in inches or cm
  length: { type: Number, default: 0 },
  shoulder: { type: Number, default: 0 },
  sleeve: { type: Number, default: 0 },
  tolerance: { type: String, default: '±0.5 in' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Size = mongoose.model('Size', sizeSchema);

// 3. Product Specification (Technical Pack & Garment Construction)
const productSpecificationSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  fabric_type: { type: String, default: 'Cotton' },
  fibre_type: { type: String, default: 'Natural' },
  composition: { type: String, default: '100% Pure Combed Cotton' },
  gsm: { type: Number, default: 180 },
  fabric_finish: { type: String, default: 'Bio-Washed & Pre-Shrunk' },
  fabric_construction: { type: String, default: 'Knitted Single Jersey' },
  neck_type: { type: String, default: 'Round Neck' },
  sleeve_type: { type: String, default: 'Half Sleeve' },
  hem_type: { type: String, default: 'Double Needle Stitched' },
  garment_wash: { type: String, default: 'Normal Soft Wash' },
  shrinkage: { type: String, default: '< 3%' },
  colour_fastness: { type: String, default: 'Grade 4+' },
  fit: { type: String, default: 'Regular Fit' },
  labels_trims: { type: String, default: 'Woven Satin Neck Label & Wash Care Tag' },
  packaging_details: { type: String, default: 'Individual Polybag with Barcode Sticker + Silica Gel' },
  other_specs: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const ProductSpecification = mongoose.model('ProductSpecification', productSpecificationSchema);

// 4. Product Variant (SKU Level Entity)
const productVariantSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  colour_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Colour' },
  colour_name: { type: String, default: '' }, // String alias for fast read without populate
  size_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Size' },
  size_name: { type: String, default: '' },     // String alias for fast read without populate
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  barcode: { type: String, default: '', trim: true },
  mrp: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  cost_price: { type: Number, default: 0 },
  purchase_price: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 10 },
  weight_grams: { type: Number, default: 250 },
  dimensions: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive', 'Discontinued'], default: 'Active' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
