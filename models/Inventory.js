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
  item_type: { type: String, default: 'FINISHED_GOODS' },
  sku: { type: String, uppercase: true, trim: true, index: true },
  source_type: { 
    type: String, 
    default: 'ADJUSTMENT'
  },
  source_id: { type: String, default: '' }, // PO number, Production Order #, Return #, etc.
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  batch_number: { type: String, default: '' },
  mfg_date: { type: Date, default: Date.now },
  manufacturing_date: { type: Date, default: Date.now },
  expiry_date: { type: Date },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  quantity: { type: Number, default: 0, min: 0 },
  quantity_initial: { type: Number, default: 0, min: 0 },
  available_quantity: { type: Number, default: 0, min: 0 },
  quantity_available: { type: Number, default: 0, min: 0 },
  reserved_quantity: { type: Number, default: 0, min: 0 },
  quantity_reserved: { type: Number, default: 0, min: 0 },
  quantity_damaged: { type: Number, default: 0, min: 0 },
  unit_cost: { type: Number, default: 0 },
  status: {
    type: String,
    default: 'Available'
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Pre-save hook to synchronize alias fields
inventoryLotSchema.pre('save', function () {
  if (this.available_quantity === undefined || this.available_quantity === 0) {
    this.available_quantity = this.quantity_available || this.quantity || 0;
  }
  if (this.quantity_available === undefined || this.quantity_available === 0) {
    this.quantity_available = this.available_quantity || 0;
  }
  if (this.quantity === undefined || this.quantity === 0) {
    this.quantity = this.quantity_initial || this.available_quantity || 0;
  }
  if (this.quantity_initial === undefined || this.quantity_initial === 0) {
    this.quantity_initial = this.quantity || 0;
  }
});

export const InventoryLot = mongoose.model('InventoryLot', inventoryLotSchema);

// 3. Immutable Auditable Inventory Transaction Ledger
const inventoryTransactionSchema = new mongoose.Schema({
  transaction_number: {
    type: String,
    unique: true,
    uppercase: true,
    index: true,
    default: () => `TXN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
  },
  lot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryLot' },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  transaction_type: {
    type: String,
    required: true
  },
  quantity: { type: Number, required: true }, // Positive for addition, negative for deduction
  before_quantity: { type: Number, default: 0 },
  after_quantity: { type: Number, default: 0 },
  unit_cost: { type: Number, default: 0 },
  reference_type: {
    type: String,
    default: 'ADJUSTMENT'
  },
  reference_id: { type: String, default: 'DIRECT' }, // e.g. ORD-1001, GRN-2026-001
  created_by: { type: String, default: 'System' },
  transaction_date: { type: Date, default: Date.now, index: true },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
