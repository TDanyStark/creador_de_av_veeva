import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { SlideListSidebar } from '@/components/editor/SlideListSidebar'
import { PropertiesSidebar } from '@/components/editor/PropertiesSidebar'
import { CanvasWorkspace } from '@/components/editor/CanvasWorkspace'
import type { EditorDataResponse, NavigationLink } from '@/types/api'
import { toast } from 'sonner'

export function EditorPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  
  const currentSlideIdFromUrl = searchParams.get('slide') ? parseInt(searchParams.get('slide')!) : null
  const [selectedLinkId, setSelectedLinkId] = useState<number | null | string>(null)

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
  }

  const selectedLink = links.find(l => l.id === selectedLinkId) || null

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
      <EditorHeader projectName={project?.name} />
      
      <div className="flex flex-1 overflow-hidden">
        <SlideListSidebar 
          slides={slides} 
          currentSlideId={currentSlide?.id || null} 
          onSelectSlide={handleSelectSlide}
        />
        
        <CanvasWorkspace 
          currentSlide={currentSlide}
          links={links.filter(l => l.slideId === currentSlide?.id)}
          selectedLinkId={selectedLinkId}
          onSelectLink={setSelectedLinkId}
          onAddLink={handleAddLink}
          onUpdateLink={handleUpdateLink}
        />
        
        <PropertiesSidebar 
          selectedLink={selectedLink}
          slides={slides}
          onUpdateLink={(updates) => selectedLinkId && typeof selectedLinkId === 'number' && handleUpdateLink(selectedLinkId, updates)}
          onDeleteLink={(linkId) => deleteMutation.mutate(linkId)}
        />
      </div>
    </div>
  )
}
