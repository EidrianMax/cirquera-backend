import mongoose from 'mongoose'

const followSchema = new mongoose.Schema({
  follower: { // quien sigue
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: { // a quien sigue
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'], // pendiente de aprobación o aceptado
    default: 'pending'
  }
}, { timestamps: true })

followSchema.index({ follower: 1, following: 1 }, { unique: true })

export default mongoose.model('Follow', followSchema)
