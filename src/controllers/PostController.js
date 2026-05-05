import Post from '../models/Post.js'
import { createNotification } from './NotificationController.js'

// @desc    Create a new post
// @route   POST /api/posts
export const createPost = async (req, res) => {
  try {
    const { content } = req.body
    const author = req.user.id

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' })
    }

    // Procesar archivos multimedia
    let media = []
    if (req.files && req.files.length > 0) {
      media = req.files.map(file => ({
        filename: file.filename,
        path: `/uploads/posts/${file.filename}`,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        uploadedAt: new Date()
      }))
    }

    const post = await Post.create({
      author,
      content: content.trim(),
      media
    })

    res.status(201).json(post)
  } catch (error) {
    console.log('❌ CREATE POST ERROR:', error)
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

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Verificar que el usuario es el autor
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' })
    }

    // Eliminar archivos multimedia del disco
    if (post.media && Array.isArray(post.media)) {
      const fs = await import('fs')
      const path = await import('path')

      for (const media of post.media) {
        const filePath = path.join(process.cwd(), 'uploads/posts', media.filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
    }

    await post.deleteOne()
    res.json({ message: 'Post removed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Add media to existing post
// @route   POST /api/posts/:id/media
export const addPostMedia = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Verificar que el usuario es el autor
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this post' })
    }

    // Procesar nuevos archivos
    let newMedia = []
    if (req.files && req.files.length > 0) {
      newMedia = req.files.map(file => ({
        filename: file.filename,
        path: `/uploads/posts/${file.filename}`,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        uploadedAt: new Date()
      }))
    }

    // Agregar a la media existente
    post.media = [...(post.media || []), ...newMedia]
    await post.save()

    res.json(post)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
