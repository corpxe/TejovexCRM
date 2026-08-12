import { Router } from 'express';
import { handleChat } from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';
 // adjust to match your existing auth middleware name

const router = Router();

router.post('/', protect, handleChat);

export default router;