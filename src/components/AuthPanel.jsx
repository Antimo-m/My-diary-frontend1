import { useState } from 'react'
import UserMessage from './UserMessage'
import { getApiError } from '../utils/apiErrors'
import './AuthPanel.css'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
}

function AuthPanel({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await onLogin({ email: form.email, password: form.password })
      } else {
        await onRegister(form)
      }
      setForm(emptyForm)
    } catch (requestError) {
      setError(getApiError(requestError, 'Controlla le credenziali e riprova.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-panel surface" aria-label="Accesso utente">
      <div>
        <p className="eyebrow">Accesso sicuro</p>
        <h2>{mode === 'login' ? 'Accedi al tuo diario' : 'Crea il tuo spazio'}</h2>
      </div>

      <div className="auth-panel__switch" role="tablist" aria-label="Modalita accesso">
        <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
          Login
        </button>
        <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
          Registrati
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' ? (
          <label>
            Nome
            <input name="name" value={form.name} onChange={updateField} autoComplete="name" required />
          </label>
        ) : null}

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </label>

        {mode === 'register' ? (
          <label>
            Conferma password
            <input
              name="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={updateField}
              autoComplete="new-password"
              required
            />
          </label>
        ) : null}

        <UserMessage tone="error">{error}</UserMessage>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Attendi...' : mode === 'login' ? 'Entra' : 'Crea account'}
        </button>
      </form>
    </section>
  )
}

export default AuthPanel
