import { cn } from '@/lib/utils'
import type { Slide, NavigationLink, Popup } from '@/types/api'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Hotspot } from './Hotspot'
import { PopupTrigger } from './PopupTrigger'
import { PopupPreview } from './PopupPreview'

interface CanvasWorkspaceProps {
  currentSlide: Slide | null
  activeMode: 'navigation' | 'popup'
  links: NavigationLink[]
  selectedLinkId: number | null | string
  onSelectLink: (id: number | null | string) => void
  onAddLink: (link: NavigationLink) => void
  onUpdateLink: (id: number | string, updates: Partial<NavigationLink>) => void
  
  popups: Popup[]
  selectedPopupId: number | null | string
  onSelectPopup: (id: number | null | string) => void
  onAddPopup: (popup: Popup) => void
  onUpdatePopup: (id: number | string, updates: Partial<Popup>) => void
  onSavePopup: (popup: Partial<Popup>, image?: File) => void
  isPreviewVisible: boolean
  version: number
}

type DragType = 'move-link' | 'resize-link' | 'move-trigger' | 'resize-trigger' | 'move-content' | 'resize-content'

export function CanvasWorkspace({ 
  currentSlide, 
  activeMode,
  links, 
  selectedLinkId, 
  onSelectLink, 
  onAddLink, 
  onUpdateLink,
  popups,
  selectedPopupId,
  onSelectPopup,
  onAddPopup,
  onUpdatePopup,
  isPreviewVisible,
  version
}: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 })
  const [currentMouse, setCurrentMouse] = useState({ x: 0, y: 0 })
  
  // Drag state: tracks the current drag operation.
  // onUpdateLink/onUpdatePopup now update local state in the parent INSTANTLY
  // (no API round-trip before re-render), so we only need the drag delta for
  // smooth live feedback while the mouse is held down.
  const [localDrag, setLocalDrag] = useState<{
    type: DragType
    startX: number
    startY: number
    currentX: number
    currentY: number
    initialItem: NavigationLink | Popup
  } | null>(null)

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
    if (e.button !== 0) return
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'IMG') {
        onSelectLink(null)
        onSelectPopup(null)
        const coords = getRelativeCoords(e)
        setIsDrawing(true)
        setDrawStart(coords)
        setCurrentMouse(coords)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    const coords = getRelativeCoords(e)
    if (isDrawing) {
      setCurrentMouse(coords)
    }
    if (localDrag) {
      setLocalDrag(prev => prev ? ({ ...prev, currentX: coords.x, currentY: coords.y }) : null)
    }
  }

  const handleMouseUp = (e: MouseEvent) => {
    if (isDrawing) {
      const coords = getRelativeCoords(e)
      const left = Math.min(drawStart.x, coords.x)
      const top = Math.min(drawStart.y, coords.y)
      const width = Math.abs(coords.x - drawStart.x)
      const height = Math.abs(coords.y - drawStart.y)

      if (width > 0.5 && height > 0.5) {
        if (activeMode === 'navigation') {
          onAddLink({ id: null, slideId: currentSlide.id, targetSlideId: null, topPercent: top, leftPercent: left, widthPercent: width, heightPercent: height })
        } else {
          onAddPopup({ id: null, slideId: currentSlide.id, imagePath: null, buttonTop: top, buttonLeft: left, buttonWidth: width, buttonHeight: height, popupTop: 10, popupLeft: 10, popupWidthPercent: 80, popupHeightPercent: 60, closeColor: '#000000', closeXPosition: 'inside', overlayType: 'dark', exclusiveOpen: true })
        }
      }
      setIsDrawing(false)
    }

    if (localDrag) {
      const dx = localDrag.currentX - localDrag.startX
      const dy = localDrag.currentY - localDrag.startY
      
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        if (localDrag.type === 'move-link' || localDrag.type === 'resize-link') {
            const link = localDrag.initialItem as NavigationLink
            const updates = localDrag.type === 'move-link' ? {
                leftPercent: Math.max(0, Math.min(100 - link.widthPercent, link.leftPercent + dx)),
                topPercent: Math.max(0, Math.min(100 - link.heightPercent, link.topPercent + dy)),
            } : {
                widthPercent: Math.max(1, Math.min(100 - link.leftPercent, link.widthPercent + dx)),
                heightPercent: Math.max(1, Math.min(100 - link.topPercent, link.heightPercent + dy)),
            }
            // This now instantly updates the parent's local state — no API flash
            onUpdateLink(selectedLinkId!, updates)
        } else if (localDrag.type.startsWith('move-trigger') || localDrag.type.startsWith('resize-trigger')) {
            const popup = localDrag.initialItem as Popup
            const updates = localDrag.type === 'move-trigger' ? {
                buttonLeft: Math.max(0, Math.min(100 - popup.buttonWidth, popup.buttonLeft + dx)),
                buttonTop: Math.max(0, Math.min(100 - popup.buttonHeight, popup.buttonTop + dy)),
            } : {
                buttonWidth: Math.max(1, Math.min(100 - popup.buttonLeft, popup.buttonWidth + dx)),
                buttonHeight: Math.max(1, Math.min(100 - popup.buttonTop, popup.buttonHeight + dy)),
            }
            onUpdatePopup(selectedPopupId!, updates)
        } else if (localDrag.type.startsWith('move-content') || localDrag.type.startsWith('resize-content')) {
            const popup = localDrag.initialItem as Popup
            const updates = localDrag.type === 'move-content' ? {
                popupLeft: Math.max(0, Math.min(100 - popup.popupWidthPercent, popup.popupLeft + dx)),
                popupTop: Math.max(0, Math.min(100 - popup.popupHeightPercent, popup.popupTop + dy)),
            } : {
                popupWidthPercent: Math.max(5, Math.min(100 - popup.popupLeft, popup.popupWidthPercent + dx)),
                popupHeightPercent: Math.max(5, Math.min(100 - popup.popupTop, popup.popupHeightPercent + dy)),
            }
            onUpdatePopup(selectedPopupId!, updates)
        }
      }
      setLocalDrag(null)
    }
  }

  useEffect(() => {
    if (isDrawing || localDrag) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDrawing, localDrag])

  // During an active drag, compute the live visual position from the initial snapshot + delta.
  // Once mouseUp fires and onUpdateLink/Popup is called, the parent's state is already updated
  // so localDrag becomes null WITHOUT a flash — the props already have the new values.
  const displayItems = useMemo(() => {
    const dx = localDrag ? localDrag.currentX - localDrag.startX : 0
    const dy = localDrag ? localDrag.currentY - localDrag.startY : 0

    const processedLinks = links.map(link => {
      if (localDrag && (localDrag.type === 'move-link' || localDrag.type === 'resize-link') && (link.id == selectedLinkId || (link.id === null && selectedLinkId === 'temp'))) {
        if (localDrag.type === 'move-link') {
            return { ...link, leftPercent: (localDrag.initialItem as NavigationLink).leftPercent + dx, topPercent: (localDrag.initialItem as NavigationLink).topPercent + dy }
        } else {
            return { ...link, widthPercent: (localDrag.initialItem as NavigationLink).widthPercent + dx, heightPercent: (localDrag.initialItem as NavigationLink).heightPercent + dy }
        }
      }
      return link
    })

    const processedPopups = popups.map(popup => {
      if (localDrag && (popup.id == selectedPopupId || (popup.id === null && selectedPopupId === 'temp'))) {
        const initial = localDrag.initialItem as Popup
        if (localDrag.type === 'move-trigger') return { ...popup, buttonLeft: initial.buttonLeft + dx, buttonTop: initial.buttonTop + dy }
        if (localDrag.type === 'resize-trigger') return { ...popup, buttonWidth: initial.buttonWidth + dx, buttonHeight: initial.buttonHeight + dy }
        if (localDrag.type === 'move-content') return { ...popup, popupLeft: initial.popupLeft + dx, popupTop: initial.popupTop + dy }
        if (localDrag.type === 'resize-content') return { ...popup, popupWidthPercent: initial.popupWidthPercent + dx, popupHeightPercent: initial.popupHeightPercent + dy }
      }
      return popup
    })

    return { links: processedLinks, popups: processedPopups }
  }, [links, popups, localDrag, selectedLinkId, selectedPopupId])

  const selectedPopup = displayItems.popups.find(p => 
    (p.id !== null && p.id == selectedPopupId) || 
    (p.id === null && selectedPopupId === 'temp')
  )

  return (
    <div className="flex-1 bg-surface-900 p-8 flex items-center justify-center overflow-auto custom-scrollbar select-none">
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="relative bg-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 overflow-hidden"
        style={{ width: '100%', maxWidth: '1024px', aspectRatio: '1024 / 768' }}
      >
        <img 
          src={`${import.meta.env.VITE_API_URL || ''}/${currentSlide.imagePath}?v=${version}`} 
          alt="Current Slide"
          className="h-full w-full object-contain pointer-events-none"
        />

        {/* Overlay Backdrop */}
        {selectedPopup && isPreviewVisible && (
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none transition-all duration-300 z-10",
              selectedPopup.overlayType === 'dark' && "bg-black/60",
              selectedPopup.overlayType === 'light' && "bg-white/40",
              selectedPopup.overlayType === 'transparent' && "bg-transparent"
            )}
          />
        )}

        {/* Navigation Links */}
        {displayItems.links.map(link => (
          <Hotspot
            key={`link-${link.id || 'temp'}`}
            link={link}
            isSelected={(link.id !== null && selectedLinkId == link.id) || (link.id === null && selectedLinkId === 'temp')}
            onClick={(e) => { e.stopPropagation(); onSelectLink(link.id || 'temp'); onSelectPopup(null) }}
            onMouseDown={(e, type) => {
              const coords = getRelativeCoords(e)
              setLocalDrag({ type: type === 'move' ? 'move-link' : 'resize-link', startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y, initialItem: { ...link } })
            }}
          />
        ))}

        {/* Popup Triggers */}
        {displayItems.popups.map(popup => (
          <PopupTrigger
            key={`popup-${popup.id || 'temp'}`}
            popup={popup}
            isSelected={(popup.id !== null && selectedPopupId == popup.id) || (popup.id === null && selectedPopupId === 'temp')}
            onClick={(e) => { e.stopPropagation(); onSelectPopup(popup.id || 'temp'); onSelectLink(null) }}
            onMouseDown={(e, type) => {
              const coords = getRelativeCoords(e)
              setLocalDrag({ type: type === 'move' ? 'move-trigger' : 'resize-trigger', startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y, initialItem: { ...popup } })
            }}
          />
        ))}

        {/* Popup Content Preview */}
        {selectedPopup && isPreviewVisible && (
          <PopupPreview 
            popup={selectedPopup}
            isSelected={true}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e, type) => {
              const coords = getRelativeCoords(e)
              setLocalDrag({ type: type === 'move' ? 'move-content' : 'resize-content', startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y, initialItem: { ...selectedPopup } })
            }}
          />
        )}

        {/* Drawing rectangle */}
        {isDrawing && (
            <div 
                className={`absolute border-2 pointer-events-none z-50 ${activeMode === 'navigation' ? 'border-brand-500 bg-brand-500/10' : 'border-amber-500 bg-amber-500/10'}`}
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
