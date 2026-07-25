import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  getOrders, lookupOrder, createStoreOrder, confirmOrderPayment, getStaff, getCoupons, createCoupon,
  getWalkins, createWalkin, getAppointments, getReturns,
  getDesigns, createDesign, getDesignRequests, getMoodBoard,
  getLinkedProducts, getCollections,
  getOfflineSales, createOfflineSale, getOnlineSales,
  getSettlements, getGstData,
  getFeedbacks, createFeedback, getDailyLogs, getShelfLayout,
  getBusinessProfile, updateBusinessProfile,
} from '../controllers/dataController.js';

const router = Router();

// Orders
router.get('/orders', optionalAuth, getOrders);
router.post('/orders/checkout', createStoreOrder);
router.post('/orders/pay-confirm', confirmOrderPayment);
router.get('/orders/lookup', optionalAuth, lookupOrder);

// Staff
router.get('/staff', authenticate, getStaff);

// Coupons
router.get('/coupons', authenticate, getCoupons);
router.post('/coupons', authenticate, createCoupon);

// Walkins
router.get('/walkins', authenticate, getWalkins);
router.post('/walkins', authenticate, createWalkin);

// Appointments
router.get('/appointments', authenticate, getAppointments);

// Returns
router.get('/returns', authenticate, getReturns);

// Designs
router.get('/designs', authenticate, getDesigns);
router.post('/designs', authenticate, createDesign);
router.get('/design-requests', authenticate, getDesignRequests);
router.get('/mood-board', authenticate, getMoodBoard);
router.get('/linked-products', authenticate, getLinkedProducts);
router.get('/collections', authenticate, getCollections);

// Sales
router.get('/sales/offline', authenticate, getOfflineSales);
router.post('/sales/offline', authenticate, createOfflineSale);
router.get('/sales/online', authenticate, getOnlineSales);

// Settlements
router.get('/settlements', authenticate, getSettlements);

// GST
router.get('/gst', authenticate, getGstData);

// Feedbacks
router.get('/feedbacks', authenticate, getFeedbacks);
router.post('/feedbacks', authenticate, createFeedback);

// Daily Logs
router.get('/daily-logs', authenticate, getDailyLogs);

// Shelf Layout
router.get('/shelf-layout', authenticate, getShelfLayout);

// Business Profile
router.get('/business-profile', optionalAuth, getBusinessProfile);
router.put('/business-profile', optionalAuth, updateBusinessProfile);

export default router;
