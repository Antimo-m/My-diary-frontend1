import AppNavbar from '../components/AppNavbar'
import './AppLayout.css'

function AppLayout({ activePage, children, onLogout, onNavigate, setTheme, theme, user }) {
  return (
    <div className="app-shell">
      <AppNavbar activePage={activePage} onLogout={onLogout} onNavigate={onNavigate} setTheme={setTheme} theme={theme} user={user} />
      <main className="app-main">{children}</main>
    </div>
  )
}

export default AppLayout
