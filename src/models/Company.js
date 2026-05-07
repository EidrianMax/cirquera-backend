import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const imageSchema = new mongoose.Schema({
  filename: String,
  path: String,
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false })

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  logo: imageSchema,
  location: String,
  description: String,
  industry: String,
  website: String,
  socialLinks: {
    linkedin: String,
    instagram: String,
    website: String
  }
}, { timestamps: true })

// Hash password before saving
companySchema.pre('save', async function () {
  if (!this.isModified('password')) return

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Method to compare password
companySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

companySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v
    delete ret.password
  }
})

export default mongoose.model('Company', companySchema)
