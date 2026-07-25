import express from 'express';
import { getStoreProducts, getStoreProductDetails } from '../controllers/storeController.js';

const router = express.Router();

router.get('/products', getStoreProducts);
router.get('/products/:id', getStoreProductDetails);

export default router;
