import * as RadixContextMenu from '@radix-ui/react-context-menu'

export const ContextMenu = RadixContextMenu.Root
export const ContextMenuTrigger = RadixContextMenu.Trigger

export function ContextMenuContent({ children, ...props }) {
  return (
    <RadixContextMenu.Portal>
      <RadixContextMenu.Content
        {...props}
        className="bg-gray-800 text-white rounded-lg shadow-2xl border border-gray-700 p-1 min-w-44 z-50"
      >
        {children}
      </RadixContextMenu.Content>
    </RadixContextMenu.Portal>
  )
}

export function ContextMenuItem({ children, danger, ...props }) {
  return (
    <RadixContextMenu.Item
      {...props}
      className={`px-3 py-1.5 text-sm rounded-md cursor-pointer outline-none
        ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-200 hover:bg-gray-700'}`}
    >
      {children}
    </RadixContextMenu.Item>
  )
}

export function ContextMenuSeparator(props) {
  return <RadixContextMenu.Separator {...props} className="h-px bg-gray-700 my-1" />
}
