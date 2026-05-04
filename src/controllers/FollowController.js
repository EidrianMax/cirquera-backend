import Follow from '../models/Follow.js'
import User from '../models/User.js'
import { createNotification } from './NotificationController.js'

// @desc    Follow a user
// @route   POST /api/follows
export const follow = async (req, res) => {
  try {
    const { follower, following } = req.body

    const exists = await Follow.findOne({
      'follower.refId': follower.refId,
      'following.refId': following.refId
    })

    if (exists) {
      return res.status(400).json({ message: 'Already following' })
    }

    const follow = await Follow.create({
      follower,
      following,
      status: 'pending'
    })

    await createNotification({
      user: following.refId,
      type: 'newFollower',
      fromUser: follower.refId
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

    await User.findByIdAndUpdate(follow.following, { $addToSet: { followers: follow.follower } })
    await User.findByIdAndUpdate(follow.follower, { $addToSet: { following: follow.following } })

    res.json(follow)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Unfollow a user
// @route   DELETE /api/follows/:id
export const unfollow = async (req, res) => {
  try {
    const { followerId, followingId } = req.body

    await Follow.findOneAndDelete({
      'follower.refId': followerId,
      'following.refId': followingId
    })

    res.json({ message: 'Unfollowed' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get followers/following list
// @route   GET /api/follows/:userId
export const getFollows = async (req, res) => {
  try {
    const { userId, type } = req.params

    const query =
      type === 'followers'
        ? { 'following.refId': userId, status: 'accepted' }
        : { 'follower.refId': userId, status: 'accepted' }

    const follows = await Follow.find(query)

    res.json(follows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
