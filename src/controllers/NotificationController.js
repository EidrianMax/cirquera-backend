import Notification from '../models/Notifications.js'

// @desc    Get user notifications
// @route   GET /api/notifications/:userId
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.params.userId })
      .populate('fromUser', 'name avatar')
      .populate('relatedPost', 'content')
      .populate('relatedJob', 'title')
      .sort({ createdAt: -1 })

    res.json(notifications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (notification) {
      notification.read = true
      await notification.save()
      res.json(notification)
    } else {
      res.status(404).json({ message: 'Notification not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Create a notification (Internal function usually called from other controllers)
export const createNotification = async (data) => {
  try {
    await Notification.create(data)
  } catch (error) {
    console.error('Error creating notification:', error.message)
  }
}
