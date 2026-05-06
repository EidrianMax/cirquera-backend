import express from 'express'
import {
  addAdminCategorySkill,
  adminLogin,
  createAdminAccount,
  createAdminCategory,
  createAdminJob,
  createAdminReport,
  deleteAdminAccount,
  deleteAdminCategory,
  deleteAdminCategorySkill,
  deleteAdminJob,
  deleteAdminReport,
  exportAdminAccounts,
  getAdminAccountById,
  getAdminAccounts,
  getAdminCategories,
  getAdminCategoryById,
  getAdminDashboard,
  getAdminJobById,
  getAdminJobs,
  getAdminReports,
  moderateAdminReportTarget,
  resolveAdminReport,
  updateAdminAccount,
  updateAdminAccountStatus,
  updateAdminCategory,
  updateAdminJob,
  updateAdminJobStatus
} from '../controllers/AdminController.js'
import { admin, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/auth/login', adminLogin)

router.use(protect, admin)

router.get('/dashboard', getAdminDashboard)

router.get(['/users/export', '/usuarios/export', '/usuarios/exportar'], exportAdminAccounts)
router.get(['/users', '/usuarios'], getAdminAccounts)
router.post(['/users', '/usuarios'], createAdminAccount)
router.get(['/users/:id', '/usuarios/:id'], getAdminAccountById)
router.put(['/users/:id', '/usuarios/:id'], updateAdminAccount)
router.patch(['/users/:id', '/usuarios/:id'], updateAdminAccount)
router.patch([
  '/users/:id/status',
  '/users/:id/toggle-status',
  '/usuarios/:id/estado',
  '/usuarios/:id/toggle-status'
], updateAdminAccountStatus)
router.delete(['/users/:id', '/usuarios/:id'], deleteAdminAccount)

router.get(['/jobs', '/ofertas'], getAdminJobs)
router.post(['/jobs', '/ofertas'], createAdminJob)
router.get(['/jobs/:id', '/ofertas/:id'], getAdminJobById)
router.put(['/jobs/:id', '/ofertas/:id'], updateAdminJob)
router.patch(['/jobs/:id', '/ofertas/:id'], updateAdminJob)
router.patch(['/jobs/:id/status', '/ofertas/:id/estado'], updateAdminJobStatus)
router.delete(['/jobs/:id', '/ofertas/:id'], deleteAdminJob)

router.get(['/reports', '/reportes'], getAdminReports)
router.post(['/reports', '/reportes'], createAdminReport)
router.patch(['/reports/:id/resolve', '/reportes/:id/resolver'], resolveAdminReport)
router.patch(['/reports/:id/target', '/reportes/:id/objetivo'], moderateAdminReportTarget)
router.delete(['/reports/:id/target', '/reportes/:id/objetivo'], moderateAdminReportTarget)
router.delete(['/reports/:id', '/reportes/:id'], deleteAdminReport)

router.get(['/categories', '/categorias'], getAdminCategories)
router.post(['/categories', '/categorias'], createAdminCategory)
router.get(['/categories/:id', '/categorias/:id'], getAdminCategoryById)
router.put(['/categories/:id', '/categorias/:id'], updateAdminCategory)
router.patch(['/categories/:id', '/categorias/:id'], updateAdminCategory)
router.post(['/categories/:id/skills', '/categorias/:id/habilidades'], addAdminCategorySkill)
router.delete(['/categories/:id/skills/:skill', '/categorias/:id/habilidades/:skill'], deleteAdminCategorySkill)
router.delete(['/categories/:id', '/categorias/:id'], deleteAdminCategory)

export default router
