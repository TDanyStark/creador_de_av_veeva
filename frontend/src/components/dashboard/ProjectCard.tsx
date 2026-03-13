import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  id: number
  name: string
  createdAt: string
  slidesCount?: number
}

export function ProjectCard({ id, name, createdAt, slidesCount }: ProjectCardProps) {
  const date = new Date(createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card className="overflow-hidden border-surface-200/10 bg-surface-900 transition-all hover:bg-surface-800/50 hover:ring-1 hover:ring-brand-500/20">
      <CardHeader className="p-4">
        <CardTitle className="line-clamp-1 text-base font-medium text-surface-50">{name}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-0">
        <div className="flex items-center gap-4 text-xs text-surface-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {slidesCount ?? 0} Slides
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-4">
        <Link 
          to={`/editor/${id}`} 
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), "w-full gap-2")}
        >
          Editar proyecto
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  )
}
