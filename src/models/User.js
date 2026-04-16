import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const experienceSchema = new mongoose.Schema({
  role: String,
  company: String,
  startDate: Date,
  endDate: Date,
  description: String
}, { _id: false })

const portfolioItemSchema = new mongoose.Schema({
  url: String,
  type: { type: String, enum: ['image', 'video'] },
  description: String
}, { _id: true })

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['talent', 'company', 'admin'],
    required: true
  },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  avatar: String,
  location: String,
  bio: String,
  skills: [{ type: String }],
  experience: [experienceSchema],
  portfolio: [portfolioItemSchema],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true })

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v
    delete ret.password
  }
})

export default mongoose.model('User', userSchema)
