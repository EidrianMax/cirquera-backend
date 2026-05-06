import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['user', 'company', 'job', 'post'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetName: String,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true },
  evidence: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolution: String,
  actionTaken: String
}, { timestamps: true })

reportSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v
  }
})

export default mongoose.model('Report', reportSchema)
