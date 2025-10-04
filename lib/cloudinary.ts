// Cloudinary configuration for image hosting
import { v2 as cloudinary } from 'cloudinary'
import crypto from 'crypto'

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

export async function uploadImage(file: File, photoDate?: string, uploadedBy?: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    // Extract credentials from CLOUDINARY_URL or use env vars
    let cloudName: string
    let apiKey: string
    let apiSecret: string

    if (process.env.CLOUDINARY_URL) {
      const url = process.env.CLOUDINARY_URL
      const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/)
      if (match) {
        apiKey = match[1]
        apiSecret = match[2]
        cloudName = match[3]
      } else {
        reject(new Error('Invalid CLOUDINARY_URL format'))
        return
      }
    } else {
      cloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
      apiKey = process.env.CLOUDINARY_API_KEY || ''
      apiSecret = process.env.CLOUDINARY_API_SECRET || ''
    }

    if (!cloudName || !apiKey || !apiSecret) {
      reject(new Error('Missing Cloudinary credentials'))
      return
    }
    
    // Generate signature for signed upload
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    // Build the string to sign with all parameters
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
      folder: 'bwca'
    }
    
    // Add format parameters for HEIC files to the signature
    // Note: Only include parameters that Cloudinary actually validates in the signature
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      params.format = 'jpg'
      // Don't include quality and fetch_format in signature - they're not validated
    }
    
    // Add context parameters to signature (Cloudinary validates these)
    if (photoDate || uploadedBy) {
      const contextParts = []
      if (photoDate) contextParts.push(`photo_date=${photoDate}`)
      if (uploadedBy) contextParts.push(`uploaded_by=${uploadedBy}`)
      params.context = contextParts.join('|')
    }

    // Create the string to sign (sorted parameters)
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')

    const stringToSign = sortedParams + apiSecret
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex')

    // Add all parameters to form data
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    formData.append('folder', 'bwca')

    // Add format parameters to form data
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      formData.append('format', 'jpg')
      formData.append('quality', 'auto')
      formData.append('fetch_format', 'auto')
    }

    // Add photo date and uploader as context
    if (photoDate || uploadedBy) {
      const contextParts = []
      if (photoDate) contextParts.push(`photo_date=${photoDate}`)
      if (uploadedBy) contextParts.push(`uploaded_by=${uploadedBy}`)
      formData.append('context', contextParts.join('|'))
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    
    fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Cloudinary HTTP ${response.status}: ${response.statusText}`)
        })
      }

      return response.json()
    })
    .then(data => {
      if (data.secure_url && data.public_id) {
        resolve({ url: data.secure_url, publicId: data.public_id })
      } else {
        reject(new Error('Upload failed: ' + (data.error?.message || JSON.stringify(data.error) || 'Unknown error')))
      }
    })
    .catch(error => {
      console.error('Cloudinary upload error:', error)
      reject(error)
    })
  })
}
