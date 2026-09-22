import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  getColours, createColour,
  getSizes, createSize,
  getProductSpecification, getProductSpecifications, saveProductSpecification,
  getProductVariants, generateVariantsMatrix,
  getWarehouses, createWarehouse,
  getInventoryStock, getInventoryTransactions, adjustInventory,
  getPurchaseOrders, createPurchaseOrder,
  getGoodsReceipts, createGoodsReceipt,
  getRawMaterials, createRawMaterial,
  getBOMs, createBOM, getBOMCalculations,
  getProductionOrders, createProductionOrder,
  createMaterialIssue, recordProductionOutput,
  getERPReports
} from '../controllers/erpController.js';

const router = Router();

// Colours & Sizes (public read, authenticated write)
router.get('/colours', optionalAuth, getColours);
router.post('/colours', authenticate, createColour);
router.get('/sizes', optionalAuth, getSizes);
router.post('/sizes', authenticate, createSize);

// Product Specifications (supports both aliases)
router.get('/specifications', optionalAuth, getProductSpecifications);
router.post('/specifications', authenticate, saveProductSpecification);
router.get('/product-specs', optionalAuth, getProductSpecifications);
router.get('/product-specs/:productId', optionalAuth, getProductSpecification);
router.post('/product-specs', authenticate, saveProductSpecification);

// Product Variants (supports both aliases)
router.get('/variants', optionalAuth, getProductVariants);
router.post('/variants/matrix-generate', authenticate, generateVariantsMatrix);
router.get('/product-variants', optionalAuth, getProductVariants);
router.post('/product-variants/matrix', authenticate, generateVariantsMatrix);

// Warehouses
router.get('/warehouses', optionalAuth, getWarehouses);
router.post('/warehouses', authenticate, createWarehouse);

// Inventory Ledger & Adjustments
router.get('/inventory/stock', optionalAuth, getInventoryStock);
router.get('/inventory/transactions', optionalAuth, getInventoryTransactions);
router.post('/inventory/adjust', authenticate, adjustInventory);

// Procurement (Purchase Orders & GRN - supports both aliases)
router.get('/procurement/orders', optionalAuth, getPurchaseOrders);
router.post('/procurement/orders', authenticate, createPurchaseOrder);
router.get('/procurement/grn', optionalAuth, getGoodsReceipts);
router.post('/procurement/grn', authenticate, createGoodsReceipt);
router.get('/purchase-orders', optionalAuth, getPurchaseOrders);
router.post('/purchase-orders', authenticate, createPurchaseOrder);
router.get('/goods-receipts', optionalAuth, getGoodsReceipts);
router.post('/goods-receipts', authenticate, createGoodsReceipt);

// Manufacturing (Raw Materials, BOM, Production - supports both aliases)
router.get('/manufacturing/raw-materials', optionalAuth, getRawMaterials);
router.post('/manufacturing/raw-materials', authenticate, createRawMaterial);
router.get('/manufacturing/boms', optionalAuth, getBOMs);
router.post('/manufacturing/boms', authenticate, createBOM);
router.get('/manufacturing/boms/:id/calculate', optionalAuth, getBOMCalculations);
router.get('/manufacturing/boms/calculate', optionalAuth, getBOMCalculations);
router.get('/manufacturing/production-orders', optionalAuth, getProductionOrders);
router.post('/manufacturing/production-orders', authenticate, createProductionOrder);
router.post('/manufacturing/issue-materials', authenticate, createMaterialIssue);
router.post('/manufacturing/complete-production', authenticate, recordProductionOutput);

router.get('/raw-materials', optionalAuth, getRawMaterials);
router.post('/raw-materials', authenticate, createRawMaterial);
router.get('/boms', optionalAuth, getBOMs);
router.post('/boms', authenticate, createBOM);
router.get('/boms/calculate', optionalAuth, getBOMCalculations);
router.get('/production-orders', optionalAuth, getProductionOrders);
router.post('/production-orders', authenticate, createProductionOrder);
router.post('/material-issues', authenticate, createMaterialIssue);
router.post('/production-outputs', authenticate, recordProductionOutput);

// ERP Executive Reports
router.get('/reports/summary', optionalAuth, getERPReports);

export default router;
