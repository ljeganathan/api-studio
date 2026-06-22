import { useState } from 'react'
import ParamsTab from './ParamsTab'
import HeadersTab from './HeadersTab'
import BodyTab from './BodyTab'
import AuthTab from './AuthTab'

const TABS = ['Params', 'Headers', 'Body', 'Auth']

export default function TabsPanel({
  params, setParams,
  headers, setHeaders,
  bodyType, setBodyType, bodyContent, setBodyContent,
  authType, setAuthType, authData, setAuthData,
}) {
  const [active, setActive] = useState('Params')

  return (
    <div className="border-b border-gray-700 bg-gray-900">
      <div className="flex gap-1 px-3 bg-gray-800">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors
              ${active === tab ? 'text-orange-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            {tab}
            {active === tab && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-orange-500" />}
          </button>
        ))}
      </div>

      {active === 'Params' && <ParamsTab params={params} setParams={setParams} />}
      {active === 'Headers' && <HeadersTab headers={headers} setHeaders={setHeaders} />}
      {active === 'Body' && (
        <BodyTab
          bodyType={bodyType} setBodyType={setBodyType} bodyContent={bodyContent} setBodyContent={setBodyContent}
          headers={headers} setHeaders={setHeaders}
        />
      )}
      {active === 'Auth' && (
        <AuthTab authType={authType} setAuthType={setAuthType} authData={authData} setAuthData={setAuthData} />
      )}
    </div>
  )
}
