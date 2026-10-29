import { Router } from 'express';
import { messageController } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All message routes strictly require JWT authentication
router.use(requireAuth);

router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.getOrCreateConversation);
router.get('/conversations/:id', messageController.getMessages);
router.post('/conversations/:id/messages', messageController.sendMessage);
router.put('/conversations/:id/read', messageController.markAsRead);
router.delete('/:id', messageController.deleteMessage);

export default router;
