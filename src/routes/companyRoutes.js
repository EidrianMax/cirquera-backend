import express from 'express'
import {
  registerCompany,
  getMyCompany,
  updateMyCompany,
  getAllCompanies,
  getCompanyByUsername,
  updateMyLogo
} from '../controllers/CompanyController.js'
import { protect } from '../middleware/authMiddleware.js'
import { uploadLogo } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.get('/', getAllCompanies)
router.post('/register', registerCompany)
router.get('/me', protect, getMyCompany)
router.put('/me', protect, updateMyCompany)
router.put('/me/logo', protect, uploadLogo, updateMyLogo)
router.get('/:username', protect, getCompanyByUsername)

export default router
