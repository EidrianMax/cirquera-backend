import express from 'express'
import {
  createPost,
  getPosts,
  getPostById,
  likePost,
  addComment,
  deletePost,
  addPostMedia
} from '../controllers/PostController.js'
import { protect } from '../middleware/authMiddleware.js'
import { uploadPostMedia } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.post('/', protect, uploadPostMedia, createPost)
router.get('/', getPosts)
router.get('/:id', getPostById)
router.put('/:id/like', protect, likePost)
router.post('/:id/comment', protect, addComment)
router.post('/:id/media', protect, uploadPostMedia, addPostMedia)
router.delete('/:id', protect, deletePost)

export default router
