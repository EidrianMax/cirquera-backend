import Chat from '../models/Chat.js'
import Message from '../models/Message.js'
import User from '../models/User.js'

const isParticipant = (chat, userId) => chat.participants.some(id => id.toString() === userId)

// @desc    Start or get a chat between two users
// @route   POST /api/chats
export const accessChat = async (req, res) => {
  try {
    const userId = req.user.id
    const targetId = req.body.targetId

    if (!targetId || targetId === userId) {
      return res.status(422).json({ message: 'A valid target user is required' })
    }

    const targetUser = await User.findById(targetId)
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' })
    }

    let chat = await Chat.findOne({
      participants: { $all: [userId, targetId] }
    })
      .populate('participants', 'name avatar role')
      .populate('lastMessage')

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, targetId]
      })

      chat = await Chat.findById(chat._id)
        .populate('participants', 'name avatar role')
        .populate('lastMessage')
    }

    return res.json(chat)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get all chats for a user
// @route   GET /api/chats/:userId
export const getChats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.params.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const chats = await Chat.find({
      participants: { $in: [req.params.userId] }
    })
      .populate('participants', 'name avatar role')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name avatar role' }
      })
      .sort({ updatedAt: -1 })

    return res.json(chats)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Send a message
// @route   POST /api/chats/message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body

    if (!chatId || typeof content !== 'string' || !content.trim()) {
      return res.status(422).json({ message: 'chatId and content are required' })
    }

    const chat = await Chat.findById(chatId)
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    if (!isParticipant(chat, req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content: content.trim()
    })

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id })

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar role')

    return res.status(201).json(populatedMessage)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// @desc    Get all messages in a chat
// @route   GET /api/chats/messages/:chatId
export const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    if (!isParticipant(chat, req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 })

    return res.json(messages)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
