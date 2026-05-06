import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  media: {
    path: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.model('Post', postSchema)
