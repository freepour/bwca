'use client'

import { useState, useCallback, useEffect } from 'react'
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
  errorMessage?: string
}

export default function PhotoUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<Array<{ id: string; file: File }>>([])
  const [currentlyUploading, setCurrentlyUploading] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const { addPhoto } = usePhotos()

  const MAX_CONCURRENT_UPLOADS = 2 // Process 2 uploads at a time

  // Process upload queue
  useEffect(() => {
    if (uploadQueue.length === 0 || currentlyUploading.size >= MAX_CONCURRENT_UPLOADS) {
      return
    }

    const availableSlots = MAX_CONCURRENT_UPLOADS - currentlyUploading.size
    const itemsToProcess = uploadQueue.slice(0, availableSlots)

    if (itemsToProcess.length > 0) {
      // Remove items from queue
      setUploadQueue(prev => prev.slice(availableSlots))

      // Add to currently uploading set and start uploads
      itemsToProcess.forEach(item => {
        setCurrentlyUploading(prev => new Set(prev).add(item.id))
        processUpload(item.id, item.file)
      })
    }
  }, [uploadQueue, currentlyUploading])

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

    // Add files to upload queue
    setUploadQueue(prev => [...prev, ...newFiles.map(f => ({ id: f.id, file: f.file }))])
  }, [])

  const processUpload = async (fileId: string, file: File) => {
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

      // Get Cloudinary credentials from env (client-safe ones only)
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY

      if (!cloudName || !apiKey) {
        throw new Error('Cloudinary configuration missing')
      }

      // Get upload signature from our API
      const timestamp = Math.round(new Date().getTime() / 1000)
      const contextParts = []
      if (photoDate) contextParts.push(`photo_date=${photoDate}`)
      if (user?.displayName) contextParts.push(`uploaded_by=${user.displayName}`)
      const context = contextParts.join('|')

      const sigResponse = await fetch('/api/upload-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp, folder: 'bwca', context })
      })

      if (!sigResponse.ok) {
        throw new Error('Failed to get upload signature')
      }

      const { signature } = await sigResponse.json()

      // Upload directly to Cloudinary (bypasses Vercel limits)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey)
      formData.append('timestamp', timestamp.toString())
      formData.append('signature', signature)
      formData.append('folder', 'bwca')
      formData.append('context', context)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Cloudinary upload failed for ${file.name}:`, errorText)
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.secure_url && result.public_id) {
        clearInterval(progressInterval)
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'success', progress: 100, cloudinaryUrl: result.secure_url, cloudinaryPublicId: result.public_id }
              : f
          )
        )

        const newPhoto = {
          id: result.public_id,
          url: result.secure_url,
          title: file.name,
          uploadedBy: user?.displayName || 'Unknown',
          uploadedAt: photoDate
        }

        addPhoto(newPhoto)
      } else {
        throw new Error(result.error?.message || 'Upload failed')
      }
    } catch (error) {
      clearInterval(progressInterval)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Upload error for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB):`, errorMessage)

      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error', errorMessage }
            : f
        )
      )
    } finally {
      // Remove from currently uploading set
      setCurrentlyUploading(prev => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })

      // Update isUploading flag
      setIsUploading(prev => {
        const stillUploading = currentlyUploading.size > 1 || uploadQueue.length > 0
        return stillUploading
      })
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

    // Add to upload queue
    setUploadQueue(prev => [...prev, { id: fileId, file: file.file }])
  }

  const removeFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId)

    // Immediately remove from UI
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })

    // Also remove from upload queue if it's waiting
    setUploadQueue(prev => prev.filter(item => item.id !== fileId))

    // If the file was successfully uploaded to Cloudinary, delete it in the background
    if (file?.status === 'success' && file.cloudinaryPublicId) {
      fetch('/api/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId: file.cloudinaryPublicId })
      }).catch(error => {
        console.error('Failed to delete from Cloudinary:', error)
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic', '.heif']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB limit (Cloudinary free tier max)
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((rejectedFile) => {
        if (rejectedFile.file.size > 10 * 1024 * 1024) {
          const sizeMB = (rejectedFile.file.size / 1024 / 1024).toFixed(2)
          alert(`File "${rejectedFile.file.name}" is too large (${sizeMB}MB). Maximum file size is 10MB. Please compress the image before uploading.`)
        }
      })
    }
  })

  if (!user) {
    return (
      <div className="text-center py-12">
        <LogIn className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600">
          You need to be logged in to upload photos. Please login with your credentials.
        </p>
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
                        src={file.cloudinaryUrl.replace('/upload/', '/upload/c_fill,w_400,h_400,f_auto,q_auto/')}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if transformation fails
                          e.currentTarget.src = file.cloudinaryUrl!
                        }}
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

                      {/* Error message */}
                      {file.status === 'error' && file.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <strong>Error:</strong> {file.errorMessage}
                        </div>
                      )}

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

