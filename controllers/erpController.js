import { Colour, Size, ProductSpecification, ProductVariant } from '../models/ProductVariant.js';
import { Warehouse, InventoryLot, InventoryTransaction } from '../models/Inventory.js';
import { SupplierProduct, PurchaseOrder, GoodsReceipt } from '../models/Procurement.js';
import { RawMaterial, BOM, ProductionOrder, MaterialIssue, ProductionOutput } from '../models/Manufacturing.js';
import { Product, Supplier, Category } from '../models/Product.js';
import { calculateBOMRequirements } from '../services/bom.service.js';
import { createPurchaseOrder as svcCreatePO, receiveGRN as svcReceiveGRN } from '../services/purchase.service.js';
import { createProductionOrder as svcCreateProdOrder, issueMaterialsToProduction as svcIssueMaterials, recordProductionCompletion as svcRecordProdCompletion } from '../services/production.service.js';
import { adjustStock as svcAdjustStock } from '../services/inventory.service.js';

// ═══════════════════════════════════════════════════════════
// 1. COLOURS & SIZES
// ═══════════════════════════════════════════════════════════
export const getColours = async (req, res) => {
  try {
    const colours = await Colour.find().sort({ name: 1 });
    res.json(colours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createColour = async (req, res) => {
  try {
    const { name, code, hex_code } = req.body;
    if (!name) return res.status(400).json({ error: 'Colour name is required' });
    const colour = await Colour.create({
      name,
      code: code || name.slice(0, 3).toUpperCase(),
      hex_code: hex_code || '#000000'
    });
    res.status(201).json(colour);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSizes = async (req, res) => {
  try {
    const sizes = await Size.find().sort({ sort_order: 1, name: 1 });
    res.json(sizes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSize = async (req, res) => {
  try {
    const { name, chest, length, shoulder, sleeve, tolerance, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Size name is required' });
    const size = await Size.create({
      name,
      chest: chest || 0,
      length: length || 0,
      shoulder: shoulder || 0,
      sleeve: sleeve || 0,
      tolerance: tolerance || '±0.5 in',
      sort_order: sort_order || 0
    });
    res.status(201).json(size);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 2. PRODUCT SPECIFICATIONS
// ═══════════════════════════════════════════════════════════
export const getProductSpecification = async (req, res) => {
  try {
    const { productId } = req.params;
    let spec = await ProductSpecification.findOne({ product_id: productId });
    if (!spec) {
      // Default initial specification
      spec = {
        product_id: productId,
        fabric_type: 'Cotton',
        fibre_type: 'Natural',
        composition: '100% Combed Cotton',
        gsm: 180,
        fabric_finish: 'Bio-Washed',
        fabric_construction: 'Knitted Single Jersey',
        neck_type: 'Round Neck',
        sleeve_type: 'Half Sleeve',
        fit: 'Regular Fit',
        packaging_details: 'Individual Polybag with Barcode'
      };
    }
    res.json(spec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const saveProductSpecification = async (req, res) => {
  try {
    const { product_id, ...specs } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });

    const updated = await ProductSpecification.findOneAndUpdate(
      { product_id },
      { $set: specs },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Link spec to product record
    await Product.findByIdAndUpdate(product_id, { $set: { spec_id: updated._id } });

    res.json({ success: true, spec: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 3. PRODUCT VARIANTS / SKUs
// ═══════════════════════════════════════════════════════════
export const getProductVariants = async (req, res) => {
  try {
    const { productId } = req.query;
    const query = productId ? { product_id: productId } : {};
    const variants = await ProductVariant.find(query)
      .populate('colour_id')
      .populate('size_id')
      .sort({ sku: 1 });
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate Variants Matrix (e.g. 2 Colours × 3 Sizes = 6 SKUs)
export const generateVariantsMatrix = async (req, res) => {
  try {
    const { productId, colourIds = [], sizeIds = [], basePrice } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const colours = await Colour.find({ _id: { $in: colourIds } });
    const sizes = await Size.find({ _id: { $in: sizeIds } });

    const createdVariants = [];

    for (const col of colours) {
      for (const sz of sizes) {
        const skuPrefix = product.sku ? product.sku.split('-')[0] : 'SKU';
        const generatedSku = `${skuPrefix}-${col.code || col.name.slice(0, 3).toUpperCase()}-${sz.name.toUpperCase()}`;

        // Upsert variant
        const variant = await ProductVariant.findOneAndUpdate(
          { sku: generatedSku },
          {
            $set: {
              product_id: product._id,
              colour_id: col._id,
              colour_name: col.name,
              size_id: sz._id,
              size_name: sz.name,
              mrp: product.mrp,
              selling_price: basePrice || product.sellingPrice,
              cost_price: product.costPrice,
              purchase_price: product.purchasePrice,
              status: 'Active'
            }
          },
          { new: true, upsert: true }
        );
        createdVariants.push(variant);
      }
    }

    res.status(201).json({
      success: true,
      count: createdVariants.length,
      variants: createdVariants
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 4. WAREHOUSES & INVENTORY LEDGER
// ═══════════════════════════════════════════════════════════
export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createWarehouse = async (req, res) => {
  try {
    const { name, code, type, address, city, state, pincode, contact_person, phone } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

    const warehouse = await Warehouse.create({
      name,
      code: code.toUpperCase(),
      type: type || 'Main Warehouse',
      address,
      city,
      state,
      pincode,
      contact_person,
      phone
    });
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Overview of real stock by SKU across Warehouses
export const getInventoryStock = async (req, res) => {
  try {
    const { warehouseId, search } = req.query;
    const match = { status: 'AVAILABLE' };
    if (warehouseId) match.warehouse_id = warehouseId;

    const lots = await InventoryLot.find(match)
      .populate('variant_id')
      .populate('warehouse_id')
      .populate('material_id')
      .sort({ updated_at: -1 });

    res.json(lots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInventoryTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = {};
    if (type && type !== 'All') query.transaction_type = type;

    const total = await InventoryTransaction.countDocuments(query);
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const txns = await InventoryTransaction.find(query)
      .populate('warehouse_id')
      .populate('variant_id')
      .populate('material_id')
      .sort({ transaction_date: -1 })
      .skip(offset)
      .limit(parseInt(limit));

    res.json({
      transactions: txns,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const adjustInventory = async (req, res) => {
  try {
    const { lotId, quantityAdjustment, reason } = req.body;
    if (!lotId || quantityAdjustment === undefined) {
      return res.status(400).json({ error: 'lotId and quantityAdjustment are required' });
    }

    const result = await svcAdjustStock({
      lotId,
      quantityAdjustment: parseInt(quantityAdjustment),
      reason: reason || 'Manual Stock Adjustment',
      userId: req.user?.name || 'Store Manager'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 5. PROCUREMENT (SUPPLIERS, PO & GRN)
// ═══════════════════════════════════════════════════════════
export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find()
      .populate('supplier_id')
      .populate('warehouse_id')
      .sort({ po_date: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const { supplierId, warehouseId, expectedDate, items, notes } = req.body;
    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Supplier and items are required' });
    }

    const po = await svcCreatePO({
      supplierId,
      warehouseId,
      expectedDate,
      items,
      notes,
      createdBy: req.user?.name || 'Procurement Team'
    });

    res.status(201).json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGoodsReceipts = async (req, res) => {
  try {
    const grns = await GoodsReceipt.find()
      .populate('supplier_id')
      .populate('warehouse_id')
      .sort({ received_date: -1 });
    res.json(grns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createGoodsReceipt = async (req, res) => {
  try {
    const { purchaseOrderId, warehouseId, invoiceNumber, items } = req.body;
    if (!purchaseOrderId || !warehouseId || !items || items.length === 0) {
      return res.status(400).json({ error: 'PO, warehouse, and items are required' });
    }

    const grn = await svcReceiveGRN({
      purchaseOrderId,
      warehouseId,
      invoiceNumber,
      items,
      receivedBy: req.user?.name || 'Store Manager',
      inspectedBy: req.user?.name || 'QC Lead'
    });

    res.status(201).json({ success: true, grn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 6. MANUFACTURING (RAW MATERIALS, BOM & PRODUCTION)
// ═══════════════════════════════════════════════════════════
export const getRawMaterials = async (req, res) => {
  try {
    const materials = await RawMaterial.find().sort({ name: 1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createRawMaterial = async (req, res) => {
  try {
    const { name, material_code, material_type, specification, unit, cost_per_unit, reorder_level } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const code = material_code || `RM-${name.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const rm = await RawMaterial.create({
      material_code: code,
      name,
      material_type: material_type || 'Fabric',
      specification: specification || '',
      unit: unit || 'meter',
      cost_per_unit: parseFloat(cost_per_unit) || 0,
      reorder_level: parseInt(reorder_level) || 50
    });
    res.status(201).json(rm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBOMs = async (req, res) => {
  try {
    const boms = await BOM.find()
      .populate('product_id')
      .populate('variant_id')
      .populate('items.material_id')
      .sort({ bom_number: 1 });
    res.json(boms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBOM = async (req, res) => {
  try {
    const { productId, variantId, items, version, estimatedLaborCost, notes } = req.body;
    if (!productId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Product and BOM items are required' });
    }

    const bomNumber = `BOM-${Date.now().toString().slice(-6)}`;
    const bom = await BOM.create({
      bom_number: bomNumber,
      product_id: productId,
      variant_id: variantId || null,
      version: version || 'v1.0',
      items,
      estimated_labor_cost: parseFloat(estimatedLaborCost) || 0,
      notes: notes || ''
    });

    res.status(201).json(bom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBOMCalculations = async (req, res) => {
  try {
    const { bomId, plannedQuantity } = req.query;
    if (!bomId || !plannedQuantity) {
      return res.status(400).json({ error: 'bomId and plannedQuantity are required' });
    }

    const calculation = await calculateBOMRequirements(bomId, parseInt(plannedQuantity) || 1);
    res.json(calculation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductionOrders = async (req, res) => {
  try {
    const orders = await ProductionOrder.find()
      .populate('product_id')
      .populate('variant_id')
      .populate('bom_id')
      .populate('warehouse_id')
      .sort({ planned_start_date: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createProductionOrder = async (req, res) => {
  try {
    const { productId, variantId, bomId, plannedQuantity, warehouseId, plannedStartDate, plannedEndDate, notes } = req.body;
    if (!productId || !bomId || !plannedQuantity) {
      return res.status(400).json({ error: 'Product, BOM, and plannedQuantity are required' });
    }

    const order = await svcCreateProdOrder({
      productId,
      variantId,
      bomId,
      plannedQuantity: parseInt(plannedQuantity),
      warehouseId,
      plannedStartDate,
      plannedEndDate,
      notes
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createMaterialIssue = async (req, res) => {
  try {
    const { productionOrderId, warehouseId, items } = req.body;
    if (!productionOrderId || !warehouseId || !items || items.length === 0) {
      return res.status(400).json({ error: 'productionOrderId, warehouseId, and items are required' });
    }

    const issue = await svcIssueMaterials({
      productionOrderId,
      warehouseId,
      items,
      issuedBy: req.user?.name || 'Warehouse Lead'
    });

    res.status(201).json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const recordProductionOutput = async (req, res) => {
  try {
    const { productionOrderId, warehouseId, quantityProduced, quantityAccepted, quantityRejected, rejectionReason, unitCost } = req.body;
    if (!productionOrderId || !warehouseId || !quantityProduced) {
      return res.status(400).json({ error: 'Order, warehouse, and quantityProduced are required' });
    }

    const output = await svcRecordProdCompletion({
      productionOrderId,
      warehouseId,
      quantityProduced: parseInt(quantityProduced),
      quantityAccepted: parseInt(quantityAccepted) || parseInt(quantityProduced),
      quantityRejected: parseInt(quantityRejected) || 0,
      rejectionReason: rejectionReason || '',
      unitCost: parseFloat(unitCost) || 0,
      inspectedBy: req.user?.name || 'QC Lead'
    });

    res.status(201).json({ success: true, output });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 7. ERP REPORTS & METRICS
// ═══════════════════════════════════════════════════════════
export const getERPReports = async (req, res) => {
  try {
    // 1. Stock Valuation & Distribution
    const lots = await InventoryLot.find({ status: 'AVAILABLE' });
    const totalInventoryValue = lots.reduce((sum, lot) => sum + ((lot.available_quantity || 0) * (lot.unit_cost || 0)), 0);
    const totalFinishedGoodsUnits = lots.filter(l => l.item_type === 'FINISHED_GOODS').reduce((sum, l) => sum + (l.available_quantity || 0), 0);
    const totalRawMaterialUnits = lots.filter(l => l.item_type === 'RAW_MATERIAL').reduce((sum, l) => sum + (l.available_quantity || 0), 0);

    // 2. Production Performance & Yield
    const prodOutputs = await ProductionOutput.find();
    const totalProduced = prodOutputs.reduce((sum, p) => sum + (p.quantity_produced || 0), 0);
    const totalAccepted = prodOutputs.reduce((sum, p) => sum + (p.quantity_accepted || 0), 0);
    const overallYieldPercent = totalProduced > 0 ? parseFloat(((totalAccepted / totalProduced) * 100).toFixed(1)) : 100;

    // 3. Purchase & Supplier Metrics
    const pos = await PurchaseOrder.find();
    const totalPOValue = pos.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const pendingPOsCount = pos.filter(p => p.status === 'SUBMITTED' || p.status === 'PARTIALLY_RECEIVED').length;

    res.json({
      stockValuation: {
        totalInventoryValue,
        totalFinishedGoodsUnits,
        totalRawMaterialUnits,
        activeLotsCount: lots.length
      },
      productionPerformance: {
        totalProduced,
        totalAccepted,
        overallYieldPercent,
        completedOutputsCount: prodOutputs.length
      },
      procurementMetrics: {
        totalPOValue,
        pendingPOsCount,
        totalPOsCount: pos.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
