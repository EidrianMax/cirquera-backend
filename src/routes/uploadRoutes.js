import express from 'express'
import { deleteUploadedFile } from '../controllers/UploadController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', (req, res) => {
  if (req.file) {
    res.json({
      message: 'File uploaded successfully',
      url: `/uploads/${req.file.filename}`
    })
  } else {
    res.status(400).json({ message: 'No file uploaded' })
  }
})

router.delete('/:filename', protect, deleteUploadedFile)

export default router
