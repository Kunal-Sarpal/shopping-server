import mongoose from 'mongoose';

// 1. Raw Material Master
const rawMaterialSchema = new mongoose.Schema({
  material_code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  material_type: {
    type: String,
    default: 'Fabric'
  },
  specification: { type: String, default: '' },
  unit: { type: String, default: 'meter' },
  cost_per_unit: { type: Number, default: 0, min: 0 },
  current_stock: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 50 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);

// 2. BOM Item Sub-schema
const bomItemSchema = new mongoose.Schema({
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  material_name: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0.0001 },
  unit: { type: String, default: 'meter' },
  scrap_percent: { type: Number, default: 0, min: 0, max: 100 }
});

// 3. Bill of Materials (BOM)
const bomSchema = new mongoose.Schema({
  bom_number: { type: String, required: true, unique: true, uppercase: true, index: true },
  name: { type: String, default: '' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false, index: true },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  version: { type: String, default: 'v1.0' },
  items: [bomItemSchema],
  effective_from: { type: Date, default: Date.now },
  effective_to: { type: Date },
  estimated_labor_cost: { type: Number, default: 0 },
  estimated_total_cost: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Active' },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const BOM = mongoose.model('BOM', bomSchema);

// 4. Production Order (In-House Manufacturing)
const productionOrderSchema = new mongoose.Schema({
  production_order_number: { type: String, required: true, unique: true, uppercase: true, index: true },
  order_number: { type: String }, // alias for production_order_number
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  bom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BOM', required: true },
  planned_quantity: { type: Number, default: 1, min: 1 },
  target_quantity: { type: Number, default: 1 }, // alias for planned_quantity
  produced_quantity: { type: Number, default: 0 },
  completed_quantity: { type: Number, default: 0 }, // alias for produced_quantity
  accepted_quantity: { type: Number, default: 0 },
  rejected_quantity: { type: Number, default: 0 },
  scrap_quantity: { type: Number, default: 0 }, // alias for rejected_quantity
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  planned_start_date: { type: Date },
  planned_end_date: { type: Date },
  actual_start_date: { type: Date },
  actual_end_date: { type: Date },
  status: {
    type: String,
    enum: ['DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'Draft', 'Planned', 'Released', 'In Progress', 'Completed', 'Cancelled'],
    default: 'DRAFT',
    index: true
  },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const ProductionOrder = mongoose.model('ProductionOrder', productionOrderSchema);

// 5. Material Issue to Floor
const materialIssueItemSchema = new mongoose.Schema({
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  material_name: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0.0001 },
  unit: { type: String, required: true },
  lot_number: { type: String, default: '' }
});

const materialIssueSchema = new mongoose.Schema({
  issue_number: { type: String, required: true, unique: true, uppercase: true, index: true },
  production_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder', required: true },
  production_order_number: { type: String, required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items: [materialIssueItemSchema],
  issued_by: { type: String, default: 'Warehouse Manager' },
  issue_date: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const MaterialIssue = mongoose.model('MaterialIssue', materialIssueSchema);

// 6. Production Output & Finished Goods Receipt
const productionOutputSchema = new mongoose.Schema({
  output_number: { type: String, required: true, unique: true, uppercase: true, index: true },
  production_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder', required: true },
  production_order_number: { type: String, required: true },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  sku: { type: String, uppercase: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity_produced: { type: Number, required: true, min: 1 },
  quantity_accepted: { type: Number, required: true, min: 0 },
  quantity_rejected: { type: Number, default: 0, min: 0 },
  rejection_reason: { type: String, default: '' },
  qc_status: {
    type: String,
    enum: ['QC_PENDING', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'],
    default: 'ACCEPTED'
  },
  lot_number: { type: String, required: true },
  unit_cost: { type: Number, default: 0 },
  completion_date: { type: Date, default: Date.now },
  inspected_by: { type: String, default: 'Quality Control Lead' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const ProductionOutput = mongoose.model('ProductionOutput', productionOutputSchema);
