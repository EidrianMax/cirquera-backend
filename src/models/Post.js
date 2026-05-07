import mongoose from 'mongoose'

const accountRefSchema = new mongoose.Schema({
  refType: {
    type: String,
    enum: ['User', 'Company'],
    required: true
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, { _id: false })

const commentSchema = new mongoose.Schema({
  author: { type: accountRefSchema, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorModel'
  },
  authorModel: {
    type: String,
    enum: ['User', 'Company'],
    required: true
  },
  content: { type: String, required: true },
  media: {
    path: {
      type: String,
      required: function () {
        return this.media?.type != null
      }
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: function () {
        return this.media?.path != null
      }
    },
    uploadedAt: { type: Date, default: Date.now }
  },
  uploadedAt: { type: Date, default: Date.now },
  likes: [accountRefSchema],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.model('Post', postSchema)
