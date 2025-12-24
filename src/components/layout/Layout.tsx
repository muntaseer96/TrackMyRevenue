import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, TrendingUp } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={openSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">TrackMyRevenue</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
