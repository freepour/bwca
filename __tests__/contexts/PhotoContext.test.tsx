import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { PhotoProvider, usePhotos } from '@/contexts/PhotoContext'

// Mock fetch
global.fetch = jest.fn()

describe('PhotoContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PhotoProvider>{children}</PhotoProvider>
  )

  describe('Photo Loading', () => {
    it('loads photos on mount', async () => {
      const mockPhotos = [
        {
          id: 'photo1',
          url: 'https://cloudinary.com/photo1.jpg',
          title: 'Photo 1',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-01T10:00:00.000Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          photos: mockPhotos,
          count: 1,
        }),
      })

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.photos).toEqual(mockPhotos)
    })

    it('sets loading state during fetch', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      const { result } = renderHook(() => usePhotos(), { wrapper })

      expect(result.current.isLoading).toBe(true)
    })

    it('handles fetch errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.photos).toEqual([])
    })

    it('handles API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to load photos',
          photos: [],
        }),
      })

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.photos).toEqual([])
    })
  })

  describe('Add Photo', () => {
    it('adds photo to the beginning of the list', async () => {
      const mockPhotos = [
        {
          id: 'photo1',
          url: 'https://cloudinary.com/photo1.jpg',
          title: 'Photo 1',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-01T10:00:00.000Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          photos: mockPhotos,
          count: 1,
        }),
      })

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const newPhoto = {
        id: 'photo2',
        url: 'https://cloudinary.com/photo2.jpg',
        title: 'Photo 2',
        uploadedBy: 'TestUser',
        uploadedAt: '2025-09-02T10:00:00.000Z',
      }

      act(() => {
        result.current.addPhoto(newPhoto)
      })

      expect(result.current.photos[0]).toEqual(newPhoto)
      expect(result.current.photos.length).toBe(2)
    })
  })

  describe('Update Photo', () => {
    it('updates photo metadata', async () => {
      const mockPhotos = [
        {
          id: 'photo1',
          url: 'https://cloudinary.com/photo1.jpg',
          title: 'Photo 1',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-01T10:00:00.000Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          photos: mockPhotos,
          count: 1,
        }),
      })

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updatePhoto('photo1', {
          uploadedAt: '2025-09-02T10:00:00.000Z',
        })
      })

      expect(result.current.photos[0].uploadedAt).toBe('2025-09-02T10:00:00.000Z')
    })

    it('only updates the specified photo', async () => {
      const mockPhotos = [
        {
          id: 'photo1',
          url: 'https://cloudinary.com/photo1.jpg',
          title: 'Photo 1',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-01T10:00:00.000Z',
        },
        {
          id: 'photo2',
          url: 'https://cloudinary.com/photo2.jpg',
          title: 'Photo 2',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-02T10:00:00.000Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          photos: mockPhotos,
          count: 2,
        }),
      })

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updatePhoto('photo1', {
          title: 'Updated Title',
        })
      })

      expect(result.current.photos[0].title).toBe('Updated Title')
      expect(result.current.photos[1].title).toBe('Photo 2')
    })
  })

  describe('Delete Photo', () => {
    it('deletes photo from Cloudinary and removes from state', async () => {
      const mockPhotos = [
        {
          id: 'photo1',
          url: 'https://cloudinary.com/photo1.jpg',
          title: 'Photo 1',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-01T10:00:00.000Z',
        },
      ]

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            photos: mockPhotos,
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Photo deleted',
          }),
        })

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deletePhoto('photo1')
      })

      expect(result.current.photos.length).toBe(0)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/delete',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ photoId: 'photo1' }),
        })
      )
    })

    it('throws error when delete fails', async () => {
      const mockPhotos = [
        {
          id: 'photo1',
          url: 'https://cloudinary.com/photo1.jpg',
          title: 'Photo 1',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-01T10:00:00.000Z',
        },
      ]

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            photos: mockPhotos,
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: false,
            error: 'Delete failed',
          }),
        })

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.deletePhoto('photo1')
        })
      ).rejects.toThrow()

      // Photo should still be in state since delete failed
      expect(result.current.photos.length).toBe(1)
    })
  })

  describe('Refresh Photos', () => {
    it('reloads photos from API', async () => {
      const mockPhotos1 = [
        {
          id: 'photo1',
          url: 'https://cloudinary.com/photo1.jpg',
          title: 'Photo 1',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-01T10:00:00.000Z',
        },
      ]

      const mockPhotos2 = [
        ...mockPhotos1,
        {
          id: 'photo2',
          url: 'https://cloudinary.com/photo2.jpg',
          title: 'Photo 2',
          uploadedBy: 'TestUser',
          uploadedAt: '2025-09-02T10:00:00.000Z',
        },
      ]

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            photos: mockPhotos1,
            count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            photos: mockPhotos2,
            count: 2,
          }),
        })

      const { result } = renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.photos.length).toBe(1)

      await act(async () => {
        await result.current.refreshPhotos()
      })

      await waitFor(() => {
        expect(result.current.photos.length).toBe(2)
      })
    })
  })

  describe('Cache Control', () => {
    it('uses no-cache headers when fetching photos', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          photos: [],
          count: 0,
        }),
      })

      renderHook(() => usePhotos(), { wrapper })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/photos',
          expect.objectContaining({
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          })
        )
      })
    })
  })
})
