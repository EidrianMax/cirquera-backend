import express from 'express'
import {
  applyToJob,
  getApplications,
  updateApplicationStatus,
  deleteApplication
} from '../controllers/ApplicationController.js'

const router = express.Router()

router.post('/', applyToJob)
router.get('/', getApplications)
router.put('/:id', updateApplicationStatus)
router.delete('/:id', deleteApplication)

export default router
