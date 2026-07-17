import { useState } from 'react'
import UserMessage from './UserMessage'
import { useI18n } from '../i18n/useI18n'
import { getApiError } from '../utils/apiErrors'
import './AuthPanel.css'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
}

function getPasswordErrors(password, t) {
  const errors = []

  if (password.length < 8) {
    errors.push(t('auth.passwordMin'))
  }

  if (!/^[A-Z]/.test(password)) {
    errors.push(t('auth.passwordStartUpper'))
  }

  if (!/[a-z]/.test(password)) {
    errors.push(t('auth.passwordLower'))
  }

  if (!/[0-9]/.test(password)) {
    errors.push(t('auth.passwordNumber'))
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push(t('auth.passwordSymbol'))
  }

  return errors
}

function AuthPanel({
  initialEmail = '',
  initialMode = 'login',
  onForgotPassword,
  onLogin,
  onRegister,
  onResetPassword,
  resetToken = '',
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ ...emptyForm, email: initialEmail })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setForm((current) => ({
      ...emptyForm,
      email: nextMode === 'register' ? '' : current.email,
    }))
  }

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const normalizedEmail = form.email.trim().toLowerCase()

      if (mode === 'login') {
        await onLogin({ email: normalizedEmail, password: form.password })
      } else if (mode === 'register') {
        const passwordErrors = getPasswordErrors(form.password, t)

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          passwordErrors.unshift(t('auth.emailInvalid'))
        }

        if (form.password !== form.password_confirmation) {
          passwordErrors.push(t('auth.passwordConfirmMismatch'))
        }

        if (passwordErrors.length) {
          setError(passwordErrors.join(' '))
          return
        }

        await onRegister({ ...form, email: normalizedEmail })
      } else if (mode === 'forgot') {
        await onForgotPassword(normalizedEmail)
        setSuccess(t('auth.linkSent'))
      } else if (mode === 'reset') {
        const passwordErrors = getPasswordErrors(form.password, t)

        if (form.password !== form.password_confirmation) {
          passwordErrors.push(t('auth.passwordConfirmMismatch'))
        }

        if (passwordErrors.length) {
          setError(passwordErrors.join(' '))
          return
        }

        await onResetPassword({
          email: normalizedEmail,
          password: form.password,
          password_confirmation: form.password_confirmation,
          token: resetToken,
        })
        setSuccess(t('auth.resetSuccess'))
        setMode('login')
      }
      setForm((current) => ({ ...emptyForm, email: mode === 'forgot' ? normalizedEmail : current.email }))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-panel surface" aria-label={t('auth.access')}>
      <h2>
        {mode === 'login'
          ? t('auth.loginTitle')
          : mode === 'register'
            ? t('auth.createSpace')
            : mode === 'forgot'
              ? t('auth.forgot')
              : t('secret.newPassword')}
      </h2>

      <div className="auth-panel__switch" role="tablist" aria-label={t('auth.mode')}>
        <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => changeMode('login')}>
          {t('auth.login')}
        </button>
        <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => changeMode('register')}>
          {t('auth.register')}
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' ? (
          <label>
            {t('auth.name')}
            <input name="name" value={form.name} onChange={updateField} autoComplete="name" required />
          </label>
        ) : null}

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
        </label>

        {mode !== 'forgot' ? (
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
        ) : null}

        {mode === 'register' || mode === 'reset' ? (
          <label>
            {t('secret.passwordConfirm')}
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
        <UserMessage tone="success">{success}</UserMessage>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading
            ? t('auth.wait')
            : mode === 'login'
              ? t('auth.enter')
              : mode === 'register'
                ? t('auth.createAccount')
                : mode === 'forgot'
                  ? t('auth.resetLink')
                  : t('auth.resetPassword')}
        </button>

        {mode === 'login' ? (
          <button className="auth-link-button" type="button" onClick={() => changeMode('forgot')}>
            {t('auth.forgot')}
          </button>
        ) : null}

        {mode === 'forgot' || mode === 'reset' ? (
          <button className="auth-link-button" type="button" onClick={() => changeMode('login')}>
            {t('auth.resetBack')}
          </button>
        ) : null}
      </form>
    </section>
  )
}

export default AuthPanel
