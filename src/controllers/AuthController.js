import User from '../models/User.js'
import Company from '../models/Company.js'
import { generateToken } from './utils.js'

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // 🔍 buscar primero en User
    let account = await User.findOne({ email })
    let type = 'user'

    // 🔍 si no existe, buscar en Company
    if (!account) {
      account = await Company.findOne({ email })
      type = 'company'
    }

    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isValid = await account.matchPassword(password)

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    res.json({
      _id: account._id,
      email: account.email,
      username: account.username,
      name: account.name || [account.firstName, account.lastName].filter(Boolean).join(' '),
      role: type === 'company' ? 'company' : account.role,
      status: account.status || 'active',
      type,
      token: generateToken(account._id, type)
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
