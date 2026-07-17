import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import AuthPanel from './components/AuthPanel'
import { getCurrentUser, login, logout, register, requestPasswordReset, resetPassword } from './services/authApi'
import { updateProfile } from './services/profileApi'
import WelcomeModal from './components/WelcomeModal'
import { useI18n } from './i18n/useI18n'
import usePageTitle from './hooks/usePageTitle'
import useMediaQuery from './hooks/useMediaQuery'
import './App.css'

const AnalysisPage = lazy(() => import('./pages/AnalysisPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const DiaryPage = lazy(() => import('./pages/DiaryPage'))
const KanbanPage = lazy(() => import('./pages/KanbanPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SecretDiaryPage = lazy(() => import('./pages/SecretDiaryPage'))

const pagePaths = {
  analysis: '/analysis',
  diary: '/diary',
  home: '/',
  kanban: '/bacheca',
  profile: '/profile',
  secretDiary: '/secret-diary',
}

const sectionPages = {
  analysis: 'analysis',
  bacheca: 'kanban',
  diary: 'diary',
  profile: 'profile',
  'secret-diary': 'secretDiary',
}

function App() {
  const { t } = useI18n()
  const location = useLocation()
  const routerNavigate = useNavigate()
  const initialParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const fragmentParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

    fragmentParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value)
      }
    })

    return params
  }, [])
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('my-diary-theme') ?? 'light')
  const [resetRequest, setResetRequest] = useState(() => {
    return {
      email: initialParams.get('email') ?? '',
      token: initialParams.get('reset_token') ?? initialParams.get('token') ?? '',
    }
  })
  const [secretResetRequest, setSecretResetRequest] = useState(() => {
    return {
      email: initialParams.get('email') ?? '',
      token: initialParams.get('secret_reset_token') ?? '',
    }
  })
  const isMobileViewport = useMediaQuery('(max-width: 900px)')
  const activePage = sectionPages[location.pathname.split('/')[1]] ?? 'home'

  usePageTitle(activePage, t)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (initialParams.get('secret_reset_token')) {
      routerNavigate(window.location.pathname, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialParams])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('my-diary-theme', theme)
  }, [theme])

  const handleLogin = async (credentials) => {
    const authenticatedUser = await login(credentials)
    setUser(authenticatedUser)
    routerNavigate(secretResetRequest.token ? '/secret-diary' : isMobileViewport ? '/' : '/diary')
  }

  const handleRegister = async (payload) => {
    const authenticatedUser = await register(payload)
    setUser(authenticatedUser)
    routerNavigate(secretResetRequest.token ? '/secret-diary' : isMobileViewport ? '/' : '/diary')
  }

  const handlePasswordResetRequest = async (email) => {
    await requestPasswordReset(email)
  }

  const handlePasswordReset = async (payload) => {
    await resetPassword(payload)
    setResetRequest({ email: '', token: '' })
    routerNavigate(window.location.pathname, { replace: true })
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
    setWelcomeDismissed(false)
    routerNavigate('/')
  }

  const handleAccountDeleted = () => {
    setUser(null)
    setWelcomeDismissed(false)
    routerNavigate('/')
  }

  const navigate = (page, requestedPath = null) => {
    routerNavigate(requestedPath ?? pagePaths[page] ?? '/')
  }

  const closeWelcomeModal = async (dontShowAgain) => {
    setWelcomeDismissed(true)

    if (dontShowAgain) {
      setUser(await updateProfile({ show_welcome_modal: false }))
    }
  }

  const pageProps = {
    authLoading,
    onAccountDeleted: handleAccountDeleted,
    onForgotPassword: handlePasswordResetRequest,
    onLogin: handleLogin,
    onNavigate: navigate,
    onRegister: handleRegister,
    onResetPassword: handlePasswordReset,
    initialResetEmail: secretResetRequest.email,
    initialResetToken: secretResetRequest.token,
    onSecretResetHandled: () => setSecretResetRequest({ email: '', token: '' }),
    onUserUpdate: setUser,
    setTheme,
    theme,
    user,
  }

  const shouldShowAuthGate = !user && (isMobileViewport || resetRequest.token)

  if (shouldShowAuthGate) {
    if (authLoading && !resetRequest.token) {
      return <main className="mobile-auth-gate mobile-auth-gate--loading">{t('auth.wait')}</main>
    }

    return (
      <main className="mobile-auth-gate">
        <AuthPanel
          initialEmail={resetRequest.email}
          initialMode={resetRequest.token ? 'reset' : 'login'}
          onForgotPassword={handlePasswordResetRequest}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onResetPassword={handlePasswordReset}
          resetToken={resetRequest.token}
        />
      </main>
    )
  }

  return (
    <AppLayout activePage={activePage} onNavigate={navigate} user={user} onLogout={handleLogout} setTheme={setTheme} theme={theme}>
      <Suspense fallback={<section className="page-container loading-state">{t('auth.wait')}</section>}>
        <Routes>
          <Route path="/" element={<HomePage {...pageProps} />} />
          <Route path="/diary/:identifier?" element={<DiaryPage {...pageProps} />} />
          <Route path="/secret-diary/:identifier?" element={<SecretDiaryPage {...pageProps} />} />
          <Route path="/bacheca/*" element={<KanbanPage {...pageProps} />} />
          <Route path="/analysis" element={<AnalysisPage {...pageProps} />} />
          <Route path="/profile" element={<ProfilePage {...pageProps} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {user?.show_welcome_modal && !welcomeDismissed ? (
        <WelcomeModal onClose={closeWelcomeModal} />
      ) : null}
    </AppLayout>
  )
}

export default App
