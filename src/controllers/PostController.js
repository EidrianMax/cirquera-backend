import Post from '../models/Post.js'
import Company from '../models/Company.js'
import User from '../models/User.js'
import cloudinary from 'cloudinary'
import streamifier from 'streamifier'

const getAuthRef = (req) => ({
  refType: req.authType === 'company' ? 'Company' : 'User',
  refId: req.user._id
})

const isSameRef = (left, right) =>
  left?.refType === right?.refType &&
  left?.refId?.toString() === right?.refId?.toString()

const getModelByType = (type) => type === 'Company' ? Company : User

const normalizePostAuthor = (author, authorModel) => {
  if (!author) return author

  const normalizedAuthor = author.toObject ? author.toObject() : author
  const displayName =
    normalizedAuthor.name ||
    [normalizedAuthor.firstName, normalizedAuthor.lastName].filter(Boolean).join(' ') ||
    normalizedAuthor.username ||
    'Perfil'

  return {
    ...normalizedAuthor,
    displayName,
    profileImage: authorModel === 'Company'
      ? normalizedAuthor.logo
      : normalizedAuthor.avatar
  }
}

const normalizeAccount = (account, type) => {
  if (!account) return null

  const raw = account.toObject ? account.toObject() : account
  const displayName =
    raw.name ||
    [raw.firstName, raw.lastName].filter(Boolean).join(' ') ||
    raw.username ||
    'Perfil'

  return {
    _id: raw._id,
    type: type === 'Company' ? 'company' : 'user',
    username: raw.username,
    displayName,
    image: type === 'Company' ? raw.logo : raw.avatar
  }
}

const findAccountByRef = async (ref) => {
  if (!ref?.refType || !ref?.refId) return null

  const account = await getModelByType(ref.refType)
    .findById(ref.refId)
    .select('firstName lastName name username avatar logo')

  return normalizeAccount(account, ref.refType)
}

const populatePostAuthor = (query) =>
  query.populate({
    path: 'author',
    select: 'firstName lastName name username avatar logo jobTitle role'
  })

const normalizePost = async (post, viewerRef = null) => {
  const normalizedPost = post.toObject ? post.toObject() : post
  const likes = normalizedPost.likes || []
  const comments = normalizedPost.comments || []

  normalizedPost.author = normalizePostAuthor(
    normalizedPost.author,
    normalizedPost.authorModel
  )
  normalizedPost.likesCount = likes.length
  normalizedPost.commentsCount = comments.length
  normalizedPost.sharesCount = 0
  normalizedPost.isLiked = viewerRef
    ? likes.some((like) => isSameRef(like, viewerRef))
    : false
  normalizedPost.comments = await Promise.all(
    comments.map(async (comment) => ({
      ...comment,
      author: await findAccountByRef(comment.author)
    }))
  )

  return normalizedPost
}

// @desc    Create a new post
// @route   POST /api/posts
export const createPost = async (req, res) => {
  try {
    const author = req.user?._id
    const authorModel = req.authType === 'company' ? 'Company' : 'User'
    const { content } = req.body
    const file = req.file

    // Validaciones básicas
    if (!author) {
      return res.status(400).json({ message: 'Missing author' })
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' })
    }

    let media = null

    // Solo subir si hay archivo
    if (file) {
      const uploadFromBuffer = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            { folder: 'cirquera/posts', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )

          streamifier.createReadStream(file.buffer).pipe(stream)
        })

      const result = await uploadFromBuffer()

      media = {
        path: result.secure_url,
        type: result.resource_type === 'video' ? 'video' : 'image'
      }
    }

    const post = await Post.create({
      author,
      authorModel,
      content: content.trim(),
      media
    })

    const populatedPost = await populatePostAuthor(Post.findById(post._id))

    res.status(201).json(await normalizePost(populatedPost, getAuthRef(req)))
  } catch (error) {
    console.log('❌ CREATE POST ERROR:', error)
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all posts (Feed)
// @route   GET /api/posts
export const getPosts = async (req, res) => {
  try {
    const posts = await populatePostAuthor(Post.find())
      .sort({ createdAt: -1 })

    const normalizedPosts = await Promise.all(
      posts.map((post) => normalizePost(post, getAuthRef(req)))
    )

    res.json(normalizedPosts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get post by ID
// @route   GET /api/posts/:id
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'firstName lastName name username avatar logo jobTitle role')
    if (post) {
      res.json(await normalizePost(post, req.user ? getAuthRef(req) : null))
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

    const viewerRef = getAuthRef(req)
    const alreadyLiked = post.likes.some((like) => isSameRef(like, viewerRef))

    if (alreadyLiked) {
      post.likes = post.likes.filter((like) => !isSameRef(like, viewerRef))
    } else {
      post.likes.push(viewerRef)
    }

    await post.save()

    const populatedPost = await populatePostAuthor(Post.findById(post._id))
    res.json(await normalizePost(populatedPost, viewerRef))
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

    const { comment } = req.body

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' })
    }

    const newComment = {
      author: getAuthRef(req),
      comment: comment.trim()
    }

    post.comments.push(newComment)
    await post.save()

    const populatedPost = await populatePostAuthor(Post.findById(post._id))
    res.status(201).json(await normalizePost(populatedPost, getAuthRef(req)))
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
