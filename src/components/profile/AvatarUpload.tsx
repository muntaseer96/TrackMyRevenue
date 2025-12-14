import { useRef, useState } from 'react'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { useUploadAvatar, useDeleteAvatar } from '../../hooks/useProfile'

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  name: string | null
  email: string | null
}

export function AvatarUpload({ currentAvatarUrl, name, email }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uploadMutation = useUploadAvatar()
  const deleteMutation = useDeleteAvatar()

  const isLoading = uploadMutation.isPending || deleteMutation.isPending

  // Get initials for fallback
  const getInitials = () => {
    if (name) {
      return name.charAt(0).toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return '?'
  }

  // Generate consistent color based on user identifier
  const getAvatarColor = () => {
    const str = name || email || ''
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ]
    return colors[Math.abs(hash) % colors.length]
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    try {
      await uploadMutation.mutateAsync(file)
      setPreviewUrl(null) // Clear preview after successful upload
    } catch (error) {
      setPreviewUrl(null)
      // Error is handled by the mutation
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex items-center gap-6">
      {/* Avatar */}
      <div className="relative">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-semibold ${getAvatarColor()}`}
          >
            {getInitials()}
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-4 h-4" />
          {currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
        </button>

        {currentAvatarUrl && (
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        )}

        {/* Error messages */}
        {uploadMutation.error && (
          <p className="text-sm text-red-600">
            {uploadMutation.error instanceof Error
              ? uploadMutation.error.message
              : 'Failed to upload avatar'}
          </p>
        )}
        {deleteMutation.error && (
          <p className="text-sm text-red-600">
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : 'Failed to delete avatar'}
          </p>
        )}
      </div>
    </div>
  )
}
