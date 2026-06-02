import { useEffect, useState } from 'react'
import { fallbackHome } from '../data/fallbackHome'
import { getHomeOverview } from '../services/homeApi'

function useHomeOverview() {
  const [overview, setOverview] = useState(fallbackHome)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isMounted = true

    getHomeOverview()
      .then((data) => {
        if (isMounted) {
          setOverview(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (isMounted) {
          setOverview(fallbackHome)
          setStatus('fallback')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { overview, status }
}

export default useHomeOverview
