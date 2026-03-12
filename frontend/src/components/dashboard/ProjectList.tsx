import { ProjectCard } from './ProjectCard'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderPlus } from 'lucide-react'

interface Project {
  id: number
  name: string
  created_at: string
}

interface ProjectListProps {
  projects: Project[]
  isLoading: boolean
}

export function ProjectList({ projects, isLoading }: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl bg-surface-800" />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-800 text-surface-400">
          <FolderPlus className="h-8 w-8 text-surface-500" />
        </div>
        <h3 className="text-lg font-medium text-surface-50">No hay proyectos todavía</h3>
        <p className="mt-1 text-sm text-surface-400">Sube un PDF para comenzar tu primera presentación.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          name={project.name}
          createdAt={project.created_at}
        />
      ))}
    </div>
  )
}
