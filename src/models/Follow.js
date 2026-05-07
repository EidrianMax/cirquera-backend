import mongoose from 'mongoose'

const followEntitySchema = new mongoose.Schema({
  refType: {
    type: String,
    enum: ['User', 'Company'],
    required: true
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'refType'
  }
}, { _id: false })

const followSchema = new mongoose.Schema({
  follower: { // quien sigue
    type: followEntitySchema,
    required: true
  },
  following: { // a quien sigue
    type: followEntitySchema,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'accepted'
  }
}, { timestamps: true })

followSchema.index(
  {
    'follower.refType': 1,
    'follower.refId': 1,
    'following.refType': 1,
    'following.refId': 1
  },
  { unique: true }
)

export default mongoose.model('Follow', followSchema)
