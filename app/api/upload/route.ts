import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
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
      console.log('Cloudinary not configured, simulating upload...')
      
      // Create a data URL for the file
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

    // Real Cloudinary upload (when configured)
    const { uploadImage } = await import('@/lib/cloudinary')
    const imageUrl = await uploadImage(file)
    
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      filename: file.name,
      size: file.size
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 })
  }
}
