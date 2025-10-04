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

  // Load photos from Cloudinary
  const loadPhotos = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/photos', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()

      if (data.success) {
        setPhotos(data.photos)
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
  }, [])

  // Refresh photos function
  const refreshPhotos = async () => {
    await loadPhotos()
  }

  const addPhoto = (photo: Photo) => {
    setPhotos(prev => [photo, ...prev])
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
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId: id })
      })

      const data = await response.json()

      if (data.success) {
        setPhotos(prev => prev.filter(photo => photo.id !== id))
      } else {
        console.error('Delete failed:', data.error)
        throw new Error(data.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
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
