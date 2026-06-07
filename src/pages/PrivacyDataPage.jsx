import { useState } from 'react'
import { FiDatabase, FiDownload, FiRefreshCcw, FiShield, FiTrash2 } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import UserMessage from '../components/UserMessage'
import { useI18n } from '../i18n/useI18n'
import { updateProfile } from '../services/profileApi'
import './PrivacyDataPage.css'

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function clearOfflineCaches() {
  if (!('caches' in window)) {
    return 0
  }

  const keys = await caches.keys()
  await Promise.all(keys.filter((key) => key.startsWith('my-diary')).map((key) => caches.delete(key)))

  return keys.length
}

function PrivacyDataPage({ authLoading, onForgotPassword, onLogin, onRegister, onResetPassword, onUserUpdate, user }) {
  const { locale, t } = useI18n()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busyAction, setBusyAction] = useState('')

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

  const runAction = async (actionName, action) => {
    setBusyAction(actionName)
    setError('')
    setMessage('')

    try {
      await action()
    } catch (actionError) {
      setError(actionError.message || t('privacy.actionError'))
    } finally {
      setBusyAction('')
    }
  }

  const exportSnapshot = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      locale,
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        email_notifications_enabled: user.email_notifications_enabled,
        default_task_reminder: user.default_task_reminder,
        timezone: user.timezone,
      },
      local_preferences: {
        theme: localStorage.getItem('my-diary-theme'),
        locale: localStorage.getItem('my-diary-locale'),
      },
      note: t('privacy.exportNote'),
    }

    downloadJson(`my-diary-privacy-export-${new Date().toISOString().slice(0, 10)}.json`, payload)
    setMessage(t('privacy.exportReady'))
  }

  const resetOnboarding = async () => {
    const updatedUser = await updateProfile({ show_welcome_modal: true })
    onUserUpdate?.(updatedUser)
    setMessage(t('privacy.onboardingResetDone'))
  }

  const clearCaches = async () => {
    await clearOfflineCaches()
    setMessage(t('privacy.cacheCleared'))
  }

  const clearLocalPreferences = () => {
    localStorage.removeItem('my-diary-theme')
    localStorage.removeItem('my-diary-locale')
    setMessage(t('privacy.localPrefsCleared'))
  }

  return (
    <section className="privacy-page page-container">
      <header className="page-header privacy-page__header">
        <div>
          <p className="eyebrow">{t('privacy.eyebrow')}</p>
          <h1 className="page-title">{t('privacy.title')}</h1>
          <p className="page-subtitle">{t('privacy.subtitle')}</p>
        </div>
      </header>

      <UserMessage tone="success">{message}</UserMessage>
      <UserMessage tone="error">{error}</UserMessage>

      <div className="privacy-grid">
        <article className="privacy-card privacy-card--wide">
          <FiShield aria-hidden="true" />
          <div>
            <h2>{t('privacy.summaryTitle')}</h2>
            <p>{t('privacy.summaryCopy')}</p>
          </div>
        </article>

        <article className="privacy-card">
          <FiDatabase aria-hidden="true" />
          <h2>{t('privacy.dataStoredTitle')}</h2>
          <ul>
            <li>{t('privacy.dataAccount')}</li>
            <li>{t('privacy.dataDiary')}</li>
            <li>{t('privacy.dataKanban')}</li>
            <li>{t('privacy.dataLocal')}</li>
          </ul>
        </article>

        <article className="privacy-card privacy-actions-card">
          <h2>{t('privacy.actionsTitle')}</h2>
          <button className="btn btn-primary" type="button" onClick={() => runAction('export', exportSnapshot)} disabled={Boolean(busyAction)}>
            <FiDownload aria-hidden="true" />
            {t('privacy.exportButton')}
          </button>
          <button className="btn btn-subtle" type="button" onClick={() => runAction('cache', clearCaches)} disabled={Boolean(busyAction)}>
            <FiTrash2 aria-hidden="true" />
            {t('privacy.clearCacheButton')}
          </button>
          <button className="btn btn-subtle" type="button" onClick={() => runAction('onboarding', resetOnboarding)} disabled={Boolean(busyAction)}>
            <FiRefreshCcw aria-hidden="true" />
            {t('privacy.resetOnboardingButton')}
          </button>
          <button className="btn btn-cancel" type="button" onClick={() => runAction('local', clearLocalPreferences)} disabled={Boolean(busyAction)}>
            {t('privacy.clearLocalButton')}
          </button>
        </article>
      </div>
    </section>
  )
}

export default PrivacyDataPage
