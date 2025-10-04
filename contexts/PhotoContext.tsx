'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Photo {
  id: string
  url: string
  title: string
  uploadedBy: string
  uploadedAt: string
}

interface PhotoContextType {
  photos: Photo[]
  isLoading: boolean
  addPhoto: (photo: Photo) => void
  updatePhoto: (id: string, updates: Partial<Photo>) => void
  deletePhoto: (id: string) => void
  refreshPhotos: () => Promise<void>
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined)

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<Set<string>>(new Set())

  // Load photos from Cloudinary
  const loadPhotos = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/photos', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()

      if (data.success) {
        // Merge with existing photos to prevent losing optimistically added ones
        setPhotos(prevPhotos => {
          const newPhotos = data.photos
          const existingIds = new Set(newPhotos.map((p: Photo) => p.id))

          // Keep any photos from local state that aren't in the API response yet
          const recentLocalPhotos = prevPhotos.filter(p => !existingIds.has(p.id))

          // Combine: API photos (source of truth) + recent local photos
          // BUT filter out any photos we know have been deleted
          const allPhotos = [...newPhotos, ...recentLocalPhotos]
          return allPhotos.filter(p => !deletedPhotoIds.has(p.id))
        })
      } else {
        console.error('Failed to load photos:', data.error)
      }
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load photos from Cloudinary on mount
  useEffect(() => {
    loadPhotos()

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPhotos()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also refresh every 30 seconds if tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadPhotos()
      }
    }, 30000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [])

  // Refresh photos function
  const refreshPhotos = async () => {
    await loadPhotos()
  }

  const addPhoto = (photo: Photo) => {
    // Add photo optimistically
    setPhotos(prev => [photo, ...prev])

    // Retry fetching from Cloudinary with exponential backoff
    // Cloudinary API can be slow to reflect new uploads
    const retryDelays = [1000, 3000, 5000, 10000] // 1s, 3s, 5s, 10s
    retryDelays.forEach(delay => {
      setTimeout(() => {
        loadPhotos()
      }, delay)
    })
  }

  const updatePhoto = (id: string, updates: Partial<Photo>) => {
    setPhotos(prev => 
      prev.map(photo => 
        photo.id === id ? { ...photo, ...updates } : photo
      )
    )
  }

  const deletePhoto = async (id: string) => {
    try {
      // Mark as deleted immediately to prevent it from reappearing
      setDeletedPhotoIds(prev => new Set(prev).add(id))

      // Immediately remove from local state
      setPhotos(prev => prev.filter(photo => photo.id !== id))

      // Delete from Cloudinary in the background
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId: id })
      })

      const data = await response.json()

      if (!data.success) {
        console.error('Delete failed:', data.error)
        // Remove from deleted list if delete failed
        setDeletedPhotoIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        // Re-add the photo back if delete failed
        await loadPhotos()
        throw new Error(data.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      // Remove from deleted list if delete failed
      setDeletedPhotoIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Reload photos to restore state if delete failed
      await loadPhotos()
      throw error
    }
  }

  return (
    <PhotoContext.Provider value={{ photos, isLoading, addPhoto, updatePhoto, deletePhoto, refreshPhotos }}>
      {children}
    </PhotoContext.Provider>
  )
}

export function usePhotos() {
  const context = useContext(PhotoContext)
  if (context === undefined) {
    throw new Error('usePhotos must be used within a PhotoProvider')
  }
  return context
}
