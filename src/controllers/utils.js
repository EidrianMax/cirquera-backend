import Company from '../models/Company.js'
import Follow from '../models/Follow.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'

export const buildProfile = async (myId, entityId, entityType) => {
  const [followersCount, followingCount, isFollowing, isPending] = await Promise.all([
    Follow.countDocuments({
      'following.refId': entityId,
      status: 'accepted'
    }),

    Follow.countDocuments({
      'follower.refId': entityId,
      status: 'accepted'
    }),

    Follow.exists({
      'follower.refId': myId,
      'following.refId': entityId,
      status: 'accepted'
    }),

    Follow.exists({
      'follower.refId': myId,
      'following.refId': entityId,
      status: 'pending'
    })
  ])

  return {
    stats: {
      followers: followersCount,
      following: followingCount
    },
    relationship: {
      isFollowing: !!isFollowing,
      isPending: !!isPending,
      isOwnProfile: myId.toString() === entityId.toString()
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
  let exists = await usernameExists(username)

  let i = 1
  while (exists) {
    username = `${base}-${i}`
    exists = await usernameExists(username)
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
  let exists = await usernameExists(username)

  let i = 1
  while (exists) {
    username = `${base}-${i}`
    exists = await usernameExists(username)
    i++
  }

  return username
}

const usernameExists = async (username) => {
  const [user, company] = await Promise.all([
    User.exists({ username }),
    Company.exists({ username })
  ])

  return !!user || !!company
}

export const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '30d'
  })
}
