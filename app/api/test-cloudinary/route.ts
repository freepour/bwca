import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 Testing Cloudinary configuration...')
  
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

  if (process.env.CLOUDINARY_URL) {
    console.log('📋 CLOUDINARY_URL format check:')
    const url = process.env.CLOUDINARY_URL
    console.log('  - Starts with cloudinary://:', url.startsWith('cloudinary://'))
    console.log('  - Contains @ symbol:', url.includes('@'))
    console.log('  - Length:', url.length)
  }

  return NextResponse.json({
    configured: !!hasCloudinaryConfig,
    hasUrl: !!process.env.CLOUDINARY_URL,
    hasCredentials: !!(process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET),
    urlFormat: process.env.CLOUDINARY_URL ? {
      startsWithCloudinary: process.env.CLOUDINARY_URL.startsWith('cloudinary://'),
      containsAt: process.env.CLOUDINARY_URL.includes('@'),
      length: process.env.CLOUDINARY_URL.length
    } : null
  })
}
