import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

// @desc    Register a new user
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { role, name, surname, email, password } = req.body

    // support spanish keys as fallback
    const nationality = req.body.nationality || req.body.nacionalidad
    const phone = req.body.phone || req.body.telefono
    const gender = req.body.gender || req.body.genero
    const dateOfBirth = req.body.dateOfBirth || req.body.data_naixement || req.body.dob
    const bio = req.body.bio || req.body.info || req.body.extraInfo

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const fullName = surname ? `${name} ${surname}` : name

    const user = await User.create({
      role,
      name: fullName,
      surname,
      nationality,
      phone,
      gender,
      dateOfBirth,
      bio,
      email,
      password
    })

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      })
    } else {
      res.status(400).json({ message: 'Invalid user data' })
    }
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
        name: user.name,
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

// @desc    Get user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar')
    if (user) {
      res.json(user)
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update user profile
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (user) {
      user.name = req.body.name || user.name
      user.avatar = req.body.avatar || user.avatar
      user.location = req.body.location || user.location
      user.bio = req.body.bio || user.bio
      user.surname = req.body.surname || user.surname
      user.nationality = req.body.nationality || req.body.nacionalidad || user.nationality
      user.phone = req.body.phone || req.body.telefono || user.phone
      user.gender = req.body.gender || req.body.genero || user.gender
      user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth
      user.skills = req.body.skills || user.skills
      user.experience = req.body.experience || user.experience
      user.portfolio = req.body.portfolio || user.portfolio

      const updatedUser = await user.save()
      res.json(updatedUser)
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all users (with filters)
// @route   GET /api/users
export const getUsers = async (req, res) => {
  try {
    const { role, skill, location } = req.query
    const query = {}

    if (role) query.role = role
    if (location) query.location = { $regex: location, $options: 'i' }
    if (skill) query.skills = { $in: [skill] }

    const users = await User.find(query)
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
