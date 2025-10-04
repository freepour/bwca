// Function to fetch all photos from Cloudinary with pagination
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

    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
    let allResources: any[] = []
    let nextCursor: string | undefined = undefined

    // Paginate through all results
    do {
      const apiUrl = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image`)
      apiUrl.searchParams.set('type', 'upload')
      apiUrl.searchParams.set('prefix', 'bwca/')
      apiUrl.searchParams.set('max_results', '500')
      apiUrl.searchParams.set('context', 'true')
      if (nextCursor) {
        apiUrl.searchParams.set('next_cursor', nextCursor)
      }

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Cloudinary API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      allResources = allResources.concat(data.resources || [])
      nextCursor = data.next_cursor
    } while (nextCursor)

    // Transform Cloudinary resources to our photo format
    // Filter out any invalid resources (e.g., deleted files that still appear in API)
    const photos = allResources
      .filter((resource: any) => {
        // Skip if missing critical fields
        if (!resource.public_id || !resource.secure_url) {
          return false
        }

        // Skip if not an image
        if (resource.resource_type !== 'image') {
          return false
        }

        // Skip if the resource has a placeholder status (indicates deleted/invalid)
        if (resource.placeholder === true) {
          return false
        }

        // Skip if resource has error status
        if (resource.error || resource.status === 'error') {
          return false
        }

        // Skip if bytes is 0 or missing (indicates invalid file)
        if (!resource.bytes || resource.bytes === 0) {
          return false
        }

        return true
      })
      .map((resource: any) => {
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