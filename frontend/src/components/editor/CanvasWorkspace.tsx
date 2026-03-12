import type { Slide, NavigationLink } from '@/types/api'
import { useState, useRef, useEffect } from 'react'
import { Hotspot } from './Hotspot'

interface CanvasWorkspaceProps {
  currentSlide: Slide | null
  links: NavigationLink[]
  selectedLinkId: number | null | string // string for temporary new links
  onSelectLink: (id: number | null | string) => void
  onAddLink: (link: NavigationLink) => void
  onUpdateLink: (id: number | string, updates: Partial<NavigationLink>) => void
}

export function CanvasWorkspace({ 
  currentSlide, 
  links, 
  selectedLinkId, 
  onSelectLink, 
  onAddLink, 
  onUpdateLink 
}: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 })
  const [currentMouse, setCurrentMouse] = useState({ x: 0, y: 0 })
  const [dragAction, setDragAction] = useState<{ type: 'move' | 'resize', startX: number, startY: number, initialLink: NavigationLink } | null>(null)

  if (!currentSlide) {
    return (
      <div className="flex-1 bg-surface-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-96 aspect-[4/3] bg-surface-800 rounded-lg shadow-2xl" />
            <p className="mt-4 text-surface-500 text-sm">Cargando diapositiva...</p>
        </div>
      </div>
    )
  }

  const getRelativeCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    
    // Check if clicking on empty space to start drawing
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'IMG') {
        onSelectLink(null)
        const coords = getRelativeCoords(e)
        setIsDrawing(true)
        setDrawStart(coords)
        setCurrentMouse(coords)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    const currentCoords = getRelativeCoords(e)
    
    if (isDrawing) {
      setCurrentMouse(currentCoords)
    }

    if (dragAction && selectedLinkId !== null) {
      const dx = currentCoords.x - dragAction.startX
      const dy = currentCoords.y - dragAction.startY
      
      const { initialLink } = dragAction

      if (dragAction.type === 'move') {
        onUpdateLink(selectedLinkId, {
          leftPercent: Math.max(0, Math.min(100 - initialLink.widthPercent, initialLink.leftPercent + dx)),
          topPercent: Math.max(0, Math.min(100 - initialLink.heightPercent, initialLink.topPercent + dy)),
        })
      } else if (dragAction.type === 'resize') {
        onUpdateLink(selectedLinkId, {
          widthPercent: Math.max(2, Math.min(100 - initialLink.leftPercent, initialLink.widthPercent + dx)),
          heightPercent: Math.max(2, Math.min(100 - initialLink.topPercent, initialLink.heightPercent + dy)),
        })
      }
    }
  }

  const handleMouseUp = (e: MouseEvent) => {
    if (isDrawing) {
      const coords = getRelativeCoords(e)
      const left = Math.min(drawStart.x, coords.x)
      const top = Math.min(drawStart.y, coords.y)
      const width = Math.abs(coords.x - drawStart.x)
      const height = Math.abs(coords.y - drawStart.y)

      if (width > 1 && height > 1) {
        const newLink: NavigationLink = {
          id: null,
          slideId: currentSlide.id,
          targetSlideId: null,
          topPercent: top,
          leftPercent: left,
          widthPercent: width,
          heightPercent: height
        }
        onAddLink(newLink)
      }
      setIsDrawing(false)
    }

    setDragAction(null)
  }

  useEffect(() => {
    if (isDrawing || dragAction) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDrawing, dragAction])

  return (
    <div className="flex-1 bg-surface-900 p-8 flex items-center justify-center overflow-auto custom-scrollbar select-none">
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="relative bg-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
        style={{ 
          width: '100%', 
          maxWidth: '1024px', 
          aspectRatio: '4/3' 
        }}
      >
        <img 
          src={`/${currentSlide.imagePath}`} 
          alt="Current Slide"
          className="h-full w-full object-contain pointer-events-none"
        />

        {links.map(link => (
          <Hotspot
            key={link.id || 'temp'}
            link={link}
            isSelected={(link.id !== null && selectedLinkId === link.id) || (link.id === null && selectedLinkId === 'temp')}
            onClick={(e) => {
                e.stopPropagation()
                onSelectLink(link.id || 'temp')
            }}
            onMouseDown={(e, type) => {
              onSelectLink(link.id || 'temp')
              const coords = getRelativeCoords(e)
              setDragAction({
                type,
                startX: coords.x,
                startY: coords.y,
                initialLink: { ...link }
              })
            }}
          />
        ))}

        {isDrawing && (
            <div 
                className="absolute border-2 border-brand-500 bg-brand-500/10 pointer-events-none z-50"
                style={{
                  top: `${Math.min(drawStart.y, currentMouse.y)}%`,
                  left: `${Math.min(drawStart.x, currentMouse.x)}%`,
                  width: `${Math.abs(currentMouse.x - drawStart.x)}%`,
                  height: `${Math.abs(currentMouse.y - drawStart.y)}%`,
                }}
            />
        )}
      </div>
    </div>
  )
}
