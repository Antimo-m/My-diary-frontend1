import { useEffect, useMemo, useState } from 'react'
import AppLayout from './layout/AppLayout'
import HomePage from './pages/HomePage'
import DiaryPage from './pages/DiaryPage'
import KanbanPage from './pages/KanbanPage'
import ProfilePage from './pages/ProfilePage'
import { getCurrentUser, login, logout, register } from './services/authApi'
import { updateProfile } from './services/profileApi'
import WelcomeModal from './components/WelcomeModal'
import usePageTitle from './hooks/usePageTitle'
import './App.css'

const pages = {
  home: HomePage,
  diary: DiaryPage,
  kanban: KanbanPage,
  profile: ProfilePage,
}

function App() {
  const [activePage, setActivePage] = useState('home')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('my-diary-theme') ?? 'light')
  const ActivePage = useMemo(() => pages[activePage] ?? HomePage, [activePage])

  usePageTitle(activePage)

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
    setActivePage('diary')
  }

  const handleRegister = async (payload) => {
    const authenticatedUser = await register(payload)
    setUser(authenticatedUser)
    setActivePage('diary')
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
    setWelcomeDismissed(false)
    setActivePage('home')
  }

  const closeWelcomeModal = async (dontShowAgain) => {
    setWelcomeDismissed(true)

    if (dontShowAgain) {
      setUser(await updateProfile({ show_welcome_modal: false }))
    }
  }

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage} user={user} onLogout={handleLogout}>
      <ActivePage
        authLoading={authLoading}
        onLogin={handleLogin}
        onNavigate={setActivePage}
        onRegister={handleRegister}
        onUserUpdate={setUser}
        setTheme={setTheme}
        theme={theme}
        user={user}
      />
      {user?.show_welcome_modal && !welcomeDismissed ? (
        <WelcomeModal onClose={closeWelcomeModal} />
      ) : null}
    </AppLayout>
  )
}

export default App
