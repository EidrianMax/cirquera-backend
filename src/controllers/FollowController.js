import Follow from '../models/Follow.js'
import User from '../models/User.js'
import { createNotification } from './NotificationController.js'

const canManageFollow = (follow, user) => (
  user.role === 'admin' ||
  follow.follower.toString() === user.id ||
  follow.following.toString() === user.id
)

// @desc    Follow a user
// @route   POST /api/follows
export const followUser = async (req, res) => {
  try {
    const follower = req.user.id
    const following = req.body.following

    if (!following) {
      return res.status(422).json({ message: 'Target user is required' })
    }

    if (follower === following) {
      return res.status(422).json({ message: 'You cannot follow yourself' })
    }

    const targetUser = await User.findById(following)
    if (!targetUser) return res.status(404).json({ message: 'User not found' })

    const existingFollow = await Follow.findOne({ follower, following })
    if (existingFollow) {
      return res.status(409).json({ message: 'Already following or request pending' })
    }

    const followStatus = targetUser.role === 'company' ? 'accepted' : 'pending'

    const follow = await Follow.create({
      follower,
      following,
      status: followStatus
    })

    if (followStatus === 'accepted') {
      await User.findByIdAndUpdate(following, { $addToSet: { followers: follower } })
      await User.findByIdAndUpdate(follower, { $addToSet: { following } })
    }

    await createNotification({
      user: following,
      type: 'newFollower',
      fromUser: follower
    })

    return res.status(201).json(follow)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already following or request pending' })
    }

    return res.status(500).json({ message: error.message })
  }
}

// @desc    Accept follow request
// @route   PUT /api/follows/:id/accept
export const acceptFollowRequest = async (req, res) => {
  try {
    const follow = await Follow.findById(req.params.id)
    if (!follow) return res.status(404).json({ message: 'Follow request not found' })

    if (req.user.role !== 'admin' && follow.following.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    follow.status = 'accepted'
    await follow.save()

    await User.findByIdAndUpdate(follow.following, { $addToSet: { followers: follow.follower } })
    await User.findByIdAndUpdate(follow.follower, { $addToSet: { following: follow.following } })

    return res.json(follow)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Unfollow a user
// @route   DELETE /api/follows/:id
export const unfollowUser = async (req, res) => {
  try {
    const follow = await Follow.findById(req.params.id)
    if (!follow) {
      return res.status(404).json({ message: 'Follow record not found' })
    }

    if (!canManageFollow(follow, req.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (follow.status === 'accepted') {
      await User.findByIdAndUpdate(follow.following, { $pull: { followers: follow.follower } })
      await User.findByIdAndUpdate(follow.follower, { $pull: { following: follow.following } })
    }

    await follow.deleteOne()
    return res.json({ message: 'Unfollowed successfully' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get followers/following list
// @route   GET /api/follows/:userId
export const getFollows = async (req, res) => {
  try {
    const { userId } = req.params
    const { type } = req.query

    let result
    if (type === 'followers') {
      result = await Follow.find({ following: userId, status: 'accepted' }).populate('follower', 'name avatar bio role')
    } else {
      result = await Follow.find({ follower: userId, status: 'accepted' }).populate('following', 'name avatar bio role')
    }

    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
