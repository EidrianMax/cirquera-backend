import Chat from '../models/Chat.js'
import Message from '../models/Message.js'

// @desc    Start or get a chat between two users
// @route   POST /api/chats
export const accessChat = async (req, res) => {
  try {
    const { userId, targetId } = req.body

    let chat = await Chat.findOne({
      participants: { $all: [userId, targetId] }
    }).populate('participants', 'firstName lastName avatar')
      .populate('lastMessage')

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, targetId]
      })
      chat = await Chat.findById(chat._id).populate('participants', 'firstName lastName avatar')
    }

    res.json(chat)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all chats for a user
// @route   GET /api/chats/:userId
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.params.userId] }
    }).populate('participants', 'firstName lastName avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })

    res.json(chats)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Send a message
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { chatId, sender, content } = req.body

    const message = await Message.create({
      chat: chatId,
      sender,
      content
    })

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id })

    res.status(201).json(message)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all messages in a chat
// @route   GET /api/messages/:chatId
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: 1 })

    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
