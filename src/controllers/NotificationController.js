import Notification from '../models/Notifications.js'

// @desc    Get user notifications
// @route   GET /api/notifications/:userId
export const getNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.params.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const notifications = await Notification.find({ user: req.params.userId })
      .populate('fromUser', 'name avatar role')
      .populate('relatedPost', 'content')
      .populate('relatedJob', 'title status')
      .sort({ createdAt: -1 })

    return res.json(notifications)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    if (req.user.role !== 'admin' && notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    notification.read = true
    await notification.save()
    return res.json(notification)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Create a notification (internal helper)
export const createNotification = async (data) => {
  try {
    await Notification.create(data)
  } catch (error) {
    console.error('Error creating notification:', error.message)
  }
}
