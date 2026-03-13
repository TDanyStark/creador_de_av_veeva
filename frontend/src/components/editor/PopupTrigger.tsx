import { memo } from 'react'
import type { Popup } from '@/types/api'
import { cn } from '@/lib/utils'
import { Maximize2 } from 'lucide-react'

interface PopupTriggerProps {
  popup: Popup
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent, type: 'move' | 'resize') => void
}

export const PopupTrigger = memo(function PopupTrigger({ popup, isSelected, onClick, onMouseDown }: PopupTriggerProps) {
  return (
    <div
      onClick={onClick}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, 'move');
      }}
      className={cn(
        "absolute flex items-center justify-center cursor-move group",
        isSelected 
          ? "bg-amber-500/20 ring-2 ring-amber-500 z-30 shadow-xl shadow-amber-500/20" 
          : "bg-amber-500/10 border border-amber-500/40 z-20 hover:bg-amber-500/20"
      )}
      style={{
        top: `${popup.buttonTop}%`,
        left: `${popup.buttonLeft}%`,
        width: `${popup.buttonWidth}%`,
        height: `${popup.buttonHeight}%`,
      }}
    >
      <div className={cn(
        "text-white flex items-center gap-1.5 pointer-events-none drop-shadow-md",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
      )}>
        <Maximize2 className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-wide">Popup Link</span>
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, 'resize');
          }}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center pointer-events-auto"
        >
          <div className="w-2 h-2 bg-amber-500 rounded-sm" />
        </div>
      )}
    </div>
  )
})
