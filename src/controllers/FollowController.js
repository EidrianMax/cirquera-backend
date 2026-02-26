import Follow from '../models/Follow.js'
import User from '../models/User.js'
import { createNotification } from './NotificationController.js'

// @desc    Follow a user
// @route   POST /api/follows
export const followUser = async (req, res) => {
  try {
    const { follower, following } = req.body

    // Verificar si ya existe el seguimiento
    const existingFollow = await Follow.findOne({ follower, following })
    if (existingFollow) {
      return res.status(400).json({ message: 'Already following or request pending' })
    }

    const targetUser = await User.findById(following)
    if (!targetUser) return res.status(404).json({ message: 'User not found' })

    // Si es una compañía, el seguimiento es automático, si es talento puede requerir aprobación
    // Pero basándonos en el requerimiento "Talent necesita aprobar seguidores; Company no"
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
export const unfollowUser = async (req, res) => {
  try {
    const follow = await Follow.findById(req.params.id)
    if (follow) {
      if (follow.status === 'accepted') {
        await User.findByIdAndUpdate(follow.following, { $pull: { followers: follow.follower } })
        await User.findByIdAndUpdate(follow.follower, { $pull: { following: follow.following } })
      }
      await follow.deleteOne()
      res.json({ message: 'Unfollowed successfully' })
    } else {
      res.status(404).json({ message: 'Follow record not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get followers/following list
// @route   GET /api/follows/:userId
export const getFollows = async (req, res) => {
  try {
    const { userId } = req.params
    const { type } = req.query // 'followers' or 'following'

    let result
    if (type === 'followers') {
      result = await Follow.find({ following: userId, status: 'accepted' }).populate('follower', 'name avatar bio')
    } else {
      result = await Follow.find({ follower: userId, status: 'accepted' }).populate('following', 'name avatar bio')
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
