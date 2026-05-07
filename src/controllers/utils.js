import Company from '../models/Company.js'
import Follow from '../models/Follow.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const normalizeEntityType = (type) => type === 'company' ? 'Company' : type === 'user' ? 'User' : type

export const buildProfile = async (myId, entityId, entityType, myEntityType = 'User') => {
  const targetType = normalizeEntityType(entityType)
  const viewerType = normalizeEntityType(myEntityType)
  const [followersCount, followingCount, relationship] = await Promise.all([
    Follow.countDocuments({
      'following.refType': targetType,
      'following.refId': entityId,
      status: 'accepted'
    }),

    Follow.countDocuments({
      'follower.refType': targetType,
      'follower.refId': entityId,
      status: 'accepted'
    }),

    Follow.findOne({
      'follower.refType': viewerType,
      'follower.refId': myId,
      'following.refType': targetType,
      'following.refId': entityId
    })
  ])
  const isOwnProfile = viewerType === targetType && myId.toString() === entityId.toString()

  return {
    stats: {
      followers: followersCount,
      following: followingCount
    },
    relationship: {
      followId: relationship?._id || null,
      isFollowing: relationship?.status === 'accepted',
      isPending: relationship?.status === 'pending',
      isOwnProfile
    }
  }
}

export const generateUsername = async (firstName, lastName) => {
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

export const generateCompanyUsername = async (name) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  let username = base
  let exists = await Company.findOne({ username })

  let i = 1
  while (exists) {
    username = `${base}-${i}`
    exists = await Company.findOne({ username })
    i++
  }

  return username
}

export const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '30d'
  })
}
