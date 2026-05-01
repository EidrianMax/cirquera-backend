import express from 'express'
import {
  getAllUsers,
  registerUser,
  loginUser,
  updateMyUser,
  getMyUser,
  getUserByUsername,
  updateMyUsername
} from '../controllers/UserController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, admin, getAllUsers)
router.get('/getUsersForChat', protect, getAllUsers)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMyUser)
router.put('/me', protect, updateMyUser)
router.put('/me/username', protect, updateMyUsername)
router.get('/:username', protect, getUserByUsername)

// GET /me -> getMyUser
// PUT /me/username -> changeMyUsername
// PUT /me/password -> changeMyPassword

export default router
