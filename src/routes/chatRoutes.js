import express from 'express'
import {
  accessChat,
  getChats,
  sendMessage,
  getMessages
} from '../controllers/ChatController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, accessChat)
router.get('/messages/:chatId', protect, getMessages)
router.get('/:userId', protect, getChats)
router.post('/message', protect, sendMessage)

export default router
