import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Crear directorios si no existen
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Configuraciones por tipo de archivo
const uploadConfigs = {
  avatar: {
    dest: 'uploads/avatars/',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: /jpg|jpeg|png/
  },
  logo: {
    dest: 'uploads/company-logos/',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: /jpg|jpeg|png/
  },
  post: {
    dest: 'uploads/posts/',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: /jpg|jpeg|png|mp4|mov|avi/
  },
  portfolio: {
    dest: 'uploads/portfolio/',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: /jpg|jpeg|png|mp4|mov|avi/
  }
}

// Función para crear storage dinámico
const createStorage = (dest) => {
  createDirIfNotExists(dest)
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dest)
    },
    filename: (req, file, cb) => {
      const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
      cb(null, uniqueName)
    }
  })
}

// Función para validar archivos
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error(`Error: Solo archivos de tipo ${allowedTypes} permitidos!`))
    }
  }
}

// Crear uploads específicos
export const uploadAvatar = multer({
  storage: createStorage(uploadConfigs.avatar.dest),
  limits: { fileSize: uploadConfigs.avatar.maxSize },
  fileFilter: createFileFilter(uploadConfigs.avatar.allowedTypes)
}).single('avatar')

export const uploadLogo = multer({
  storage: createStorage(uploadConfigs.logo.dest),
  limits: { fileSize: uploadConfigs.logo.maxSize },
  fileFilter: createFileFilter(uploadConfigs.logo.allowedTypes)
}).single('logo')

export const uploadPostMedia = multer({
  storage: createStorage(uploadConfigs.post.dest),
  limits: { fileSize: uploadConfigs.post.maxSize },
  fileFilter: createFileFilter(uploadConfigs.post.allowedTypes)
}).array('media', 10) // Máximo 10 archivos

export const uploadPortfolio = multer({
  storage: createStorage(uploadConfigs.portfolio.dest),
  limits: { fileSize: uploadConfigs.portfolio.maxSize },
  fileFilter: createFileFilter(uploadConfigs.portfolio.allowedTypes)
}).array('portfolio', 20) // Máximo 20 archivos

// Función helper para eliminar archivos
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error eliminando archivo:', error)
  }
}

// Función helper para validar ownership
export const validateFileOwnership = (userId, filePath) => {
  // Esta función se implementará en los controllers
  return true // Placeholder
}
