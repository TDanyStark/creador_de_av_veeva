import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
      className="w-full"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  )
}
