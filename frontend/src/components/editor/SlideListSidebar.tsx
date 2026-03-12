import type { Slide } from '@/types/api'
import { cn } from '@/lib/utils'

interface SlideListSidebarProps {
  slides: Slide[]
  currentSlideId: number | null
  onSelectSlide: (slideId: number) => void
}

export function SlideListSidebar({ slides, currentSlideId, onSelectSlide }: SlideListSidebarProps) {
  return (
    <aside className="no-scrollbar w-64 shrink-0 overflow-y-auto border-r border-surface-200/10 bg-surface-950 p-4">
      <div className="mb-4 text-xs font-bold uppercase tracking-wider text-surface-500">
        Slides ({slides.length})
      </div>
      <div className="space-y-4">
        {slides.map((slide, index) => {
          const isActive = currentSlideId === slide.id
          
          return (
            <button
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className={cn(
                "group relative w-full overflow-hidden rounded-lg border-2 transition-all outline-none",
                isActive 
                  ? "border-brand-500 ring-4 ring-brand-500/10" 
                  : "border-surface-800 hover:border-surface-600"
              )}
            >
              <div className="aspect-[4/3] w-full bg-surface-900">
                <img 
                  src={`/${slide.imagePath}`} 
                  alt={`Slide ${index + 1}`}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 py-1.5 px-3 text-xs font-medium backdrop-blur-md transition-colors",
                isActive ? "bg-brand-500 text-white" : "bg-surface-900/80 text-surface-400 group-hover:text-surface-200"
              )}>
                Slide {index + 1}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
