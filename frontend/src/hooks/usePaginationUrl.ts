import { useSearchParams } from 'react-router-dom'

export function usePaginationUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const page = parseInt(searchParams.get('page') || '1', 10)
  
  const setPage = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', newPage.toString())
      return prev
    })
  }

  return { page, setPage }
}
