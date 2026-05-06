import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // a quien va la notificación
  type: {
    type: String,
    enum: ['newFollower', 'newComment', 'newLike', 'newApplication', 'jobAccepted'],
    required: true
  },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // quien generó la acción
  relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // opcional
  relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // opcional
  read: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
