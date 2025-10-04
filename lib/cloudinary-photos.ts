// Function to fetch all photos from Cloudinary
export async function getAllPhotos() {
  try {
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

    // Make API request to get all photos with context metadata
    const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?type=upload&max_results=500&context=true`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Cloudinary API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Transform Cloudinary resources to our photo format
    const photos = data.resources.map((resource: any) => {
      // Try to get photo date from context, fallback to created_at
      const photoDate = resource.context?.custom?.photo_date || resource.created_at

      // Try to get uploader from context, default to 'Unknown'
      const uploadedBy = resource.context?.custom?.uploaded_by || 'Unknown'

      return {
        id: resource.public_id,
        url: resource.secure_url,
        title: resource.original_filename || resource.public_id,
        uploadedBy,
        uploadedAt: photoDate
      }
    })

    return photos

  } catch (error) {
    console.error('Error fetching photos from Cloudinary:', error)
    return []
  }
}