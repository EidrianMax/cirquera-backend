import express from 'express'
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers
} from '../controllers/UserController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/', protect, getUsers)
router.get('/profile/:id', protect, getUserProfile)
router.put('/profile/:id', protect, updateUserProfile)

export default router
