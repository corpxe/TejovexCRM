import { Router } from 'express';
import { listPredictions, getPredictions } from '../controllers/predictions.controller';
import { protect } from '../middleware/auth.middleware'; // adjust to match your existing auth middleware name

const router = Router();

router.get('/', protect, listPredictions);
router.get('/:entityType/:entityId', protect, getPredictions);

export default router;