import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  location: String,
  contractType: {
    type: String,
    enum: ['temporal', 'fijo', 'freelance']
  },
  skillsRequired: [{ type: String }],
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['active', 'rejected', 'closed', 'deleted'],
    default: 'active'
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model('Job', jobSchema)
