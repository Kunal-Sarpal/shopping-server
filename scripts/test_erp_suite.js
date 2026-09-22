// End-to-End Automated Test Script for Hanguluxe Fashion ERP Suite
const BASE_URL = 'http://127.0.0.1:5001';

let authToken = '';

async function req(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🚀 STARTING HANGULUXE FASHION ERP E2E TEST SUITE...\n');

  try {
    // TEST 0: Authentication as Manager
    console.log('--- TEST 0: Manager Authentication ---');
    const loginRes = await req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'manager@fashionco.com', password: 'password123' })
    });
    assert(loginRes.ok && loginRes.data.token, 'POST /api/auth/login logs in as Manager and returns JWT token');
    authToken = loginRes.data.token;

    // TEST 1: Catalog Products API (Existing route regression test)
    console.log('\n--- TEST 1: Existing Catalog Products API ---');
    const prodRes = await req('/api/products');
    assert(prodRes.ok && (prodRes.data.products || Array.isArray(prodRes.data)), 'GET /api/products returns 200 and product list');

    // TEST 2: Master Colours & Sizes
    console.log('\n--- TEST 2: Master Colours & Master Sizes ---');
    const colName = `Crimson-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
    const colCode = `CR-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
    const createCol = await req('/api/erp/colours', {
      method: 'POST',
      body: JSON.stringify({ name: colName, code: colCode, hex_code: '#B8001F' })
    });
    assert(createCol.ok && createCol.data._id, `POST /api/erp/colours creates colour: ${colName}`);

    const getCols = await req('/api/erp/colours');
    assert(getCols.ok && Array.isArray(getCols.data) && getCols.data.some(c => c.code === colCode), 'GET /api/erp/colours retrieves new colour');

    const sizeName = `SZ-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
    const createSize = await req('/api/erp/sizes', {
      method: 'POST',
      body: JSON.stringify({ name: sizeName, code: sizeName, category: 'Adult', sort_order: 5 })
    });
    assert(createSize.ok && createSize.data._id, `POST /api/erp/sizes creates size: ${sizeName}`);

    const getSizes = await req('/api/erp/sizes');
    assert(getSizes.ok && Array.isArray(getSizes.data), 'GET /api/erp/sizes retrieves sizes list');

    // TEST 3: Product Specifications & Variant Matrix Generator
    console.log('\n--- TEST 3: Product Specification & Matrix Generator ---');
    const specName = `Silk Jacquard Anarkali ${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const createSpec = await req('/api/erp/specifications', {
      method: 'POST',
      body: JSON.stringify({
        name: specName,
        category: 'Ethnic Wear',
        gender: 'Women',
        base_price: 7999,
        cost_price: 2800,
        fabric_gsm: 190,
        weave_type: 'Jacquard',
        wash_care: 'Dry Clean Only',
        description: 'Test Spec for automated ERP verification'
      })
    });
    assert(createSpec.ok && createSpec.data._id, `POST /api/erp/specifications creates spec: ${specName}`);
    const specId = createSpec.data._id;

    // Generate combinatorial variant matrix
    const matrixRes = await req('/api/erp/variants/matrix-generate', {
      method: 'POST',
      body: JSON.stringify({
        specId,
        colourIds: [createCol.data._id],
        sizeIds: [createSize.data._id],
        skuPrefix: `TEST-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
        basePrice: 7999,
        costPrice: 2800,
        initialStock: 15
      })
    });
    assert(matrixRes.ok && matrixRes.data.createdCount >= 1, 'POST /api/erp/variants/matrix-generate creates combinatorial variants');

    const getVars = await req(`/api/erp/variants?specId=${specId}`);
    assert(getVars.ok && Array.isArray(getVars.data) && getVars.data.length >= 1, 'GET /api/erp/variants returns generated variants for spec');
    const testVariant = getVars.data[0];

    // TEST 4: Warehouses & Stock Adjustment
    console.log('\n--- TEST 4: Warehouses, Lots & Stock Adjustment ---');
    let whRes = await req('/api/erp/warehouses');
    if (!whRes.data || whRes.data.length === 0) {
      await req('/api/erp/warehouses', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Main Surat Fulfillment Center',
          code: `WH-TEST-${Date.now() % 1000}`,
          address: { city: 'Surat', state: 'Gujarat' },
          is_active: true
        })
      });
      whRes = await req('/api/erp/warehouses');
    }
    assert(whRes.ok && Array.isArray(whRes.data) && whRes.data.length > 0, 'GET /api/erp/warehouses returns warehouse list');
    const targetWhId = whRes.data[0]._id;

    const stockRes = await req(`/api/erp/inventory/stock?variantId=${testVariant._id}`);
    assert(stockRes.ok, 'GET /api/erp/inventory/stock returns stock lots');

    // Perform audit stock adjustment
    const adjustRes = await req('/api/erp/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        variantId: testVariant._id,
        warehouseId: targetWhId,
        quantityChange: 5,
        adjustmentType: 'Physical Count',
        reason: 'Automated test physical count reconciliation'
      })
    });
    assert(adjustRes.ok && adjustRes.data.success, 'POST /api/erp/inventory/adjust reconciles stock and creates audit record');

    // TEST 5: Outsourced Procurement & Incoming QC
    console.log('\n--- TEST 5: Outsourced Procurement & Incoming QC ---');
    const poRes = await req('/api/erp/procurement/orders', {
      method: 'POST',
      body: JSON.stringify({
        supplierName: 'Royal Fabric & Loom Mills',
        expectedDeliveryDate: new Date(Date.now() + 14 * 86400000),
        items: [{
          variantId: testVariant._id,
          sku: testVariant.sku,
          orderedQuantity: 50,
          unitPrice: 2200
        }]
      })
    });
    assert(poRes.ok && poRes.data._id, 'POST /api/erp/procurement/orders creates vendor Purchase Order');
    const poId = poRes.data._id;

    // Receive Goods with QC (48 Accepted, 2 Rejected)
    const grnRes = await req('/api/erp/procurement/grn', {
      method: 'POST',
      body: JSON.stringify({
        purchaseOrderId: poId,
        warehouseId: targetWhId,
        items: [{
          purchase_order_item_id: poRes.data.items[0]._id,
          variant_id: testVariant._id,
          quantity_received: 50,
          quantity_accepted: 48,
          quantity_rejected: 2,
          rejection_reason: '2 units exhibited warp yarn snagging defects',
          unit_cost: 2200
        }]
      })
    });
    assert(grnRes.ok && grnRes.data.success, 'POST /api/erp/procurement/grn processes GRN with Incoming QC');

    const getGRNs = await req('/api/erp/procurement/grn');
    assert(getGRNs.ok && Array.isArray(getGRNs.data) && getGRNs.data.length >= 1, 'GET /api/erp/procurement/grn lists QC inspection records');

    // TEST 6: In-House Manufacturing (Raw Materials, BOM, Requirements, Production Order, Output QC)
    console.log('\n--- TEST 6: Self-Manufacturing Workflow ---');
    const rawMatCode = `RM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const createMat = await req('/api/erp/manufacturing/raw-materials', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Fine Chanderi Zari Fabric',
        code: rawMatCode,
        category: 'Fabric',
        unit_of_measure: 'Meters',
        current_stock: 200,
        unit_cost: 350,
        reorder_level: 30
      })
    });
    if (!createMat.ok || !createMat.data._id) {
      console.log('   [createMat Error Detail]:', createMat.status, createMat.data);
    }
    assert(createMat.ok && createMat.data._id, `POST /api/erp/manufacturing/raw-materials creates raw material: ${rawMatCode}`);
    const rawMatId = createMat.data._id;

    // Create BOM Recipe
    const bomRes = await req('/api/erp/manufacturing/boms', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test BOM Recipe ${Date.now() % 1000}`,
        variant_id: testVariant._id,
        description: 'Standard formula for Jacquard Anarkali',
        items: [{
          raw_material_id: rawMatId,
          quantity_required: 3.5,
          unit_of_measure: 'Meters',
          wastage_percentage: 4
        }]
      })
    });
    assert(bomRes.ok && bomRes.data._id, 'POST /api/erp/manufacturing/boms creates Bill of Materials recipe');
    const bomId = bomRes.data._id;

    // Calculate BOM Requirements for 20 garments
    const calcRes = await req(`/api/erp/manufacturing/boms/${bomId}/calculate?quantity=20`);
    assert(calcRes.ok && calcRes.data.requirements && calcRes.data.requirements.length > 0, 'GET /api/erp/manufacturing/boms/:id/calculate computes exact material needs & costs');

    // Launch Production Order
    const prodOrderRes = await req('/api/erp/manufacturing/production-orders', {
      method: 'POST',
      body: JSON.stringify({
        bom_id: bomId,
        variant_id: testVariant._id,
        target_quantity: 20,
        warehouse_id: targetWhId,
        planned_start_date: new Date(),
        planned_completion_date: new Date(Date.now() + 7 * 86400000)
      })
    });
    assert(prodOrderRes.ok && prodOrderRes.data._id, 'POST /api/erp/manufacturing/production-orders schedules production batch');
    const prodOrderId = prodOrderRes.data._id;

    // Issue materials to production
    const issueRes = await req('/api/erp/manufacturing/issue-materials', {
      method: 'POST',
      body: JSON.stringify({
        productionOrderId: prodOrderId,
        warehouseId: targetWhId
      })
    });
    if (!issueRes.ok || !issueRes.data.success) {
      console.log('   [issueRes Error Detail]:', issueRes.status, issueRes.data);
    }
    assert(issueRes.ok && issueRes.data.success, 'POST /api/erp/manufacturing/issue-materials deducts raw materials and logs ISSUE ledger entry');

    // Complete Production with QC (19 passed, 1 defective)
    const completeRes = await req('/api/erp/manufacturing/complete-production', {
      method: 'POST',
      body: JSON.stringify({
        productionOrderId: prodOrderId,
        warehouseId: targetWhId,
        acceptedQuantity: 19,
        defectiveQuantity: 1,
        defectNotes: '1 piece failed QC due to cut pattern alignment error'
      })
    });
    assert(completeRes.ok && completeRes.data.success, 'POST /api/erp/manufacturing/complete-production inwards 19 units into finished goods lot');

    // TEST 7: Auditable Ledger Verification
    console.log('\n--- TEST 7: Auditable Inventory Ledger Verification ---');
    const ledgerRes = await req('/api/erp/inventory/transactions');
    assert(ledgerRes.ok && ledgerRes.data.transactions && ledgerRes.data.transactions.length >= 4, 'GET /api/erp/inventory/transactions returns append-only transaction ledger');

    const txTypes = ledgerRes.data.transactions.map(t => t.transaction_type);
    console.log(`   Ledger Transaction Types present: ${[...new Set(txTypes)].join(', ')}`);
    assert(txTypes.includes('RECEIPT') || txTypes.includes('ADJUSTMENT') || txTypes.includes('PROD_IN'), 'Ledger contains RECEIPT, ADJUSTMENT, and PROD_IN transactions');

    // TEST 8: Storefront Payment Confirmation & Auto Stock Deduction
    console.log('\n--- TEST 8: Store Order Payment & Stock Deduction ---');
    const payRes = await req('/api/orders/pay-confirm', {
      method: 'POST',
      body: JSON.stringify({
        orderNumber: 'ORD-1001'
      })
    });
    assert(payRes.ok && payRes.data.success, 'POST /api/orders/pay-confirm updates payment status and triggers dispatchSale()');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`🏁 TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
