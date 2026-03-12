import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useAuthStore } from '@/store/useAuthStore'
import type { ApiResponse, LoginPayload, LoginResponseData } from '@/types/api'

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation<ApiResponse<LoginResponseData>, Error, LoginPayload>({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await apiClient.post<ApiResponse<LoginResponseData>>(
        '/auth/login',
        payload
      )
      return data
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuth(response.data.token, response.data.user)
      }
    },
  })
}
