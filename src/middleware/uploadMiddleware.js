import fs from 'fs'
import multer from 'multer'
import path from 'path'

const uploadsDir = path.resolve('uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
  }
})

// Check file type
function checkFileType (file, cb) {
  const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.avi'])
  const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ])

  const extname = allowedExtensions.has(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedMimeTypes.has(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  }

  return cb(new Error('Images and videos only'))
}

// Init upload
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb)
  }
})

export default upload
