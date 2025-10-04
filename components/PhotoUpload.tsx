'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, LogIn } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

interface UploadedFile {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'success' | 'error'
  progress?: number
  isHeic?: boolean
}

export default function PhotoUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuth()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = []
    
    for (const file of acceptedFiles) {
      let preview = URL.createObjectURL(file)
      
      // Handle HEIC files - convert to JPEG for display
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        console.log('Processing HEIC file:', file.name, file.type)
        try {
          // Dynamic import to avoid SSR issues
          const heic2any = (await import('heic2any')).default
          console.log('HEIC2ANY loaded, converting...')
          
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          }) as Blob
          
          console.log('HEIC conversion successful, blob size:', convertedBlob.size)
          preview = URL.createObjectURL(convertedBlob)
          console.log('Preview URL created:', preview)
        } catch (error) {
          console.error('HEIC conversion failed:', error)
          // Try using the original file URL as fallback
          console.log('Trying original file URL as fallback')
          preview = URL.createObjectURL(file)
        }
      }
      
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
      
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        status: 'uploading',
        progress: 0,
        isHeic
      })
    }

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simulate upload progress
    newFiles.forEach(fileObj => {
      simulateUpload(fileObj.id)
    })
  }, [])

  const simulateUpload = (fileId: string) => {
    setIsUploading(true)
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setIsUploading(false)
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, status: 'success', progress: 100 }
              : file
          )
        )
      } else {
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, progress }
              : file
          )
        )
      }
    }, 200)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic', '.heif']
    },
    multiple: true
  })

  if (!user) {
    return (
      <div className="text-center py-12">
        <LogIn className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600 mb-6">
          You need to be logged in to upload photos. Please login with your credentials.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Authorized Users:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• deadeye</div>
            <div>• shackleton</div>
            <div>• whitey</div>
            <div>• scooter</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-primary-800">
          Welcome back, <span className="font-medium">{user.displayName}</span>! 
          Upload your BWCA photos to share with the group.
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-lg text-primary-600">Drop the photos here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop photos here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports JPG, PNG, GIF, WebP, and HEIC formats
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Photos ({uploadedFiles.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card p-4 relative"
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-3">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      {file.isHeic && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          HEIC
                        </span>
                      )}
                    </p>
                    
                    {/* Progress Bar */}
                    {file.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Status Icons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {file.status === 'uploading' && (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
                            <span className="text-xs text-primary-600">Uploading...</span>
                          </>
                        )}
                        {file.status === 'success' && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-600">Uploaded</span>
                          </>
                        )}
                        {file.status === 'error' && (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600">Error</span>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

