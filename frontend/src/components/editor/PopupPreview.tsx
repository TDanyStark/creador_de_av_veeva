import type { Popup } from '@/types/api'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface PopupPreviewProps {
  popup: Popup
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent, type: 'move' | 'resize') => void
}

export function PopupPreview({ popup, isSelected, onClick, onMouseDown }: PopupPreviewProps) {
  const imageUrl = popup.imagePath 
    ? `${import.meta.env.VITE_API_URL || ''}/${popup.imagePath}`
    : null;

  return (
    <div
      onClick={onClick}
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, 'move');
        }}
      className={cn(
        "absolute flex items-center justify-center cursor-move group pointer-events-auto",
        isSelected 
          ? "ring-2 ring-amber-500 z-50 shadow-[0_0_40px_rgba(0,0,0,0.5)]" 
          : "ring-1 ring-amber-500/50 z-40"
      )}
        style={{
          top: `${popup.popupTop}%`,
          left: `${popup.popupLeft}%`,
          width: `${popup.popupWidthPercent}%`,
          height: `${popup.popupHeightPercent}%`,
        }}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Popup Preview" 
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <div className="w-full h-full bg-amber-900/40 backdrop-blur-xl flex flex-col items-center justify-center border-2 border-dashed border-amber-500/50 rounded-xl">
            <p className="text-amber-500 font-black text-sm uppercase tracking-tight shadow-sm">Sin imagen de popup</p>
            <p className="text-amber-400/60 text-[10px] mt-1 font-medium">Sube una imagen o arrastra para mover</p>
          </div>
        )}

        {/* Close button preview */}
        <div 
          className={cn(
            "absolute p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all",
            popup.closeXPosition === 'inside' ? "top-3 right-3" : "-top-10 -right-2"
          )}
          style={{ color: popup.closeColor }}
        >
          <X size={20} className="drop-shadow-sm" />
        </div>

        {/* Resize Handle */}
        {isSelected && (
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDown(e, 'resize');
            }}
            className="absolute -bottom-1 -right-1 w-8 h-8 cursor-nwse-resize flex items-center justify-center pointer-events-auto bg-amber-500 text-white rounded-tl-xl shadow-lg hover:scale-110 transition-transform z-[60]"
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-white/80 translate-x-[-1px] translate-y-[-1px]" />
          </div>
        )}

        {/* Label */}
        <div className="absolute -top-6 left-0 flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Vista Previa del Popup
        </div>
    </div>
  )
}
