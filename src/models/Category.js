import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  icon: { type: String, default: 'category' },
  skills: [{ type: String }]
}, { timestamps: true })

categorySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v
  }
})

export default mongoose.model('Category', categorySchema)
