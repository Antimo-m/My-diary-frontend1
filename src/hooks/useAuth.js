import { useEffect, useState } from 'react'
import { onSessionExpired } from '../services/apiClient'
import { getCurrentUser } from '../services/authApi'

/**
 * Stato di autenticazione dell'app: carica l'utente corrente all'avvio e lo
 * azzera quando una risposta 401/419 segnala che la sessione non è più valida,
 * così ogni pagina torna automaticamente al pannello di accesso.
 */
function useAuth() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => onSessionExpired(() => setUser(null)), [])

  return { authLoading, setUser, user }
}

export default useAuth
