import express from 'express';
import { trackEvent, getAnalyticsDashboard, submitRating, replyToRating, getProductRatings } from '../controllers/analyticsController.js';

const router = express.Router();

// Optional auth — extracts user if token exists but doesn't block
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    import('jsonwebtoken').then(jwt => {
      try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'fashion_erp_jwt_secret_key_2025_suraj');
      } catch (e) {}
      next();
    });
  } else {
    next();
  }
};

// Public / Silent tracking endpoint
router.post('/track', optionalAuth, trackEvent);

// Product ratings & admin replies
router.post('/rating', optionalAuth, submitRating);
router.post('/rating/reply', optionalAuth, replyToRating);
router.get('/ratings/:productId', getProductRatings);

// Analytics dashboard
router.get('/dashboard', optionalAuth, getAnalyticsDashboard);

export default router;
