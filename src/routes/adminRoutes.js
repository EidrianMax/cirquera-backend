import express from 'express'
import {
  getAdminSummary,
  adminListUsers,
  adminUpdateUser,
  adminListJobs,
  adminUpdateJob,
  adminListApplications
} from '../controllers/AdminController.js'
import { admin, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect, admin)

router.get('/summary', getAdminSummary)
router.get('/users', adminListUsers)
router.patch('/users/:id', adminUpdateUser)
router.get('/jobs', adminListJobs)
router.patch('/jobs/:id', adminUpdateJob)
router.get('/applications', adminListApplications)

export default router
