import { NextResponse } from 'next/server'
import { getAllPhotos } from '@/lib/cloudinary-photos'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const photos = await getAllPhotos()

    return NextResponse.json({
      success: true,
      photos,
      count: photos.length
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Photos API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      photos: []
    }, { status: 500 })
  }
}
