import type { NavigationLink } from '@/types/api'
import { cn } from '@/lib/utils'
import { Link as LinkIcon } from 'lucide-react'

interface HotspotProps {
  link: NavigationLink
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent, type: 'move' | 'resize') => void
}

export function Hotspot({ link, isSelected, onClick, onMouseDown }: HotspotProps) {
  return (
    <div
      onClick={onClick}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, 'move');
      }}
      className={cn(
        "absolute flex items-center justify-center cursor-move transition-all group",
        isSelected 
          ? "bg-brand-500/20 ring-2 ring-brand-500 z-20 shadow-xl shadow-brand-500/20" 
          : "bg-brand-500/10 border border-brand-500/40 z-10 hover:bg-brand-500/20"
      )}
      style={{
        top: `${link.topPercent}%`,
        left: `${link.leftPercent}%`,
        width: `${link.widthPercent}%`,
        height: `${link.heightPercent}%`,
      }}
    >
      <div className={cn(
        "text-white flex items-center gap-1.5 pointer-events-none drop-shadow-md",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
      )}>
        <LinkIcon className="h-4 w-4" />
        {link.targetSlideId ? (
            <span className="text-[10px] font-bold uppercase tracking-wide">Veeva Link</span>
        ) : (
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-200">Sin destino</span>
        )}
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
          <div className="w-2 h-2 bg-brand-500 rounded-sm" />
        </div>
      )}
    </div>
  )
}
