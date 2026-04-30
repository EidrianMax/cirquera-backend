import express from 'express'
import upload from '../middleware/uploadMiddleware.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, upload.single('file'), (req, res) => {
  if (req.file) {
    return res.json({
      message: 'File uploaded successfully',
      url: `/uploads/${req.file.filename}`
    })
  }

  return res.status(400).json({ message: 'No file uploaded' })
})

export default router
