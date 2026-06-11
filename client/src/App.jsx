import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/layout/Navbar'
import BottomNav from './components/layout/BottomNav'
import Home from './pages/Home'
import Games from './pages/Games'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Login from './pages/Login'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16 md:pb-0 md:pt-16">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>
            } />
            <Route path="/games" element={
              <ProtectedRoute><AppLayout><Games /></AppLayout></ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute><AppLayout><Leaderboard /></AppLayout></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
