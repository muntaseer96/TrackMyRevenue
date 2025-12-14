import { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile } from '../../hooks/useProfile'
import { AvatarUpload } from './AvatarUpload'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { toast } from '../ui/useToast'

export function ProfileForm() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const updateMutation = useUpdateProfile()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Sync form state with profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateMutation.mutateAsync({ name, phone })
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    }
  }

  if (profileLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-9 w-32 bg-gray-200 rounded-lg" />
              <div className="h-9 w-24 bg-gray-200 rounded-lg" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-16 bg-gray-200 rounded-lg" />
            <div className="h-16 bg-gray-200 rounded-lg" />
            <div className="h-16 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Profile Photo</h3>
          <AvatarUpload
            currentAvatarUrl={profile?.avatar_url || null}
            name={profile?.name || null}
            email={profile?.email || null}
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />

          <Input
            label="Email"
            value={profile?.email || ''}
            disabled
            hint="Email cannot be changed"
            className="bg-gray-50 text-gray-500"
          />

          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
