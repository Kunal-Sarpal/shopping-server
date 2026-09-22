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
    if (productId) {
      let spec = await ProductSpecification.findOne({
        $or: [{ product_id: productId }, { _id: productId }]
      });
      return res.json(spec || {});
    }
    const specs = await ProductSpecification.find().sort({ name: 1 });
    res.json(specs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductSpecifications = async (req, res) => {
  try {
    const specs = await ProductSpecification.find().sort({ name: 1 });
    res.json(specs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const saveProductSpecification = async (req, res) => {
  try {
    const { product_id, name, ...specs } = req.body;
    let spec = null;
    if (product_id) {
      spec = await ProductSpecification.findOneAndUpdate(
        { product_id },
        { $set: { product_id, name, ...specs } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      await Product.findByIdAndUpdate(product_id, { $set: { spec_id: spec._id } });
    } else if (name) {
      spec = await ProductSpecification.findOneAndUpdate(
        { name },
        { $set: { name, ...specs } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      spec = await ProductSpecification.create(req.body);
    }
    res.status(201).json(spec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 3. PRODUCT VARIANTS / SKUs
// ═══════════════════════════════════════════════════════════
export const getProductVariants = async (req, res) => {
  try {
    const { productId, specId } = req.query;
    const query = {};
    if (productId) query.product_id = productId;
    if (specId) query.spec_id = specId;

    const variants = await ProductVariant.find(query)
      .populate('colour_id')
      .populate('size_id')
      .populate('spec_id')
      .sort({ sku: 1 });
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate Variants Matrix (e.g. 2 Colours × 3 Sizes = 6 SKUs)
export const generateVariantsMatrix = async (req, res) => {
  try {
    const { productId, specId, colourIds = [], sizeIds = [], basePrice, costPrice, skuPrefix, initialStock = 0 } = req.body;

    let product = null;
    let spec = null;

    if (productId) product = await Product.findById(productId);
    if (specId) spec = await ProductSpecification.findById(specId);

    if (!product && !spec) {
      return res.status(400).json({ error: 'productId or specId is required' });
    }

    const colours = await Colour.find({ _id: { $in: colourIds } });
    const sizes = await Size.find({ _id: { $in: sizeIds } });

    const createdVariants = [];
    const effectivePrefix = (skuPrefix && skuPrefix.trim()) || (product?.sku ? product.sku.split('-')[0] : (spec?.name ? spec.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() : 'HGLX'));

    for (const col of colours) {
      for (const sz of sizes) {
        const colCode = col.code || col.name.slice(0, 3).toUpperCase();
        const sizeCode = sz.code || sz.name.toUpperCase();
        const generatedSku = `${effectivePrefix}-${colCode}-${sizeCode}`;

        const variant = await ProductVariant.findOneAndUpdate(
          { sku: generatedSku },
          {
            $set: {
              ...(product ? { product_id: product._id } : {}),
              ...(spec ? { spec_id: spec._id } : {}),
              colour_id: col._id,
              colour_name: col.name,
              size_id: sz._id,
              size_name: sz.name,
              mrp: product ? product.mrp : (basePrice || spec?.base_price || 0),
              selling_price: basePrice || (product ? product.sellingPrice : (spec?.base_price || 0)),
              cost_price: costPrice || (product ? product.costPrice : (spec?.cost_price || 0)),
              purchase_price: costPrice || (product ? product.purchasePrice : (spec?.cost_price || 0)),
              stock_quantity: initialStock,
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
      createdCount: createdVariants.length,
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
    let warehouses = await Warehouse.find().sort({ name: 1 });
    if (warehouses.length === 0) {
      const defaultWh = await Warehouse.create({
        name: 'Main Showroom & Fulfillment Center',
        code: 'MAIN-WH',
        type: 'Main Warehouse',
        address: 'GIDC Apparel Park, Ring Road',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395002',
        is_active: true
      });
      warehouses = [defaultWh];
    }
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
    const { warehouseId, search, variantId } = req.query;
    const match = {};
    if (warehouseId) match.warehouse_id = warehouseId;
    if (variantId) match.variant_id = variantId;

    const lots = await InventoryLot.find(match)
      .populate('variant_id')
      .populate('warehouse_id')
      .populate('material_id')
      .sort({ updated_at: -1 });

    res.json({ lots, count: lots.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInventoryTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, warehouseId } = req.query;
    const query = {};
    if (type && type !== 'ALL' && type !== 'All') query.transaction_type = type;
    if (warehouseId) query.warehouse_id = warehouseId;

    const total = await InventoryTransaction.countDocuments(query);
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const txns = await InventoryTransaction.find(query)
      .populate('warehouse_id')
      .populate({
        path: 'variant_id',
        populate: { path: 'spec_id' }
      })
      .populate('material_id')
      .sort({ transaction_date: -1, createdAt: -1 })
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
    const { lotId, variantId, warehouseId, quantityAdjustment, quantityChange, reason, adjustmentType } = req.body;
    const rawQty = quantityAdjustment !== undefined ? quantityAdjustment : quantityChange;
    const qtyChange = parseInt(rawQty);
    if (isNaN(qtyChange)) {
      return res.status(400).json({ error: 'quantityAdjustment or quantityChange is required' });
    }

    let targetLotId = lotId;
    if (!targetLotId && variantId) {
      let lot = await InventoryLot.findOne({ variant_id: variantId });
      if (!lot) {
        let whId = warehouseId;
        if (!whId) {
          const wh = await Warehouse.findOne();
          whId = wh?._id;
        }
        lot = await InventoryLot.create({
          lot_number: `LOT-ADJ-${Date.now().toString().slice(-6)}`,
          warehouse_id: whId,
          variant_id: variantId,
          quantity_initial: Math.max(0, qtyChange),
          quantity_available: Math.max(0, qtyChange),
          quantity_reserved: 0,
          quantity_damaged: 0,
          status: 'Available'
        });
      }
      targetLotId = lot._id;
    }

    if (!targetLotId) {
      return res.status(400).json({ error: 'lotId or variantId is required' });
    }

    const result = await svcAdjustStock({
      lotId: targetLotId,
      quantityAdjustment: qtyChange,
      reason: reason || adjustmentType || 'Manual Stock Adjustment',
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
      .sort({ po_date: -1, createdAt: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const { supplierId, supplier_id, supplierName, supplier_name, warehouseId, warehouse_id, expectedDate, expected_delivery_date, items, notes } = req.body;
    const sName = supplierName || supplier_name || 'Artisan Supplier';

    let whId = warehouseId || warehouse_id;
    if (!whId) {
      const wh = await Warehouse.findOne();
      whId = wh?._id;
    }

    const po = await svcCreatePO({
      supplierId: supplierId || supplier_id || null,
      supplierName: sName,
      warehouseId: whId,
      expectedDate: expectedDate || expected_delivery_date,
      items: (items || []).map(i => ({
        variantId: i.variantId || i.variant_id,
        sku: i.sku,
        orderedQuantity: i.orderedQuantity || i.ordered_quantity,
        unitPrice: i.unitPrice || i.unit_price
      })),
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
      .populate('purchase_order_id')
      .sort({ received_date: -1, createdAt: -1 });
    res.json(grns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createGoodsReceipt = async (req, res) => {
  try {
    const { purchaseOrderId, warehouseId, invoiceNumber, supplierInvoiceNumber, items } = req.body;
    let whId = warehouseId;
    if (!whId) {
      const wh = await Warehouse.findOne();
      whId = wh?._id;
    }

    const grn = await svcReceiveGRN({
      purchaseOrderId,
      warehouseId: whId,
      invoiceNumber: invoiceNumber || supplierInvoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
      items: (items || []).map(i => ({
        variantId: i.variantId || i.variant_id,
        sku: i.sku,
        receivedQuantity: i.receivedQuantity || i.received_quantity,
        acceptedQuantity: i.acceptedQuantity || i.accepted_quantity,
        rejectedQuantity: i.rejectedQuantity || i.rejected_quantity || 0,
        rejectionReason: i.rejectionReason || i.rejection_reason || '',
        unitCost: i.unitCost || i.unit_cost || 0
      })),
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
    const { name, code, material_code, category, material_type, specification, unit, unit_of_measure, cost_per_unit, unit_cost, current_stock, reorder_level } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const mCode = (code || material_code || `RM-${name.slice(0, 3).toUpperCase()}-${Date.now() % 1000}`).toUpperCase();
    const rm = await RawMaterial.create({
      material_code: mCode,
      name,
      material_type: category || material_type || 'Fabric',
      specification: specification || '',
      unit: unit_of_measure || unit || 'meter',
      cost_per_unit: parseFloat(unit_cost || cost_per_unit) || 0,
      current_stock: parseFloat(current_stock) || 0,
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
    const { name, productId, variantId, variant_id, items, version, estimatedLaborCost, notes } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'BOM items are required' });
    }

    const bomNumber = `BOM-${Date.now().toString().slice(-6)}`;
    const bom = await BOM.create({
      bom_number: bomNumber,
      name: name || `BOM for Garment ${bomNumber}`,
      product_id: productId || null,
      variant_id: variantId || variant_id || null,
      version: version || 'v1.0',
      items: items.map(i => ({
        material_id: i.material_id || i.raw_material_id,
        quantity: i.quantity || i.quantity_required || 1,
        unit: i.unit || i.unit_of_measure || 'meter',
        scrap_percent: i.scrap_percent || i.wastage_percentage || 0
      })),
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
    const bomId = req.params.id || req.params.bomId || req.query.bomId;
    const quantity = parseInt(req.query.quantity || req.query.plannedQuantity || 1);
    if (!bomId) {
      return res.status(400).json({ error: 'bomId is required' });
    }

    const calculation = await calculateBOMRequirements(bomId, quantity);
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
      .sort({ planned_start_date: -1, createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createProductionOrder = async (req, res) => {
  try {
    const { productId, product_id, variantId, variant_id, bomId, bom_id, plannedQuantity, targetQuantity, target_quantity, warehouseId, warehouse_id, plannedStartDate, plannedCompletionDate, notes } = req.body;
    const bId = bomId || bom_id;
    const qty = parseInt(targetQuantity || target_quantity || plannedQuantity || 1);
    if (!bId) {
      return res.status(400).json({ error: 'bomId is required' });
    }

    let whId = warehouseId || warehouse_id;
    if (!whId) {
      const wh = await Warehouse.findOne();
      whId = wh?._id;
    }

    const orderNumber = `PROD-${Date.now().toString().slice(-6)}`;
    const order = await ProductionOrder.create({
      production_order_number: orderNumber,
      order_number: orderNumber,
      product_id: productId || product_id || null,
      variant_id: variantId || variant_id || null,
      bom_id: bId,
      planned_quantity: qty,
      target_quantity: qty,
      warehouse_id: whId,
      planned_start_date: plannedStartDate || new Date(),
      planned_end_date: plannedCompletionDate,
      status: 'PLANNED',
      notes: notes || ''
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createMaterialIssue = async (req, res) => {
  try {
    const { productionOrderId, warehouseId, items } = req.body;
    let whId = warehouseId;
    if (!whId) {
      const wh = await Warehouse.findOne();
      whId = wh?._id;
    }

    const issue = await svcIssueMaterials({
      productionOrderId,
      warehouseId: whId,
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
    const { productionOrderId, warehouseId, quantityProduced, acceptedQuantity, defectiveQuantity, quantityAccepted, quantityRejected, defectNotes, rejectionReason, unitCost } = req.body;
    let whId = warehouseId;
    if (!whId) {
      const wh = await Warehouse.findOne();
      whId = wh?._id;
    }

    const aQty = parseInt(acceptedQuantity !== undefined ? acceptedQuantity : (quantityAccepted !== undefined ? quantityAccepted : quantityProduced || 0)) || 0;
    const rQty = parseInt(defectiveQuantity !== undefined ? defectiveQuantity : (quantityRejected !== undefined ? quantityRejected : 0)) || 0;
    const pQty = parseInt(quantityProduced !== undefined ? quantityProduced : (aQty + rQty)) || (aQty + rQty);

    const output = await svcRecordProdCompletion({
      productionOrderId,
      warehouseId: whId,
      quantityProduced: pQty,
      quantityAccepted: aQty,
      quantityRejected: rQty,
      rejectionReason: rejectionReason || defectNotes || '',
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
