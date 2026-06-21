import { NavLink, useNavigate } from 'react-router-dom'
import { History, Upload, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function TopBar({ onToggleHistory, onOpenImport }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = (user?.username || '?').slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between px-4 h-14 bg-gray-800 border-b border-gray-700 shrink-0">
      <div className="text-lg font-bold text-white">
        <span className="text-orange-400">API</span> Studio
      </div>

      <nav className="flex items-center gap-6 text-sm font-medium">
        <NavLink to="/" className={({ isActive }) => isActive ? 'text-orange-400' : 'text-gray-400 hover:text-white'}>
          Home
        </NavLink>
        {user?.is_admin && (
          <>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'text-orange-400' : 'text-gray-400 hover:text-white'}>
              Admin
            </NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => isActive ? 'text-orange-400' : 'text-gray-400 hover:text-white'}>
              Leaderboard
            </NavLink>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <button onClick={onToggleHistory} title="History" className="text-gray-400 hover:text-white transition-colors">
          <History size={18} />
        </button>
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium"
        >
          <Upload size={13} /> Import
        </button>
        <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </div>
        <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-red-400 transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
