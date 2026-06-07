import { useEffect, useState } from 'react'
import { FiCheck, FiLock, FiMail, FiUnlock } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import AppToast from '../components/AppToast'
import IconButton from '../components/IconButton'
import UserMessage from '../components/UserMessage'
import { useI18n } from '../i18n/useI18n'
import DiaryPage from './DiaryPage'
import * as secretDiaryApi from '../services/secretDiaryApi'
import { getApiError } from '../utils/apiErrors'

const emptyPasswordForm = {
  password: '',
  password_confirmation: '',
}

function SecretDiaryPasswordGate({ initialEmail, initialResetToken, onResetHandled, onUnlocked, user }) {
  const { t } = useI18n()
  const [email, setEmail] = useState(initialEmail || user?.email || '')
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyPasswordForm)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(initialResetToken ? 'reset' : 'unlock')
  const [status, setStatus] = useState(null)
  const [successToast, setSuccessToast] = useState('')

  const loadStatus = async () => {
    setLoading(true)
    setError('')

    try {
      const nextStatus = await secretDiaryApi.getSecretDiaryStatus()
      setStatus(nextStatus)
      if (!nextStatus.has_password && mode !== 'reset') {
        setMode('setup')
      }
      if (nextStatus.unlocked) {
        onUnlocked(nextStatus)
      }
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a verificare il Diario Segreto.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadStatus())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!successToast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setSuccessToast(''), 3500)

    return () => window.clearTimeout(timeoutId)
  }, [successToast])

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submitPassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'setup') {
        onUnlocked(await secretDiaryApi.setupSecretDiary(form))
      } else if (mode === 'reset') {
        await secretDiaryApi.resetSecretDiaryPassword({
          email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          token: initialResetToken,
        })
        setSuccessToast(t('secret.passwordUpdated'))
        setMode('unlock')
        setForm(emptyPasswordForm)
        onResetHandled?.()
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        onUnlocked(await secretDiaryApi.unlockSecretDiary(form.password))
      }
    } catch (requestError) {
      setError(getApiError(requestError, 'Operazione Diario Segreto non riuscita.'))
    } finally {
      setLoading(false)
    }
  }

  const requestReset = async () => {
    setLoading(true)
    setError('')

    try {
      await secretDiaryApi.requestSecretDiaryPasswordReset(email)
      setSuccessToast(t('secret.emailSent'))
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a inviare il link di recupero.'))
    } finally {
      setLoading(false)
    }
  }

  const isSetup = mode === 'setup'
  const isReset = mode === 'reset'

  return (
    <section className="diary-page secret-diary-page page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('secret.protectedArea')}</p>
          <h1 className="page-title">{t('secret.title')}</h1>
          <p className="page-subtitle">
            {isSetup ? t('secret.setupSubtitle') : t('secret.enterPassword')}
          </p>
        </div>
      </header>

      <UserMessage tone="error">{error}</UserMessage>
      <AppToast>{successToast}</AppToast>

      <form className="secret-gate surface" onSubmit={submitPassword}>
        <div className="secret-gate__icon" aria-hidden="true">
          {isSetup ? <FiLock /> : <FiUnlock />}
        </div>
        <div>
          <h2>{isSetup ? t('secret.createPassword') : isReset ? t('secret.newPassword') : t('secret.unlockDiary')}</h2>
          <p>{t('secret.gateCopy')}</p>
        </div>

        {isReset ? (
          <label>
            Email
            <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
        ) : null}

        <label>
          {t('secret.password')}
          <input name="password" type="password" value={form.password} onChange={updateForm} autoComplete="current-password" required />
        </label>

        {isSetup || isReset ? (
          <label>
            {t('secret.passwordConfirm')}
            <input name="password_confirmation" type="password" value={form.password_confirmation} onChange={updateForm} autoComplete="new-password" required />
          </label>
        ) : null}

        <div className="secret-gate__actions">
          <IconButton variant="confirm" type="submit" disabled={loading || !status} label={isSetup ? t('secret.createPassword') : t('secret.unlock')}>
            <FiCheck />
          </IconButton>
          {!isSetup && !isReset ? (
            <button className="auth-link-button" type="button" onClick={requestReset} disabled={loading}>
              <FiMail aria-hidden="true" />
              {t('secret.forgot')}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}

function SecretDiaryPage({ authLoading, initialResetEmail = '', initialResetToken = '', onForgotPassword, onLogin, onRegister, onResetPassword, onSecretResetHandled, user }) {
  const { t } = useI18n()
  const [status, setStatus] = useState(null)

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

  if (!status?.unlocked) {
    return (
      <SecretDiaryPasswordGate
        initialEmail={initialResetEmail}
        initialResetToken={initialResetToken}
        onResetHandled={onSecretResetHandled}
        onUnlocked={setStatus}
        user={user}
      />
    )
  }

  const lockSecretDiary = async () => {
    setStatus(await secretDiaryApi.lockSecretDiary())
  }

  const secretCopy = {
    createStripText: t('secret.gateCopy'),
    empty: t('diary.empty'),
    eyebrow: t('secret.protectedArea'),
    loadError: t('diary.loadError'),
    newPage: t('diary.newPage'),
    pageSaved: t('diary.pageSaved'),
    pageSubtitle: t('secret.setupSubtitle'),
    pageTitle: t('secret.title'),
    recent: t('diary.recent'),
    rereadSubtitle: t('diary.reread'),
    saveError: t('diary.saveError'),
    secretClass: 'secret-diary-page',
  }

  return (
    <>
      <div className="secret-diary-lockbar page-container">
        <button className="btn btn-subtle" type="button" onClick={lockSecretDiary}>
          <FiLock aria-hidden="true" />
          {t('secret.lock')}
        </button>
      </div>
      <DiaryPage
        authLoading={authLoading}
        copy={secretCopy}
        diaryApi={secretDiaryApi}
        onForgotPassword={onForgotPassword}
        onLogin={onLogin}
        onRegister={onRegister}
        onResetPassword={onResetPassword}
        user={user}
      />
    </>
  )
}

export default SecretDiaryPage
