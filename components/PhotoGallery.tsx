'use client'

import { useState, useEffect } from 'react'
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
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editedDateTime, setEditedDateTime] = useState('')
  const [imageCache, setImageCache] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const { photos, isLoading, deletePhoto, refreshPhotos } = usePhotos()

  // Filter and sort photos before using in effects
  const filteredPhotos = photos
    .filter(photo => {
      if (filter === 'all') {
        return true
      }

      const photoDate = new Date(photo.uploadedAt)
      return photoDate.toDateString() === filter
    })
    .sort((a, b) => {
      // Sort chronologically (oldest to newest)
      return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
    })

  // Preload full-resolution images when viewing a photo
  useEffect(() => {
    if (!selectedPhoto) return

    // Add current photo to cache
    if (!imageCache.has(selectedPhoto.url)) {
      const img = new Image()
      img.src = selectedPhoto.url
      setImageCache(prev => new Set(prev).add(selectedPhoto.url))
    }

    // Preload adjacent photos for smoother navigation
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id)
    const adjacentPhotos = [
      filteredPhotos[currentIndex - 1],
      filteredPhotos[currentIndex + 1]
    ].filter(Boolean)

    adjacentPhotos.forEach(photo => {
      if (!imageCache.has(photo.url)) {
        const img = new Image()
        img.src = photo.url
        setImageCache(prev => new Set(prev).add(photo.url))
      }
    })
  }, [selectedPhoto, filteredPhotos])

  // Keyboard navigation for photo viewer
  useEffect(() => {
    if (!selectedPhoto) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable keyboard navigation while editing date
      if (isEditingDate) {
        if (e.key === 'Escape') {
          handleCancelEdit()
        }
        return
      }

      if (e.key === 'Escape') {
        setSelectedPhoto(null)
      } else if (e.key === 'ArrowLeft') {
        // Navigate to previous photo
        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id)
        const prevIndex = currentIndex === 0 ? filteredPhotos.length - 1 : currentIndex - 1
        setSelectedPhoto(filteredPhotos[prevIndex])
      } else if (e.key === 'ArrowRight') {
        // Navigate to next photo
        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id)
        const nextIndex = currentIndex === filteredPhotos.length - 1 ? 0 : currentIndex + 1
        setSelectedPhoto(filteredPhotos[nextIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhoto, filteredPhotos, isEditingDate])

  // Helper to get Cloudinary thumbnail URL
  const getThumbnailUrl = (url: string) => {
    // Transform Cloudinary URL to use thumbnail optimization
    // Example: https://res.cloudinary.com/xxx/image/upload/v123/photo.jpg
    // Becomes: https://res.cloudinary.com/xxx/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v123/photo.jpg
    if (url.includes('res.cloudinary.com')) {
      return url.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/')
    }
    return url
  }

  const handleDownload = (photo: Photo) => {
    // In a real app, this would trigger a download
    console.log('Downloading:', photo.title)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      try {
        await deletePhoto(photoId)
        // Close the modal if the deleted photo is currently selected
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(null)
        }
        console.log('✅ Photo deleted successfully')
      } catch (error) {
        console.error('❌ Failed to delete photo:', error)
        alert('Failed to delete photo. Please try again.')
      }
    }
  }

  const handleEditDate = (photo: Photo) => {
    setIsEditingDate(true)
    // Format datetime for input field (YYYY-MM-DDTHH:mm)
    // We'll preserve seconds and milliseconds when saving
    const date = new Date(photo.uploadedAt)
    const formattedDateTime = date.toISOString().slice(0, 16)
    setEditedDateTime(formattedDateTime)
  }

  const handleSaveDate = async () => {
    if (!selectedPhoto || !editedDateTime) return

    try {
      // Parse the edited date (which only has minutes precision)
      const editedDate = new Date(editedDateTime)

      // Get original seconds and milliseconds from the current photo
      const originalDate = new Date(selectedPhoto.uploadedAt)
      const seconds = originalDate.getSeconds()
      const milliseconds = originalDate.getMilliseconds()

      // Set the preserved seconds and milliseconds on the new date
      editedDate.setSeconds(seconds)
      editedDate.setMilliseconds(milliseconds)

      const response = await fetch('/api/update-photo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoId: selectedPhoto.id,
          newDateTime: editedDate.toISOString(),
          uploadedBy: selectedPhoto.uploadedBy
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh photos to get updated data
        await refreshPhotos()
        setIsEditingDate(false)
        // Update selected photo with new date
        setSelectedPhoto({
          ...selectedPhoto,
          uploadedAt: new Date(editedDateTime).toISOString()
        })
      } else {
        alert('Failed to update photo date: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating photo date:', error)
      alert('Failed to update photo date. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setIsEditingDate(false)
    setEditedDateTime('')
  }

  // Create dynamic filter options based on actual photo dates
  const getFilterOptions = () => {
    const uniqueDates = Array.from(new Set(photos.map(photo => {
      const date = new Date(photo.uploadedAt)
      return date.toDateString()
    }))).sort((a, b) => {
      // Sort chronologically by date, not alphabetically
      return new Date(a).getTime() - new Date(b).getTime()
    })

    const filterOptions = [
      { id: 'all', label: 'All Photos', count: photos.length }
    ]

    // Set September 1 of the current year as Day 1
    const currentYear = new Date().getFullYear()
    const sept1 = new Date(currentYear, 8, 1) // Month is 0-indexed, so 8 = September
    sept1.setHours(0, 0, 0, 0)

    uniqueDates.forEach((dateString) => {
      const date = new Date(dateString)
      date.setHours(0, 0, 0, 0)

      // Calculate day number relative to September 1
      const diffTime = date.getTime() - sept1.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const dayNumber = diffDays + 1 // Sept 1 is Day 1, so add 1

      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })

      const photosOnThisDate = photos.filter(photo =>
        new Date(photo.uploadedAt).toDateString() === dateString
      ).length

      filterOptions.push({
        id: dateString,
        label: `Day ${dayNumber} - ${formattedDate} (${photosOnThisDate})`,
        count: photosOnThisDate
      })
    })

    return filterOptions
  }

  // Group photos by date for display (already sorted chronologically)
  const groupedPhotos = filteredPhotos.reduce((groups, photo) => {
    const date = new Date(photo.uploadedAt)
    const dateKey = date.toLocaleDateString('en-US', {
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

  // Sort the group keys chronologically
  const sortedGroupKeys = Object.keys(groupedPhotos).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime()
  })

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
            {tab.label}
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
      {sortedGroupKeys.map((date) => (
        <div key={date} className="space-y-4">
          {(() => {
            const photos = groupedPhotos[date]
            return (
              <>
          {filter === 'all' && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">{date}</h2>
              <span className="text-sm text-gray-500">({photos.length} photos)</span>
            </div>
          )}

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
                    src={getThumbnailUrl(photo.url)}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Hide parent container if image fails to load
                      const target = e.target as HTMLImageElement
                      const container = target.closest('.relative.group') as HTMLElement
                      if (container) {
                        container.style.display = 'none'
                      }
                    }}
                  />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-end">
                  <div className="w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                          className="p-1 text-white hover:text-primary-400 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {user && user.displayName === photo.uploadedBy && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePhoto(photo.id)
                            }}
                            className="p-1 text-white hover:text-red-400 transition-colors"
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
              </>
            )
          })()}
        </div>
      ))}

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl z-10 w-10 h-10 flex items-center justify-center"
            >
              ✕
            </button>

            {/* Navigation arrows */}
            {filteredPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id)
                    const prevIndex = currentIndex === 0 ? filteredPhotos.length - 1 : currentIndex - 1
                    setSelectedPhoto(filteredPhotos[prevIndex])
                  }}
                  className="absolute left-4 text-white/70 hover:text-white text-4xl z-10 w-12 h-12 flex items-center justify-center"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id)
                    const nextIndex = currentIndex === filteredPhotos.length - 1 ? 0 : currentIndex + 1
                    setSelectedPhoto(filteredPhotos[nextIndex])
                  }}
                  className="absolute right-4 text-white/70 hover:text-white text-4xl z-10 w-12 h-12 flex items-center justify-center"
                >
                  ›
                </button>
              </>
            )}

            {/* Photo */}
            <motion.img
              key={selectedPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Bottom metadata bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{selectedPhoto.uploadedBy}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    {isEditingDate ? (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="datetime-local"
                          value={editedDateTime}
                          onChange={(e) => setEditedDateTime(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveDate()
                            }
                          }}
                          className="bg-black/50 text-white px-2 py-1 rounded border border-white/30 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveDate}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          if (user && user.displayName === selectedPhoto.uploadedBy) {
                            handleEditDate(selectedPhoto)
                          }
                        }}
                        className={user && user.displayName === selectedPhoto.uploadedBy ? "cursor-pointer hover:text-blue-300" : ""}
                        title={user && user.displayName === selectedPhoto.uploadedBy ? "Click to edit date/time" : ""}
                      >
                        {new Date(selectedPhoto.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} {new Date(selectedPhoto.uploadedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(selectedPhoto)
                    }}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {user && user.displayName === selectedPhoto.uploadedBy && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePhoto(selectedPhoto.id)
                      }}
                      className="p-2 text-white/70 hover:text-red-400 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}