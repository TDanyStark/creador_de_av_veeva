import type { Slide, NavigationLink, Popup } from '@/types/api'
import { Trash2, Link as LinkIcon, Maximize2, Upload, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface PropertiesSidebarProps {
  selectedLink: NavigationLink | null
  selectedPopup: Popup | null
  slides: Slide[]
  onUpdateLink: (updates: Partial<NavigationLink>) => void
  onDeleteLink: (id: number) => void
  onUpdatePopup: (updates: Partial<Popup>) => void
  onSavePopup: (updates: Partial<Popup>, image?: File) => void
  onDeletePopup: (id: number) => void
  isPreviewVisible: boolean
  onTogglePreview: () => void
}

export function PropertiesSidebar({ 
  selectedLink, 
  selectedPopup,
  slides, 
  onUpdateLink, 
  onDeleteLink,
  onUpdatePopup,
  onSavePopup,
  onDeletePopup,
  isPreviewVisible,
  onTogglePreview
}: PropertiesSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedPopup) {
      onSavePopup({}, file)
    }
  }

  const handleCoordChange = (field: keyof Popup, value: string) => {
    const numValue = parseFloat(value) || 0
    onUpdatePopup({ [field]: Math.max(0, Math.min(100, numValue)) })
  }

  if (!selectedLink && !selectedPopup) {
    return (
      <aside className="w-80 shrink-0 border-l border-surface-200/10 bg-surface-950 p-6 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-900 mb-4">
          <LinkIcon className="h-6 w-6 text-surface-600" />
        </div>
        <h3 className="text-surface-200 font-medium tracking-tight">Nada seleccionado</h3>
        <p className="text-surface-500 text-sm mt-1">
          Crea un hotspot en el lienzo para configurar su navegación o popups.
        </p>
      </aside>
    )
  }

  if (selectedPopup) {
    return (
      <aside className="w-80 shrink-0 border-l border-surface-200/10 bg-surface-950 overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-surface-200/10 flex items-center justify-between">
          <h3 className="text-surface-50 font-semibold flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-amber-500" />
            Configuración Popup
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePreview}
            className={cn(
              "h-8 gap-2 text-[10px] font-bold uppercase tracking-wider transition-all",
              isPreviewVisible 
                ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" 
                : "bg-surface-800 text-surface-400 hover:bg-surface-700"
            )}
          >
            {isPreviewVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            {isPreviewVisible ? 'Cerrar' : 'Ver'}
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-3 block">
              Imagen del Popup
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative aspect-video w-full rounded-xl bg-surface-900 border-2 border-dashed border-surface-800 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all overflow-hidden flex flex-col items-center justify-center text-center p-4"
            >
              {selectedPopup.imagePath ? (
                <>
                  <img 
                    src={`${import.meta.env.VITE_API_URL || ''}/${selectedPopup.imagePath}`} 
                    className="absolute inset-0 h-full w-full object-contain p-2"
                    alt="Current popup"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-6 w-6 text-white mb-2" />
                    <span className="text-xs text-white font-medium px-2">Cambiar imagen</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-surface-600 mb-2 group-hover:text-amber-500 transition-colors" />
                  <span className="text-xs text-surface-500 font-medium group-hover:text-surface-300">Sube una imagen</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="h-px bg-surface-800" />

          {/* Overlay & Settings */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-3 block">
                Tipo de Fondo (Overlay)
              </label>
              <div className="flex gap-2">
                {['dark', 'light', 'transparent'].map((type) => (
                  <button
                    key={type}
                    onClick={() => onSavePopup({ overlayType: type as any })}
                    className={cn(
                      "flex-1 py-1.5 rounded-md border text-[10px] font-bold uppercase transition-all",
                      selectedPopup.overlayType === type
                        ? "bg-amber-500 border-amber-400 text-white"
                        : "bg-surface-900 border-surface-800 text-surface-500 hover:border-surface-600"
                    )}
                  >
                    {type === 'dark' ? 'Oscuro' : type === 'light' ? 'Claro' : 'Limpio'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900 border border-surface-800">
                  <div>
                    <div className="text-xs font-semibold text-surface-200">Botón "X"</div>
                    <div className="text-[10px] text-surface-500 uppercase">{selectedPopup.closeXPosition === 'inside' ? 'Interno' : 'Externo'}</div>
                  </div>
                  <button 
                    onClick={() => onSavePopup({ closeXPosition: selectedPopup.closeXPosition === 'inside' ? 'outside' : 'inside' })}
                    className={cn(
                      "h-6 w-11 rounded-full transition-colors relative",
                      selectedPopup.closeXPosition === 'inside' ? "bg-amber-500" : "bg-surface-600"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-sm",
                      selectedPopup.closeXPosition === 'inside' ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900 border border-surface-800">
                  <div>
                    <div className="text-xs font-semibold text-surface-200">Exclusivo</div>
                    <div className="text-[10px] text-surface-500">Auto-cerrar</div>
                  </div>
                  <button 
                    onClick={() => onSavePopup({ exclusiveOpen: !selectedPopup.exclusiveOpen })}
                    className={cn(
                      "h-6 w-11 rounded-full transition-colors relative",
                      selectedPopup.exclusiveOpen ? "bg-amber-500" : "bg-surface-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-sm",
                      selectedPopup.exclusiveOpen ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-3 block">
                Color de la "X"
              </label>
              <div className="flex gap-4">
                {['#000000', '#ffffff', '#ef4444', '#f59e0b', '#3b82f6'].map((color) => (
                  <button
                    key={color}
                    onClick={() => onSavePopup({ closeColor: color })}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedPopup.closeColor === color 
                        ? "border-amber-500 scale-110 shadow-lg" 
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selectedPopup.closeColor === color && (
                      <Check className={cn("h-3 w-3", color === '#ffffff' ? "text-black" : "text-white")} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-surface-800" />

          {/* Coordinates Grid */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-2 block">Trigger Position & Size (%)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'T-X', field: 'buttonLeft' as const },
                  { label: 'T-Y', field: 'buttonTop' as const },
                  { label: 'T-W', field: 'buttonWidth' as const },
                  { label: 'T-H', field: 'buttonHeight' as const }
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-surface-600 block">{item.label}</label>
                    <input 
                      type="number"
                      value={Math.round(selectedPopup[item.field])}
                      onChange={(e) => handleCoordChange(item.field, e.target.value)}
                      className="w-full p-1 rounded bg-surface-900 border border-surface-800 text-surface-400 text-[10px] font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-2 block">Popup Content Position & Size (%)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'P-X', field: 'popupLeft' as const },
                  { label: 'P-Y', field: 'popupTop' as const },
                  { label: 'P-W', field: 'popupWidthPercent' as const },
                  { label: 'P-H', field: 'popupHeightPercent' as const }
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-amber-500/50 block">{item.label}</label>
                    <input 
                      type="number"
                      value={Math.round(selectedPopup[item.field])}
                      onChange={(e) => handleCoordChange(item.field, e.target.value)}
                      className="w-full p-1 rounded bg-surface-900 border border-surface-800 text-amber-500/80 text-[10px] font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                onClick={() => onSavePopup({})}
              >
                Guardar Configuración
              </Button>
              <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all font-bold uppercase text-[10px]"
                  onClick={() => selectedPopup.id && onDeletePopup(selectedPopup.id)}
              >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Eliminar Popup
              </Button>
          </div>
        </div>
      </aside>
    )
  }

  if (selectedLink) {
    return (
      <aside className="w-80 shrink-0 border-l border-surface-200/10 bg-surface-950 overflow-y-auto custom-scrollbar">
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
                      src={`${import.meta.env.VITE_API_URL || ''}/${slide.imagePath}`} 
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

          {/* Actions */}
          <div className="pt-4 flex flex-col gap-2">
              <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all font-bold uppercase text-[10px]"
                  onClick={() => selectedLink.id && onDeleteLink(selectedLink.id)}
              >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Eliminar Enlace
              </Button>
          </div>
        </div>
      </aside>
    )
  }

  return null
}
