import Post from '../models/Post.js'
import { createNotification } from './NotificationController.js'

const normalizeMedia = (media) => {
  if (!Array.isArray(media)) {
    return []
  }

  return media.filter(item => item && typeof item.url === 'string' && typeof item.type === 'string')
}

const canManagePost = (post, user) => user.role === 'admin' || post.author.toString() === user.id

// @desc    Create a new post
// @route   POST /api/posts
export const createPost = async (req, res) => {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : ''
    const media = normalizeMedia(req.body.media)

    if (!content) {
      return res.status(422).json({ message: 'Post content is required' })
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      media
    })

    return res.status(201).json(post)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get all posts (Feed)
// @route   GET /api/posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 })

    return res.json(posts)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get post by ID
// @route   GET /api/posts/:id
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar role')
      .populate('comments.user', 'name avatar role')

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    return res.json(post)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Like / Unlike post
// @route   PUT /api/posts/:id/like
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const userId = req.user.id
    const alreadyLiked = post.likes.some(id => id.toString() === userId)

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId)
    } else {
      post.likes.push(userId)
    }

    await post.save()

    if (!alreadyLiked && post.author.toString() !== userId) {
      await createNotification({
        user: post.author,
        type: 'newLike',
        fromUser: userId,
        relatedPost: post._id
      })
    }

    return res.json(post)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : ''

    if (!comment) {
      return res.status(422).json({ message: 'Comment is required' })
    }

    post.comments.push({
      user: req.user.id,
      comment
    })
    await post.save()

    if (post.author.toString() !== req.user.id) {
      await createNotification({
        user: post.author,
        type: 'newComment',
        fromUser: req.user.id,
        relatedPost: post._id
      })
    }

    return res.status(201).json(post)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Delete post
// @route   DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (!canManagePost(post, req.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await post.deleteOne()
    return res.json({ message: 'Post removed' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
