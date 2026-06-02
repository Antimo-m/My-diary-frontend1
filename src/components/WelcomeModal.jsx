import { useState } from 'react'
import { FiBell, FiCheck } from 'react-icons/fi'
import Modal from './Modal'
import './WelcomeModal.css'

function WelcomeModal({ onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  return (
    <Modal labelledBy="welcome-modal-title" onClose={() => onClose(dontShowAgain)}>
      <div className="welcome-modal__icon" aria-hidden="true"><FiBell /></div>
      <div>
        <p className="eyebrow">Primo accesso</p>
        <h2 id="welcome-modal-title">Benvenuto nell'app</h2>
        <p className="modal-copy">
          L'app supporta notifiche email: riceverai aggiornamenti sui tuoi eventi e potrai impostare promemoria personalizzati per le attivita.
        </p>
      </div>
      <label className="welcome-modal__check">
        <input type="checkbox" checked={dontShowAgain} onChange={(event) => setDontShowAgain(event.target.checked)} />
        Non mostrare piu
      </label>
      <div className="modal-actions">
        <button className="btn btn-primary" type="button" onClick={() => onClose(dontShowAgain)}>
          <FiCheck aria-hidden="true" />
          Continua
        </button>
      </div>
    </Modal>
  )
}

export default WelcomeModal
