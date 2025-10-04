'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, LogIn } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { usePhotos } from '@/contexts/PhotoContext'
import EXIF from 'exif-js'

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
  const { addPhoto } = usePhotos()

  // Function to extract photo date from file metadata
  const getPhotoDate = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      console.log('📸 File metadata:')
      console.log('  - File name:', file.name)
      console.log('  - File size:', file.size)
      console.log('  - File type:', file.type)
      console.log('  - Last modified:', new Date(file.lastModified).toISOString())
      
      // Try EXIF first
      EXIF.getData(file as any, function(this: any) {
        const dateTime = EXIF.getTag(this, 'DateTime')
        const dateTimeOriginal = EXIF.getTag(this, 'DateTimeOriginal')
        const dateTimeDigitized = EXIF.getTag(this, 'DateTimeDigitized')
        
        console.log('📸 EXIF data:')
        console.log('  - DateTime:', dateTime)
        console.log('  - DateTimeOriginal:', dateTimeOriginal)
        console.log('  - DateTimeDigitized:', dateTimeDigitized)
        
        // Try different EXIF date fields in order of preference
        const exifDate = dateTimeOriginal || dateTimeDigitized || dateTime
        
        if (exifDate) {
          // EXIF date format: "YYYY:MM:DD HH:MM:SS"
          const [datePart, timePart] = exifDate.split(' ')
          const [year, month, day] = datePart.split(':')
          const [hour, minute, second] = timePart.split(':')
          
          const photoDate = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
          )
          
          const today = new Date()
          const isToday = photoDate.toDateString() === today.toDateString()
          
          console.log('📸 EXIF date found:', exifDate, '→', photoDate.toISOString())
          console.log('📸 Is EXIF date today?', isToday)
          
          if (isToday) {
            // EXIF date is today, probably not the real photo date, use lastModified
            console.log('📸 EXIF date is today, using file lastModified instead')
            resolve(new Date(file.lastModified).toISOString())
          } else {
            // EXIF date is not today, use it
            console.log('📸 Using EXIF date (not today)')
            resolve(photoDate.toISOString())
          }
        } else {
          // Fallback to file's lastModified date
          console.log('📸 No EXIF date found, using file lastModified')
          resolve(new Date(file.lastModified).toISOString())
        }
      })
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = []
    
    for (const file of acceptedFiles) {
      let preview = URL.createObjectURL(file)
      
      // Handle HEIC files - try conversion, fallback to Cloudinary
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        console.log('Processing HEIC file:', file.name, file.type)
        
        // For HEIC files, we'll let Cloudinary handle the conversion
        // Use a nice placeholder that shows it's a HEIC file
        preview = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNDAiIGZpbGw9IiM2MzY2RjEiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSIyMCIgZmlsbD0iI0ZGRiIvPgo8dGV4dCB4PSIyMDAiIHk9IjI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzYzNjZGMiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNTAwIj5IRUlDPC90ZXh0Pgo8dGV4dCB4PSIyMDAiIHk9IjI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzYzNjZGMiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5DbG91ZGluYXJ5IHdpbGw8L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iMjg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM2NkYyIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPmNvbnZlcnQgdGhpczwvdGV4dD4KPC9zdmc+'
        console.log('HEIC file detected - Cloudinary will handle conversion')
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
      simulateUpload(fileObj.id, fileObj.file)
    })
  }, [])

  const simulateUpload = async (fileId: string, file: File) => {
    setIsUploading(true)
    let progress = 0
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20
      if (progress < 90) {
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, progress }
              : file
          )
        )
      }
    }, 200)

      try {
        console.log('Starting upload for file:', file.name, 'Size:', file.size)
        
        // Get the actual photo date from EXIF data first
        const photoDate = await getPhotoDate(file)
        
        console.log('📅 Photo metadata:')
        console.log('  - EXIF date:', photoDate)
        console.log('  - Date string:', new Date(photoDate).toDateString())
        
        // Create FormData for upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('photoDate', photoDate) // Pass the date to the API
        
        // Upload to our API endpoint with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        
        console.log('Sending request to /api/upload...')
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })
      
      clearTimeout(timeoutId)
      console.log('Response received, status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error('Error response data:', errorData)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error('Could not parse error response as JSON')
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log('Upload response:', result)
      
      if (result.success) {
        clearInterval(progressInterval)
        setIsUploading(false)
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, status: 'success', progress: 100 }
              : file
          )
        )
        console.log('Upload successful:', result.imageUrl)
        
        const newPhoto = {
          id: fileId,
          url: result.imageUrl,
          title: file.name,
          uploadedBy: user?.displayName || 'Unknown',
          uploadedAt: photoDate
        }
        
        // Add photo to context
        addPhoto(newPhoto)
      } else {
        console.error('Upload failed:', result.error)
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      clearInterval(progressInterval)
      setIsUploading(false)
      setUploadedFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, status: 'error' }
            : file
        )
      )
      console.error('Upload error:', error)
      
      // Show user-friendly error message
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Upload timed out after 30 seconds')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Upload failed:', errorMessage)
      }
    }
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
                          HEIC (Cloudinary will convert)
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

