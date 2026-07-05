import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const VIEWPORT_MARGIN = 12

/**
 * Anchors a floating panel to a trigger using fixed positioning inside a body
 * portal. This keeps the panel out of any `overflow: auto/hidden` ancestor
 * (such as a scrollable modal) so its content can never be clipped, while
 * flipping upward when there is not enough room below the trigger.
 */
function useFloatingPanel({ isOpen, onClose, width = 288, gap = 8 }) {
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const [style, setStyle] = useState(null)

  const reposition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const panelWidth = Math.min(width, viewportWidth - VIEWPORT_MARGIN * 2)
    const left = Math.min(Math.max(VIEWPORT_MARGIN, rect.left), viewportWidth - panelWidth - VIEWPORT_MARGIN)

    const panelHeight = panelRef.current?.offsetHeight ?? 0
    const spaceBelow = viewportHeight - rect.bottom
    const openUpward = panelHeight > spaceBelow && rect.top > spaceBelow

    const next = {
      position: 'fixed',
      left: `${left}px`,
      width: `${panelWidth}px`,
      maxHeight: `${viewportHeight - VIEWPORT_MARGIN * 2}px`,
      overflowY: 'auto',
    }

    if (openUpward) {
      next.bottom = `${viewportHeight - rect.top + gap}px`
    } else {
      next.top = `${rect.bottom + gap}px`
    }

    setStyle(next)
  }, [gap, width])

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined
    }

    reposition()
    const frame = requestAnimationFrame(reposition)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [isOpen, reposition])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const closeFromOutside = (event) => {
      if (triggerRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) {
        return
      }

      onClose()
    }

    const closeFromEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('pointerdown', closeFromOutside)
    document.addEventListener('focusin', closeFromOutside)
    document.addEventListener('keydown', closeFromEscape)

    return () => {
      document.removeEventListener('pointerdown', closeFromOutside)
      document.removeEventListener('focusin', closeFromOutside)
      document.removeEventListener('keydown', closeFromEscape)
    }
  }, [isOpen, onClose])

  const renderPanel = useCallback((panel) => {
    if (!isOpen) {
      return null
    }

    return createPortal(panel, document.body)
  }, [isOpen])

  return {
    triggerRef,
    panelRef,
    renderPanel,
    // Hidden until measured so the flip-direction calculation never flashes.
    panelStyle: style ?? { position: 'fixed', top: 0, left: 0, visibility: 'hidden' },
  }
}

export default useFloatingPanel
