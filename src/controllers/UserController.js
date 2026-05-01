import Follow from '../models/Follow.js'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

const buildUserProfile = async (myId, user) => {
  const userId = user._id

  const [followersCount, followingCount, isFollowing, isPending] = await Promise.all([
    Follow.countDocuments({
      following: userId,
      status: 'accepted'
    }),
    Follow.countDocuments({
      follower: userId,
      status: 'accepted'
    }),
    Follow.exists({
      follower: myId,
      following: userId,
      status: 'accepted'
    }),
    Follow.exists({
      follower: myId,
      following: userId,
      status: 'pending'
    })
  ])

  return {
    user,
    stats: {
      followers: followersCount,
      following: followingCount
    },
    relationship: {
      isFollowing: !!isFollowing,
      isPending: !!isPending,
      isOwnProfile: myId.toString() === userId.toString()
    }
  }
}

const generateUsername = async (firstName, lastName) => {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  let username = base
  let exists = await User.findOne({ username })

  let i = 1
  while (exists) {
    username = `${base}-${i}`
    exists = await User.findOne({ username })
    i++
  }

  return username
}

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

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const username = await generateUsername(firstName, lastName)

    const user = await User.create({
      role,
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
      role: user.role
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Authenticate user
// @route   POST /api/users/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      })
    } else {
      res.status(401).json({ message: 'Invalid email or password' })
    }
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

    const profile = await buildUserProfile(myId, user)

    res.json(profile)
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

    let user = await User.findOne({ username })

    // 🔥 fallback: buscar en usernames antiguos
    if (!user) {
      user = await User.findOne({
        previousUsernames: username
      })
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // aquí reutilizas tu buildUserProfile
    const profile = await buildUserProfile(myId, user)

    res.json(profile)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update user profile
// @route   PUT /api/users/profile
export const updateMyUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.firstName = req.body.firstName || user.firstName
    user.lastName = req.body.lastName || user.lastName
    user.avatar = req.body.avatar || user.avatar
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
    const exists = await User.findOne({ username: newUsername })
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
