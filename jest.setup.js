import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock Cloudinary environment variables
process.env.CLOUDINARY_URL = 'cloudinary://123:secret@test'
process.env.CLOUDINARY_CLOUD_NAME = 'test'
process.env.CLOUDINARY_API_KEY = '123'
process.env.CLOUDINARY_API_SECRET = 'secret'

// Mock BWCA password for testing
process.env.BWCA_PASSWORD = 'test-password-for-jest'
