'use client'

import { useState } from 'react'
import { Camera, Upload, Users, Heart, LogIn } from 'lucide-react'
import PhotoUpload from '@/components/PhotoUpload'
import PhotoGallery from '@/components/PhotoGallery'
import LoginModal from '@/components/LoginModal'
import UserMenu from '@/components/UserMenu'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('gallery')
  const [showLogin, setShowLogin] = useState(false)
  const { user, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Camera className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">BWCA Adventure 2025</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="text-sm font-medium">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'gallery'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            View Photos
          </button>
          <button
            onClick={() => {
              if (!user) {
                setShowLogin(true)
                return
              }
              setActiveTab('upload')
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload Photos {!user && '(Login Required)'}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'gallery' ? <PhotoGallery /> : <PhotoUpload />}
      </main>

      {/* Login Modal */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  )
}

