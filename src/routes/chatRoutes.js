import express from 'express'
import {
  accessChat,
  getChatProfiles,
  getChats,
  sendMessage,
  getMessages
} from '../controllers/ChatController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/profiles/available', protect, getChatProfiles)
router.post('/', protect, accessChat)
router.post('/messages', protect, sendMessage)
router.get('/messages/:chatId', protect, getMessages)
router.get('/:userId', protect, getChats)

export default router
