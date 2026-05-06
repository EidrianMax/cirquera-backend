import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes imports
import userRoutes from './routes/userRoutes.js'
import companyRoutes from './routes/companyRoutes.js'
import authRoutes from './routes/authRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import postRoutes from './routes/postRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import followRoutes from './routes/followRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import cloudinary from 'cloudinary'

dotenv.config()

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(cors())
app.use(express.json())

// Static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api', (req, res) => res.send('API is running... 🚀'))

// Routes
app.use('/api/users', userRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/follows', followRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/upload', uploadRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 3000

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cirquera'

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => console.log(`${error} did not connect`))
