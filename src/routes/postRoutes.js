import express from 'express'
import {
  createPost,
  getPosts,
  getPostById,
  likePost,
  addComment,
  deletePost
} from '../controllers/PostController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, createPost)
router.get('/', getPosts)
router.get('/:id', getPostById)
router.put('/:id/like', protect, likePost)
router.post('/:id/comment', protect, addComment)
router.delete('/:id', protect, deletePost)

export default router
