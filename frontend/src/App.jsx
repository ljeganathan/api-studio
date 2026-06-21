import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import AppLayout from './components/layout/AppLayout'
import AdminDashboard from './components/dashboard/AdminDashboard'
import LeaderDashboard from './components/dashboard/LeaderDashboard'

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const token = useAuthStore(s => s.token)
  const isAdmin = useAuthStore(s => s.user?.is_admin)
  if (!token) return <Navigate to="/login" />
  return isAdmin ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/leaderboard" element={<AdminRoute><LeaderDashboard /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
