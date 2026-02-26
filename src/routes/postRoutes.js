import express from 'express'
import {
  createPost,
  getPosts,
  getPostById,
  likePost,
  addComment,
  deletePost
} from '../controllers/PostController.js'

const router = express.Router()

router.post('/', createPost)
router.get('/', getPosts)
router.get('/:id', getPostById)
router.put('/:id/like', likePost)
router.post('/:id/comment', addComment)
router.delete('/:id', deletePost)

export default router
