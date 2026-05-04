import express from 'express'
import {
  registerCompany,
  getMyCompany,
  updateMyCompany,
  getAllCompanies,
  getCompanyByUsername
} from '../controllers/CompanyController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', getAllCompanies)
router.post('/register', registerCompany)
router.get('/me', protect, getMyCompany)
router.put('/me', protect, updateMyCompany)
router.get('/:username', protect, getCompanyByUsername)

export default router
