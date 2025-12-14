import { Header } from '../components/layout/Header'
import { ProfileForm } from '../components/profile'

export function Profile() {
  return (
    <div>
      <Header title="Profile" />
      <div className="p-6">
        <div className="max-w-2xl">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your profile information and photo
            </p>
          </div>
          <ProfileForm />
        </div>
      </div>
    </div>
  )
}
