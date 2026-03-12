import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-900 group-[.toaster]:text-surface-50 group-[.toaster]:border-surface-200/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-surface-200/60",
          actionButton:
            "group-[.toast]:bg-brand-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-surface-800 group-[.toast]:text-surface-200",
          success: "group-[.toast]:bg-green-600/10 group-[.toast]:text-green-400 group-[.toast]:border-green-500/20",
          error: "group-[.toast]:bg-red-600/10 group-[.toast]:text-red-400 group-[.toast]:border-red-500/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
