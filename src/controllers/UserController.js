import User from '../models/User.js'
import Company from '../models/Company.js'
import { generateUsername, buildProfile } from './utils.js'

// @desc    Get users with filters
// @route   GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const { skill, location } = req.query

    const filters = {
      ...(location && {
        location: { $regex: location, $options: 'i' }
      }),
      ...(skill && {
        skills: {
          $in: [new RegExp(`^${skill}$`, 'i')]
        }
      })
    }

    const users = await User.find(filters)
      .select('-password -__v')
      .lean()

    return res.json(users)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Register a new user
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { role, firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: 'firstName, lastName, email and password are required'
      })
    }

    if (role && role !== 'talent' && role !== 'admin') {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const username = await generateUsername(firstName, lastName)

    const user = await User.create({
      role: role || 'talent',
      firstName,
      lastName,
      email,
      username,
      password
    })

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      type: 'user'
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get my profile
// @route   GET /api/users/profile
export const getMyUser = async (req, res) => {
  try {
    const myId = req.user.id

    const user = await User.findById(myId).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const profile = await buildProfile(myId, user._id, 'User')

    res.json({
      type: 'user',
      user,
      ...profile
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get user profile
// @route   GET /api/users/:username
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params
    const myId = req.user.id

    const user = await User.findOne({ username })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const profile = await buildProfile(myId, user._id, 'User')

    res.json({
      type: 'user',
      user,
      ...profile
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update user profile
// @route   PUT /api/users/me
export const updateMyUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // No manejar avatar aquí - usar endpoint específico
    user.firstName = req.body.firstName || user.firstName
    user.lastName = req.body.lastName || user.lastName
    user.location = req.body.location || user.location
    user.bio = req.body.bio || user.bio
    user.skills = req.body.skills || user.skills
    user.experience = req.body.experience || user.experience
    user.portfolio = req.body.portfolio || user.portfolio

    const updatedUser = await user.save()

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateMyUsername = async (req, res) => {
  try {
    const userId = req.user.id
    const { newUsername } = req.body

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // comprobar si está en uso
    const [userExists, companyExists] = await Promise.all([
      User.findOne({ username: newUsername, _id: { $ne: userId } }),
      Company.findOne({ username: newUsername })
    ])

    const exists = userExists || companyExists
    if (exists) {
      return res.status(400).json({ message: 'Username already taken' })
    }

    // guardar el anterior
    user.previousUsernames.push(user.username)

    // actualizar
    user.username = newUsername

    await user.save()

    res.json({
      message: 'Username updated successfully',
      username: user.username
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update user avatar
// @route   PUT /api/users/me/avatar
export const updateMyAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Eliminar avatar anterior si existe
    if (user.avatar?.filename) {
      const fs = await import('fs')
      const path = await import('path')
      const oldFilePath = path.join(process.cwd(), 'uploads/avatars', user.avatar.filename)
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath)
      }
    }

    // Guardar nuevo avatar
    if (req.file) {
      user.avatar = {
        filename: req.file.filename,
        path: `/uploads/avatars/${req.file.filename}`,
        uploadedAt: new Date()
      }
    }

    const updatedUser = await user.save()

    res.json({
      message: 'Avatar updated successfully',
      avatar: updatedUser.avatar
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
