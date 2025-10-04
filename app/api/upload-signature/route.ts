import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Generate a signature for client-side Cloudinary uploads
export async function POST(request: NextRequest) {
  try {
    const { timestamp, folder, context } = await request.json()

    // Extract credentials
    let apiSecret: string

    if (process.env.CLOUDINARY_URL) {
      const url = process.env.CLOUDINARY_URL
      const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/)
      if (match) {
        apiSecret = match[2]
      } else {
        throw new Error('Invalid CLOUDINARY_URL format')
      }
    } else {
      apiSecret = process.env.CLOUDINARY_API_SECRET || ''
    }

    if (!apiSecret) {
      throw new Error('Missing Cloudinary API secret')
    }

    // Build the string to sign
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
      folder: folder || 'bwca'
    }

    if (context) {
      params.context = context
    }

    // Create the string to sign (sorted parameters)
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')

    const stringToSign = sortedParams + apiSecret
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex')

    return NextResponse.json({
      success: true,
      signature,
      timestamp
    })
  } catch (error) {
    console.error('Signature generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
