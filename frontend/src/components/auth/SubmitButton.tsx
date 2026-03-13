import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SubmitButtonProps {
  isLoading: boolean
  label?: string
  loadingLabel?: string
}

export function SubmitButton({
  isLoading,
  label = 'Ingresar',
  loadingLabel = 'Verificando...',
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      variant="default"
      className={cn(
        "w-full transition-all duration-300",
        "shadow-lg shadow-brand-600/20 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0"
      )}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingLabel}</span>
        </div>
      ) : (
        label
      )}
    </Button>
  )
}
