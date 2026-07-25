import { Router } from 'express';
import { getProducts, createProduct, deleteProduct } from '../controllers/productController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getProducts);
router.post('/', optionalAuth, createProduct);
router.delete('/:id', optionalAuth, deleteProduct);

export default router;
