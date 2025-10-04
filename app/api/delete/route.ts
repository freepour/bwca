import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  console.log('🗑️ Delete API called')
  
  try {
    const { photoId } = await request.json()
    
    if (!photoId) {
      console.error('❌ No photo ID provided')
      return NextResponse.json({ error: 'No photo ID provided' }, { status: 400 })
    }

    console.log('🗑️ Deleting photo:', photoId)

    // Check if Cloudinary is configured
    const hasCloudinaryConfig = process.env.CLOUDINARY_URL || 
                               (process.env.CLOUDINARY_CLOUD_NAME && 
                                process.env.CLOUDINARY_API_KEY && 
                                process.env.CLOUDINARY_API_SECRET)

    if (!hasCloudinaryConfig) {
      console.log('⚠️ Cloudinary not configured, simulating delete')
      return NextResponse.json({ 
        success: true, 
        message: 'Photo deleted (demo mode)',
        photoId
      })
    }

    // Real Cloudinary delete
    console.log('☁️ Starting Cloudinary delete...')
    
    try {
      const { cloudinary } = await import('@/lib/cloudinary')
      console.log('📦 Cloudinary module imported successfully')
      
      console.log('🗑️ Calling Cloudinary destroy...')
      const result = await cloudinary.uploader.destroy(photoId)
      console.log('✅ Cloudinary delete successful:', result)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Photo deleted successfully',
        photoId,
        result
      })
      
    } catch (error) {
      console.error('❌ Cloudinary delete error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({ error: 'Delete failed: ' + errorMessage }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Delete failed: ' + errorMessage }, { status: 500 })
  }
}
