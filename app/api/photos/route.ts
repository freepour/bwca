import { NextResponse } from 'next/server'
import { fetchPhotosFromCloudinary } from '@/lib/cloudinary-photos'

export async function GET() {
  try {
    console.log('📡 Photos API called')
    
    const photos = await fetchPhotosFromCloudinary()
    
    return NextResponse.json({ 
      success: true, 
      photos,
      count: photos.length
    })
  } catch (error) {
    console.error('❌ Photos API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      photos: []
    }, { status: 500 })
  }
}
