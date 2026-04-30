import express from 'express'
import {
  followUser,
  acceptFollowRequest,
  unfollowUser,
  getFollows
} from '../controllers/FollowController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, followUser)
router.put('/:id/accept', protect, acceptFollowRequest)
router.delete('/:id', protect, unfollowUser)
router.get('/:userId', getFollows)

export default router
