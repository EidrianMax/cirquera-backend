import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Company from '../models/Company.js'

export const protect = async (req, res, next) => {
  let token

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret_key'
      )

      let entity = null

      // 🔥 USER
      if (decoded.type === 'user') {
        entity = await User.findById(decoded.id)
      }

      // 🏢 COMPANY
      if (decoded.type === 'company') {
        entity = await Company.findById(decoded.id)
      }

      if (!entity) {
        return res.status(401).json({
          message: 'Not authorized, entity not found'
        })
      }

      req.user = entity
      req.authType = decoded.type

      return next()
    }

    return res.status(401).json({
      message: 'Not authorized, no token'
    })
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized, token failed'
    })
  }
}

export const admin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next()
  }

  return res.status(403).json({
    message: 'Not authorized as admin'
  })
}
