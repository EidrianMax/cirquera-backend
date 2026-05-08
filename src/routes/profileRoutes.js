import express from 'express'
import { getProfileByUsername } from '../controllers/ProfileController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/:username', protect, getProfileByUsername)

export default router
