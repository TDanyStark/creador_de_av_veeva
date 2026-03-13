import { useRef } from 'react'
import type { Slide } from '@/types/api'
import { cn } from '@/lib/utils'
import { Trash2, Plus, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface SlideListSidebarProps {
  slides: Slide[]
  currentSlideId: number | null
  onSelectSlide: (slideId: number) => void
  onDeleteSlide: (slideId: number) => void
  onReorderSlides: (newOrderIds: number[]) => void
  onAddSlides: (files: File[]) => void
  version: number
}

export function SlideListSidebar({ 
  slides, 
  currentSlideId, 
  onSelectSlide,
  onDeleteSlide,
  onReorderSlides,
  onAddSlides,
  version
}: SlideListSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = slides.findIndex((slide) => slide.id === active.id)
      const newIndex = slides.findIndex((slide) => slide.id === over?.id)
      
      const newItems = arrayMove(slides, oldIndex, newIndex)
      onReorderSlides(newItems.map(s => s.id))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddSlides(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  return (
    <aside className="no-scrollbar flex w-72 shrink-0 flex-col border-r border-surface-200/10 bg-surface-950">
      <div className="flex items-center justify-between border-b border-surface-200/5 p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-surface-500">
          Slides ({slides.length})
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-brand-500/10 hover:text-brand-500"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {slides.map((slide, index) => (
                <SortableSlideItem 
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isActive={currentSlideId === slide.id}
                  onSelect={() => onSelectSlide(slide.id)}
                  onDelete={() => onDeleteSlide(slide.id)}
                  version={version}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </aside>
  )
}

interface SortableSlideItemProps {
  slide: Slide
  index: number
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  version: number
}

function SortableSlideItem({ slide, index, isActive, onSelect, onDelete, version }: SortableSlideItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex gap-2",
        isDragging && "opacity-50"
      )}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="mt-2 flex h-8 w-6 cursor-grab items-center justify-center rounded text-surface-600 hover:bg-surface-800 hover:text-surface-400 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="relative flex-1">
        <button
          onClick={onSelect}
          className={cn(
            "group relative w-full overflow-hidden rounded-lg border-2 transition-all outline-none",
            isActive 
              ? "border-brand-500 ring-4 ring-brand-500/10" 
              : "border-surface-800 hover:border-surface-600"
          )}
        >
          <div className="aspect-[4/3] w-full bg-surface-900">
            <img 
              src={`/${slide.imagePath}?v=${version}`} 
              alt={`Slide ${index + 1}`}
              className="h-full w-full object-contain"
            />
          </div>
          <div className={cn(
            "absolute bottom-0 left-0 right-0 py-1.5 px-3 text-left text-[10px] font-medium backdrop-blur-md transition-colors",
            isActive ? "bg-brand-500 text-white" : "bg-surface-900/80 text-surface-400 group-hover:text-surface-200"
          )}>
            {index + 1}. Slide {index + 1}
          </div>

        </button>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger 
            render={
              <button
                className={cn(
                  "absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110",
                  !isActive && "opacity-0 group-hover:opacity-100"
                )}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            } 
          />
          <AlertDialogContent className="bg-surface-900 border-surface-800 text-surface-50">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar slide?</AlertDialogTitle>
              <AlertDialogDescription className="text-surface-400">
                Esta acción eliminará permanentemente la imagen, sus popups y enlaces de navegación asociados. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-surface-800 border-surface-700 hover:bg-surface-700 text-surface-200">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-none"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

