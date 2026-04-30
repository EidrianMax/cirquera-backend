import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

const USER_LIST_FIELDS = 'name email role status avatar location bio skills createdAt updatedAt'
const CHAT_USER_FIELDS = 'name role avatar location bio'

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

// @desc    Register a new user
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const role = req.body.role || 'talent'
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const email = normalizeEmail(req.body.email)
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    if (!['talent', 'company'].includes(role)) {
      return res.status(422).json({ message: 'Only talent or company accounts can be self-registered' })
    }

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || password.length < 6) {
      return res.status(422).json({ message: 'Invalid user data' })
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const user = await User.create({
      role,
      name,
      email,
      password
    })

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id)
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Authenticate user
// @route   POST /api/users/login
export const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(422).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'User account is suspended' })
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id)
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get authenticated user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers', 'name avatar role')
      .populate('following', 'name avatar role')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json(user)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Update authenticated user profile
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (isNonEmptyString(req.body.name)) user.name = req.body.name.trim()
    if (isNonEmptyString(req.body.avatar)) user.avatar = req.body.avatar.trim()
    if (isNonEmptyString(req.body.location)) user.location = req.body.location.trim()
    if (isNonEmptyString(req.body.bio)) user.bio = req.body.bio.trim()

    const skills = normalizeStringArray(req.body.skills)
    if (skills) user.skills = skills

    if (Array.isArray(req.body.experience)) user.experience = req.body.experience
    if (Array.isArray(req.body.portfolio)) user.portfolio = req.body.portfolio

    if (req.body.password !== undefined) {
      if (typeof req.body.password !== 'string' || req.body.password.length < 6) {
        return res.status(422).json({ message: 'Password must be at least 6 characters long' })
      }

      user.password = req.body.password
    }

    const updatedUser = await user.save()
    return res.json(updatedUser)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get all users (admin)
// @route   GET /api/users
export const getUsers = async (req, res) => {
  try {
    const { role, location, search, status } = req.query
    const query = {}

    if (role) query.role = role
    if (status) query.status = status
    if (location) query.location = { $regex: String(location), $options: 'i' }
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .select(USER_LIST_FIELDS)
      .sort({ createdAt: -1 })

    return res.json(users)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get users for chat lists
// @route   GET /api/users/getUsersForChat
export const getUsersForChat = async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const query = {
      _id: { $ne: req.user._id },
      status: 'active'
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .select(CHAT_USER_FIELDS)
      .sort({ name: 1 })

    return res.json(users)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
