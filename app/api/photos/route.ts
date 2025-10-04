import { NextResponse } from 'next/server'
import { getAllPhotos } from '@/lib/cloudinary-photos'

export async function GET() {
  try {
    console.log('📡 Photos API called at:', new Date().toISOString())

    const photos = await getAllPhotos()

    console.log('📊 Returning photos:', photos.length)
    console.log('📋 Photo details:', JSON.stringify(photos, null, 2))

    return NextResponse.json({
      success: true,
      photos,
      count: photos.length
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
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
