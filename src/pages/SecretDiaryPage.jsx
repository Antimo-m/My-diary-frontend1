import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiLogOut, FiLock, FiMail, FiUnlock } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import UserMessage from '../components/UserMessage'
import IconButton from '../components/ui/IconButton'
import Toast from '../components/ui/Toast'
import { useI18n } from '../i18n/useI18n'
import DiaryPage from './DiaryPage'
import * as secretDiaryApi from '../services/secretDiaryApi'
import { getApiError } from '../utils/apiErrors'

const emptyPasswordForm = {
  password: '',
  password_confirmation: '',
}

const secretDiaryInactivityMs = 5 * 60 * 1000
const secretDiaryLastActivityKey = 'my-diary-secret-last-activity'

function SecretDiaryPasswordGate({ initialEmail, initialResetToken, notice, noticeTone, onResetHandled, onUnlocked, user }) {
  const { t } = useI18n()
  const navigate = useNavigate()
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
        onUnlocked(nextStatus, { fromStatus: true })
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
        navigate(window.location.pathname, { replace: true })
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
    <Toast.Provider>
    <section className="diary-page secret-diary-page page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t('secret.title')}</h1>
          <p className="page-subtitle">
            {isSetup ? t('secret.setupSubtitle') : t('secret.enterPassword')}
          </p>
        </div>
      </header>

      <UserMessage tone="error">{error}</UserMessage>
      <UserMessage tone={noticeTone}>{notice}</UserMessage>
      <Toast open={Boolean(successToast)} onOpenChange={(isOpen) => !isOpen && setSuccessToast('')} tone="success">
        {successToast}
      </Toast>

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

        {!isSetup && !isReset ? (
          <button className="auth-link-button secret-gate__forgot" type="button" onClick={requestReset} disabled={loading}>
            <FiMail aria-hidden="true" />
            {t('secret.forgot')}
          </button>
        ) : null}

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
        </div>
      </form>
    </section>
    </Toast.Provider>
  )
}

function SecretDiaryPage({ authLoading, initialResetEmail = '', initialResetToken = '', onForgotPassword, onLogin, onRegister, onResetPassword, onSecretResetHandled, user }) {
  const { t } = useI18n()
  const lastActivityRef = useRef(0)
  const lockInProgressRef = useRef(false)
  const [lockNotice, setLockNotice] = useState('')
  const [lockNoticeTone, setLockNoticeTone] = useState('info')
  const [status, setStatus] = useState(null)

  const lockSecretDiary = useCallback(async ({ automatic = false } = {}) => {
    if (lockInProgressRef.current) {
      return
    }

    lockInProgressRef.current = true

    try {
      const nextStatus = await secretDiaryApi.lockSecretDiary()
      window.sessionStorage.removeItem(secretDiaryLastActivityKey)
      setStatus(nextStatus)
      if (automatic) {
        setLockNoticeTone('info')
        setLockNotice(t('secret.inactivityLocked'))
      }
    } catch {
      window.sessionStorage.removeItem(secretDiaryLastActivityKey)
      setStatus({ unlocked: false })
      if (automatic) {
        setLockNoticeTone('info')
        setLockNotice(t('secret.inactivityLocked'))
      } else {
        setLockNoticeTone('error')
        setLockNotice(t('secret.lockError'))
      }
    } finally {
      lockInProgressRef.current = false
    }
  }, [t])

  useEffect(() => {
    if (!lockNotice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setLockNotice(''), 5000)

    return () => window.clearTimeout(timeoutId)
  }, [lockNotice])

  useEffect(() => {
    if (!status?.unlocked) {
      return undefined
    }

    const storedActivity = Number(window.sessionStorage.getItem(secretDiaryLastActivityKey))
    let deadline = (Number.isFinite(storedActivity) && storedActivity > 0 ? storedActivity : Date.now()) + secretDiaryInactivityMs
    let timeoutId
    let lastPersistedActivity = Number.isFinite(storedActivity) ? storedActivity : 0

    const scheduleLock = () => {
      window.clearTimeout(timeoutId)
      const remaining = Math.max(0, deadline - Date.now())
      timeoutId = window.setTimeout(() => void lockSecretDiary({ automatic: true }), remaining)
    }

    const registerActivity = () => {
      const activityTime = Date.now()
      lastActivityRef.current = activityTime
      if (activityTime - lastPersistedActivity >= 15000) {
        window.sessionStorage.setItem(secretDiaryLastActivityKey, String(activityTime))
        lastPersistedActivity = activityTime
      }
      deadline = activityTime + secretDiaryInactivityMs
      scheduleLock()
    }

    const checkVisibility = () => {
      if (document.visibilityState !== 'visible') {
        return
      }

      if (Date.now() >= deadline) {
        void lockSecretDiary({ automatic: true })
      } else {
        scheduleLock()
      }
    }

    const keepServerSessionAlive = async () => {
      if (
        document.visibilityState !== 'visible'
        || Date.now() - lastActivityRef.current >= secretDiaryInactivityMs
      ) {
        return
      }

      try {
        const nextStatus = await secretDiaryApi.getSecretDiaryStatus()
        if (!nextStatus.unlocked) {
          window.sessionStorage.removeItem(secretDiaryLastActivityKey)
          setLockNoticeTone('info')
          setLockNotice(t('secret.inactivityLocked'))
          setStatus(nextStatus)
        }
      } catch {
        // A transient status failure must not close a diary that is still active locally.
      }
    }

    lastActivityRef.current = Number.isFinite(storedActivity) && storedActivity > 0 ? storedActivity : Date.now()
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'input', 'touchstart', 'scroll', 'wheel']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, registerActivity, { passive: true }))
    document.addEventListener('visibilitychange', checkVisibility)
    const keepAliveId = window.setInterval(() => void keepServerSessionAlive(), 60 * 1000)
    scheduleLock()

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(keepAliveId)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, registerActivity))
      document.removeEventListener('visibilitychange', checkVisibility)
    }
  }, [lockSecretDiary, status?.unlocked, t])

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
        notice={lockNotice}
        noticeTone={lockNoticeTone}
        onResetHandled={onSecretResetHandled}
        onUnlocked={(nextStatus, { fromStatus = false } = {}) => {
          const lastActivity = Number(window.sessionStorage.getItem(secretDiaryLastActivityKey))

          if (fromStatus && Number.isFinite(lastActivity) && lastActivity > 0 && Date.now() - lastActivity >= secretDiaryInactivityMs) {
            void lockSecretDiary({ automatic: true })
            return
          }

          const activityTime = Date.now()
          window.sessionStorage.setItem(secretDiaryLastActivityKey, String(activityTime))
          lastActivityRef.current = activityTime
          setLockNotice('')
          setLockNoticeTone('info')
          setStatus(nextStatus)
        }}
        user={user}
      />
    )
  }

  const secretCopy = {
    createStripText: t('secret.gateCopy'),
    empty: t('diary.empty'),
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
      <div className="secret-diary-exit-row">
        <button className="btn secret-diary-exit" type="button" onClick={() => void lockSecretDiary()}>
          <FiLogOut aria-hidden="true" />
          <span>{t('secret.lock')}</span>
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
