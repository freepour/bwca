import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { photoId, newDateTime, uploadedBy } = await request.json()

    if (!photoId || !newDateTime) {
      return NextResponse.json({ error: 'Missing photoId or newDateTime' }, { status: 400 })
    }

    // Check if Cloudinary is configured
    const hasCloudinaryConfig = process.env.CLOUDINARY_URL ||
                               (process.env.CLOUDINARY_CLOUD_NAME &&
                                process.env.CLOUDINARY_API_KEY &&
                                process.env.CLOUDINARY_API_SECRET)

    if (!hasCloudinaryConfig) {
      return NextResponse.json({
        success: true,
        message: 'Photo updated (demo mode)',
        photoId
      })
    }

    try {
      const { cloudinary } = await import('@/lib/cloudinary')

      // Build context with both photo_date and uploaded_by to preserve user info
      const contextParts = [`photo_date=${newDateTime}`]
      if (uploadedBy) {
        contextParts.push(`uploaded_by=${uploadedBy}`)
      }

      // Update the photo's context metadata in Cloudinary
      const result = await cloudinary.uploader.explicit(photoId, {
        type: 'upload',
        context: contextParts.join('|')
      })

      return NextResponse.json({
        success: true,
        message: 'Photo date updated successfully',
        photoId,
        result
      })

    } catch (error) {
      console.error('Cloudinary update error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({ error: 'Update failed: ' + errorMessage }, { status: 500 })
    }

  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Update failed: ' + errorMessage }, { status: 500 })
  }
}
