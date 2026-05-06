import express from 'express'
import { deleteUploadedFile } from '../controllers/UploadController.js'
import { protect } from '../middleware/authMiddleware.js'
import { uploadPostMedia } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.post('/', uploadPostMedia, (req, res) => {
  if (req.files && req.files.length > 0) {
    const fileUrls = req.files.map(file => `/uploads/posts/${file.filename}`)
    res.json({
      message: 'Files uploaded successfully',
      urls: fileUrls
    });
  } else {
    res.status(400).json({ message: 'No files uploaded' });
  }
})

router.delete('/:filename', protect, deleteUploadedFile)

export default router
