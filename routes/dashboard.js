import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getManagerDashboard,
  getReceptionistDashboard,
  getDesignerDashboard,
  getPartnerDashboard,
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/manager', authenticate, getManagerDashboard);
router.get('/receptionist', authenticate, getReceptionistDashboard);
router.get('/designer', authenticate, getDesignerDashboard);
router.get('/partner', authenticate, getPartnerDashboard);

export default router;
