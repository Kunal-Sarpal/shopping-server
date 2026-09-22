import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import { Colour, Size, ProductSpecification, ProductVariant } from '../models/ProductVariant.js';
import { Warehouse, InventoryLot, InventoryTransaction } from '../models/Inventory.js';
import { RawMaterial, BOM, BOMItem, ProductionOrder, MaterialIssue, ProductionOutput } from '../models/Manufacturing.js';
import { PurchaseOrder, GoodsReceipt } from '../models/Procurement.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/hanguluxe';

async function seedERP() {
  console.log('🌱 Connecting to MongoDB for ERP Complete Seed...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  try {
    // 1. Warehouses
    let mainWh = await Warehouse.findOne({ code: 'MAIN-WH' });
    if (!mainWh) {
      mainWh = await Warehouse.create({
        name: 'Main Showroom & Fulfillment Center',
        code: 'MAIN-WH',
        address: { street: 'GIDC Apparel Park, Ring Road', city: 'Surat', state: 'Gujarat', pincode: '395002' },
        is_active: true
      });
    }

    let factoryWh = await Warehouse.findOne({ code: 'FACTORY-SURAT' });
    if (!factoryWh) {
      factoryWh = await Warehouse.create({
        name: 'Surat Manufacturing Unit 01',
        code: 'FACTORY-SURAT',
        address: { street: 'Pandesara Industrial Estate', city: 'Surat', state: 'Gujarat', pincode: '394221' },
        is_active: true
      });
    }

    // 2. Raw Materials
    const rawMaterialsData = [
      { name: 'Pure Chanderi Silk Fabric', code: 'FAB-CHAND-01', category: 'Fabric', unit_of_measure: 'Meters', current_stock: 450, unit_cost: 320, reorder_level: 50 },
      { name: 'Mulberry Raw Silk Fabric', code: 'FAB-MUL-02', category: 'Fabric', unit_of_measure: 'Meters', current_stock: 280, unit_cost: 580, reorder_level: 40 },
      { name: 'Cotton Cambric Lining', code: 'LIN-COT-01', category: 'Lining', unit_of_measure: 'Meters', current_stock: 600, unit_cost: 65, reorder_level: 100 },
      { name: 'Gold Zari Embroidery Thread', code: 'TH-ZARI-GLD', category: 'Thread', unit_of_measure: 'Spools', current_stock: 120, unit_cost: 110, reorder_level: 25 },
      { name: 'Handcrafted Mother-of-Pearl Buttons', code: 'BTN-MOP-14', category: 'Buttons', unit_of_measure: 'Pieces', current_stock: 1500, unit_cost: 8, reorder_level: 300 },
      { name: 'Invisible Concealed Zipper 16in', code: 'ZIP-INV-16', category: 'Zippers', unit_of_measure: 'Pieces', current_stock: 350, unit_cost: 18, reorder_level: 50 }
    ];

    const seededMats = [];
    for (const m of rawMaterialsData) {
      let doc = await RawMaterial.findOne({ code: m.code });
      if (!doc) {
        doc = await RawMaterial.create(m);
      }
      seededMats.push(doc);
    }
    console.log(`🧵 Seeded ${seededMats.length} raw materials`);

    // 3. Colours & Sizes
    const colours = await Colour.find();
    const sizes = await Size.find();
    const primaryColour = colours[0] || (await Colour.create({ name: 'Royal Black', hex_code: '#111827', code: 'BLK' }));
    const redColour = colours.find(c => c.code === 'MRN') || (await Colour.create({ name: 'Maroon Red', hex_code: '#881337', code: 'MRN' }));
    const sizeM = sizes.find(s => s.code === 'M') || (await Size.create({ name: 'M', code: 'M', category: 'Adult', sort_order: 3 }));
    const sizeL = sizes.find(s => s.code === 'L') || (await Size.create({ name: 'L', code: 'L', category: 'Adult', sort_order: 4 }));

    // 4. Product Specification
    let kurtaSpec = await ProductSpecification.findOne({ name: 'Royal Chanderi Jacquard Kurta Set' });
    if (!kurtaSpec) {
      kurtaSpec = await ProductSpecification.create({
        name: 'Royal Chanderi Jacquard Kurta Set',
        category: 'Ethnic Wear',
        gender: 'Women',
        base_price: 6999,
        cost_price: 2450,
        fabric_gsm: 160,
        weave_type: 'Jacquard Weave',
        silhouette: 'A-Line Flared',
        wash_care: 'Dry Clean Only',
        description: 'Luxurious festive kurta set featuring intricate gold zari motifs with silk trousers.'
      });
    }

    // 5. Variants
    let variantM = await ProductVariant.findOne({ sku: 'HGLX-KURTA-BLK-M' });
    if (!variantM) {
      variantM = await ProductVariant.create({
        spec_id: kurtaSpec._id,
        colour_id: primaryColour._id,
        size_id: sizeM._id,
        sku: 'HGLX-KURTA-BLK-M',
        barcode: '8901234567891',
        cost_price: 2450,
        selling_price: 6999,
        stock_quantity: 35,
        is_active: true
      });
    }

    let variantL = await ProductVariant.findOne({ sku: 'HGLX-KURTA-MRN-L' });
    if (!variantL) {
      variantL = await ProductVariant.create({
        spec_id: kurtaSpec._id,
        colour_id: redColour._id,
        size_id: sizeL._id,
        sku: 'HGLX-KURTA-MRN-L',
        barcode: '8901234567892',
        cost_price: 2450,
        selling_price: 6999,
        stock_quantity: 28,
        is_active: true
      });
    }

    // 6. Bill of Materials (BOM)
    let kurtaBOM = await BOM.findOne({ name: 'Standard Chanderi Kurta Set BOM' });
    if (!kurtaBOM) {
      kurtaBOM = await BOM.create({
        name: 'Standard Chanderi Kurta Set BOM',
        variant_id: variantM._id,
        version: 'v1.0',
        description: 'Standard material recipe for stitched 3-piece Chanderi Silk Kurta Set with lining',
        is_active: true,
        items: [
          { raw_material_id: seededMats[0]._id, quantity_required: 2.8, unit_of_measure: 'Meters', wastage_percentage: 5 },
          { raw_material_id: seededMats[2]._id, quantity_required: 2.2, unit_of_measure: 'Meters', wastage_percentage: 3 },
          { raw_material_id: seededMats[3]._id, quantity_required: 1.0, unit_of_measure: 'Spools', wastage_percentage: 2 },
          { raw_material_id: seededMats[4]._id, quantity_required: 6.0, unit_of_measure: 'Pieces', wastage_percentage: 5 },
          { raw_material_id: seededMats[5]._id, quantity_required: 1.0, unit_of_measure: 'Pieces', wastage_percentage: 0 }
        ]
      });
      console.log('📋 Seeded BOM: Standard Chanderi Kurta Set BOM');
    }

    // 7. Production Order & Completion
    let prodOrder = await ProductionOrder.findOne({ order_number: 'PROD-2026-001' });
    if (!prodOrder) {
      prodOrder = await ProductionOrder.create({
        order_number: 'PROD-2026-001',
        bom_id: kurtaBOM._id,
        variant_id: variantM._id,
        warehouse_id: mainWh._id,
        target_quantity: 30,
        completed_quantity: 29,
        scrap_quantity: 1,
        status: 'Completed',
        planned_start_date: new Date('2026-09-01'),
        planned_completion_date: new Date('2026-09-10'),
        actual_completion_date: new Date('2026-09-09')
      });

      // Finished goods lot & transaction
      const prodLot = await InventoryLot.create({
        lot_number: 'LOT-PROD-2026-001',
        warehouse_id: mainWh._id,
        variant_id: variantM._id,
        quantity_initial: 29,
        quantity_available: 29,
        quantity_reserved: 0,
        quantity_damaged: 0,
        unit_cost: 2450,
        status: 'Available',
        manufacturing_date: new Date('2026-09-09')
      });

      await InventoryTransaction.create({
        transaction_type: 'PROD_IN',
        warehouse_id: mainWh._id,
        variant_id: variantM._id,
        lot_id: prodLot._id,
        quantity: 29,
        unit_cost: 2450,
        reference_id: prodOrder.order_number,
        notes: 'Production batch inward after 100% QC inspection (29 passed, 1 rejected due to collar pattern offset)'
      });
      console.log('✅ Seeded Production Order PROD-2026-001');
    }

    // 8. Purchase Order & Goods Receipt Note (GRN) with Incoming QC
    let po = await PurchaseOrder.findOne({ po_number: 'PO-2026-089' });
    if (!po) {
      po = await PurchaseOrder.create({
        po_number: 'PO-2026-089',
        supplier_name: 'Gujarat Artisan Weavers Cooperative',
        expected_delivery_date: new Date('2026-09-15'),
        status: 'Received',
        total_amount: 50 * 1850,
        items: [{
          variant_id: variantL._id,
          sku: variantL.sku,
          ordered_quantity: 50,
          received_quantity: 50,
          unit_price: 1850,
          total_price: 92500
        }]
      });

      // GRN with QC
      const grn = await GoodsReceipt.create({
        grn_number: 'GRN-2026-042',
        purchase_order_id: po._id,
        supplier_invoice_number: 'GAW-INV-9921',
        warehouse_id: mainWh._id,
        received_date: new Date('2026-09-14'),
        items: [{
          variant_id: variantL._id,
          sku: variantL.sku,
          received_quantity: 50,
          accepted_quantity: 48,
          rejected_quantity: 2,
          rejection_reason: '2 units rejected due to small dye stains on dupatta hemline',
          unit_cost: 1850
        }]
      });

      const grnLot = await InventoryLot.create({
        lot_number: 'LOT-GRN-2026-042',
        warehouse_id: mainWh._id,
        variant_id: variantL._id,
        quantity_initial: 48,
        quantity_available: 48,
        quantity_reserved: 0,
        quantity_damaged: 0,
        unit_cost: 1850,
        status: 'Available',
        manufacturing_date: new Date('2026-09-14')
      });

      await InventoryTransaction.create({
        transaction_type: 'RECEIPT',
        warehouse_id: mainWh._id,
        variant_id: variantL._id,
        lot_id: grnLot._id,
        quantity: 48,
        unit_cost: 1850,
        reference_id: grn.grn_number,
        notes: 'Goods Receipt Note: GAW-INV-9921. 48 accepted into sellable inventory, 2 quarantined/rejected.'
      });

      console.log('✅ Seeded Purchase Order PO-2026-089 & GRN-2026-042');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🌟 Complete ERP Demo Seed Executed Successfully!');
    console.log('═══════════════════════════════════════════════════════════');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

seedERP();
