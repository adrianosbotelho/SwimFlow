import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const unlinkAsync = promisify(fs.unlink)
const existsAsync = promisify(fs.exists)

export class ImageService {
  private static uploadsDir = path.join(process.cwd(), 'uploads')
  private static profileImagesDir = path.join(this.uploadsDir, 'profile-images')

  /**
   * Ensure upload directories exist
   */
  static ensureDirectories(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true })
    }
    
    if (!fs.existsSync(this.profileImagesDir)) {
      fs.mkdirSync(this.profileImagesDir, { recursive: true })
    }
  }

  /**
   * Delete an image file safely
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      if (await existsAsync(imagePath)) {
        await unlinkAsync(imagePath)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      // Don't throw error - image deletion failure shouldn't break the main operation
    }
  }

  /**
   * Get full file path from image URL
   */
  static getFilePathFromUrl(imageUrl: string): string {
    const filename = path.basename(imageUrl)
    return path.join(this.profileImagesDir, filename)
  }

  /**
   * Generate image URL for client
   */
  static generateImageUrl(filename: string): string {
    return `/uploads/profile-images/${filename}`
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ]

    if (!allowedMimes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 5MB.'
      }
    }

    return { valid: true }
  }

  /**
   * Clean up orphaned image files (images not referenced by any entity)
   */
  static async cleanupOrphanedImages(): Promise<number> {
    try {
      const files = fs.readdirSync(this.profileImagesDir)
      let deletedCount = 0

      // This would need to be implemented with database queries
      // to check which images are still referenced
      // For now, just return 0
      
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up orphaned images:', error)
      return 0
    }
  }
}

// Initialize directories on module load
ImageService.ensureDirectories()