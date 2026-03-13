import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { toast } from 'sonner'

export function ExportButton() {
  const { id } = useParams()
  
  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ data: { success: boolean; url: string } }>(`/projects/${id}/export`)
      return data.data
    },
    onSuccess: (data) => {
      if (data.success && data.url) {
        toast.success('Exportación completada', { description: 'El proyecto se ha empaquetado correctamente.' })
        // Create an invisible link to trigger the download automatically
        const a = document.createElement('a')
        a.href = data.url
        // Use a generic filename or let server decide. The server gives a url to the zip file.
        a.download = data.url.split('/').pop() || 'project.zip'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        toast.error('Error de exportación', { description: 'No se pudo generar el archivo ZIP.' })
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Ocurrió un error inesperado al exportar.'
      toast.error('Error de exportación', { description: msg })
    }
  })

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="gap-2 border-brand-800 bg-brand-950/50 text-brand-200 hover:bg-brand-900 hover:text-brand-50"
    >
      <Download className={`h-4 w-4 ${mutation.isPending ? 'animate-bounce' : ''}`} />
      {mutation.isPending ? 'Empaquetando...' : 'Exportar Veeva'}
    </Button>
  )
}
