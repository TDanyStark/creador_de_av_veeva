import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { SlideListSidebar } from '@/components/editor/SlideListSidebar'
import { PropertiesSidebar } from '@/components/editor/PropertiesSidebar'
import { CanvasWorkspace } from '@/components/editor/CanvasWorkspace'
import type { EditorDataResponse, NavigationLink, Popup } from '@/types/api'
import { toast } from 'sonner'

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay]) as T
}

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

  // ─── LOCAL EDITOR STATE (source of truth for the UI) ──────────────────────
  // These are populated once from the server and then maintained locally.
  // Server responses NEVER overwrite these while the user is editing.
  const [localLinks, setLocalLinks] = useState<NavigationLink[]>([])
  const [localPopups, setLocalPopups] = useState<Popup[]>([])
  const serverDataInitialized = useRef(false)

  // ─── React Query (load only) ───────────────────────────────────────────────
  const { data, isLoading } = useQuery<EditorDataResponse>({
    queryKey: ['editor-data', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${id}/editor-data`)
      return data.data
    },
    enabled: !!id,
    // Don't auto-refetch in background — editor takes full ownership
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  // Populate local state once when server data arrives (or when forced refresh)
  useEffect(() => {
    if (data && !serverDataInitialized.current) {
      setLocalLinks(data.navigationLinks || [])
      setLocalPopups(data.popups || [])
      serverDataInitialized.current = true
    }
  }, [data])

  const slides = [...(data?.slides || [])].sort((a, b) => a.slideNumber - b.slideNumber)
  const project = data?.project
  const currentSlide = slides.find(s => s.id === currentSlideIdFromUrl) || slides[0] || null

  useEffect(() => {
    if (slides.length > 0 && !currentSlideIdFromUrl) {
      setSearchParams({ slide: slides[0].id.toString() }, { replace: true })
    }
  }, [slides, currentSlideIdFromUrl, setSearchParams])

  // ─── Refresh from server (used after add/delete/replicate operations) ──────
  const refreshFromServer = useCallback(async () => {
    serverDataInitialized.current = false
    const result = await queryClient.fetchQuery<EditorDataResponse>({
      queryKey: ['editor-data', id],
      queryFn: async () => {
        const { data } = await apiClient.get(`/projects/${id}/editor-data`)
        return data.data
      },
    })
    setLocalLinks(result.navigationLinks || [])
    setLocalPopups(result.popups || [])
    serverDataInitialized.current = true
  }, [id, queryClient])

  // ─── API mutations (fire-and-forget, never touch local state on success) ───
  const saveLinkApiCall = useCallback(async (link: NavigationLink) => {
    const { data } = await apiClient.post(`/slides/${link.slideId}/navigation`, link)
    const savedLink: NavigationLink = data.data
    // Only update the ID if it was a new link (id=null → real id)
    if (link.id === null && savedLink.id) {
      setLocalLinks(prev => prev.map(l => l.id === null ? { ...l, id: savedLink.id } : l))
      setSelectedLinkId(savedLink.id)
    }
  }, [])

  const savePopupApiCall = useCallback(async (popup: Partial<Popup>, image?: File) => {
    const formData = new FormData()
    Object.entries(popup).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value.toString())
    })
    if (image) formData.append('image', image)

    const { data } = await apiClient.post(`/slides/${popup.slideId}/popups`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const savedPopup: Popup = data.data
    // Only update ID for new popups, and update imagePath if image was uploaded
    setLocalPopups(prev => prev.map(p => {
      const isMatch = (p.id !== null && p.id === popup.id) || (p.id === null && popup.id === null)
      if (!isMatch) return p
      return {
        ...p,
        id: savedPopup.id ?? p.id,
        imagePath: savedPopup.imagePath ?? p.imagePath,
      }
    }))
    if (savedPopup.id && (popup.id === null || popup.id === undefined)) {
      setSelectedPopupId(savedPopup.id)
    }
  }, [])

  const debouncedSaveLink = useDebounce(saveLinkApiCall, 600)
  const debouncedSavePopup = useDebounce(savePopupApiCall, 600)

  // ─── Local update handlers (instant, no flicker) ──────────────────────────
  const handleUpdateLink = useCallback((linkId: number | string, updates: Partial<NavigationLink>) => {
    setLocalLinks(prev => prev.map(l => l.id === linkId ? { ...l, ...updates } : l))
    if (typeof linkId === 'number') {
      const link = localLinks.find(l => l.id === linkId)
      if (link) debouncedSaveLink({ ...link, ...updates })
    }
  }, [localLinks, debouncedSaveLink])

  const handleUpdatePopup = useCallback((popupId: number | string, updates: Partial<Popup>) => {
    setLocalPopups(prev => prev.map(p => p.id === popupId ? { ...p, ...updates } : p))
    if (typeof popupId === 'number') {
      const popup = localPopups.find(p => p.id === popupId)
      if (popup) debouncedSavePopup({ ...popup, ...updates })
    }
  }, [localPopups, debouncedSavePopup])

  const handleAddLink = useCallback((newLink: NavigationLink) => {
    // Add optimistically with a temp ID, then replace with real ID from server
    setLocalLinks(prev => [...prev, { ...newLink, id: null }])
    saveLinkApiCall(newLink)
  }, [saveLinkApiCall])

  const handleAddPopup = useCallback((newPopup: Popup) => {
    setLocalPopups(prev => [...prev, { ...newPopup, id: null }])
    savePopupApiCall(newPopup)
  }, [savePopupApiCall])

  // Save popup with image (immediate, not debounced)
  const handleSavePopup = useCallback((updates: Partial<Popup>, image?: File) => {
    const popup = localPopups.find(p => p.id === selectedPopupId)
    if (!popup) return
    const merged = { ...popup, ...updates }
    if (image) {
      // Preview image update locally with object URL
      const previewUrl = URL.createObjectURL(image)
      setLocalPopups(prev => prev.map(p => p.id === selectedPopupId ? { ...merged, imagePath: previewUrl } : p))
    } else {
      setLocalPopups(prev => prev.map(p => p.id === selectedPopupId ? merged : p))
    }
    savePopupApiCall(merged, image)
  }, [localPopups, selectedPopupId, savePopupApiCall])

  // ─── Delete mutations ──────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (linkId: number) => { await apiClient.delete(`/navigation-links/${linkId}`) },
    onMutate: (linkId) => {
      setLocalLinks(prev => prev.filter(l => l.id !== linkId))
      setSelectedLinkId(null)
    },
    onError: () => { refreshFromServer(); toast.error('Error al eliminar enlace') },
    onSuccess: () => { toast.success('Enlace eliminado') }
  })

  const deletePopupMutation = useMutation({
    mutationFn: async (popupId: number) => { await apiClient.delete(`/popups/${popupId}`) },
    onMutate: (popupId) => {
      setLocalPopups(prev => prev.filter(p => p.id !== popupId))
      setSelectedPopupId(null)
    },
    onError: () => { refreshFromServer(); toast.error('Error al eliminar popup') },
    onSuccess: () => { toast.success('Popup eliminado') }
  })

  // ─── Keybinds ─────────────────────────────────────────────────────────────
  const links = localLinks.filter(l => l.slideId === currentSlide?.id)
  const popups = localPopups.filter(p => p.slideId === currentSlide?.id)
  const selectedLink = links.find(l => l.id === selectedLinkId) || null
  const selectedPopup = popups.find(p => p.id === selectedPopupId) || null

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
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
          handleAddLink({ ...clipboard.data, slideId: currentSlide.id, leftPercent: clipboard.data.leftPercent + 2, topPercent: clipboard.data.topPercent + 2 })
          toast.success('Navegación pegada')
        } else {
          handleAddPopup({ ...clipboard.data, slideId: currentSlide.id, buttonLeft: clipboard.data.buttonLeft + 2, buttonTop: clipboard.data.buttonTop + 2 })
          toast.success('Popup pegado')
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLink && typeof selectedLink.id === 'number') {
          deleteMutation.mutate(selectedLink.id)
        } else if (selectedPopup && typeof selectedPopup.id === 'number') {
          deletePopupMutation.mutate(selectedPopup.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedLink, selectedPopup, clipboard, currentSlide, handleAddLink, handleAddPopup])

  // ─── Slide management mutations ────────────────────────────────────────────
  const handleSelectSlide = (slideId: number) => {
    setSearchParams({ slide: slideId.toString() })
    setSelectedLinkId(null)
    setSelectedPopupId(null)
  }

  const replicateLinkMutation = useMutation({
    mutationFn: async ({ link, targetSlideIds }: { link: NavigationLink, targetSlideIds: number[] }) => {
      const promises = targetSlideIds.map(slideId => {
        const { id: _id, ...rest } = link
        return apiClient.post(`/slides/${slideId}/navigation`, { ...rest, slideId })
      })
      return Promise.all(promises)
    },
    onSuccess: async () => { await refreshFromServer(); toast.success('Enlace replicado correctamente') }
  })

  const replicatePopupMutation = useMutation({
    mutationFn: async ({ popup, targetSlideIds }: { popup: Popup, targetSlideIds: number[] }) => {
      const promises = targetSlideIds.map(slideId => {
        const { id: _id, ...rest } = popup
        const formData = new FormData()
        Object.entries(rest).forEach(([key, value]) => {
          if (value !== null && value !== undefined) formData.append(key, value.toString())
        })
        return apiClient.post(`/slides/${slideId}/popups`, formData)
      })
      return Promise.all(promises)
    },
    onSuccess: async () => { await refreshFromServer(); toast.success('Popup replicado correctamente') }
  })

  const deleteSlideMutation = useMutation({
    mutationFn: async (slideId: number) => { await apiClient.delete(`/slides/${slideId}`) },
    onSuccess: async () => {
      await refreshFromServer()
      setVersion(v => v + 1)
      toast.success('Slide eliminado correctamente')
      const remainingSlides = slides.filter(s => s.id !== currentSlideIdFromUrl)
      if (remainingSlides.length > 0) setSearchParams({ slide: remainingSlides[0].id.toString() })
    }
  })

  const reorderSlidesMutation = useMutation({
    mutationFn: async (newOrderIds: number[]) => {
      await apiClient.patch(`/projects/${id}/slides/reorder`, { order: newOrderIds })
    },
    onSuccess: async () => { await refreshFromServer(); setVersion(v => v + 1); toast.success('Orden actualizado') }
  })

  const addSlidesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData()
      files.forEach(file => formData.append('slides[]', file))
      await apiClient.post(`/projects/${id}/slides`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: async () => { await refreshFromServer(); setVersion(v => v + 1); toast.success('Slides añadidos correctamente') }
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
          links={links}
          selectedLinkId={selectedLinkId}
          onSelectLink={(id) => {
            setSelectedLinkId(id)
            if (id) { setActiveMode('navigation'); setSelectedPopupId(null) }
          }}
          onAddLink={handleAddLink}
          onUpdateLink={handleUpdateLink}
          popups={popups}
          selectedPopupId={selectedPopupId}
          onSelectPopup={(id) => {
            setSelectedPopupId(id)
            setIsPreviewVisible(false)
            if (id) { setActiveMode('popup'); setSelectedLinkId(null) }
          }}
          onAddPopup={handleAddPopup}
          onUpdatePopup={handleUpdatePopup}
          onSavePopup={handleSavePopup}
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
          onSavePopup={(updates, image) => handleSavePopup(updates, image)}
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
