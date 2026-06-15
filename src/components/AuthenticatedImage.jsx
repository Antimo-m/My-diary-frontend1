import { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'

function AuthenticatedImage({ alt = '', className = '', fallback = null, src }) {
  const [fetchedImage, setFetchedImage] = useState({ source: '', url: '' })
  const directImageUrl = src?.startsWith('blob:') || src?.startsWith('data:') ? src : ''
  const imageUrl = directImageUrl || (fetchedImage.source === src ? fetchedImage.url : '')

  useEffect(() => {
    if (!src || src.startsWith('blob:') || src.startsWith('data:')) {
      return undefined
    }

    let active = true
    let objectUrl = ''

    apiClient.get(src, { responseType: 'blob' })
      .then((response) => {
        if (!active) return

        objectUrl = URL.createObjectURL(response.data)
        setFetchedImage({ source: src, url: objectUrl })
      })
      .catch(() => {})

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  if (!imageUrl) {
    return fallback
  }

  return <img className={className} src={imageUrl} alt={alt} />
}

export default AuthenticatedImage
