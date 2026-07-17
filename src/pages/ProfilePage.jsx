import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import CustomSelect from '../components/CustomSelect'
import UserMessage from '../components/UserMessage'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import { timeZones } from '../data/timeZones'
import { useI18n } from '../i18n/useI18n'
import { deleteAccount } from '../services/authApi'
import { updateProfile } from '../services/profileApi'
import { getApiError } from '../utils/apiErrors'
import './ProfilePage.css'

function ProfilePage({ authLoading, onAccountDeleted, onForgotPassword, onLogin, onRegister, onResetPassword, onUserUpdate, user }) {
  const { locale, setLocale, setTimeZone, t, timeZone } = useI18n()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    locale,
    timezone: user?.timezone ?? 'Europe/Rome',
  })
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    const syncForm = window.setTimeout(() => {
      setForm({
        name: user.name ?? '',
        locale: user.locale ?? locale,
        timezone: user.timezone ?? 'Europe/Rome',
      })
    }, 0)

    return () => window.clearTimeout(syncForm)
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
      setTimeZone(updatedUser.timezone ?? form.timezone)
      setSuccess(t('profile.saved'))
    } catch (requestError) {
      setError(getApiError(requestError, t('profile.updateError')))
    } finally {
      setSaving(false)
    }
  }

  const openDeleteModal = () => {
    setDeletePassword('')
    setDeleteError('')
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletePassword('')
    setDeleteError('')
  }

  const confirmDeleteAccount = async (event) => {
    event.preventDefault()
    setDeleteError('')
    setDeleting(true)

    try {
      await deleteAccount(deletePassword)
      onAccountDeleted?.()
    } catch (requestError) {
      setDeleteError(getApiError(requestError, t('profile.deleteAccountError')))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="profile-page page-container">
      <header className="page-header profile-page__header">
        <div>
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

          <CustomSelect
            label={t('profile.timezone')}
            name="timezone"
            onChange={updateField}
            options={timeZones}
            searchable
            value={form.timezone}
          />
        </section>

        <section className="profile-settings__card">
          <div className="profile-settings__section-title">
            <h2>{t('language.label')}</h2>
          </div>

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

        <Button variant="primary" className="profile-settings__submit" type="submit" disabled={saving}>
          {saving ? t('auth.wait') : t('profile.saveProfile')}
        </Button>
      </form>

      <section className="profile-settings__card profile-settings__card--danger">
        <div className="profile-settings__section-title">
          <h2>{t('profile.deleteAccount')}</h2>
          <p className="profile-danger-copy">{t('profile.dangerZoneCopy')}</p>
        </div>

        <Button variant="danger" className="profile-danger-trigger" type="button" onClick={openDeleteModal}>
          <FiTrash2 aria-hidden="true" />
          {t('profile.deleteAccount')}
        </Button>
      </section>

      {isDeleteModalOpen ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && closeDeleteModal()}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiAlertTriangle /></div>
          <div>
            <Dialog.Title asChild><h2>{t('profile.deleteAccountTitle')}</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('profile.deleteAccountCopy')}</p></Dialog.Description>
          </div>

          <form className="dialog-form" onSubmit={confirmDeleteAccount}>
            <label>
              <span>{t('profile.deleteAccountConfirmLabel')}</span>
              <input
                autoFocus
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder={t('profile.deleteAccountConfirmPlaceholder')}
                required
                type="password"
                value={deletePassword}
              />
            </label>

            <UserMessage tone="error">{deleteError}</UserMessage>

            <div className="dialog-actions">
              <Button variant="danger" disabled={deleting} type="submit">
                <FiTrash2 aria-hidden="true" />
                {deleting ? t('auth.wait') : t('profile.deleteAccountButton')}
              </Button>
              <Button variant="cancel" disabled={deleting} onClick={closeDeleteModal} type="button">
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </section>
  )
}

export default ProfilePage
