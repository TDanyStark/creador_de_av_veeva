import { ChevronLeft, Layers, Save, Play, Link as LinkIcon, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface EditorHeaderProps {
  projectName?: string
  activeMode: 'navigation' | 'popup'
  onModeChange: (mode: 'navigation' | 'popup') => void
}

export function EditorHeader({ projectName, activeMode, onModeChange }: EditorHeaderProps) {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200/10 bg-surface-950 px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/dashboard')}
          className="h-8 w-8 text-surface-400 hover:bg-surface-800 hover:text-surface-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-surface-800" />
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 ring-1 ring-brand-500/40">
            <Layers className="h-4 w-4 text-brand-400" />
          </div>
          <span className="font-semibold text-surface-50">
            {projectName || 'Cargando proyecto...'}
          </span>
        </div>

        <div className="h-4 w-px bg-surface-800 mx-2" />
        
        {/* Mode Selector */}
        <div className="flex items-center bg-surface-900 rounded-lg p-1 gap-1 ring-1 ring-white/5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onModeChange('navigation')}
            className={cn(
              "h-8 gap-2 px-3 text-xs font-semibold transition-all",
              activeMode === 'navigation' 
                ? "bg-brand-600 text-white shadow-lg" 
                : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
            )}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Navegación
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onModeChange('popup')}
            className={cn(
              "h-8 gap-2 px-3 text-xs font-semibold transition-all",
              activeMode === 'popup' 
                ? "bg-amber-600 text-white shadow-lg" 
                : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
            )}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Popups
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/preview/${id}?${window.location.search.replace('?', '')}`)}
          className="gap-2 border-surface-800 bg-surface-900 text-surface-200 hover:bg-surface-800 hover:text-surface-50"
        >
          <Play className="h-4 w-4 fill-current" />
          Vista Previa
        </Button>
        <Button variant="default" size="sm" className="gap-2 bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-900/40">
          <Save className="h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>
    </header>
  )
}
