/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  env: {
    // Expose Cloudinary cloud name and API key to client for direct uploads
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ||
      (process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.match(/cloudinary:\/\/\d+:[^@]+@(.+)/)?.[1] : ''),
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ||
      (process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.match(/cloudinary:\/\/(\d+):/)?.[1] : ''),
  },
}

module.exports = nextConfig

