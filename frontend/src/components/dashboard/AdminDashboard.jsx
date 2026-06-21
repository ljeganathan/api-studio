import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'
import UserTable from './UserTable'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    client.get('/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
  }, [])

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-orange-400">Admin Dashboard</h1>
      </div>
      <UserTable users={users} onUsersChange={setUsers} />
    </div>
  )
}
