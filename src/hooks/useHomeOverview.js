import { useQuery } from '@tanstack/react-query'
import { fallbackHome } from '../data/fallbackHome'
import { getHomeOverview } from '../services/homeApi'

function useHomeOverview() {
  const { data, isError, isPending } = useQuery({
    queryKey: ['home-overview'],
    queryFn: getHomeOverview,
  })

  return {
    overview: data ?? fallbackHome,
    status: isPending ? 'loading' : isError ? 'fallback' : 'ready',
  }
}

export default useHomeOverview
