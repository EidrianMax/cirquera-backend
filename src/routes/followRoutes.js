import express from 'express'
import {
  follow,
  acceptFollowRequest,
  unfollow,
  getFollows
} from '../controllers/FollowController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, follow)
router.put('/:id/accept', protect, acceptFollowRequest)
router.delete('/:entityType/:entityId', protect, unfollow)
router.get('/:entityType/:entityId/:listType', protect, getFollows)

export default router
