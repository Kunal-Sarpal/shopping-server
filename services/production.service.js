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
    product_id: productId,
    variant_id: variantId,
    bom_id: bomId,
    planned_quantity: plannedQuantity,
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

  // Decrement inventory via centralized service
  await issueMaterial({
    issueNumber,
    productionOrderNumber: order.production_order_number,
    warehouseId,
    items,
    userId: issuedBy
  });

  // Record material issue document
  const issueDoc = await MaterialIssue.create({
    issue_number: issueNumber,
    production_order_id: order._id,
    production_order_number: order.production_order_number,
    warehouse_id: warehouseId,
    items: items.map(i => ({
      material_id: i.material_id,
      quantity: i.quantity,
      unit: i.unit,
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
  inspectedBy = 'QC Lead'
}) => {
  const order = await ProductionOrder.findById(productionOrderId).populate('variant_id');
  if (!order) throw new Error('Production Order not found');

  const outputNumber = `OUT-${Date.now().toString().slice(-6)}`;
  const lotNumber = `LOT-PROD-${Date.now().toString().slice(-6)}`;
  const qcStatus = quantityRejected > 0 ? (quantityAccepted > 0 ? 'PARTIALLY_ACCEPTED' : 'REJECTED') : 'ACCEPTED';

  // Ingest accepted finished goods into inventory
  if (quantityAccepted > 0) {
    await completeProduction({
      outputNumber,
      productionOrderNumber: order.production_order_number,
      variantId: order.variant_id?._id || order.variant_id,
      sku: order.variant_id?.sku || '',
      warehouseId,
      quantityAccepted,
      unitCost,
      lotNumber,
      userId: inspectedBy
    });
  }

  // Create ProductionOutput document
  const outputDoc = await ProductionOutput.create({
    output_number: outputNumber,
    production_order_id: order._id,
    production_order_number: order.production_order_number,
    variant_id: order.variant_id?._id || order.variant_id,
    sku: order.variant_id?.sku || '',
    warehouse_id: warehouseId,
    quantity_produced: quantityProduced,
    quantity_accepted: quantityAccepted,
    quantity_rejected: quantityRejected,
    rejection_reason: rejectionReason,
    qc_status: qcStatus,
    lot_number: lotNumber,
    unit_cost: unitCost,
    inspected_by: inspectedBy
  });

  // Update ProductionOrder totals and status
  order.produced_quantity += quantityProduced;
  order.accepted_quantity += quantityAccepted;
  order.rejected_quantity += quantityRejected;

  if (order.produced_quantity >= order.planned_quantity) {
    order.status = 'COMPLETED';
    order.actual_end_date = new Date();
  }
  await order.save();

  return outputDoc;
};
