'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Heart, Share2, Calendar, User, MessageCircle, Send, Camera } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Comment {
  id: string
  text: string
  author: string
  createdAt: string
}

interface Photo {
  id: string
  url: string
  title: string
  uploadedBy: string
  uploadedAt: string
  likes: number
  isLiked: boolean
  comments: Comment[]
}

// Start with empty photo array - ready for real photos!
const mockPhotos: Photo[] = []

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [filter, setFilter] = useState<'all' | 'day1' | 'day2'>('all')
  const [newComment, setNewComment] = useState('')
  const { user } = useAuth()

  const handleLike = (photoId: string) => {
    setPhotos(prev => 
      prev.map(photo => 
        photo.id === photoId 
          ? { 
              ...photo, 
              isLiked: !photo.isLiked,
              likes: photo.isLiked ? photo.likes - 1 : photo.likes + 1
            }
          : photo
      )
    )
  }

  const handleDownload = (photo: Photo) => {
    // In a real app, this would trigger a download
    console.log('Downloading:', photo.title)
  }

  const handleShare = (photo: Photo) => {
    // In a real app, this would open share options
    console.log('Sharing:', photo.title)
  }

  const handleAddComment = (photoId: string) => {
    if (!newComment.trim() || !user) return

    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      text: newComment.trim(),
      author: user.username,
      createdAt: new Date().toISOString()
    }

    setPhotos(prev =>
      prev.map(photo =>
        photo.id === photoId
          ? { ...photo, comments: [...photo.comments, comment] }
          : photo
      )
    )

    setNewComment('')
  }

  const filteredPhotos = photos.filter(photo => {
    const photoDate = new Date(photo.uploadedAt)
    
    if (filter === 'day1') {
      return photoDate.toDateString() === new Date('2024-09-02').toDateString()
    }
    if (filter === 'day2') {
      return photoDate.toDateString() === new Date('2024-09-03').toDateString()
    }
    return true
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

  // Sort photos within each group by time
  Object.keys(groupedPhotos).forEach(dateKey => {
    groupedPhotos[dateKey].sort((a, b) => 
      new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
    )
  })

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All Photos' },
          { key: 'day1', label: 'Day 1 (Sep 2)' },
          { key: 'day2', label: 'Day 2 (Sep 3)' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`flex-1 min-w-0 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
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
              : 'Try a different filter or upload some photos.'
            }
          </p>
          {filter === 'all' && (
            <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-gray-600">
                Login and upload photos to start building your trip memories.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Photo Grid - Grouped by Date */}
      {filteredPhotos.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedPhotos).map(([dateKey, photosForDate], groupIndex) => (
          <div key={dateKey} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center space-x-3">
              <div className="h-px bg-gray-300 flex-1"></div>
              <h3 className="text-lg font-semibold text-gray-900 px-4 py-2 bg-white rounded-lg shadow-sm border">
                {dateKey}
              </h3>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
            
            {/* Photos for this date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {photosForDate.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                    className="card overflow-hidden cursor-pointer group"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 truncate">
                        {photo.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{photo.uploadedBy}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLike(photo.id)
                          }}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                            photo.isLiked
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${photo.isLiked ? 'fill-current' : ''}`} />
                          <span>{photo.likes}</span>
                        </button>
                        
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShare(photo)
                            }}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <div className="flex items-center space-x-1 text-gray-400">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">{photo.comments.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
        </div>
      )}

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
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex">
                <div className="flex-1">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                </div>
                
                <div className="w-80 p-6 flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {selectedPhoto.title}
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="h-5 w-5" />
                      <span>Uploaded by {selectedPhoto.uploadedBy}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-5 w-5" />
                      <span>{new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1" />
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleLike(selectedPhoto.id)}
                      className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                        selectedPhoto.isLiked
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${selectedPhoto.isLiked ? 'fill-current' : ''}`} />
                      <span>{selectedPhoto.likes} likes</span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleDownload(selectedPhoto)}
                        className="btn-secondary flex items-center justify-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handleShare(selectedPhoto)}
                        className="btn-primary flex items-center justify-center space-x-2"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Comments ({selectedPhoto.comments.length})
                    </h3>
                    
                    {/* Comments List */}
                    <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                      {selectedPhoto.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    {user ? (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(selectedPhoto.id)
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddComment(selectedPhoto.id)}
                          disabled={!newComment.trim()}
                          className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">
                        <button className="text-primary-600 hover:text-primary-700">
                          Login to comment
                        </button>
                      </p>
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

