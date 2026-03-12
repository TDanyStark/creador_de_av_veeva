import { LoginForm } from '@/components/auth/LoginForm'
import { Layers } from 'lucide-react'

export function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
      {/* Background glow effects */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-800/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="rounded-2xl border border-surface-200/10 bg-surface-900/80 p-8 shadow-2xl backdrop-blur-sm">
          {/* Logo & title */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/20 ring-1 ring-brand-500/40">
              <Layers className="h-7 w-7 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-surface-50">
                Creador de AV Veeva
              </h1>
              <p className="mt-1 text-sm text-surface-200/60">
                Inicia sesión para acceder al editor
              </p>
            </div>
          </div>

          {/* Form */}
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-surface-200/30">
          © {new Date().getFullYear()} Creador AV Veeva. Todos los derechos reservados.
        </p>
      </div>
    </main>
  )
}
