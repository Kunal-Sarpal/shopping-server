import { ProductionOrder, MaterialIssue, ProductionOutput, BOM } from '../models/Manufacturing.js';
import { issueMaterial, completeProduction } from './inventory.service.js';
import { calculateBOMRequirements } from './bom.service.js';

// 1. Create a new Production Order with pre-calculated requirements
export const createProductionOrder = async ({
  productId,
  variantId,
  bomId,
  plannedQuantity,
  warehouseId,
  plannedStartDate,
  plannedEndDate,
  notes = ''
}) => {
  const orderNumber = `PROD-${Date.now().toString().slice(-6)}`;

  const newOrder = await ProductionOrder.create({
    production_order_number: orderNumber,
    order_number: orderNumber,
    product_id: productId || null,
    variant_id: variantId || null,
    bom_id: bomId,
    planned_quantity: plannedQuantity || 1,
    target_quantity: plannedQuantity || 1,
    warehouse_id: warehouseId,
    planned_start_date: plannedStartDate || new Date(),
    planned_end_date: plannedEndDate,
    status: 'PLANNED',
    notes
  });

  return newOrder;
};

// 2. Issue Raw Materials to the Production Order
export const issueMaterialsToProduction = async ({
  productionOrderId,
  warehouseId,
  items, // array of { material_id, quantity, unit }
  issuedBy = 'Warehouse Manager'
}) => {
  const order = await ProductionOrder.findById(productionOrderId);
  if (!order) throw new Error('Production Order not found');

  const issueNumber = `ISS-${Date.now().toString().slice(-6)}`;
  const poNum = order.production_order_number || order.order_number;

  let issueItems = items;
  if (!issueItems || issueItems.length === 0) {
    const bomCalc = await calculateBOMRequirements(order.bom_id, order.planned_quantity || order.target_quantity || 1);
    issueItems = (bomCalc.requirements || []).map(r => ({
      material_id: r.material_id || r.materialId || r.raw_material_id,
      material_name: r.material_name || '',
      quantity: r.total_required_quantity || r.totalRequired || r.quantity || 1,
      unit: r.unit || r.unit_of_measure || 'meter'
    }));
  }

  // Decrement inventory via centralized service
  await issueMaterial({
    issueNumber,
    productionOrderNumber: poNum,
    warehouseId: warehouseId || order.warehouse_id,
    items: issueItems,
    userId: issuedBy
  });

  // Record material issue document
  const issueDoc = await MaterialIssue.create({
    issue_number: issueNumber,
    production_order_id: order._id,
    production_order_number: poNum,
    warehouse_id: warehouseId || order.warehouse_id,
    items: (issueItems || []).map(i => ({
      material_id: i.material_id || i.materialId || i.raw_material_id,
      material_name: i.material_name || '',
      quantity: i.quantity || 1,
      unit: i.unit || i.unit_of_measure || 'meter',
      lot_number: i.lot_number || ''
    })),
    issued_by: issuedBy
  });

  order.status = 'IN_PROGRESS';
  if (!order.actual_start_date) order.actual_start_date = new Date();
  await order.save();

  return issueDoc;
};

// 3. Complete Production with QC Inspection
export const recordProductionCompletion = async ({
  productionOrderId,
  warehouseId,
  quantityProduced,
  quantityAccepted,
  quantityRejected = 0,
  rejectionReason = '',
  unitCost = 0,
  receivedBy,
  inspectedBy = 'QC Lead'
}) => {
  const order = await ProductionOrder.findById(productionOrderId).populate('variant_id');
  if (!order) throw new Error('Production Order not found');

  const outputNumber = `OUT-${Date.now().toString().slice(-6)}`;
  const lotNumber = `LOT-PROD-${Date.now().toString().slice(-6)}`;
  const poNum = order.production_order_number || order.order_number;
  const qcStatus = quantityRejected > 0 ? (quantityAccepted > 0 ? 'PARTIALLY_ACCEPTED' : 'REJECTED') : 'ACCEPTED';
  const inspector = receivedBy || inspectedBy;

  // Ingest accepted finished goods into inventory
  if (quantityAccepted > 0) {
    await completeProduction({
      outputNumber,
      productionOrderNumber: poNum,
      variantId: order.variant_id?._id || order.variant_id,
      sku: order.variant_id?.sku || 'SKU',
      warehouseId: warehouseId || order.warehouse_id,
      quantityAccepted,
      unitCost,
      lotNumber,
      userId: inspector
    });
  }

  // Create ProductionOutput document
  const outputDoc = await ProductionOutput.create({
    output_number: outputNumber,
    production_order_id: order._id,
    production_order_number: poNum,
    variant_id: order.variant_id?._id || order.variant_id,
    sku: order.variant_id?.sku || 'SKU',
    warehouse_id: warehouseId || order.warehouse_id,
    quantity_produced: quantityProduced || (quantityAccepted + quantityRejected),
    quantity_accepted: quantityAccepted,
    quantity_rejected: quantityRejected,
    rejection_reason: rejectionReason,
    qc_status: qcStatus,
    lot_number: lotNumber,
    unit_cost: unitCost,
    inspected_by: inspector
  });

  // Update ProductionOrder totals and status
  order.produced_quantity = (order.produced_quantity || 0) + (quantityProduced || (quantityAccepted + quantityRejected));
  order.completed_quantity = (order.completed_quantity || 0) + quantityAccepted;
  order.accepted_quantity = (order.accepted_quantity || 0) + quantityAccepted;
  order.rejected_quantity = (order.rejected_quantity || 0) + quantityRejected;
  order.scrap_quantity = order.rejected_quantity;

  const target = order.planned_quantity || order.target_quantity || 1;
  if (order.produced_quantity >= target) {
    order.status = 'COMPLETED';
    order.actual_end_date = new Date();
  }
  await order.save();

  return outputDoc;
};
