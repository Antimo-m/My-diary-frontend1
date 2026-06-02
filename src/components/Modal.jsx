import './Modal.css'

function Modal({ children, labelledBy, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="app-modal surface" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={(event) => event.stopPropagation()}>
        {children}
      </section>
    </div>
  )
}

export default Modal
