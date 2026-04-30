import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  talent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: String
}, { timestamps: true })

applicationSchema.index({ job: 1, talent: 1 }, { unique: true })

export default mongoose.model('Application', applicationSchema)
