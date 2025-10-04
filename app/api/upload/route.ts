import { NextRequest, NextResponse } from 'next/server'

// Increase timeout for large photo uploads
export const runtime = 'nodejs'
export const maxDuration = 120 // 120 seconds timeout (2 minutes)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const photoDate = formData.get('photoDate') as string
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check if Cloudinary is configured
    const hasCloudinaryConfig = process.env.CLOUDINARY_URL ||
                               (process.env.CLOUDINARY_CLOUD_NAME &&
                                process.env.CLOUDINARY_API_KEY &&
                                process.env.CLOUDINARY_API_SECRET)

    if (!hasCloudinaryConfig) {
      // Fallback: simulate upload for demo purposes
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = file.type || 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${base64}`

      return NextResponse.json({
        success: true,
        imageUrl: dataUrl,
        filename: file.name,
        size: file.size,
        note: 'Demo mode - Cloudinary not configured'
      })
    }

    // Real Cloudinary upload
    try {
      const { uploadImage } = await import('@/lib/cloudinary')
      const result = await uploadImage(file, photoDate, uploadedBy)

      return NextResponse.json({
        success: true,
        imageUrl: result.url,
        publicId: result.publicId,
        filename: file.name,
        size: file.size
      })
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError)
      throw cloudinaryError
    }
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Upload failed: ' + errorMessage }, { status: 500 })
  }
}
