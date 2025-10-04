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
    console.log('🔧 Setting up Cloudinary upload...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'bwca_photos')
    
    // Add format conversion for HEIC files
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      formData.append('format', 'jpg') // Convert HEIC to JPG
      formData.append('quality', 'auto') // Auto-optimize quality
      formData.append('fetch_format', 'auto') // Auto-detect best format
      console.log('📱 Uploading HEIC file, Cloudinary will convert to JPG with auto-optimization')
    }
    
    // Extract cloud name from CLOUDINARY_URL or use env var
    const cloudName = process.env.CLOUDINARY_URL 
      ? process.env.CLOUDINARY_URL.split('@')[1] 
      : process.env.CLOUDINARY_CLOUD_NAME
    
    console.log('☁️ Cloud name:', cloudName)
    
    if (!cloudName) {
      console.error('❌ Cloudinary cloud name not found')
      reject(new Error('Cloudinary cloud name not found'))
      return
    }
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    console.log('🌐 Upload URL:', uploadUrl)
    console.log('📤 Starting Cloudinary request...')
    
    fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      console.log('📡 Cloudinary response status:', response.status)
      return response.json()
    })
    .then(data => {
      console.log('📊 Cloudinary upload response:', data)
      if (data.secure_url) {
        console.log('✅ Upload successful, URL:', data.secure_url)
        resolve(data.secure_url)
      } else {
        console.error('❌ Upload failed, error:', data.error)
        reject(new Error('Upload failed: ' + (data.error?.message || 'Unknown error')))
      }
    })
    .catch(error => {
      console.error('❌ Cloudinary upload error:', error)
      reject(error)
    })
  })
}
