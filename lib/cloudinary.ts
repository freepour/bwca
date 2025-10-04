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

export async function uploadImage(file: File, photoDate?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('🔧 Setting up Cloudinary signed upload...')
    const formData = new FormData()
    formData.append('file', file)
    
    // Add format conversion for HEIC files (now allowed with signed uploads)
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      console.log('📱 Uploading HEIC file with explicit format conversion to JPG')
    }
    
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
        console.error('❌ Invalid CLOUDINARY_URL format')
        reject(new Error('Invalid CLOUDINARY_URL format'))
        return
      }
    } else {
      cloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
      apiKey = process.env.CLOUDINARY_API_KEY || ''
      apiSecret = process.env.CLOUDINARY_API_SECRET || ''
    }
    
    console.log('☁️ Cloud name:', cloudName)
    console.log('🔑 API key:', apiKey ? 'SET' : 'NOT SET')
    console.log('🔐 API secret:', apiSecret ? 'SET' : 'NOT SET')
    
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Missing Cloudinary credentials')
      reject(new Error('Missing Cloudinary credentials'))
      return
    }
    
    // Generate signature for signed upload
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    // Build the string to sign with all parameters
    const params: Record<string, string> = {
      timestamp: timestamp.toString()
    }
    
    // Add format parameters for HEIC files to the signature
    // Note: Only include parameters that Cloudinary actually validates in the signature
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      params.format = 'jpg'
      // Don't include quality and fetch_format in signature - they're not validated
    }
    
    // Add photo date as context (not included in signature)
    if (photoDate) {
      console.log('📅 Adding photo date to Cloudinary:', photoDate)
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
    
    console.log('🔏 Parameters:', params)
    console.log('🔏 Sorted params:', sortedParams)
    console.log('🔏 String to sign:', stringToSign.replace(apiSecret, '[SECRET]'))
    console.log('🔏 Generated signature:', signature)
    console.log('🔏 API Secret length:', apiSecret.length)
    console.log('🔏 API Secret starts with:', apiSecret.substring(0, 4) + '...')
    
    // Add all parameters to form data
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    
    // Add format parameters to form data
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      formData.append('format', 'jpg')
      formData.append('quality', 'auto')
      formData.append('fetch_format', 'auto')
    }
    
    // Add photo date as context
    if (photoDate) {
      formData.append('context', `photo_date=${photoDate}`)
    }
    
    // Debug: Log all form data parameters
    console.log('📤 Form data parameters:')
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (key !== 'file') {
        console.log(`  ${key}: ${value}`)
      }
    })
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    console.log('🌐 Upload URL:', uploadUrl)
    console.log('📤 Starting Cloudinary request...')
    
    fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      console.log('📡 Cloudinary response status:', response.status)
      console.log('📡 Cloudinary response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        console.error('❌ Cloudinary HTTP error:', response.status, response.statusText)
        return response.text().then(text => {
          console.error('❌ Cloudinary error response body:', text)
          throw new Error(`Cloudinary HTTP ${response.status}: ${response.statusText} - ${text}`)
        })
      }
      
      return response.json()
    })
    .then(data => {
      console.log('📊 Cloudinary upload response:', data)
      if (data.secure_url) {
        console.log('✅ Upload successful, URL:', data.secure_url)
        resolve(data.secure_url)
      } else {
        console.error('❌ Upload failed, error:', data.error)
        console.error('❌ Full response data:', data)
        reject(new Error('Upload failed: ' + (data.error?.message || JSON.stringify(data.error) || 'Unknown error')))
      }
    })
    .catch(error => {
      console.error('❌ Cloudinary upload error:', error)
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      reject(error)
    })
  })
}
