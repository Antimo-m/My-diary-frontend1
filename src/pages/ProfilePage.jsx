import { useEffect, useState } from 'react'
import AuthPanel from '../components/AuthPanel'
import UserMessage from '../components/UserMessage'
import { useI18n } from '../i18n/useI18n'
import { updateProfile } from '../services/profileApi'
import { getApiError } from '../utils/apiErrors'
import './ProfilePage.css'

function ProfilePage({ authLoading, onForgotPassword, onLogin, onRegister, onResetPassword, onUserUpdate, user }) {
  const { locale, setLocale, t, timeZone } = useI18n()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email_notifications_enabled: true,
    default_task_reminder: 'none',
    locale,
    timezone: timeZone,
  })

  useEffect(() => {
    if (!user) {
      return
    }

    setForm({
      name: user.name ?? '',
      email_notifications_enabled: Boolean(user.email_notifications_enabled),
      default_task_reminder: user.default_task_reminder ?? 'none',
      locale: user.locale ?? locale,
      timezone: user.timezone ?? timeZone,
    })
  }, [locale, timeZone, user])

  if (authLoading) {
    return <section className="page-container loading-state">{t('auth.wait')}</section>
  }

  if (!user) {
    return (
      <section className="page-container">
        <AuthPanel onForgotPassword={onForgotPassword} onLogin={onLogin} onRegister={onRegister} onResetPassword={onResetPassword} />
      </section>
    )
  }

  const updateField = (event) => {
    const { checked, name, type, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const chooseLocale = (nextLocale) => {
    setForm((current) => ({ ...current, locale: nextLocale }))
    setLocale(nextLocale)
  }

  const submitProfile = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const updatedUser = await updateProfile(form)
      onUserUpdate?.(updatedUser)
      setLocale(updatedUser.locale ?? form.locale)
      setSuccess(t('profile.saved'))
    } catch (requestError) {
      setError(getApiError(requestError, t('profile.updateError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="profile-page page-container">
      <header className="page-header profile-page__header">
        <div>
          <p className="eyebrow">{t('profile.info')}</p>
          <h1 className="page-title">{t('common.profile')}</h1>
          <p className="page-subtitle">{t('profile.subtitle')}</p>
        </div>
      </header>

      <UserMessage tone="error">{error}</UserMessage>
      <UserMessage tone="success">{success}</UserMessage>

      <form className="profile-settings" onSubmit={submitProfile}>
        <section className="profile-settings__card">
          <div className="profile-settings__identity">
            <span aria-hidden="true">{(user.name || user.email || 'MD').slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <label>
            <span>{t('profile.editName')}</span>
            <input name="name" value={form.name} onChange={updateField} />
          </label>

          <label>
            <span>{t('profile.timezone')}</span>
            <input name="timezone" value={form.timezone} onChange={updateField} />
          </label>
        </section>

        <section className="profile-settings__card">
          <div className="profile-settings__section-title">
            <p className="eyebrow">{t('profile.details')}</p>
            <h2>{t('profile.activityReminders')}</h2>
          </div>

          <label className="profile-toggle-row">
            <span>
              <strong>{t('profile.emailNotifications')}</strong>
              <small>{t('profile.emailNotificationsHint')}</small>
            </span>
            <input
              checked={form.email_notifications_enabled}
              name="email_notifications_enabled"
              onChange={updateField}
              type="checkbox"
            />
          </label>

          <label>
            <span>{t('profile.defaultReminder')}</span>
            <select name="default_task_reminder" value={form.default_task_reminder} onChange={updateField}>
              <option value="none">{t('task.noReminder')}</option>
              <option value="custom">{t('profile.customReminder')}</option>
            </select>
          </label>

          <div className="profile-language-control">
            <span>{t('language.label')}</span>
            <div role="group" aria-label={t('language.label')}>
              <button className={form.locale === 'it' ? 'active' : ''} type="button" onClick={() => chooseLocale('it')}>
                IT
              </button>
              <button className={form.locale === 'en' ? 'active' : ''} type="button" onClick={() => chooseLocale('en')}>
                EN
              </button>
            </div>
          </div>
        </section>

        <button className="btn btn-primary profile-settings__submit" type="submit" disabled={saving}>
          {saving ? t('auth.wait') : t('profile.saveProfile')}
        </button>
      </form>
    </section>
  )
}

export default ProfilePage
