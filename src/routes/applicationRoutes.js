import express from 'express'
import {
  applyToJob,
  getApplications,
  updateApplicationStatus,
  deleteApplication
} from '../controllers/ApplicationController.js'

import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, applyToJob)
router.get('/', protect, getApplications)
router.put('/:id', protect, updateApplicationStatus)
router.delete('/:id', protect, deleteApplication)

export default router
