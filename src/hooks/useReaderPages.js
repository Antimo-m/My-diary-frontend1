import { useLayoutEffect, useRef, useState } from 'react'

export function paginateText(text, maxLength = 220) {
  const content = (text || '').trim()

  if (!content) {
    return ['']
  }

  const words = content.split(/\s+/)
  const pages = []
  let page = ''

  words.forEach((word) => {
    const nextPage = page ? `${page} ${word}` : word

    if (nextPage.length > maxLength && page) {
      pages.push(page)
      page = word
    } else {
      page = nextPage
    }
  })

  if (page) {
    pages.push(page)
  }

  return pages
}

function paginateTextToElement(text, element) {
  const content = (text || '').trim()

  if (!content || !element) {
    return [content]
  }

  const tokens = Array.from(content)
  const pages = []
  let start = 0

  while (start < tokens.length) {
    let low = start + 1
    let high = tokens.length
    let best = start + 1

    while (low <= high) {
      const middle = Math.floor((low + high) / 2)
      element.textContent = tokens.slice(start, middle).join('')

      if (element.scrollHeight <= element.clientHeight + 1) {
        best = middle
        low = middle + 1
      } else {
        high = middle - 1
      }
    }

    pages.push(tokens.slice(start, best).join(''))
    start = best
  }

  element.textContent = ''

  return pages.length ? pages : ['']
}

/**
 * Split a note body into reader pages that fit the rendered page box,
 * re-measuring on resize through a hidden clone of the body element.
 */
function useReaderPages(text) {
  const bodyRef = useRef(null)
  const measureRef = useRef(null)
  const [pages, setPages] = useState(() => paginateText(text, 620))

  useLayoutEffect(() => {
    const bodyElement = bodyRef.current
    const measureElement = measureRef.current

    if (!bodyElement || !measureElement) {
      return undefined
    }

    const recalculate = () => {
      measureElement.style.width = `${bodyElement.clientWidth}px`
      setPages(paginateTextToElement(text, measureElement))
    }

    recalculate()
    const observer = new ResizeObserver(recalculate)
    observer.observe(bodyElement)

    return () => observer.disconnect()
  }, [text])

  return { bodyRef, measureRef, pages }
}

export default useReaderPages
