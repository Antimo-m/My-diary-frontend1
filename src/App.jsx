import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
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
const PrivacyDataPage = lazy(() => import('./pages/PrivacyDataPage'))
const SecretDiaryPage = lazy(() => import('./pages/SecretDiaryPage'))

const pages = {
  home: HomePage,
  diary: DiaryPage,
  kanban: KanbanPage,
  profile: ProfilePage,
  privacy: PrivacyDataPage,
  analysis: AnalysisPage,
  secretDiary: SecretDiaryPage,
}

function initialPageFromLocation(searchParams) {
  if (searchParams.get('secret_reset_token')) {
    return 'secretDiary'
  }

  if (window.location.pathname.startsWith('/kanban')) {
    return 'kanban'
  }

  if (window.location.pathname.startsWith('/profile')) {
    return 'profile'
  }

  if (window.location.pathname.startsWith('/privacy')) {
    return 'privacy'
  }

  if (window.location.pathname.startsWith('/analysis')) {
    return 'analysis'
  }

  return 'home'
}

function App() {
  const { t } = useI18n()
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const [activePage, setActivePage] = useState(() => initialPageFromLocation(initialParams))
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
  const ActivePage = useMemo(() => pages[activePage] ?? pages.home, [activePage])

  usePageTitle(activePage, t)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('my-diary-theme', theme)
  }, [theme])

  const handleLogin = async (credentials) => {
    const authenticatedUser = await login(credentials)
    setUser(authenticatedUser)
    setActivePage(secretResetRequest.token ? 'secretDiary' : isMobileViewport ? 'home' : 'diary')
  }

  const handleRegister = async (payload) => {
    const authenticatedUser = await register(payload)
    setUser(authenticatedUser)
    setActivePage(secretResetRequest.token ? 'secretDiary' : isMobileViewport ? 'home' : 'diary')
  }

  const handlePasswordResetRequest = async (email) => {
    await requestPasswordReset(email)
  }

  const handlePasswordReset = async (payload) => {
    await resetPassword(payload)
    setResetRequest({ email: '', token: '' })
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
    setWelcomeDismissed(false)
    setActivePage('home')
  }

  const navigate = (page) => {
    const paths = {
      analysis: '/analysis',
      diary: '/diary',
      home: '/',
      kanban: window.location.pathname.startsWith('/kanban/') ? window.location.pathname : '/kanban',
      profile: '/profile',
      privacy: '/privacy',
      secretDiary: '/secret-diary',
    }

    window.history.pushState({}, '', paths[page] ?? '/')
    setActivePage(page)
  }

  const closeWelcomeModal = async (dontShowAgain) => {
    setWelcomeDismissed(true)

    if (dontShowAgain) {
      setUser(await updateProfile({ show_welcome_modal: false }))
    }
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
        <ActivePage
          authLoading={authLoading}
          onForgotPassword={handlePasswordResetRequest}
          onLogin={handleLogin}
          onNavigate={navigate}
          onRegister={handleRegister}
          onResetPassword={handlePasswordReset}
          initialResetEmail={secretResetRequest.email}
          initialResetToken={secretResetRequest.token}
          onSecretResetHandled={() => setSecretResetRequest({ email: '', token: '' })}
          onUserUpdate={setUser}
          setTheme={setTheme}
          theme={theme}
          user={user}
        />
      </Suspense>
      {user?.show_welcome_modal && !welcomeDismissed ? (
        <WelcomeModal onClose={closeWelcomeModal} />
      ) : null}
    </AppLayout>
  )
}

export default App
