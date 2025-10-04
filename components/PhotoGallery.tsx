'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Calendar, User, Camera, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePhotos } from '@/contexts/PhotoContext'

interface Photo {
  id: string
  url: string
  title: string
  uploadedBy: string
  uploadedAt: string
}

export default function PhotoGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const { user } = useAuth()
  const { photos, isLoading, deletePhoto, refreshPhotos } = usePhotos()

  const handleDownload = (photo: Photo) => {
    // In a real app, this would trigger a download
    console.log('Downloading:', photo.title)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      try {
        await deletePhoto(photoId)
        console.log('✅ Photo deleted successfully')
      } catch (error) {
        console.error('❌ Failed to delete photo:', error)
        alert('Failed to delete photo. Please try again.')
      }
    }
  }

  // Create dynamic filter options based on actual photo dates
  const getFilterOptions = () => {
    const uniqueDates = Array.from(new Set(photos.map(photo => {
      const date = new Date(photo.uploadedAt)
      return date.toDateString()
    }))).sort()

    const filterOptions = [
      { id: 'all', label: 'All Photos', count: photos.length }
    ]

    uniqueDates.forEach((dateString, index) => {
      const date = new Date(dateString)
      const dayNumber = index + 1
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      const photosOnThisDate = photos.filter(photo => 
        new Date(photo.uploadedAt).toDateString() === dateString
      ).length

      filterOptions.push({
        id: dateString,
        label: `Day ${dayNumber} (${formattedDate})`,
        count: photosOnThisDate
      })
    })

    return filterOptions
  }

  const filteredPhotos = photos.filter(photo => {
    if (filter === 'all') {
      return true
    }
    
    const photoDate = new Date(photo.uploadedAt)
    return photoDate.toDateString() === filter
  })

  // Group photos by date for display
  const groupedPhotos = filteredPhotos.reduce((groups, photo) => {
    const date = new Date(photo.uploadedAt)
    const dateKey = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(photo)
    return groups
  }, {} as Record<string, Photo[]>)

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading photos from Cloudinary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Photo Gallery</h2>
        <button
          onClick={refreshPhotos}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
        {getFilterOptions().map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <div className="text-center py-12">
          <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No photos yet' : 'No photos found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Be the first to upload photos from your BWCA adventure!'
              : 'No photos found for this day. Try a different filter.'
            }
          </p>
        </div>
      )}

      {/* Photo Grid */}
      {Object.entries(groupedPhotos).map(([date, photos]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">{date}</h2>
            <span className="text-sm text-gray-500">({photos.length} photos)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-end">
                  <div className="w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">{photo.uploadedBy}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(photo)
                          }}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {user && user.displayName === photo.uploadedBy && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePhoto(photo.id)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete photo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col lg:flex-row h-full">
                {/* Photo */}
                <div className="lg:w-2/3 bg-black flex items-center justify-center">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
                
                {/* Photo Info */}
                <div className="lg:w-1/3 p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedPhoto.title}</h3>
                    <button
                      onClick={() => setSelectedPhoto(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600 mb-4">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Uploaded by {selectedPhoto.uploadedBy}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600 mb-6">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(selectedPhoto.uploadedAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex-1" />
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleDownload(selectedPhoto)}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    
                    {user && user.displayName === selectedPhoto.uploadedBy && (
                      <button
                        onClick={() => handleDeletePhoto(selectedPhoto.id)}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}