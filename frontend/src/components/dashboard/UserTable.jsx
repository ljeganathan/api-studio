import client from '../../api/client'
import toast from 'react-hot-toast'

export default function UserTable({ users, onUsersChange }) {
  const toggleActive = async (user) => {
    try {
      const { data } = await client.patch(`/admin/users/${user.id}/toggle`)
      onUsersChange(users.map(u => (u.id === user.id ? { ...u, is_active: data.active } : u)))
    } catch {
      toast.error('Failed to update user status')
    }
  }

  const makeAdmin = async (user) => {
    try {
      await client.patch(`/admin/users/${user.id}/make-admin`)
      onUsersChange(users.map(u => (u.id === user.id ? { ...u, is_admin: true } : u)))
      toast.success(`${user.username} is now an admin`)
    } catch {
      toast.error('Failed to promote user')
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Username</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Admin</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {users.map(user => (
            <tr key={user.id} className="bg-gray-900 hover:bg-gray-800/60">
              <td className="px-4 py-3 text-gray-400">{user.id}</td>
              <td className="px-4 py-3 text-white font-medium">{user.username}</td>
              <td className="px-4 py-3 text-gray-300">{user.email}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                {user.is_admin && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-400/10 text-orange-400">Admin</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 flex gap-2">
                <button
                  onClick={() => toggleActive(user)}
                  className="px-2 py-1 rounded-md text-xs bg-gray-700 hover:bg-gray-600 text-gray-200"
                >
                  Toggle Active
                </button>
                {!user.is_admin && (
                  <button
                    onClick={() => makeAdmin(user)}
                    className="px-2 py-1 rounded-md text-xs bg-orange-500/20 hover:bg-orange-500/40 text-orange-400"
                  >
                    Make Admin
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
