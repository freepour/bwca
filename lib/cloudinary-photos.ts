// Function to fetch all photos from Cloudinary
export async function fetchPhotosFromCloudinary(): Promise<any[]> {
  try {
    console.log('📡 Fetching photos from Cloudinary...')
    
    // Extract credentials from environment
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
        throw new Error('Invalid CLOUDINARY_URL format')
      }
    } else {
      cloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
      apiKey = process.env.CLOUDINARY_API_KEY || ''
      apiSecret = process.env.CLOUDINARY_API_SECRET || ''
    }
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Missing Cloudinary credentials')
    }
    
    // Generate signature for API request
    const timestamp = Math.round(new Date().getTime() / 1000)
    const signature = require('crypto')
      .createHash('sha1')
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest('hex')
    
    // Make API request to get all resources
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=500`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Cloudinary API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('📊 Cloudinary API response:', data)
    
    // Transform Cloudinary resources to our photo format
    const photos = data.resources.map((resource: any) => {
      // Try to get photo date from context, fallback to created_at
      let photoDate = resource.created_at
      if (resource.context && resource.context.photo_date) {
        photoDate = resource.context.photo_date
        console.log('📅 Using photo date from context:', photoDate)
      } else {
        console.log('📅 Using Cloudinary created_at:', photoDate)
      }
      
      return {
        id: resource.public_id,
        url: resource.secure_url,
        title: resource.original_filename || resource.public_id,
        uploadedBy: 'Unknown', // Cloudinary doesn't store this info
        uploadedAt: photoDate
      }
    })
    
    console.log('✅ Loaded photos from Cloudinary:', photos.length)
    return photos
    
  } catch (error) {
    console.error('❌ Error fetching photos from Cloudinary:', error)
    return []
  }
}
