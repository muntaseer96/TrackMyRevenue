import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Websites } from './pages/Websites'
import { WebsiteDetail } from './pages/WebsiteDetail'
import { Categories } from './pages/Categories'
import { Investments } from './pages/Investments'
import { Expenses } from './pages/Expenses'
import { Profile } from './pages/Profile'
import { Import } from './pages/Import'
import { Cashflow } from './pages/Cashflow'
import { useEffect } from 'react'
import { Toaster } from './components/ui'

function ProtectedRoute() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/websites" element={<Websites />} />
            <Route path="/websites/:id" element={<WebsiteDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/import" element={<Import />} />
            <Route path="/cashflow" element={<Cashflow />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
