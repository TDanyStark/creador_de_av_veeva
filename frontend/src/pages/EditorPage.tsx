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
  const [clipboard, setClipboard] = useState<{ type: 'navigation' | 'popup', data: any } | null>(null)
  const [version, setVersion] = useState(0)

  const { data, isLoading } = useQuery<EditorDataResponse>({
    queryKey: ['editor-data', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${id}/editor-data`)
      return data.data
    },
    enabled: !!id,
  })

  const slides = [...(data?.slides || [])].sort((a, b) => a.slideNumber - b.slideNumber)
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
      if (savedLink.id) setSelectedLinkId(savedLink.id)
      // toast.success('Enlace guardado correctamente') // Removed to avoid too many toasts on auto-save
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
      if (savedPopup.id) setSelectedPopupId(savedPopup.id)
      // toast.success('Popup guardado')
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

  // Keybinds for Copy/Paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selectedLink = links.find(l => l.id === selectedLinkId)
        const selectedPopup = popups.find(p => p.id === selectedPopupId)
        
        if (selectedLink) {
          setClipboard({ type: 'navigation', data: { ...selectedLink, id: null } })
          toast.info('Navegación copiada')
        } else if (selectedPopup) {
          setClipboard({ type: 'popup', data: { ...selectedPopup, id: null } })
          toast.info('Popup copiado')
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard && currentSlide) {
        if (clipboard.type === 'navigation') {
          saveMutation.mutate({ ...clipboard.data, slideId: currentSlide.id, leftPercent: clipboard.data.leftPercent + 2, topPercent: clipboard.data.topPercent + 2 })
          toast.success('Navegación pegada')
        } else {
          savePopupMutation.mutate({ popup: { ...clipboard.data, slideId: currentSlide.id, buttonLeft: clipboard.data.buttonLeft + 2, buttonTop: clipboard.data.buttonTop + 2 } })
          toast.success('Popup pegado')
        }
      }

      // Delete / Suppress keybind
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedLink = links.find(l => l.id === selectedLinkId)
        const selectedPopup = popups.find(p => p.id === selectedPopupId)

        if (selectedLink && typeof selectedLink.id === 'number') {
          deleteMutation.mutate(selectedLink.id)
        } else if (selectedPopup && typeof selectedPopup.id === 'number') {
          deletePopupMutation.mutate(selectedPopup.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedLinkId, selectedPopupId, links, popups, clipboard, currentSlide])

  const handleUpdateLink = (linkId: number | string, updates: Partial<NavigationLink>) => {
    queryClient.setQueryData(['editor-data', id], (old: EditorDataResponse | undefined) => {
        if (!old) return old
        return {
            ...old,
            navigationLinks: old.navigationLinks.map(link => 
                link.id === linkId ? { ...link, ...updates } : link
            )
        }
    })

    if (typeof linkId === 'number') {
        const link = links.find(l => l.id === linkId)
        if (link) {
            saveMutation.mutate({ ...link, ...updates })
        }
    }
  }

  const handleUpdatePopup = (popupId: number | string, updates: Partial<Popup>) => {
    queryClient.setQueryData(['editor-data', id], (old: EditorDataResponse | undefined) => {
      if (!old) return old
      return {
        ...old,
        popups: old.popups.map(p => p.id === popupId ? { ...p, ...updates } : p)
      }
    })

    if (typeof popupId === 'number') {
        const popup = popups.find(p => p.id === popupId)
        if (popup) {
            savePopupMutation.mutate({ popup: { ...popup, ...updates } })
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

  const selectedLink = links.find(l => l.id === selectedLinkId) || null
  const selectedPopup = popups.find(p => p.id === selectedPopupId) || null

  const replicateLinkMutation = useMutation({
    mutationFn: async ({ link, targetSlideIds }: { link: NavigationLink, targetSlideIds: number[] }) => {
      const promises = targetSlideIds.map(slideId => {
        const { id, ...rest } = link
        return apiClient.post(`/slides/${slideId}/navigation`, { ...rest, slideId })
      })
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      toast.success('Enlace replicado correctamente')
    }
  })

  const replicatePopupMutation = useMutation({
    mutationFn: async ({ popup, targetSlideIds }: { popup: Popup, targetSlideIds: number[] }) => {
      const promises = targetSlideIds.map(slideId => {
        const { id, ...rest } = popup
        const formData = new FormData()
        Object.entries(rest).forEach(([key, value]) => {
          if (value !== null && value !== undefined) formData.append(key, value.toString())
        })
        return apiClient.post(`/slides/${slideId}/popups`, formData)
      })
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      toast.success('Popup replicado correctamente')
    }
  })

  const deleteSlideMutation = useMutation({
    mutationFn: async (slideId: number) => {
      await apiClient.delete(`/slides/${slideId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      setVersion(v => v + 1)
      toast.success('Slide eliminado correctamente')
      // If the current slide was deleted, redirect to the first available slide
      const remainingSlides = slides.filter(s => s.id !== currentSlideIdFromUrl)
      if (remainingSlides.length > 0) {
        setSearchParams({ slide: remainingSlides[0].id.toString() })
      }
    }
  })

  const reorderSlidesMutation = useMutation({
    mutationFn: async (newOrderIds: number[]) => {
      await apiClient.patch(`/projects/${id}/slides/reorder`, { order: newOrderIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      setVersion(v => v + 1)
      toast.success('Orden actualizado')
    }
  })

  const addSlidesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData()
      files.forEach(file => formData.append('slides[]', file))
      await apiClient.post(`/projects/${id}/slides`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-data', id] })
      setVersion(v => v + 1)
      toast.success('Slides añadidos correctamente')
    }
  })

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
          onDeleteSlide={(slideId: number) => deleteSlideMutation.mutate(slideId)}
          onReorderSlides={(newOrder: number[]) => reorderSlidesMutation.mutate(newOrder)}
          onAddSlides={(files: File[]) => addSlidesMutation.mutate(files)}
          version={version}
        />
        
        <CanvasWorkspace 
          currentSlide={currentSlide}
          activeMode={activeMode}
          links={links.filter(l => l.slideId === currentSlide?.id)}
          selectedLinkId={selectedLinkId}
          onSelectLink={(id) => { 
            setSelectedLinkId(id); 
            if (id) {
              setActiveMode('navigation');
              setSelectedPopupId(null);
            }
          }}
          onAddLink={handleAddLink}
          onUpdateLink={handleUpdateLink}
          popups={popups.filter(p => p.slideId === currentSlide?.id)}
          selectedPopupId={selectedPopupId}
          onSelectPopup={(id) => { 
            setSelectedPopupId(id); 
            setIsPreviewVisible(false); 
            if (id) {
              setActiveMode('popup');
              setSelectedLinkId(null);
            }
          }}
          onAddPopup={(newPopup) => savePopupMutation.mutate({ popup: newPopup })}
          onUpdatePopup={handleUpdatePopup}
          onSavePopup={(popup, image) => savePopupMutation.mutate({ popup, image })}
          isPreviewVisible={isPreviewVisible}
          version={version}
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
          onReplicateLink={(link, targetSlideIds) => replicateLinkMutation.mutate({ link, targetSlideIds })}
          onReplicatePopup={(popup, targetSlideIds) => replicatePopupMutation.mutate({ popup, targetSlideIds })}
        />
      </div>
    </div>
  )
}
