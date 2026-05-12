import Chat from '../models/Chat.js'
import Company from '../models/Company.js'
import Message from '../models/Message.js'
import User from '../models/User.js'

const toModelType = (type) => {
  if (type === 'company') return 'Company'
  if (type === 'user') return 'User'
  return type
}

const getModel = (type) => toModelType(type) === 'Company' ? Company : User

const getAuthRef = (req) => ({
  refType: req.authType === 'company' ? 'Company' : 'User',
  refId: req.user._id
})

const isSameRef = (left, right) =>
  (left?.refType
    ? left.refType === right?.refType && left?.refId?.toString() === right?.refId?.toString()
    : right?.refType === 'User' && left?.toString() === right?.refId?.toString())

const formatAccount = (account, type) => {
  if (!account) return null

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
    firstName: raw.firstName,
    lastName: raw.lastName,
    name: raw.name,
    displayName,
    avatar: raw.avatar,
    logo: raw.logo,
    image: toModelType(type) === 'Company' ? raw.logo : raw.avatar
  }
}

const findAccountByRef = async (ref) => {
  if (!ref?.refType && ref?.toString()) {
    const account = await User.findById(ref).select('firstName lastName name username avatar logo')
    return formatAccount(account, 'User')
  }

  if (!ref?.refType || !ref?.refId) return null

  const account = await getModel(ref.refType)
    .findById(ref.refId)
    .select('firstName lastName name username avatar logo')

  return formatAccount(account, ref.refType)
}

const normalizeMessage = async (message) => {
  if (!message) return null

  const normalizedMessage = message.toObject ? message.toObject() : message
  normalizedMessage.sender = await findAccountByRef(normalizedMessage.sender)
  return normalizedMessage
}

const normalizeChat = async (chat) => {
  const normalizedChat = chat.toObject ? chat.toObject() : chat

  normalizedChat.participants = await Promise.all(
    (normalizedChat.participants || []).map(findAccountByRef)
  )
  normalizedChat.participants = normalizedChat.participants.filter(Boolean)
  normalizedChat.lastMessage = await normalizeMessage(normalizedChat.lastMessage)

  return normalizedChat
}

const getTargetRef = (body) => {
  if (body.target?.refType && body.target?.refId) {
    return {
      refType: toModelType(body.target.refType),
      refId: body.target.refId
    }
  }

  if (body.targetType && body.targetId) {
    return {
      refType: toModelType(body.targetType),
      refId: body.targetId
    }
  }

  if (body.targetId) {
    return {
      refType: 'User',
      refId: body.targetId
    }
  }

  return null
}

// @desc    List profiles that can be used to start a chat
// @route   GET /api/chats/profiles/available
export const getChatProfiles = async (req, res) => {
  try {
    const me = getAuthRef(req)
    const [users, companies] = await Promise.all([
      User.find().select('firstName lastName username avatar'),
      Company.find().select('name username logo')
    ])

    const profiles = [
      ...users
        .filter((user) => !(me.refType === 'User' && user._id.toString() === me.refId.toString()))
        .map((user) => formatAccount(user, 'User')),
      ...companies
        .filter((company) => !(me.refType === 'Company' && company._id.toString() === me.refId.toString()))
        .map((company) => formatAccount(company, 'Company'))
    ]

    res.json(profiles)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Start or get a chat between two accounts
// @route   POST /api/chats
export const accessChat = async (req, res) => {
  try {
    const me = getAuthRef(req)
    const target = getTargetRef(req.body)

    if (!target?.refType || !target?.refId) {
      return res.status(400).json({ message: 'Target profile is required' })
    }

    if (isSameRef(me, target)) {
      return res.status(400).json({ message: 'You cannot chat with yourself' })
    }

    const targetAccount = await getModel(target.refType).findById(target.refId)
    if (!targetAccount) {
      return res.status(404).json({ message: 'Target profile not found' })
    }

    let chat = await Chat.findOne({
      $and: [
        { participants: { $elemMatch: { refType: me.refType, refId: me.refId } } },
        { participants: { $elemMatch: { refType: target.refType, refId: target.refId } } }
      ]
    }).populate('lastMessage')

    if (!chat) {
      chat = await Chat.create({
        participants: [me, target]
      })
      chat = await Chat.findById(chat._id).populate('lastMessage')
    }

    res.json(await normalizeChat(chat))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all chats for the authenticated account
// @route   GET /api/chats/:userId
export const getChats = async (req, res) => {
  try {
    const me = getAuthRef(req)
    const chats = await Chat.find({
      $or: [
        { participants: { $elemMatch: { refType: me.refType, refId: me.refId } } },
        ...(me.refType === 'User' ? [{ participants: { $in: [me.refId] } }] : [])
      ]
    })
      .populate('lastMessage')
      .sort({ updatedAt: -1 })

    res.json(await Promise.all(chats.map(normalizeChat)))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Send a message
// @route   POST /api/chats/messages
export const sendMessage = async (req, res) => {
  try {
    const sender = getAuthRef(req)
    const { chatId, content } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' })
    }

    const chat = await Chat.findById(chatId)
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const isParticipant = chat.participants.some((participant) => isSameRef(participant, sender))
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized for this chat' })
    }

    const message = await Message.create({
      chat: chatId,
      sender,
      content: content.trim()
    })

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id })

    res.status(201).json(await normalizeMessage(message))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all messages in a chat
// @route   GET /api/chats/messages/:chatId
export const getMessages = async (req, res) => {
  try {
    const me = getAuthRef(req)
    const chat = await Chat.findById(req.params.chatId)
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const isParticipant = chat.participants.some((participant) =>
      isSameRef(participant, me)
    )
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized for this chat' })
    }

    const messages = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 })
    res.json(await Promise.all(messages.map(normalizeMessage)))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
