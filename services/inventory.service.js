import { Warehouse, InventoryLot, InventoryTransaction } from '../models/Inventory.js';
import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { RawMaterial } from '../models/Manufacturing.js';

// Helper: Synchronize backward-compatible Product.stock cache from live inventory lots
export const syncProductStockCache = async (productId) => {
  if (!productId || !Product.db || Product.db.readyState !== 1) return;
  try {
    const variants = await ProductVariant.find({ product_id: productId }).select('_id');
    const variantIds = variants.map(v => v._id);

    // Sum available quantity across all active lots for these variants
    const lots = await InventoryLot.find({
      variant_id: { $in: variantIds },
      status: 'AVAILABLE'
    });

    const totalStock = lots.reduce((sum, lot) => sum + (lot.available_quantity || 0), 0);
    const status = totalStock === 0 ? 'Out of Stock' : totalStock < 25 ? 'Low Stock' : 'In Stock';

    await Product.findByIdAndUpdate(productId, {
      $set: { stock: totalStock, status }
    });
  } catch (err) {
    console.warn('syncProductStockCache warning:', err.message);
  }
};

// 1. Receive Stock from Goods Receipt Note (GRN)
export const receiveStock = async ({
  grnNumber,
  supplierId,
  warehouseId,
  items, // array of { variant_id, material_id, item_type, sku, quantity_accepted, unit_cost, lot_number }
  userId = 'System'
}) => {
  const transactionsCreated = [];

  for (const item of items) {
    if (!item.quantity_accepted || item.quantity_accepted <= 0) continue;

    const lotNumber = item.lot_number || `LOT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Create or locate lot
    let lot = await InventoryLot.findOne({ lot_number: lotNumber, warehouse_id: warehouseId });
    const beforeQty = lot ? lot.available_quantity : 0;

    if (!lot) {
      lot = await InventoryLot.create({
        lot_number: lotNumber,
        variant_id: item.variant_id || null,
        material_id: item.material_id || null,
        item_type: item.item_type || (item.variant_id ? 'FINISHED_GOODS' : 'RAW_MATERIAL'),
        sku: item.sku || '',
        source_type: 'PURCHASE',
        source_id: grnNumber,
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        quantity: item.quantity_accepted,
        available_quantity: item.quantity_accepted,
        unit_cost: item.unit_cost || 0,
        status: 'AVAILABLE'
      });
    } else {
      lot.quantity += item.quantity_accepted;
      lot.available_quantity += item.quantity_accepted;
      lot.status = 'AVAILABLE';
      await lot.save();
    }

    const afterQty = lot.available_quantity;

    // Create audit transaction
    const txnNumber = `TXN-REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const txn = await InventoryTransaction.create({
      transaction_number: txnNumber,
      lot_id: lot._id,
      variant_id: item.variant_id || null,
      material_id: item.material_id || null,
      warehouse_id: warehouseId,
      transaction_type: 'PURCHASE_RECEIPT',
      quantity: item.quantity_accepted, // Positive
      before_quantity: beforeQty,
      after_quantity: afterQty,
      unit_cost: item.unit_cost || 0,
      reference_type: 'GRN',
      reference_id: grnNumber,
      created_by: userId,
      notes: `Received via GRN ${grnNumber}`
    });

    transactionsCreated.push(txn);

    // Sync master product stock cache if finished goods
    if (item.variant_id) {
      const variant = await ProductVariant.findById(item.variant_id);
      if (variant?.product_id) {
        await syncProductStockCache(variant.product_id);
      }
    }
  }

  return transactionsCreated;
};

// 2. Issue Raw Material to Production Floor
export const issueMaterial = async ({
  issueNumber,
  productionOrderNumber,
  warehouseId,
  items, // array of { material_id, quantity, unit }
  userId = 'System'
}) => {
  const transactionsCreated = [];

  for (const item of items) {
    if (!item.quantity || item.quantity <= 0) continue;

    // Find available lots for this raw material (FIFO: oldest lot first)
    const lots = await InventoryLot.find({
      material_id: item.material_id,
      warehouse_id: warehouseId,
      status: 'AVAILABLE',
      available_quantity: { $gt: 0 }
    }).sort({ created_at: 1 });

    let remainingToDeduct = item.quantity;

    for (const lot of lots) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(lot.available_quantity, remainingToDeduct);
      const beforeQty = lot.available_quantity;
      lot.available_quantity -= deductAmount;
      if (lot.available_quantity === 0) lot.status = 'EXHAUSTED';
      await lot.save();

      const afterQty = lot.available_quantity;
      remainingToDeduct -= deductAmount;

      const txnNumber = `TXN-ISS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const txn = await InventoryTransaction.create({
        transaction_number: txnNumber,
        lot_id: lot._id,
        material_id: item.material_id,
        warehouse_id: warehouseId,
        transaction_type: 'MATERIAL_ISSUE',
        quantity: -deductAmount, // Negative
        before_quantity: beforeQty,
        after_quantity: afterQty,
        unit_cost: lot.unit_cost,
        reference_type: 'MATERIAL_ISSUE',
        reference_id: issueNumber,
        created_by: userId,
        notes: `Issued to Production Order ${productionOrderNumber}`
      });

      transactionsCreated.push(txn);
    }

    if (remainingToDeduct > 0) {
      // If no pre-existing lot, check RawMaterial and create opening lot or audit transaction
      const rm = await RawMaterial.findById(item.material_id);
      const openingStock = (rm && rm.current_stock >= remainingToDeduct) ? rm.current_stock : (remainingToDeduct + 50);
      const lot = await InventoryLot.create({
        lot_number: `LOT-RM-${Date.now().toString().slice(-6)}`,
        material_id: item.material_id,
        item_type: 'RAW_MATERIAL',
        source_type: 'OPENING_STOCK',
        warehouse_id: warehouseId,
        quantity: openingStock,
        available_quantity: Math.max(0, openingStock - remainingToDeduct),
        unit_cost: rm?.cost_per_unit || 0,
        status: 'AVAILABLE'
      });

      const txnNumber = `TXN-ISS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const txn = await InventoryTransaction.create({
        transaction_number: txnNumber,
        lot_id: lot._id,
        material_id: item.material_id,
        warehouse_id: warehouseId,
        transaction_type: 'MATERIAL_ISSUE',
        quantity: -remainingToDeduct, // Negative
        before_quantity: openingStock,
        after_quantity: lot.available_quantity,
        unit_cost: lot.unit_cost,
        reference_type: 'MATERIAL_ISSUE',
        reference_id: issueNumber,
        created_by: userId,
        notes: `Issued to Production Order ${productionOrderNumber}`
      });
      transactionsCreated.push(txn);
    }

    if (item.material_id) {
      await RawMaterial.findByIdAndUpdate(item.material_id, {
        $inc: { current_stock: -item.quantity }
      });
    }
  }

  return transactionsCreated;
};

// 3. Complete Production Output (Finished Goods)
export const completeProduction = async ({
  outputNumber,
  productionOrderNumber,
  variantId,
  sku,
  warehouseId,
  quantityAccepted,
  unitCost = 0,
  lotNumber = null,
  userId = 'System'
}) => {
  if (!quantityAccepted || quantityAccepted <= 0) return null;

  const lotNum = lotNumber || `LOT-PROD-${Date.now().toString().slice(-6)}`;

  let lot = await InventoryLot.findOne({ lot_number: lotNum, warehouse_id: warehouseId });
  const beforeQty = lot ? lot.available_quantity : 0;

  if (!lot) {
    lot = await InventoryLot.create({
      lot_number: lotNum,
      variant_id: variantId,
      item_type: 'FINISHED_GOODS',
      sku: sku || '',
      source_type: 'PRODUCTION',
      source_id: productionOrderNumber,
      warehouse_id: warehouseId,
      quantity: quantityAccepted,
      available_quantity: quantityAccepted,
      unit_cost: unitCost,
      status: 'AVAILABLE'
    });
  } else {
    lot.quantity += quantityAccepted;
    lot.available_quantity += quantityAccepted;
    lot.status = 'AVAILABLE';
    await lot.save();
  }

  const afterQty = lot.available_quantity;

  const txnNumber = `TXN-PROD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const txn = await InventoryTransaction.create({
    transaction_number: txnNumber,
    lot_id: lot._id,
    variant_id: variantId,
    warehouse_id: warehouseId,
    transaction_type: 'PRODUCTION_OUTPUT',
    quantity: quantityAccepted, // Positive
    before_quantity: beforeQty,
    after_quantity: afterQty,
    unit_cost: unitCost,
    reference_type: 'PRODUCTION_OUTPUT',
    reference_id: outputNumber,
    created_by: userId,
    notes: `Production output from ${productionOrderNumber}`
  });

  if (variantId) {
    const variant = await ProductVariant.findById(variantId);
    if (variant?.product_id) {
      await syncProductStockCache(variant.product_id);
    }
  }

  return txn;
};

// 4. Dispatch Sale (Customer Order Fulfillment)
export const dispatchSale = async ({
  orderNumber,
  items, // array of { product_name, sku, variant_id, quantity }
  warehouseId = null,
  userId = 'Customer / Store'
}) => {
  const transactionsCreated = [];

  // Default to Main Warehouse if not specified
  let targetWarehouseId = warehouseId;
  if (!targetWarehouseId && Warehouse.db && Warehouse.db.readyState === 1) {
    const defaultWh = await Warehouse.findOne({ type: 'Main Warehouse', status: 'Active' }) || await Warehouse.findOne({ status: 'Active' });
    if (defaultWh) targetWarehouseId = defaultWh._id;
  }

  for (const item of items) {
    const qtyToDeduct = item.quantity || 1;

    // Find variant if ID not provided
    let variant = null;
    if (item.variant_id) {
      variant = await ProductVariant.findById(item.variant_id);
    } else if (item.sku) {
      variant = await ProductVariant.findOne({ sku: item.sku });
    }

    if (!variant && item.product_name) {
      // Find product by name and its first variant
      const prod = await Product.findOne({ product_name: item.product_name });
      if (prod) {
        variant = await ProductVariant.findOne({ product_id: prod._id });
      }
    }

    // Find available lots (FIFO)
    const lotQuery = {
      status: 'AVAILABLE',
      available_quantity: { $gt: 0 }
    };
    if (variant) lotQuery.variant_id = variant._id;
    else if (item.sku) lotQuery.sku = item.sku;
    if (targetWarehouseId) lotQuery.warehouse_id = targetWarehouseId;

    const lots = await InventoryLot.find(lotQuery).sort({ created_at: 1 });

    let remainingToDeduct = qtyToDeduct;

    for (const lot of lots) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(lot.available_quantity, remainingToDeduct);
      const beforeQty = lot.available_quantity;
      lot.available_quantity -= deductAmount;
      if (lot.available_quantity === 0) lot.status = 'EXHAUSTED';
      await lot.save();

      const afterQty = lot.available_quantity;
      remainingToDeduct -= deductAmount;

      const txnNumber = `TXN-SALE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const txn = await InventoryTransaction.create({
        transaction_number: txnNumber,
        lot_id: lot._id,
        variant_id: variant ? variant._id : lot.variant_id,
        warehouse_id: lot.warehouse_id,
        transaction_type: 'SALE',
        quantity: -deductAmount, // Negative
        before_quantity: beforeQty,
        after_quantity: afterQty,
        unit_cost: lot.unit_cost,
        reference_type: 'ORDER',
        reference_id: orderNumber,
        created_by: userId,
        notes: `Order ${orderNumber} dispatch`
      });

      transactionsCreated.push(txn);
    }

    // Sync product stock & sold counts
    if (variant?.product_id) {
      await Product.findByIdAndUpdate(variant.product_id, { $inc: { sold: qtyToDeduct } });
      await syncProductStockCache(variant.product_id);
    } else if (item.product_name) {
      const prod = await Product.findOne({ product_name: item.product_name });
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 0) - qtyToDeduct);
        prod.sold = (prod.sold || 0) + qtyToDeduct;
        prod.status = prod.stock === 0 ? 'Out of Stock' : prod.stock < 25 ? 'Low Stock' : 'In Stock';
        await prod.save();
      }
    }
  }

  return transactionsCreated;
};

// 5. Restock or Quarantine Returned Goods
export const returnStock = async ({
  returnCode,
  orderNumber,
  variantId,
  sku,
  quantity = 1,
  condition = 'Sellable', // 'Sellable' or 'Damaged'
  warehouseId,
  userId = 'Customer Returns'
}) => {
  const lotNumber = `LOT-RET-${Date.now().toString().slice(-6)}`;
  const status = condition === 'Sellable' ? 'AVAILABLE' : 'DAMAGED';

  const lot = await InventoryLot.create({
    lot_number: lotNumber,
    variant_id: variantId,
    item_type: 'FINISHED_GOODS',
    sku: sku || '',
    source_type: 'RETURN',
    source_id: returnCode || orderNumber,
    warehouse_id: warehouseId,
    quantity: quantity,
    available_quantity: condition === 'Sellable' ? quantity : 0,
    status: status
  });

  const txnNumber = `TXN-RET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const txn = await InventoryTransaction.create({
    transaction_number: txnNumber,
    lot_id: lot._id,
    variant_id: variantId,
    warehouse_id: warehouseId,
    transaction_type: condition === 'Sellable' ? 'RETURN' : 'DAMAGE',
    quantity: condition === 'Sellable' ? quantity : 0,
    before_quantity: 0,
    after_quantity: condition === 'Sellable' ? quantity : 0,
    reference_type: 'RETURN',
    reference_id: returnCode || orderNumber,
    created_by: userId,
    notes: `Customer return (${condition}) for order ${orderNumber}`
  });

  if (variantId && condition === 'Sellable') {
    const variant = await ProductVariant.findById(variantId);
    if (variant?.product_id) {
      await syncProductStockCache(variant.product_id);
    }
  }

  return { lot, txn };
};

// 6. Manual Stock Adjustment with Audit
export const adjustStock = async ({
  lotId,
  quantityAdjustment, // positive or negative
  reason = 'Inventory Reconciliation',
  userId = 'Store Manager'
}) => {
  const lot = await InventoryLot.findById(lotId);
  if (!lot) throw new Error('Inventory lot not found');

  const beforeQty = lot.available_quantity;
  lot.available_quantity = Math.max(0, lot.available_quantity + quantityAdjustment);
  lot.quantity = Math.max(0, lot.quantity + quantityAdjustment);
  lot.status = lot.available_quantity === 0 ? 'EXHAUSTED' : 'AVAILABLE';
  await lot.save();

  const afterQty = lot.available_quantity;

  const txnNumber = `TXN-ADJ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const txn = await InventoryTransaction.create({
    transaction_number: txnNumber,
    lot_id: lot._id,
    variant_id: lot.variant_id,
    material_id: lot.material_id,
    warehouse_id: lot.warehouse_id,
    transaction_type: 'ADJUSTMENT',
    quantity: quantityAdjustment,
    before_quantity: beforeQty,
    after_quantity: afterQty,
    reference_type: 'ADJUSTMENT',
    reference_id: txnNumber,
    created_by: userId,
    notes: reason
  });

  if (lot.variant_id) {
    const variant = await ProductVariant.findById(lot.variant_id);
    if (variant?.product_id) {
      await syncProductStockCache(variant.product_id);
    }
  }

  return { lot, txn };
};
