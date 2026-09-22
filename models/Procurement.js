import mongoose from 'mongoose';

// 1. Supplier Product Relationship & Pricing Contract
const supplierProductSchema = new mongoose.Schema({
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
  item_type: { type: String, enum: ['FINISHED_GOODS', 'RAW_MATERIAL'], default: 'FINISHED_GOODS' },
  supplier_sku: { type: String, trim: true },
  minimum_order_quantity: { type: Number, default: 1, min: 1 },
  unit_price: { type: Number, required: true, min: 0 },
  lead_time_days: { type: Number, default: 7 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const SupplierProduct = mongoose.model('SupplierProduct', supplierProductSchema);

// 2. Purchase Order Item Sub-schema
const purchaseOrderItemSchema = new mongoose.Schema({
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
  item_name: { type: String, required: true },
  sku: { type: String, trim: true },
  ordered_quantity: { type: Number, required: true, min: 1 },
  received_quantity: { type: Number, default: 0, min: 0 },
  unit_price: { type: Number, required: true, min: 0 },
  tax_percent: { type: Number, default: 5 },
  total_price: { type: Number, required: true, min: 0 }
});

// 3. Purchase Order (Outsourced Procurement)
const purchaseOrderSchema = new mongoose.Schema({
  po_number: { type: String, required: true, unique: true, uppercase: true, index: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplier_name: { type: String, default: '' },
  po_date: { type: Date, default: Date.now },
  expected_date: { type: Date },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  items: [purchaseOrderItemSchema],
  subtotal: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
    default: 'DRAFT',
    index: true
  },
  created_by: { type: String, default: 'System' },
  approved_by: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

// 4. Goods Receipt Note (GRN) Item with QC
const grnItemSchema = new mongoose.Schema({
  po_item_id: { type: mongoose.Schema.Types.ObjectId },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
  item_name: { type: String, required: true },
  sku: { type: String, trim: true },
  quantity_received: { type: Number, required: true, min: 0 },
  quantity_accepted: { type: Number, required: true, min: 0 },
  quantity_rejected: { type: Number, default: 0, min: 0 },
  rejection_reason: { type: String, default: '' },
  unit_cost: { type: Number, required: true, min: 0 },
  lot_number: { type: String, default: '' }
});

// 5. Goods Receipt Note (GRN) Document
const goodsReceiptSchema = new mongoose.Schema({
  grn_number: { type: String, required: true, unique: true, uppercase: true, index: true },
  purchase_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  po_number: { type: String, required: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplier_name: { type: String, default: '' },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  invoice_number: { type: String, default: '' },
  received_date: { type: Date, default: Date.now },
  items: [grnItemSchema],
  total_accepted: { type: Number, default: 0 },
  total_rejected: { type: Number, default: 0 },
  qc_status: {
    type: String,
    enum: ['QC_PENDING', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'],
    default: 'QC_PENDING'
  },
  received_by: { type: String, default: 'Store Manager' },
  inspected_by: { type: String, default: '' },
  status: { type: String, enum: ['DRAFT', 'RECEIVED', 'CANCELLED'], default: 'RECEIVED' },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema);
