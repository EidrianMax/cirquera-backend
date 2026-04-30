import express from 'express'
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
} from '../controllers/JobController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, createJob)
router.get('/', getJobs)
router.get('/:id', getJobById)
router.put('/:id', updateJob)
router.delete('/:id', deleteJob)

export default router
