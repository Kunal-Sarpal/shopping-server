import mongoose from 'mongoose';

// 1. Warehouse Master
const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  type: {
    type: String,
    enum: ['Main Warehouse', 'Retail Store', 'Raw Material Warehouse', 'Finished Goods Warehouse'],
    default: 'Main Warehouse'
  },
  contact_person: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Warehouse = mongoose.model('Warehouse', warehouseSchema);

// 2. Traceable Inventory Lot
const inventoryLotSchema = new mongoose.Schema({
  lot_number: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
  item_type: { type: String, enum: ['FINISHED_GOODS', 'RAW_MATERIAL'], default: 'FINISHED_GOODS' },
  sku: { type: String, uppercase: true, trim: true, index: true },
  source_type: { 
    type: String, 
    enum: ['PURCHASE', 'PRODUCTION', 'ADJUSTMENT', 'RETURN'], 
    required: true 
  },
  source_id: { type: String, default: '' }, // PO number, Production Order #, Return #, etc.
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  batch_number: { type: String, default: '' },
  mfg_date: { type: Date },
  expiry_date: { type: Date },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  quantity: { type: Number, required: true, min: 0 },
  available_quantity: { type: Number, required: true, min: 0 },
  reserved_quantity: { type: Number, default: 0, min: 0 },
  unit_cost: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['AVAILABLE', 'QUARANTINED', 'DAMAGED', 'EXHAUSTED'],
    default: 'AVAILABLE'
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const InventoryLot = mongoose.model('InventoryLot', inventoryLotSchema);

// 3. Immutable Auditable Inventory Transaction Ledger
const inventoryTransactionSchema = new mongoose.Schema({
  transaction_number: { type: String, required: true, unique: true, uppercase: true, index: true },
  lot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryLot' },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  transaction_type: {
    type: String,
    enum: [
      'PURCHASE_RECEIPT',
      'PRODUCTION_OUTPUT',
      'MATERIAL_ISSUE',
      'SALE',
      'RETURN',
      'DAMAGE',
      'ADJUSTMENT',
      'TRANSFER'
    ],
    required: true
  },
  quantity: { type: Number, required: true }, // Positive for addition, negative for deduction
  before_quantity: { type: Number, default: 0 },
  after_quantity: { type: Number, default: 0 },
  unit_cost: { type: Number, default: 0 },
  reference_type: {
    type: String,
    enum: ['GRN', 'PRODUCTION_OUTPUT', 'MATERIAL_ISSUE', 'ORDER', 'RETURN', 'ADJUSTMENT', 'TRANSFER'],
    required: true
  },
  reference_id: { type: String, required: true }, // e.g. ORD-1001, GRN-2026-001
  created_by: { type: String, default: 'System' },
  transaction_date: { type: Date, default: Date.now, index: true },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
