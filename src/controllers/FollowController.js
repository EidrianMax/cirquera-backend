import Follow from '../models/Follow.js'
import Company from '../models/Company.js'
import User from '../models/User.js'

const toModelType = (type) => {
  if (type === 'user') return 'User'
  if (type === 'company') return 'Company'
  return type
}

const getAuthRef = (req) => ({
  refType: req.authType === 'company' ? 'Company' : 'User',
  refId: req.user._id
})

const getModel = (type) => toModelType(type) === 'Company' ? Company : User

const formatAccount = (account, type) => {
  const raw = account.toObject ? account.toObject() : account
  const displayName =
    raw.name ||
    [raw.firstName, raw.lastName].filter(Boolean).join(' ') ||
    raw.username ||
    'Perfil'

  return {
    _id: raw._id,
    type: toModelType(type) === 'Company' ? 'company' : 'user',
    username: raw.username,
    displayName,
    location: raw.location,
    image: toModelType(type) === 'Company' ? raw.logo : raw.avatar
  }
}

const findAccount = async (ref) => {
  const Model = getModel(ref.refType)
  const account = await Model.findById(ref.refId).select('firstName lastName name username avatar logo location')
  if (!account) return null
  return formatAccount(account, ref.refType)
}

// @desc    Follow a user
// @route   POST /api/follows
export const follow = async (req, res) => {
  try {
    const follower = getAuthRef(req)
    const following = {
      refType: toModelType(req.body.following?.refType),
      refId: req.body.following?.refId
    }

    if (!following.refType || !following.refId) {
      return res.status(400).json({ message: 'Following profile is required' })
    }

    if (
      follower.refType === following.refType &&
      follower.refId.toString() === following.refId.toString()
    ) {
      return res.status(400).json({ message: 'You cannot follow yourself' })
    }

    const target = await getModel(following.refType).findById(following.refId)
    if (!target) {
      return res.status(404).json({ message: 'Profile not found' })
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

    follow.status = 'accepted'
    await follow.save()

    res.json(follow)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Unfollow a user
// @route   DELETE /api/follows/:entityType/:entityId
export const unfollow = async (req, res) => {
  try {
    const follower = getAuthRef(req)
    const following = {
      refType: toModelType(req.params.entityType),
      refId: req.params.entityId
    }

    await Follow.findOneAndDelete({
      'follower.refType': follower.refType,
      'follower.refId': follower.refId,
      'following.refType': following.refType,
      'following.refId': following.refId
    })

    res.json({ message: 'Unfollowed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get followers/following list
// @route   GET /api/follows/:entityType/:entityId/:listType
export const getFollows = async (req, res) => {
  try {
    const { entityId, listType } = req.params
    const entityType = toModelType(req.params.entityType)

    const query =
      listType === 'followers'
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

    const follows = await Follow.find(query)
    const refs = follows.map((follow) =>
      listType === 'followers' ? follow.follower : follow.following
    )

    const accounts = await Promise.all(refs.map(findAccount))

    res.json(accounts.filter(Boolean))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
