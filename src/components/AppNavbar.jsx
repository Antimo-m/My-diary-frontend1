import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi'
import './AppNavbar.css'

const navItems = [
  { key: 'home', label: 'Home' },
  { key: 'diary', label: 'Diario' },
  { key: 'kanban', label: 'Kanban' },
]

function AppNavbar({ activePage, onLogout, onNavigate, user }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeMenu)

    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  const navigateToProfile = () => {
    setIsUserMenuOpen(false)
    onNavigate('profile')
  }

  const logoutFromMenu = () => {
    setIsUserMenuOpen(false)
    onLogout()
  }

  return (
    <header className="app-navbar">
      <nav className="app-navbar__inner" aria-label="Navigazione principale">
        <button
          className="app-navbar__brand"
          type="button"
          onClick={() => onNavigate('home')}
          aria-label="Vai alla home"
        >
          <span className="brand-logo" aria-hidden="true">MD</span>
          <span>My Diary</span>
        </button>

        <div className="app-navbar__links">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-link ${activePage === item.key ? 'active' : ''}`}
              type="button"
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="app-navbar__session">
          {user ? (
            <div className="profile-menu" ref={menuRef}>
              <button
                className="profile-menu__trigger"
                type="button"
                onClick={() => setIsUserMenuOpen((current) => !current)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <span title={user.email}>{user.name}</span>
                <FiChevronDown aria-hidden="true" />
              </button>
              {isUserMenuOpen ? (
                <div className="profile-menu__panel" role="menu">
                  <button type="button" onClick={navigateToProfile} role="menuitem">
                    <FiUser aria-hidden="true" />
                    Profilo
                  </button>
                  <button type="button" onClick={logoutFromMenu} role="menuitem">
                    <FiLogOut aria-hidden="true" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="app-navbar__cta" type="button" onClick={() => onNavigate('diary')}>
              Accedi
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

export default AppNavbar
