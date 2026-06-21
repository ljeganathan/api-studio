import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import client from '../../api/client'
import { useAuthStore } from '../../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await client.post('/auth/register', { email, username, password })

      const form = new URLSearchParams()
      form.set('username', email)
      form.set('password', password)
      const { data } = await client.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      setAuth(data.access_token, { username: data.username, is_admin: data.is_admin })
      navigate('/')
    } catch {
      toast.error('Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          <span className="text-orange-400">API</span> Studio
        </h1>
        <p className="text-gray-400 text-sm mb-6">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Username</label>
            <input
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-white text-sm"
              placeholder="janedoe"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-white text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-white text-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-white text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-gray-500 text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-400 hover:text-orange-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
