import express from 'express'
import {
  getAllUsers,
  registerUser,
  updateMyUser,
  getMyUser,
  getUserByUsername,
  updateMyUsername,
  updateMyAvatar
} from '../controllers/UserController.js'
import { protect, admin } from '../middleware/authMiddleware.js'
import { uploadAvatar } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.get('/', protect, admin, getAllUsers)
router.get('/getUsersForChat', protect, getAllUsers)
router.post('/register', registerUser)
router.get('/me', protect, getMyUser)
router.put('/me', protect, updateMyUser)
router.put('/me/username', protect, updateMyUsername)
router.put('/me/avatar', protect, uploadAvatar, updateMyAvatar)
router.get('/:username', protect, getUserByUsername)

// GET /me -> getMyUser
// PUT /me/username -> changeMyUsername
// PUT /me/password -> changeMyPassword

export default router
