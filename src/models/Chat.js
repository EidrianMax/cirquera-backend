import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  participants: [{
    refType: {
      type: String,
      required: true
    },
    refId: {
      type: String,
      required: true
    }
  }],

  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }

}, { timestamps: true })

export default mongoose.model('Chat', chatSchema)
