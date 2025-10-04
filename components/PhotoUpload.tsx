'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, LogIn, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { usePhotos } from '@/contexts/PhotoContext'
import EXIF from 'exif-js'

interface UploadedFile {
  id: string
  file: File
  preview?: string
  cloudinaryUrl?: string
  cloudinaryPublicId?: string
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
      // Try EXIF first
      EXIF.getData(file as any, function(this: any) {
        const dateTime = EXIF.getTag(this, 'DateTime')
        const dateTimeOriginal = EXIF.getTag(this, 'DateTimeOriginal')
        const dateTimeDigitized = EXIF.getTag(this, 'DateTimeDigitized')

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

          if (isToday) {
            // EXIF date is today, probably not the real photo date, use lastModified
            resolve(new Date(file.lastModified).toISOString())
          } else {
            // EXIF date is not today, use it
            resolve(photoDate.toISOString())
          }
        } else {
          // Fallback to file's lastModified date
          resolve(new Date(file.lastModified).toISOString())
        }
      })
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = []

    for (const file of acceptedFiles) {
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
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
        // Get the actual photo date from EXIF data first
        const photoDate = await getPhotoDate(file)

        // Create FormData for upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('photoDate', photoDate)
        formData.append('uploadedBy', user?.displayName || 'Unknown')

        // Upload to our API endpoint with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Could not parse error response
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      if (result.success) {
        clearInterval(progressInterval)
        setIsUploading(false)
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'success', progress: 100, cloudinaryUrl: result.imageUrl, cloudinaryPublicId: result.publicId }
              : f
          )
        )

        const newPhoto = {
          id: result.publicId,
          url: result.imageUrl,
          title: file.name,
          uploadedBy: user?.displayName || 'Unknown',
          uploadedAt: photoDate
        }

        addPhoto(newPhoto)
      } else {
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
    }
  }

  const retryUpload = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId)
    if (!file) return

    // Reset status to uploading
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? { ...f, status: 'uploading' as const, progress: 0 }
          : f
      )
    )

    // Retry the upload
    await simulateUpload(fileId, file.file)
  }

  const removeFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId)

    // If the file was successfully uploaded to Cloudinary, delete it
    if (file?.status === 'success' && file.cloudinaryPublicId) {
      try {
        await fetch('/api/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photoId: file.cloudinaryPublicId })
        })
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', error)
      }
    }

    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
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
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB limit
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((rejectedFile) => {
        if (rejectedFile.file.size > 10 * 1024 * 1024) {
          alert(`File "${rejectedFile.file.name}" is too large. Maximum file size is 10MB.`)
        }
      })
    }
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
          <p className="text-lg text-gray-600">
            Drag and drop photos here, or click to browse
          </p>
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Uploaded Photos ({uploadedFiles.length})
              </h3>
              {uploadedFiles.some(f => f.status === 'error') && (
                <button
                  onClick={() => {
                    uploadedFiles
                      .filter(f => f.status === 'error')
                      .forEach(f => retryUpload(f.id))
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry All Failed
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card p-4 relative"
                >
                  {file.cloudinaryUrl ? (
                    <div className="aspect-square rounded-lg overflow-hidden mb-3">
                      <img
                        src={file.cloudinaryUrl}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Uploading...</p>
                      </div>
                    </div>
                  )}
                  
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
                            <span className="text-xs text-red-600 font-medium">Failed</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {file.status === 'error' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              retryUpload(file.id)
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5"
                            title="Retry upload"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                          </button>
                        )}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
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

