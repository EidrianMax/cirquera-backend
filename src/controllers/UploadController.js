import { deleteFile } from '../middleware/uploadMiddleware.js'

// @desc    Delete file by filename
// @route   DELETE /api/upload/:filename
export const deleteUploadedFile = async (req, res) => {
  try {
    const { filename } = req.params
    const userId = req.user.id

    // TODO: Implementar validación de ownership
    // Por ahora, solo eliminar si el archivo existe

    // Buscar en qué directorio está el archivo
    const fs = await import('fs')
    const path = await import('path')

    const possibleDirs = ['uploads/avatars', 'uploads/company-logos', 'uploads/posts', 'uploads/portfolio']
    let filePath = null

    for (const dir of possibleDirs) {
      const fullPath = path.join(process.cwd(), dir, filename)
      if (fs.existsSync(fullPath)) {
        filePath = fullPath
        break
      }
    }

    if (!filePath) {
      return res.status(404).json({ message: 'File not found' })
    }

    deleteFile(filePath)

    res.json({ message: 'File deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}