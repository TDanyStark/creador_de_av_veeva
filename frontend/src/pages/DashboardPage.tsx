import { useAuthStore } from '@/store/useAuthStore'
import { Layers, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { usePaginationUrl } from '@/hooks/usePaginationUrl'
import { ProjectList } from '@/components/dashboard/ProjectList'
import { PaginationControls } from '@/components/dashboard/PaginationControls'
import { PdfUploader } from '@/components/dashboard/PdfUploader'

export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { page, setPage } = usePaginationUrl()

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects?page=${page}&limit=12`)
      return data.data
    },
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-surface-950 text-surface-50">
      <header className="flex items-center justify-between border-b border-surface-200/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/20 ring-1 ring-brand-500/40">
            <Layers className="h-5 w-5 text-brand-400" />
          </div>
          <span className="font-semibold text-surface-50">Creador AV Veeva</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-800 text-xs font-semibold text-surface-200">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-surface-200">{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-surface-400 transition-colors hover:text-surface-50">
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-surface-50">Mis Proyectos</h1>
            <p className="mt-1 text-surface-400">Gestiona y edita tus presentaciones de Veeva.</p>
          </div>
          <PdfUploader />
        </div>

        <ProjectList projects={data?.projects || []} isLoading={isLoading} />
        
        {data?.pagination && (
          <PaginationControls
            currentPage={data.pagination.page}
            totalPages={data.pagination.pages}
            onPageChange={setPage}
          />
        )}
      </div>
    </main>
  )
}
