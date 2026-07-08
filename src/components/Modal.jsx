import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

function Modal({ children, labelledBy, onClose }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    // Blocca lo scroll della pagina dietro al modal, così l'overlay resta
    // ancorato alla viewport e non può essere trascinato fuori inquadratura.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Il portal su body evita che un antenato con transform/filter/overflow
  // diventi il containing block del backdrop fixed e lo ritagli fuori schermo.
  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="app-modal surface" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={(event) => event.stopPropagation()}>
        {children}
      </section>
    </div>,
    document.body,
  )
}

export default Modal
