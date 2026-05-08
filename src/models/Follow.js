import mongoose from 'mongoose'

const followSchema = new mongoose.Schema({
  follower: { // quien sigue
    refType: {
      type: String,
      enum: ['User', 'Company'],
      required: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  following: { // a quien sigue
    refType: {
      type: String,
      enum: ['User', 'Company'],
      required: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'], // pendiente de aprobación o aceptado
    default: 'pending'
  }
}, { timestamps: true })

followSchema.index({
  'follower.refType': 1,
  'follower.refId': 1,
  'following.refType': 1,
  'following.refId': 1
}, { unique: true })

export default mongoose.model('Follow', followSchema)
