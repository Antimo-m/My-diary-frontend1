import { useEffect, useState } from 'react'
import { FiBell, FiCheck, FiMoon, FiSun, FiUser } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import UserMessage from '../components/UserMessage'
import { updateProfile } from '../services/profileApi'
import { getApiError } from '../utils/apiErrors'
import './ProfilePage.css'

const supportedReminderPreference = (value) => (['none', 'custom'].includes(value) ? value : 'none')

function ProfilePage({ authLoading, onLogin, onRegister, onUserUpdate, theme, setTheme, user }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(user?.email_notifications_enabled ?? true)
  const [defaultTaskReminder, setDefaultTaskReminder] = useState(supportedReminderPreference(user?.default_task_reminder))

  useEffect(() => {
    void Promise.resolve().then(() => {
      setName(user?.name ?? '')
      setEmailNotificationsEnabled(user?.email_notifications_enabled ?? true)
      setDefaultTaskReminder(supportedReminderPreference(user?.default_task_reminder))
    })
  }, [user])

  if (authLoading) {
    return <section className="page-container loading-state">Verifico la sessione...</section>
  }

  if (!user) {
    return (
      <section className="page-container">
        <AuthPanel onLogin={onLogin} onRegister={onRegister} />
      </section>
    )
  }

  const submitProfile = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      onUserUpdate(await updateProfile({ name }))
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco ad aggiornare il profilo.'))
    } finally {
      setLoading(false)
    }
  }

  const submitPreferences = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      onUserUpdate(await updateProfile({
        email_notifications_enabled: emailNotificationsEnabled,
        default_task_reminder: defaultTaskReminder,
      }))
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco ad aggiornare le preferenze.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="profile-page page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Profilo</p>
          <h1 className="page-title">Profilo</h1>
          <p className="page-subtitle">Gestisci account, tema e notifiche.</p>
        </div>
      </header>

      <UserMessage tone="error">{error}</UserMessage>

      <div className="profile-grid">
        <section className="surface profile-card">
          <div className="profile-avatar" aria-hidden="true"><FiUser /></div>
          <div>
            <p className="eyebrow">Dettagli</p>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <small>Registrazione: {user.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : 'Non disponibile'}</small>
          </div>
        </section>

        <form className="surface profile-form" onSubmit={submitProfile}>
          <div>
            <p className="eyebrow">Modifica nome</p>
            <h2>Informazioni profilo</h2>
          </div>
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength="255" required />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            <FiCheck aria-hidden="true" />
            {loading ? 'Salvataggio...' : 'Salva profilo'}
          </button>
        </form>

        <section className="surface preference-panel">
          <div>
            <p className="eyebrow">Preferenze</p>
            <h2>Tema</h2>
          </div>
          <div className="theme-toggle" role="group" aria-label="Seleziona tema">
            <button className={theme === 'light' ? 'active' : ''} type="button" onClick={() => setTheme('light')}>
              <FiSun aria-hidden="true" />
              Light
            </button>
            <button className={theme === 'dark' ? 'active' : ''} type="button" onClick={() => setTheme('dark')}>
              <FiMoon aria-hidden="true" />
              Dark
            </button>
          </div>
        </section>

        <form className="surface preference-panel notification-panel" onSubmit={submitPreferences}>
          <div className="preference-heading">
            <div className="profile-avatar profile-avatar--small" aria-hidden="true"><FiBell /></div>
            <div>
              <p className="eyebrow">Notifiche Email</p>
              <h2>Promemoria attivita</h2>
            </div>
          </div>
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={emailNotificationsEnabled}
              onChange={(event) => setEmailNotificationsEnabled(event.target.checked)}
            />
            Attiva notifiche email
          </label>
          <label>
            Promemoria predefinito
            <select value={defaultTaskReminder} onChange={(event) => setDefaultTaskReminder(event.target.value)}>
              <option value="none">Nessun promemoria</option>
              <option value="custom">Scegli orario esatto nel task</option>
            </select>
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            <FiCheck aria-hidden="true" />
            Salva preferenze
          </button>
        </form>
      </div>
    </section>
  )
}

export default ProfilePage
