import multer from 'multer'
import path from 'path'

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
  }
})

// Check file type
function checkFileType (file, cb) {
  const filetypes = /jpg|jpeg|png|mp4|mov|avi/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error('Error: Images and Videos Only!'))
  }
}

// Init upload
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb)
  }
})

export default upload
