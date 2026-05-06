import express from 'express'
import upload from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.post('/', upload.single('file'), (req, res) => {
  if (req.file) {
    res.json({
      message: 'File uploaded successfully',
      url: `/uploads/${req.file.filename}`
    })
  } else {
    res.status(400).json({ message: 'No file uploaded' })
  }
})

export default router
