import Post from '../models/Post.js'
import { createNotification } from './NotificationController.js'

// @desc    Create a new post
// @route   POST /api/posts
export const createPost = async (req, res) => {
  try {
    const { author, content, media } = req.body

    const post = await Post.create({
      author,
      content,
      media
    })

    res.status(201).json(post)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all posts (Feed)
// @route   GET /api/posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
    res.json(posts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get post by ID
// @route   GET /api/posts/:id
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments.user', 'name avatar')
    if (post) {
      res.json(post)
    } else {
      res.status(404).json({ message: 'Post not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Like / Unlike post
// @route   PUT /api/posts/:id/like
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const userId = req.body.userId
    const alreadyLiked = post.likes.includes(userId)

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId)
    } else {
      post.likes.push(userId)
    }

    await post.save()

    if (!alreadyLiked) {
      await createNotification({
        user: post.author,
        type: 'newLike',
        fromUser: userId,
        relatedPost: post._id
      })
    }

    res.json(post)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const { user, comment } = req.body
    const newComment = { user, comment }

    post.comments.push(newComment)
    await post.save()

    await createNotification({
      user: post.author,
      type: 'newComment',
      fromUser: user,
      relatedPost: post._id
    })

    res.status(201).json(post)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Delete post
// @route   DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (post) {
      await post.deleteOne()
      res.json({ message: 'Post removed' })
    } else {
      res.status(404).json({ message: 'Post not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
