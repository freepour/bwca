// Cloudinary configuration for image hosting
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary using the URL format
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  })
} else {
  // Fallback to individual credentials if URL not available
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export { cloudinary }

export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'bwca_photos')
    
    // Extract cloud name from CLOUDINARY_URL or use env var
    const cloudName = process.env.CLOUDINARY_URL 
      ? process.env.CLOUDINARY_URL.split('@')[1] 
      : process.env.CLOUDINARY_CLOUD_NAME
    
    if (!cloudName) {
      reject(new Error('Cloudinary cloud name not found'))
      return
    }
    
    fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      console.log('Cloudinary upload response:', data)
      if (data.secure_url) {
        resolve(data.secure_url)
      } else {
        reject(new Error('Upload failed: ' + (data.error?.message || 'Unknown error')))
      }
    })
    .catch(error => {
      console.error('Cloudinary upload error:', error)
      reject(error)
    })
  })
}
