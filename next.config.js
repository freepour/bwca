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
  // Note: Next.js 14 doesn't have direct API route body size config in app directory
  // The limit is handled by the deployment platform (Vercel has 4.5MB default, can be increased)
  // For local dev, Node.js doesn't have a hard limit on formData
}

module.exports = nextConfig

