import express from 'express'
import {
  follow,
  acceptFollowRequest,
  unfollow,
  getFollows
} from '../controllers/FollowController.js'

const router = express.Router()

router.post('/', follow)
router.put('/:id/accept', acceptFollowRequest)
router.delete('/:id', unfollow)
router.get('/:userId', getFollows)

export default router
