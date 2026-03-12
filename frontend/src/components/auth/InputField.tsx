import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
}

export function InputField({ id, label, error, className, ...props }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={cn(error && 'border-red-500/60 focus-visible:ring-red-500', className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400 mt-0.5">
          {error}
        </p>
      )}
    </div>
  )
}
