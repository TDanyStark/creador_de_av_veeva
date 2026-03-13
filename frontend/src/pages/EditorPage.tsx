import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { SlideListSidebar } from '@/components/editor/SlideListSidebar'
import { PropertiesSidebar } from '@/components/editor/PropertiesSidebar'
import { CanvasWorkspace } from '@/components/editor/CanvasWorkspace'
import type { EditorDataResponse, NavigationLink, Popup } from '@/types/api'
import { toast } from 'sonner'

export function EditorPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  
  const currentSlideIdFromUrl = searchParams.get('slide') ? parseInt(searchParams.get('slide')!) : null
  const [selectedLinkId, setSelectedLinkId] = useState<number | null | string>(null)
  const [selectedPopupId, setSelectedPopupId] = useState<number | null | string>(null)
  const [activeMode, setActiveMode] = useState<'navigation' | 'popup'>('navigation')
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)

  const { data, isLoading } = useQuery<EditorDataResponse>({
    queryKey: ['editor-data', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${id}/editor-data`)
      return data.data
    },
    enabled: !!id,
  })

  const slides = data?.slides || []
  const links = data?.navigationLinks || []
  const popups = data?.popups || []
  const project = data?.project

  const currentSlide = slides.find(s => s.id === currentSlideIdFromUrl) || slides[0] || null

  useEffect(() => {
    if (slides.length > 0 && !currentSlideIdFromUrl) {
      setSearchParams({ slide: slides[0].id.toString() }, { replace: true })
    }
  }, [slides, currentSlideIdFromUrl, setSearchParams])

  const saveMutation = useMutation({
    mutationFn: async (link: NavigationLink) => {
      const { data } = await apiClient.post(`/slides/${link.slideId}/navigation`, link)
      return data.data
    },
    onSuccess: (savedLink) => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      setSelectedLinkId(savedLink.id)
      toast.success('Enlace guardado correctamente')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (linkId: number) => {
      await apiClient.delete(`/navigation-links/${linkId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      setSelectedLinkId(null)
      toast.success('Enlace eliminado')
    }
  })

  const savePopupMutation = useMutation({
    mutationFn: async ({ popup, image }: { popup: Partial<Popup>, image?: File }) => {
      const formData = new FormData()
      Object.entries(popup).forEach(([key, value]) => {
        if (value !== null && value !== undefined) formData.append(key, value.toString())
      })
      if (image) {
        formData.append('image', image)
      }

      const { data } = await apiClient.post(`/slides/${popup.slideId}/popups`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return data.data
    },
    onSuccess: (savedPopup) => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      setSelectedPopupId(savedPopup.id)
      toast.success('Popup guardado')
    }
  })

  const deletePopupMutation = useMutation({
    mutationFn: async (popupId: number) => {
      await apiClient.delete(`/popups/${popupId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      setSelectedPopupId(null)
      toast.success('Popup eliminado')
    }
  })

  const handleUpdateLink = (linkId: number | string, updates: Partial<NavigationLink>) => {
    // For MVP, we'll update the cache optimistically or just wait for the save button if we add one.
    // The plan says "CRUD para actualizar los links", I'll make it auto-save for now on certain actions
    // or just local state if it's a drag/resize.
    
    // Optimistic local update in query cache
    queryClient.setQueryData(['editor-data', id], (old: EditorDataResponse | undefined) => {
        if (!old) return old
        return {
            ...old,
            navigationLinks: old.navigationLinks.map(link => 
                link.id === linkId ? { ...link, ...updates } : link
            )
        }
    })

    // If it's a property update (like targetSlideId), auto-save
    if (updates.targetSlideId !== undefined && typeof linkId === 'number') {
        const link = links.find(l => l.id === linkId)
        if (link) {
            saveMutation.mutate({ ...link, ...updates })
        }
    }
  }

  const handleAddLink = (newLink: NavigationLink) => {
    saveMutation.mutate(newLink)
  }

  const handleSelectSlide = (slideId: number) => {
    setSearchParams({ slide: slideId.toString() })
    setSelectedLinkId(null)
    setSelectedPopupId(null)
  }

  const handleUpdatePopup = (popupId: number | string, updates: Partial<Popup>) => {
    queryClient.setQueryData(['editor-data', id], (old: EditorDataResponse | undefined) => {
      if (!old) return old
      return {
        ...old,
        popups: old.popups.map(p => p.id === popupId ? { ...p, ...updates } : p)
      }
    })
  }

  const selectedLink = links.find(l => l.id === selectedLinkId) || null
  const selectedPopup = popups.find(p => p.id === selectedPopupId) || null

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-surface-950">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <p className="text-surface-400 font-medium">Cargando editor...</p>
            </div>
        </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-surface-950 text-surface-50 overflow-hidden">
      <EditorHeader 
        projectName={project?.name} 
        activeMode={activeMode}
        onModeChange={(mode) => {
          setActiveMode(mode)
          setSelectedLinkId(null)
          setSelectedPopupId(null)
          setIsPreviewVisible(false)
        }}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <SlideListSidebar 
          slides={slides} 
          currentSlideId={currentSlide?.id || null} 
          onSelectSlide={handleSelectSlide}
        />
        
        <CanvasWorkspace 
          currentSlide={currentSlide}
          activeMode={activeMode}
          links={links.filter(l => l.slideId === currentSlide?.id)}
          selectedLinkId={selectedLinkId}
          onSelectLink={setSelectedLinkId}
          onAddLink={handleAddLink}
          onUpdateLink={handleUpdateLink}
          popups={popups.filter(p => p.slideId === currentSlide?.id)}
          selectedPopupId={selectedPopupId}
          onSelectPopup={(id) => { setSelectedPopupId(id); setIsPreviewVisible(false); }}
          onAddPopup={(newPopup) => savePopupMutation.mutate({ popup: newPopup })}
          onUpdatePopup={handleUpdatePopup}
          onSavePopup={(popup, image) => savePopupMutation.mutate({ popup, image })}
          isPreviewVisible={isPreviewVisible}
        />
        
        <PropertiesSidebar 
          selectedLink={selectedLink}
          selectedPopup={selectedPopup}
          slides={slides}
          onUpdateLink={(updates) => selectedLinkId && typeof selectedLinkId === 'number' && handleUpdateLink(selectedLinkId, updates)}
          onDeleteLink={(linkId) => deleteMutation.mutate(linkId)}
          onUpdatePopup={(updates) => selectedPopupId && (typeof selectedPopupId === 'number' || selectedPopupId === 'temp') && handleUpdatePopup(selectedPopupId, updates)}
          onSavePopup={(updates, image) => selectedPopupId && (typeof selectedPopupId === 'number' || selectedPopupId === 'temp') && savePopupMutation.mutate({ popup: { ...selectedPopup!, ...updates }, image })}
          onDeletePopup={(popupId) => deletePopupMutation.mutate(popupId)}
          isPreviewVisible={isPreviewVisible}
          onTogglePreview={() => setIsPreviewVisible(prev => !prev)}
        />
      </div>
    </div>
  )
}
