import { useState, useCallback } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import TreeNode from './TreeNode'
import DragDropTree from './DragDropTree'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from './ContextMenu'
import client from '../../api/client'

export default function CollectionTree({ collections, onCollectionsChange, onSelectRequest, onImport, onExport, searchTerm = '' }) {
  const [expandedCollections, setExpandedCollections] = useState(new Set())
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [collectionData, setCollectionData] = useState({})
  const [selectedId, setSelectedId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const loadCollectionChildren = useCallback(async (collectionId) => {
    try {
      const [foldersRes, requestsRes] = await Promise.all([
        client.get('/folders', { params: { collection_id: collectionId } }),
        client.get('/requests', { params: { collection_id: collectionId } }),
      ])
      setCollectionData(prev => ({
        ...prev,
        [collectionId]: { folders: foldersRes.data, requests: requestsRes.data },
      }))
    } catch {
      toast.error('Failed to load collection contents')
    }
  }, [])

  const refreshCollection = (collectionId) => loadCollectionChildren(collectionId)

  const toggleCollection = async (col) => {
    const next = new Set(expandedCollections)
    if (next.has(col.id)) {
      next.delete(col.id)
    } else {
      next.add(col.id)
      if (!collectionData[col.id]) await loadCollectionChildren(col.id)
    }
    setExpandedCollections(next)
  }

  const toggleFolder = (folderId) => {
    const next = new Set(expandedFolders)
    next.has(folderId) ? next.delete(folderId) : next.add(folderId)
    setExpandedFolders(next)
  }

  const addCollection = async () => {
    const name = window.prompt('Collection name', 'New Collection')
    if (!name) return
    const { data } = await client.post('/collections', { name })
    onCollectionsChange([...collections, data])
  }

  const addFolder = async (col) => {
    const name = window.prompt('Folder name', 'New Folder')
    if (!name) return
    await client.post('/folders', { name, collection_id: col.id })
    await refreshCollection(col.id)
  }

  const addRequest = async (col, folder = null) => {
    const name = window.prompt('Request name', 'New Request')
    if (!name) return
    const { data } = await client.post('/requests', {
      name, method: 'GET', url: '', collection_id: col.id, folder_id: folder?.id || null,
    })
    await refreshCollection(col.id)
    onSelectRequest(data)
    setSelectedId(`request-${data.id}`)
  }

  const renameCollection = async (col) => {
    const name = window.prompt('Rename collection', col.name)
    if (!name) return
    const { data } = await client.put(`/collections/${col.id}`, { name })
    onCollectionsChange(collections.map(c => (c.id === col.id ? data : c)))
  }

  const renameFolder = async (col, folder) => {
    const name = window.prompt('Rename folder', folder.name)
    if (!name) return
    await client.put(`/folders/${folder.id}`, { name })
    await refreshCollection(col.id)
  }

  const renameRequest = async (col, req) => {
    const name = window.prompt('Rename request', req.name)
    if (!name) return
    await client.put(`/requests/${req.id}`, { name })
    await refreshCollection(col.id)
  }

  const deleteCollection = async (col) => {
    if (!window.confirm(`Delete collection "${col.name}"?`)) return
    await client.delete(`/collections/${col.id}`)
    onCollectionsChange(collections.filter(c => c.id !== col.id))
    toast.success('Collection deleted')
  }

  const deleteFolder = async (col, folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"?`)) return
    await client.delete(`/folders/${folder.id}`)
    await refreshCollection(col.id)
  }

  const deleteRequest = async (col, req) => {
    if (!window.confirm(`Delete request "${req.name}"?`)) return
    await client.delete(`/requests/${req.id}`)
    await refreshCollection(col.id)
  }

  const duplicateRequest = async (col, req) => {
    await client.post('/requests', {
      name: `${req.name} Copy`,
      method: req.method,
      url: req.url,
      headers: req.headers,
      params: req.params,
      body_type: req.body_type,
      body_content: req.body_content,
      auth_type: req.auth_type,
      auth_data: req.auth_data,
      collection_id: col.id,
      folder_id: req.folder_id,
    })
    await refreshCollection(col.id)
    toast.success('Request duplicated')
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = collections.findIndex(c => `collection-${c.id}` === active.id)
    const newIndex = collections.findIndex(c => `collection-${c.id}` === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(collections, oldIndex, newIndex)
    onCollectionsChange(reordered)
    try {
      await client.patch('/collections/reorder', reordered.map((c, i) => ({ id: c.id, order_index: i })))
    } catch {
      toast.error('Failed to save order')
    }
  }

  return (
    <div className="px-2 py-2">
      <button
        onClick={addCollection}
        className="w-full flex items-center justify-center gap-1.5 mb-2 py-1.5 rounded-md bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
      >
        + New Collection
      </button>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={collections.map(c => `collection-${c.id}`)} strategy={verticalListSortingStrategy}>
          {collections.map(col => {
            const data = collectionData[col.id]
            const isExpanded = expandedCollections.has(col.id)
            const matches = !searchTerm || col.name.toLowerCase().includes(searchTerm.toLowerCase())
            return (
              <div key={col.id} className={matches ? '' : 'hidden'}>
                <DragDropTree id={`collection-${col.id}`}>
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <TreeNode
                        type="collection"
                        name={col.name}
                        depth={0}
                        hasChildren
                        expanded={isExpanded}
                        onToggle={() => toggleCollection(col)}
                        onClick={() => toggleCollection(col)}
                      />
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => addFolder(col)}>Add Folder</ContextMenuItem>
                      <ContextMenuItem onSelect={() => addRequest(col)}>Add Request</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => renameCollection(col)}>Rename</ContextMenuItem>
                      <ContextMenuItem onSelect={() => onImport(col)}>Import</ContextMenuItem>
                      <ContextMenuItem onSelect={() => onExport(col)}>Export</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem danger onSelect={() => deleteCollection(col)}>Delete</ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </DragDropTree>

                {isExpanded && data && (
                  <div>
                    {data.folders.filter(f => !f.parent_folder_id).map(folder => {
                      const folderExpanded = expandedFolders.has(folder.id)
                      const folderRequests = data.requests.filter(r => r.folder_id === folder.id)
                      return (
                        <div key={folder.id}>
                          <ContextMenu>
                            <ContextMenuTrigger>
                              <TreeNode
                                type="folder"
                                name={folder.name}
                                depth={1}
                                hasChildren
                                expanded={folderExpanded}
                                onToggle={() => toggleFolder(folder.id)}
                                onClick={() => toggleFolder(folder.id)}
                              />
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onSelect={() => addRequest(col, folder)}>Add Request</ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem onSelect={() => renameFolder(col, folder)}>Rename</ContextMenuItem>
                              <ContextMenuItem danger onSelect={() => deleteFolder(col, folder)}>Delete</ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>

                          {folderExpanded && folderRequests.map(req => (
                            <ContextMenu key={req.id}>
                              <ContextMenuTrigger>
                                <TreeNode
                                  type="request"
                                  name={req.name}
                                  method={req.method}
                                  depth={2}
                                  selected={selectedId === `request-${req.id}`}
                                  onClick={() => { onSelectRequest(req); setSelectedId(`request-${req.id}`) }}
                                />
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onSelect={() => duplicateRequest(col, req)}>Duplicate</ContextMenuItem>
                                <ContextMenuItem onSelect={() => renameRequest(col, req)}>Rename</ContextMenuItem>
                                <ContextMenuItem danger onSelect={() => deleteRequest(col, req)}>Delete</ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          ))}
                        </div>
                      )
                    })}

                    {data.requests.filter(r => !r.folder_id).map(req => (
                      <ContextMenu key={req.id}>
                        <ContextMenuTrigger>
                          <TreeNode
                            type="request"
                            name={req.name}
                            method={req.method}
                            depth={1}
                            selected={selectedId === `request-${req.id}`}
                            onClick={() => { onSelectRequest(req); setSelectedId(`request-${req.id}`) }}
                          />
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onSelect={() => duplicateRequest(col, req)}>Duplicate</ContextMenuItem>
                          <ContextMenuItem onSelect={() => renameRequest(col, req)}>Rename</ContextMenuItem>
                          <ContextMenuItem danger onSelect={() => deleteRequest(col, req)}>Delete</ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </SortableContext>
      </DndContext>
    </div>
  )
}
