import { useEffect, useState } from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import RequestPanel from '../request/RequestPanel'
import HistoryPanel from '../history/HistoryPanel'
import ImportModal from '../collection/ImportModal'
import ExportModal from '../collection/ExportModal'
import client from '../../api/client'

export default function AppLayout() {
  const [collections, setCollections] = useState([])
  const [activeRequest, setActiveRequest] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [exportTarget, setExportTarget] = useState(null)
  const [replayData, setReplayData] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(null)

  useEffect(() => {
    client.get('/collections').then(r => setCollections(r.data))
  }, [])

  const refreshCollections = () => {
    client.get('/collections').then(r => setCollections(r.data))
  }

  const selectRequest = (req) => {
    setReplayData(null)
    setActiveRequest(req)
  }

  const requestToShow = replayData?.request || activeRequest

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar onToggleHistory={() => setShowHistory(v => !v)} onOpenImport={() => setImportOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          collections={collections}
          onCollectionsChange={setCollections}
          onSelectRequest={selectRequest}
          onImport={() => setImportOpen(true)}
          onExport={(col) => setExportTarget(col)}
          refreshSignal={refreshSignal}
        />
        <main className="flex-1 flex flex-col min-h-0">
          {requestToShow
            ? <RequestPanel
                key={requestToShow.id}
                request={requestToShow}
                prefillResponse={replayData?.response}
                onSaved={(saved) => setRefreshSignal({ collectionId: saved.collection_id, version: Date.now() })}
              />
            : <div className="flex-1 flex items-center justify-center text-gray-500 text-xl">Select a request or create a new one</div>
          }
        </main>
        {showHistory && (
          <div className="w-80 shrink-0 flex flex-col min-h-0">
            <HistoryPanel
              onReplayResponse={(data) => { setReplayData(data); setShowHistory(false) }}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}
      </div>

      {importOpen && (
        <ImportModal onClose={() => setImportOpen(false)} onImported={() => { refreshCollections(); setImportOpen(false) }} />
      )}
      {exportTarget && (
        <ExportModal collection={exportTarget} onClose={() => setExportTarget(null)} />
      )}
    </div>
  )
}
