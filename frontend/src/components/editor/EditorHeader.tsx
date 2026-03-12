import { ChevronLeft, Layers, Save, Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

interface EditorHeaderProps {
  projectName?: string
}

export function EditorHeader({ projectName }: EditorHeaderProps) {
  const navigate = useNavigate()

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
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2 border-surface-800 bg-surface-900 text-surface-200 hover:bg-surface-800 hover:text-surface-50">
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
