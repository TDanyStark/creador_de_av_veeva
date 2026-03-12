import { useAuthStore } from '@/store/useAuthStore'
import { Layers, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

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
        <div className="flex items-center gap-4">
          <span className="text-sm text-surface-200/60">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <section className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <h1 className="text-3xl font-bold text-surface-50">Dashboard</h1>
        <p className="text-surface-200/50 text-sm">
          Fase 2: Aquí aparecerán los proyectos. ¡La Fase 1 está completa! 🎉
        </p>
      </section>
    </main>
  )
}
