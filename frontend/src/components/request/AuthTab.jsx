export default function AuthTab({ authType, setAuthType, authData, setAuthData }) {
  const updateField = (field, value) => setAuthData({ ...authData, [field]: value })

  return (
    <div className="p-3">
      <select
        value={authType}
        onChange={e => setAuthType(e.target.value)}
        className="bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-sm text-gray-200 mb-3"
      >
        <option value="none">No Auth</option>
        <option value="bearer">Bearer Token</option>
        <option value="basic">Basic Auth</option>
      </select>

      {authType === 'bearer' && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Token</label>
          <input
            type="text"
            value={authData.token || ''}
            onChange={e => updateField('token', e.target.value)}
            placeholder="Bearer token"
            className="w-full bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-sm text-gray-200"
          />
        </div>
      )}

      {authType === 'basic' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Username</label>
            <input
              type="text"
              value={authData.username || ''}
              onChange={e => updateField('username', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-sm text-gray-200"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Password</label>
            <input
              type="password"
              value={authData.password || ''}
              onChange={e => updateField('password', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-sm text-gray-200"
            />
          </div>
        </div>
      )}

      {authType === 'none' && (
        <p className="text-gray-500 text-sm py-6 text-center">This request does not use any authorization</p>
      )}
    </div>
  )
}
