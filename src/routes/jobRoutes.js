import express from 'express'
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
} from '../controllers/JobController.js'
import { optionalAuth, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, createJob)
router.get('/', optionalAuth, getJobs)
router.get('/:id', optionalAuth, getJobById)
router.put('/:id', protect, updateJob)
router.delete('/:id', protect, deleteJob)

export default router
