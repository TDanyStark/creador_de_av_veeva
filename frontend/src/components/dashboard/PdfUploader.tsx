import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Upload, FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function PdfUploader() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  const { mutate: createProject, isPending } = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post('/projects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return data
    },
    onSuccess: () => {
      toast.success('Proyecto creado correctamente')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
      setName('')
      setFile(null)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear el proyecto'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !name) return

    const formData = new FormData()
    formData.append('name', name)
    formData.append('pdf', file)

    createProject(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Upload className="h-4 w-4" />
        Nuevo Proyecto
      </DialogTrigger>
      <DialogContent className="border-surface-200/10 bg-surface-950 text-surface-50 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription className="text-surface-400">
            Sube un archivo PDF para extraer sus páginas y crear una presentación Veeva.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proyecto</Label>
            <Input
              id="name"
              placeholder="Ej: Lanzamiento Producto 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf">Archivo PDF</Label>
            <div className="relative">
              <input
                id="pdf"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isPending}
                required
              />
              <label
                htmlFor="pdf"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200/10 bg-surface-900/50 py-10 transition-colors hover:bg-surface-900"
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-8 w-8 text-brand-400" />
                    <span className="text-sm font-medium text-surface-200">{file.name}</span>
                    <span className="text-xs text-surface-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-surface-600" />
                    <span className="text-sm text-surface-400">Seleccionar PDF</span>
                    <span className="text-xs text-surface-600">Click para explorar</span>
                  </div>
                )}
              </label>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending || !file || !name}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando PDF...
              </>
            ) : (
              'Crear e Importar'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
