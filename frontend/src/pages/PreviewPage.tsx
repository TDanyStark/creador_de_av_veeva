import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { EditorDataResponse } from '@/types/api'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentSlideIdParam = searchParams.get('slide')
  
  const [activePopupIds, setActivePopupIds] = useState<number[]>([])

  const { data, isLoading, isError } = useQuery<EditorDataResponse>({
    queryKey: ['editor-data', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${id}/editor-data`)
      return data.data
    },
    enabled: !!id,
  })

  // Sort slides properly
  const slides = [...(data?.slides || [])].sort((a, b) => a.slideNumber - b.slideNumber)
  const links = data?.navigationLinks || []
  const popups = data?.popups || []

  // Ensure current slide is an existing one
  const currentSlideId = currentSlideIdParam ? parseInt(currentSlideIdParam) : -1
  const currentSlide = slides.find(s => s.id === currentSlideId) || slides[0]

  // Swipes logic
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50 

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) 
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && nextSlide) {
      handleGoToSlide(nextSlide.id)
    }
    if (isRightSwipe && prevSlide) {
      handleGoToSlide(prevSlide.id)
    }
  }

  const currentIndex = slides.findIndex(s => s.id === currentSlide?.id)
  const prevSlide = currentIndex > 0 ? slides[currentIndex - 1] : null
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null

  const handleGoToSlide = useCallback((targetSlideId: number) => {
    setActivePopupIds([])
    setSearchParams({ slide: targetSlideId.toString() })
  }, [setSearchParams])

  const handlePopupToggle = useCallback((popupId: number | null, exclusiveOpen: boolean) => {
    if (!popupId) return
    setActivePopupIds(prev => {
      if (prev.includes(popupId)) {
        return prev.filter(id => id !== popupId)
      }
      if (exclusiveOpen) {
        return [popupId]
      }
      return [...prev, popupId]
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(`/editor/${id}?slide=${currentSlide?.id}`)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, id, currentSlide])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (isError || !currentSlide) {
     return <div className="flex h-screen w-full items-center justify-center bg-black text-white">Error cargando preview</div>
  }

  const currentLinks = links.filter(l => l.slideId === currentSlide.id)
  const currentPopups = popups.filter(p => p.slideId === currentSlide.id)
  // Display all active popups that belong to this slide
  const activePopupsData = currentPopups.filter(p => p.id !== null && activePopupIds.includes(p.id))

  const hasOverlay = activePopupsData.some(p => p.overlayType && p.overlayType !== 'transparent')
  const overlayClass = activePopupsData.some(p => p.overlayType === 'light') ? 'bg-white/40' : 'bg-black/60'

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden font-sans select-none">
      
      {/* Back to editor button */}
      <Button 
        variant="secondary"
        className="absolute top-4 left-4 z-50 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity"
        onClick={() => navigate(`/editor/${id}?slide=${currentSlide.id}`)}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver al Editor
      </Button>

      {/* Veeva Emulation Container (usually 4:3 aspect ratio iPad scale) */}
      <div 
        className="relative w-full aspect-[4/3] max-h-screen text-left touch-pan-y shadow-2xl overflow-hidden"
        style={{ maxWidth: 'calc(100vh * 4 / 3)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        {/* Slide Image Background */}
        <img 
           className="w-full h-full object-contain pointer-events-none"
           src={`${import.meta.env.VITE_API_URL || ''}/${currentSlide.imagePath}`}
           alt={`Slide ${currentSlide.slideNumber}`}
        />

        {/* Navigation Layers */}
        {currentLinks.map(link => (
          <div
            key={link.id}
            onClick={(e) => {
              e.stopPropagation();
              if (link.targetSlideId) handleGoToSlide(link.targetSlideId)
            }}
            className="absolute cursor-pointer"
            style={{
              top: `${link.topPercent}%`,
              left: `${link.leftPercent}%`,
              width: `${link.widthPercent}%`,
              height: `${link.heightPercent}%`
            }}
          />
        ))}

        {/* Popup Triggers */}
        {currentPopups.map(popup => (
          <div
            key={`trigger-${popup.id}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePopupToggle(popup.id, popup.exclusiveOpen)
            }}
            className="absolute cursor-pointer"
            style={{
              top: `${popup.buttonTop}%`,
              left: `${popup.buttonLeft}%`,
              width: `${popup.buttonWidth}%`,
              height: `${popup.buttonHeight}%`
            }}
          />
        ))}

        {/* Render Active Popups */}
        {activePopupsData.length > 0 && (
          <div className="absolute inset-0 z-40 pointer-events-none">
            {/* Overlay if needed */}
            {hasOverlay && (
              <div 
                className={`absolute inset-0 pointer-events-auto transition-colors duration-300 ${overlayClass}`} 
                onClick={() => setActivePopupIds([])}
              />
            )}
            
            {activePopupsData.map(popup => (
              <div
                key={`popup-${popup.id}`}
                className="absolute pointer-events-auto shadow-2xl"
                style={{
                  top: `${popup.popupTop}%`,
                  left: `${popup.popupLeft}%`,
                  width: `${popup.popupWidthPercent}%`,
                  height: `${popup.popupHeightPercent}%`,
                  backgroundImage: popup.imagePath ? `url(${import.meta.env.VITE_API_URL || ''}/${popup.imagePath})` : 'none',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <button
                  type="button"
                  className="absolute cursor-pointer flex items-center justify-center rounded-full shadow-sm hover:scale-110 transition-transform bg-white/80 backdrop-blur-sm"
                  style={{
                    color: popup.closeColor || '#000',
                    width: '32px',
                    height: '32px',
                    top: popup.closeXPosition === 'outside' ? '-16px' : '8px',
                    right: popup.closeXPosition === 'outside' ? '-16px' : '8px',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePopupToggle(popup.id, false);
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Desktop Navigation Arrows Overlay */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-50 pointer-events-none sm:pointer-events-auto">
        {prevSlide && (
          <button 
            className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur shadow-lg pointer-events-auto hover:bg-black/70 hover:scale-105 transition-all outline-none"
            onClick={() => handleGoToSlide(prevSlide.id)}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
      </div>

      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-50 pointer-events-none sm:pointer-events-auto">
        {nextSlide && (
          <button 
            className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur shadow-lg pointer-events-auto hover:bg-black/70 hover:scale-105 transition-all outline-none"
            onClick={() => handleGoToSlide(nextSlide.id)}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  )
}
