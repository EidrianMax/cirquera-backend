import express from 'express'
import {
  getNotifications,
  markAsRead
} from '../controllers/NotificationController.js'

const router = express.Router()

router.get('/:userId', getNotifications)
router.put('/:id/read', markAsRead)

export default router
