import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'
import client from '../../api/client'

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444']

export default function LeaderDashboard() {
  const [topUsers, setTopUsers] = useState([])
  const [methodStats, setMethodStats] = useState([])
  const [trends, setTrends] = useState([])

  useEffect(() => {
    const onError = () => toast.error('Failed to load leaderboard data')
    client.get('/leaderboard/top-users').then(r => setTopUsers(r.data)).catch(onError)
    client.get('/leaderboard/method-stats').then(r => setMethodStats(r.data)).catch(onError)
    client.get('/leaderboard/daily-trends').then(r => setTrends(r.data.reverse())).catch(onError)
  }, [])

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-8 text-orange-400">Usage Leaderboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Top Users</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topUsers}>
              <XAxis dataKey="username" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Methods Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={methodStats} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={80} label>
                {methodStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Daily Trends (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trends}>
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
