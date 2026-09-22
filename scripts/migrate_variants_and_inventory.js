import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import { Product } from '../models/Product.js';
import { Colour, Size, ProductSpecification, ProductVariant } from '../models/ProductVariant.js';
import { Warehouse, InventoryLot, InventoryTransaction } from '../models/Inventory.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/hanguluxe';

async function runMigration() {
  console.log('🔄 Connecting to MongoDB for ERP backfill migration...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  try {
    // 1. Ensure Default Warehouse
    let defaultWarehouse = await Warehouse.findOne({ code: 'MAIN-WH' });
    if (!defaultWarehouse) {
      defaultWarehouse = await Warehouse.create({
        name: 'Main Showroom & Fulfillment Center',
        code: 'MAIN-WH',
        address: {
          street: 'GIDC Apparel Park, Ring Road',
          city: 'Surat',
          state: 'Gujarat',
          pincode: '395002'
        },
        is_active: true
      });
      console.log('📍 Created default warehouse: MAIN-WH');
    }

    // 2. Standard Master Colours & Sizes
    const defaultColours = [
      { name: 'Royal Black', hex_code: '#111827', code: 'BLK' },
      { name: 'Maroon Red', hex_code: '#881337', code: 'MRN' },
      { name: 'Emerald Green', hex_code: '#064e3b', code: 'EMR' },
      { name: 'Mustard Gold', hex_code: '#b45309', code: 'GLD' },
      { name: 'Navy Blue', hex_code: '#1e3a8a', code: 'NVY' },
      { name: 'Ivory White', hex_code: '#f8fafc', code: 'WHT' }
    ];

    for (const c of defaultColours) {
      await Colour.updateOne({ code: c.code }, { $setOnInsert: c }, { upsert: true });
    }

    const defaultSizes = [
      { name: 'XS', code: 'XS', category: 'Adult', sort_order: 1 },
      { name: 'S', code: 'S', category: 'Adult', sort_order: 2 },
      { name: 'M', code: 'M', category: 'Adult', sort_order: 3 },
      { name: 'L', code: 'L', category: 'Adult', sort_order: 4 },
      { name: 'XL', code: 'XL', category: 'Adult', sort_order: 5 },
      { name: 'XXL', code: 'XXL', category: 'Adult', sort_order: 6 }
    ];

    for (const s of defaultSizes) {
      await Size.updateOne({ code: s.code }, { $setOnInsert: s }, { upsert: true });
    }

    const allColours = await Colour.find();
    const allSizes = await Size.find();
    const defaultColour = allColours[0];

    // 3. Migrate each Product into ProductSpecification and ProductVariants
    const products = await Product.find();
    console.log(`📦 Found ${products.length} existing products to migrate...`);

    let migratedSpecs = 0;
    let migratedVariants = 0;
    let migratedLots = 0;

    for (const prod of products) {
      let spec = null;
      if (prod.spec_id) {
        spec = await ProductSpecification.findById(prod.spec_id);
      }

      if (!spec) {
        spec = await ProductSpecification.create({
          name: prod.name,
          category: prod.category || 'Ethnic Wear',
          gender: prod.gender || 'Women',
          base_price: prod.sellingPrice || prod.mrp || 0,
          cost_price: prod.costPrice || 0,
          description: prod.description || '',
          wash_care: 'Dry Clean Only',
          created_by: 'MIGRATION_SCRIPT'
        });
        prod.spec_id = spec._id;
        await prod.save();
        migratedSpecs++;
      }

      // Parse string sizes (e.g. "S, M, L, XL")
      const rawSizes = (prod.sizes || 'M')
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);

      const totalStock = prod.stock || 0;
      const stockPerSize = rawSizes.length > 0 ? Math.floor(totalStock / rawSizes.length) : totalStock;
      const remainder = rawSizes.length > 0 ? totalStock % rawSizes.length : 0;

      for (let i = 0; i < rawSizes.length; i++) {
        const sizeCode = rawSizes[i];
        let matchedSize = allSizes.find(s => s.code === sizeCode || s.name.toUpperCase() === sizeCode);
        if (!matchedSize) {
          matchedSize = await Size.create({
            name: sizeCode,
            code: sizeCode,
            category: 'Adult',
            sort_order: 10 + i
          });
        }

        const cleanSkuBase = (prod.sku || prod.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)).toUpperCase();
        const variantSku = `${cleanSkuBase}-${defaultColour.code}-${matchedSize.code}`;

        let variant = await ProductVariant.findOne({ sku: variantSku });
        const initialQty = stockPerSize + (i === 0 ? remainder : 0);

        if (!variant) {
          variant = await ProductVariant.create({
            spec_id: spec._id,
            colour_id: defaultColour._id,
            size_id: matchedSize._id,
            sku: variantSku,
            barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
            cost_price: prod.costPrice || 0,
            selling_price: prod.sellingPrice || 0,
            stock_quantity: initialQty,
            is_active: true
          });
          migratedVariants++;
        }

        // Create InventoryLot for sellable stock
        const lotNumber = `LOT-MIG-${variant.sku.replace(/[^a-zA-Z0-9]/g, '')}`;
        let lot = await InventoryLot.findOne({ lot_number: lotNumber });
        if (!lot && initialQty > 0) {
          lot = await InventoryLot.create({
            lot_number: lotNumber,
            warehouse_id: defaultWarehouse._id,
            variant_id: variant._id,
            quantity_initial: initialQty,
            quantity_available: initialQty,
            quantity_reserved: 0,
            quantity_damaged: 0,
            unit_cost: prod.costPrice || 0,
            status: 'Available',
            manufacturing_date: new Date()
          });

          await InventoryTransaction.create({
            transaction_type: 'ADJUSTMENT',
            warehouse_id: defaultWarehouse._id,
            variant_id: variant._id,
            lot_id: lot._id,
            quantity: initialQty,
            unit_cost: prod.costPrice || 0,
            reference_id: `MIG-${prod._id}`,
            notes: `Initial stock migration from legacy Product: ${prod.name}`
          });

          migratedLots++;
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ ERP Backfill Migration Completed Successfully!`);
    console.log(`   - Product Specifications Created: ${migratedSpecs}`);
    console.log(`   - Product Variants Generated:     ${migratedVariants}`);
    console.log(`   - Inventory Lots Backfilled:       ${migratedLots}`);
    console.log('═══════════════════════════════════════════════════════════');
  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runMigration();
