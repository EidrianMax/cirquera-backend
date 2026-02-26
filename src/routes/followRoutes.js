import express from 'express'
import {
  followUser,
  acceptFollowRequest,
  unfollowUser,
  getFollows
} from '../controllers/FollowController.js'

const router = express.Router()

router.post('/', followUser)
router.put('/:id/accept', acceptFollowRequest)
router.delete('/:id', unfollowUser)
router.get('/:userId', getFollows)

export default router
