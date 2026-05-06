import express from 'express'
import {
  accessChat,
  getChats,
  sendMessage,
  getMessages
} from '../controllers/ChatController.js'

const router = express.Router()

router.post('/', accessChat)
router.get('/:userId', getChats)
router.post('/messages', sendMessage)
router.get('/messages/:chatId', getMessages)

export default router
