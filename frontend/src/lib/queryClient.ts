import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403/404
        if (axios401(error)) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

function axios401(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response: { status: number } }).response?.status === 401
  )
}
