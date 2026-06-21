import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export default function DragDropTree({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center">
      <span {...attributes} {...listeners} className="cursor-grab text-gray-600 opacity-0 group-hover:opacity-100 shrink-0 pl-0.5">
        <GripVertical size={12} />
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
