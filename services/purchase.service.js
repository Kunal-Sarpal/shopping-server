import { PurchaseOrder, GoodsReceipt } from '../models/Procurement.js';
import { Supplier } from '../models/Product.js';
import { receiveStock } from './inventory.service.js';

// 1. Create a Purchase Order
export const createPurchaseOrder = async ({
  supplierId,
  warehouseId,
  expectedDate,
  items, // array of { variant_id, material_id, item_name, sku, ordered_quantity, unit_price, tax_percent }
  notes = '',
  createdBy = 'Store Manager'
}) => {
  const supplier = await Supplier.findById(supplierId);
  const poNumber = `PO-${Date.now().toString().slice(-6)}`;

  let subtotal = 0;
  let taxAmount = 0;

  const formattedItems = items.map(item => {
    const lineTotal = item.ordered_quantity * item.unit_price;
    const tax = lineTotal * ((item.tax_percent || 5) / 100);
    subtotal += lineTotal;
    taxAmount += tax;
    return {
      ...item,
      total_price: lineTotal + tax
    };
  });

  const totalAmount = subtotal + taxAmount;

  const po = await PurchaseOrder.create({
    po_number: poNumber,
    supplier_id: supplierId,
    supplier_name: supplier?.supplier_name || '',
    expected_date: expectedDate,
    warehouse_id: warehouseId,
    items: formattedItems,
    subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    status: 'SUBMITTED',
    created_by: createdBy,
    notes
  });

  return po;
};

// 2. Receive Goods Receipt Note (GRN) with Incoming QC
export const receiveGRN = async ({
  purchaseOrderId,
  warehouseId,
  invoiceNumber = '',
  items, // array of { po_item_id, variant_id, material_id, item_name, sku, quantity_received, quantity_accepted, quantity_rejected, rejection_reason, unit_cost }
  receivedBy = 'Store Manager',
  inspectedBy = 'QC Inspector'
}) => {
  const po = await PurchaseOrder.findById(purchaseOrderId);
  if (!po) throw new Error('Purchase Order not found');

  const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
  let totalAccepted = 0;
  let totalRejected = 0;

  const formattedGrnItems = items.map(item => {
    const accepted = Math.max(0, parseInt(item.quantity_accepted) || 0);
    const rejected = Math.max(0, parseInt(item.quantity_rejected) || 0);
    totalAccepted += accepted;
    totalRejected += rejected;
    const lotNumber = `LOT-PO-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

    return {
      po_item_id: item.po_item_id,
      variant_id: item.variant_id,
      material_id: item.material_id,
      item_name: item.item_name,
      sku: item.sku,
      quantity_received: parseInt(item.quantity_received) || (accepted + rejected),
      quantity_accepted: accepted,
      quantity_rejected: rejected,
      rejection_reason: item.rejection_reason || '',
      unit_cost: parseFloat(item.unit_cost) || 0,
      lot_number: lotNumber
    };
  });

  const qcStatus = totalRejected > 0 ? (totalAccepted > 0 ? 'PARTIALLY_ACCEPTED' : 'REJECTED') : 'ACCEPTED';

  // 1. Ingest accepted quantities into inventory ledger
  const acceptedStockItems = formattedGrnItems
    .filter(i => i.quantity_accepted > 0)
    .map(i => ({
      variant_id: i.variant_id,
      material_id: i.material_id,
      item_type: i.variant_id ? 'FINISHED_GOODS' : 'RAW_MATERIAL',
      sku: i.sku,
      quantity_accepted: i.quantity_accepted,
      unit_cost: i.unit_cost,
      lot_number: i.lot_number
    }));

  await receiveStock({
    grnNumber,
    supplierId: po.supplier_id,
    warehouseId,
    items: acceptedStockItems,
    userId: inspectedBy
  });

  // 2. Create GoodsReceipt document
  const grnDoc = await GoodsReceipt.create({
    grn_number: grnNumber,
    purchase_order_id: po._id,
    po_number: po.po_number,
    supplier_id: po.supplier_id,
    supplier_name: po.supplier_name,
    warehouse_id: warehouseId,
    invoice_number: invoiceNumber,
    items: formattedGrnItems,
    total_accepted: totalAccepted,
    total_rejected: totalRejected,
    qc_status: qcStatus,
    received_by: receivedBy,
    inspected_by: inspectedBy,
    status: 'RECEIVED'
  });

  // 3. Update Purchase Order item received counts and overall PO status
  let allFullyReceived = true;
  let hasAnyReceipt = false;

  for (const poItem of po.items) {
    const receivedLine = formattedGrnItems.find(g => String(g.po_item_id) === String(poItem._id) || g.sku === poItem.sku);
    if (receivedLine) {
      poItem.received_quantity = (poItem.received_quantity || 0) + receivedLine.quantity_accepted;
    }
    if ((poItem.received_quantity || 0) > 0) hasAnyReceipt = true;
    if ((poItem.received_quantity || 0) < poItem.ordered_quantity) allFullyReceived = false;
  }

  po.status = allFullyReceived ? 'RECEIVED' : (hasAnyReceipt ? 'PARTIALLY_RECEIVED' : po.status);
  await po.save();

  return grnDoc;
};
