import type { Slide, NavigationLink } from '@/types/api'
import { Trash2, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PropertiesSidebarProps {
  selectedLink: NavigationLink | null
  slides: Slide[]
  onUpdateLink: (updates: Partial<NavigationLink>) => void
  onDeleteLink: (id: number) => void
}

export function PropertiesSidebar({ selectedLink, slides, onUpdateLink, onDeleteLink }: PropertiesSidebarProps) {
  if (!selectedLink) {
    return (
      <aside className="w-80 shrink-0 border-l border-surface-200/10 bg-surface-950 p-6 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-900 mb-4">
          <LinkIcon className="h-6 w-6 text-surface-600" />
        </div>
        <h3 className="text-surface-200 font-medium tracking-tight">Nada seleccionado</h3>
        <p className="text-surface-500 text-sm mt-1">
          Crea un hotspot en el lienzo para configurar su navegación.
        </p>
      </aside>
    )
  }

  return (
    <aside className="w-80 shrink-0 border-l border-surface-200/10 bg-surface-950 overflow-y-auto">
      <div className="p-6 border-b border-surface-200/10">
        <h3 className="text-surface-50 font-semibold flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-brand-400" />
          Navegación Veeva
        </h3>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3 block">
            Destino (Zip/Página)
          </label>
          <div className="grid gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {slides.filter(s => s.id !== selectedLink.slideId).map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => onUpdateLink({ targetSlideId: slide.id })}
                className={`flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                  selectedLink.targetSlideId === slide.id
                    ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/20'
                    : 'border-surface-800 bg-surface-900 hover:border-surface-600'
                }`}
              >
                <div className="h-10 w-12 rounded bg-black shrink-0 overflow-hidden border border-surface-800">
                   <img 
                    src={`/${slide.imagePath}`} 
                    alt={`Slide ${idx + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                    <div className="text-xs font-medium text-surface-200">Slide {idx + 1}</div>
                    <div className="text-[10px] text-surface-500 font-mono">slide_{(idx + 1).toString().padStart(2, '0')}.zip</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-surface-800" />

        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-surface-500">X (%)</label>
                <div className="px-3 py-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-200 text-sm font-mono">
                    {selectedLink.leftPercent.toFixed(1)}%
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-surface-500">Y (%)</label>
                <div className="px-3 py-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-200 text-sm font-mono">
                    {selectedLink.topPercent.toFixed(1)}%
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-surface-500">W (%)</label>
                <div className="px-3 py-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-200 text-sm font-mono">
                    {selectedLink.widthPercent.toFixed(1)}%
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-surface-500">H (%)</label>
                <div className="px-3 py-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-200 text-sm font-mono">
                    {selectedLink.heightPercent.toFixed(1)}%
                </div>
            </div>
        </div>

        <div className="pt-4">
            <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                onClick={() => selectedLink.id && onDeleteLink(selectedLink.id)}
            >
                <Trash2 className="h-4 w-4" />
                Eliminar Enlace
            </Button>
        </div>
      </div>
    </aside>
  )
}
