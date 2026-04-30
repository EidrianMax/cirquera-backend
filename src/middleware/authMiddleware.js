import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required')
  }

  return process.env.JWT_SECRET
}

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.split(' ')[1]
}

const resolveUserFromToken = async (token) => {
  const decoded = jwt.verify(token, getJwtSecret())
  const user = await User.findById(decoded.id)

  if (!user) {
    throw new Error('User not found')
  }

  if (user.status === 'suspended') {
    const error = new Error('User account is suspended')
    error.statusCode = 403
    throw error
  }

  return user
}

export const protect = async (req, res, next) => {
  const token = getBearerToken(req)

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' })
  }

  try {
    req.user = await resolveUserFromToken(token)
    next()
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      message: error.message === 'JWT_SECRET is required'
        ? 'Server authentication is not configured'
        : error.statusCode
          ? error.message
          : 'Not authorized, token failed'
    })
  }
}

export const optionalAuth = async (req, res, next) => {
  const token = getBearerToken(req)

  if (!token) {
    return next()
  }

  try {
    req.user = await resolveUserFromToken(token)
  } catch (error) {
    req.user = null
  }

  next()
}

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }

  return res.status(403).json({ message: 'Not authorized as an admin' })
}

export const companyOrAdmin = (req, res, next) => {
  if (req.user && ['company', 'admin'].includes(req.user.role)) {
    return next()
  }

  return res.status(403).json({ message: 'Only companies or admins can perform this action' })
}
