import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('📤 Upload API called')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('📁 File received:', file.name, 'Size:', file.size, 'Type:', file.type)

        // Check if Cloudinary is configured
        const hasCloudinaryConfig = process.env.CLOUDINARY_URL || 
                                   (process.env.CLOUDINARY_CLOUD_NAME && 
                                    process.env.CLOUDINARY_API_KEY && 
                                    process.env.CLOUDINARY_API_SECRET)

        console.log('☁️ Cloudinary configured:', !!hasCloudinaryConfig)
        console.log('🔧 Environment variables:')
        console.log('  - CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'SET' : 'NOT SET')
        console.log('  - CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET')
        console.log('  - CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET')
        console.log('  - CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET')

    if (!hasCloudinaryConfig) {
      // Fallback: simulate upload for demo purposes
      console.log('🔄 Cloudinary not configured, simulating upload...')
      
      // Create a data URL for the file
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = file.type || 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${base64}`
      
      console.log('✅ Demo upload completed')
      return NextResponse.json({ 
        success: true, 
        imageUrl: dataUrl,
        filename: file.name,
        size: file.size,
        note: 'Demo mode - Cloudinary not configured'
      })
    }

    // Real Cloudinary upload (when configured)
    console.log('☁️ Starting Cloudinary upload...')
    
    try {
      const { uploadImage } = await import('@/lib/cloudinary')
      console.log('📦 Cloudinary module imported successfully')
      
      console.log('📤 Calling uploadImage function...')
      const imageUrl = await uploadImage(file)
      console.log('✅ Cloudinary upload successful:', imageUrl)
      
      return NextResponse.json({ 
        success: true, 
        imageUrl,
        filename: file.name,
        size: file.size
      })
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError)
      throw cloudinaryError
    }
  } catch (error) {
    console.error('❌ Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Upload failed: ' + errorMessage }, { status: 500 })
  }
}
