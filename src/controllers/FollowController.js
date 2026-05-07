import Follow from '../models/Follow.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import { createNotification } from './NotificationController.js'

const getAuthEntityType = (authType) => authType === 'company' ? 'Company' : 'User'

const normalizeEntityType = (type) => {
  if (type === 'company') return 'Company'
  if (type === 'user') return 'User'
  return type
}

const getModelForType = (type) => type === 'Company' ? Company : User

const getEntityExists = async ({ refType, refId }) => {
  const Model = getModelForType(refType)
  return Model.exists({ _id: refId })
}

const serializeEntity = (entity, entityType) => {
  if (!entity) return null

  return {
    _id: entity._id,
    entityType,
    username: entity.username,
    name: entityType === 'Company'
      ? entity.name
      : [entity.firstName, entity.lastName].filter(Boolean).join(' '),
    firstName: entity.firstName,
    lastName: entity.lastName,
    avatar: entity.avatar,
    logo: entity.logo,
    location: entity.location,
    jobTitle: entity.jobTitle
  }
}

const hydrateFollows = async (follows, side) => {
  const idsByType = follows.reduce((acc, follow) => {
    const entity = follow[side]
    if (!entity?.refType || !entity?.refId) return acc

    acc[entity.refType] = acc[entity.refType] || []
    acc[entity.refType].push(entity.refId)
    return acc
  }, {})

  const [users, companies] = await Promise.all([
    idsByType.User?.length
      ? User.find({ _id: { $in: idsByType.User } }).select('firstName lastName username avatar location jobTitle')
      : [],
    idsByType.Company?.length
      ? Company.find({ _id: { $in: idsByType.Company } }).select('name username logo location')
      : []
  ])

  const entitiesByKey = new Map([
    ...users.map(user => [`User:${user._id.toString()}`, user]),
    ...companies.map(company => [`Company:${company._id.toString()}`, company])
  ])

  return follows
    .map((follow) => {
      const entityRef = follow[side]
      if (!entityRef?.refType || !entityRef?.refId) return null

      const entity = entitiesByKey.get(`${entityRef.refType}:${entityRef.refId.toString()}`)

      if (!entity) return null

      return {
        followId: follow._id,
        status: follow.status,
        entityType: entityRef.refType,
        entity: serializeEntity(entity, entityRef.refType)
      }
    })
    .filter(Boolean)
}

// @desc    Follow a user or company
// @route   POST /api/follows
export const follow = async (req, res) => {
  try {
    const follower = {
      refType: getAuthEntityType(req.authType),
      refId: req.user.id
    }
    const following = {
      refType: normalizeEntityType(req.body.following?.refType || req.body.followingType),
      refId: req.body.following?.refId || req.body.followingId
    }

    if (!following.refType || !following.refId) {
      return res.status(400).json({ message: 'Following target is required' })
    }

    if (follower.refType === following.refType && follower.refId.toString() === following.refId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' })
    }

    const targetExists = await getEntityExists(following)
    if (!targetExists) {
      return res.status(404).json({ message: 'Profile to follow not found' })
    }

    const exists = await Follow.findOne({
      'follower.refType': follower.refType,
      'follower.refId': follower.refId,
      'following.refType': following.refType,
      'following.refId': following.refId
    })

    if (exists) {
      return res.status(400).json({ message: 'Already following' })
    }

    const follow = await Follow.create({
      follower,
      following,
      status: 'accepted'
    })

    if (following.refType === 'User') {
      await createNotification({
        user: following.refId,
        type: 'newFollower',
        fromUser: follower.refType === 'User' ? follower.refId : undefined
      })
    }

    res.status(201).json(follow)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Accept follow request
// @route   PUT /api/follows/:id/accept
export const acceptFollowRequest = async (req, res) => {
  try {
    const follow = await Follow.findById(req.params.id)
    if (!follow) return res.status(404).json({ message: 'Follow request not found' })

    const authEntityType = getAuthEntityType(req.authType)
    if (
      follow.following.refType !== authEntityType ||
      follow.following.refId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    follow.status = 'accepted'
    await follow.save()

    res.json(follow)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Unfollow a user or company
// @route   DELETE /api/follows/:id
export const unfollow = async (req, res) => {
  try {
    const authEntityType = getAuthEntityType(req.authType)
    const follow = await Follow.findOneAndDelete({
      _id: req.params.id,
      'follower.refType': authEntityType,
      'follower.refId': req.user.id
    })

    if (!follow) {
      return res.status(404).json({ message: 'Follow relationship not found' })
    }

    res.json({ message: 'Unfollowed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get public followers/following list
// @route   GET /api/follows/:entityId?entityType=User&type=followers
export const getFollows = async (req, res) => {
  try {
    const { entityId } = req.params
    const listType = req.query.type === 'following' ? 'following' : 'followers'
    const entityType = normalizeEntityType(req.query.entityType) || 'User'

    const query = listType === 'followers'
      ? {
          'following.refType': entityType,
          'following.refId': entityId,
          status: 'accepted'
        }
      : {
          'follower.refType': entityType,
          'follower.refId': entityId,
          status: 'accepted'
        }

    const follows = await Follow.find(query).sort({ createdAt: -1 })
    const sideToHydrate = listType === 'followers' ? 'follower' : 'following'
    const hydrated = await hydrateFollows(follows, sideToHydrate)

    res.json(hydrated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
