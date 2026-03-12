import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { InputField } from '@/components/auth/InputField'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { useLogin } from '@/hooks/useLogin'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('¡Bienvenido!', {
            description: 'Sesión iniciada correctamente.',
          })
          navigate('/dashboard')
        }
      },
      onError: (error: unknown) => {
        const message =
          (error as { response?: { data?: { message?: string } } })
            .response?.data?.message ?? 'Error al iniciar sesión.'
        toast.error('Error de autenticación', {
          description: message,
        })
      },
    })
  }

  return (
    <form
      id="login-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <InputField
        id="email"
        label="Correo electrónico"
        type="email"
        placeholder="admin@veeva.test"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <InputField
        id="password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <SubmitButton isLoading={isPending} />
    </form>
  )
}
