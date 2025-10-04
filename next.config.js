/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  webpack: (config) => {
    // Add support for HEIC files
    config.module.rules.push({
      test: /\.(heic|heif)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images/',
          outputPath: 'static/images/',
        },
      },
    })
    return config
  },
}

module.exports = nextConfig

