import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiGlobe, FiLogOut, FiMenu, FiMoon, FiUser, FiX } from 'react-icons/fi'
import { useI18n } from '../i18n/useI18n'
import './AppNavbar.css'

const navItems = [
  { key: 'home', labelKey: 'nav.home' },
  { key: 'diary', labelKey: 'nav.diary' },
  { key: 'secretDiary', labelKey: 'nav.secretDiary' },
  { key: 'kanban', labelKey: 'nav.kanban' },
  { key: 'analysis', labelKey: 'nav.analysis' },
]

function LanguageSwitch({ className = '', locale, setLocale, t }) {
  return (
    <div className={`language-switch ${className}`} role="group" aria-label={t('language.label')}>
      <span>
        <FiGlobe aria-hidden="true" />
        {t('language.label')}
      </span>
      <div>
        <button className={locale === 'it' ? 'active' : ''} type="button" onClick={() => setLocale('it')}>IT</button>
        <button className={locale === 'en' ? 'active' : ''} type="button" onClick={() => setLocale('en')}>EN</button>
      </div>
    </div>
  )
}

function AppNavbar({ activePage, onLogout, onNavigate, setTheme, theme, user }) {
  const { locale, setLocale, t } = useI18n()
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
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
    setIsMobileAccountOpen(false)
    setIsMobileDrawerOpen(false)
    setIsUserMenuOpen(false)
    onNavigate('profile')
  }

  const logoutFromMenu = () => {
    setIsMobileAccountOpen(false)
    setIsMobileDrawerOpen(false)
    setIsUserMenuOpen(false)
    onLogout()
  }

  const navigateFromMenu = (page) => {
    setIsMobileAccountOpen(false)
    setIsMobileDrawerOpen(false)
    setIsUserMenuOpen(false)
    onNavigate(page)
  }

  const isDarkMode = theme === 'dark'

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  return (
    <header className="app-navbar">
      <nav className="app-navbar__inner" aria-label={t('nav.main')}>
        <button
          className="app-navbar__brand"
          type="button"
          onClick={() => onNavigate('home')}
          aria-label="Vai alla home"
        >
          <span className="brand-logo" aria-hidden="true">MD</span>
          <span>{t('app.brand')}</span>
        </button>

        <button
          className="app-navbar__mobile-toggle"
          type="button"
          onClick={() => setIsMobileDrawerOpen((current) => !current)}
          aria-expanded={isMobileDrawerOpen}
          aria-label={isMobileDrawerOpen ? t('nav.closeMenu') : t('nav.openMenu')}
        >
          {isMobileDrawerOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>

        <div className="app-navbar__links">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-link ${activePage === item.key ? 'active' : ''}`}
              type="button"
              onClick={() => navigateFromMenu(item.key)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <div className="app-navbar__session app-navbar__session--desktop">
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
                  <div className="profile-menu__identity">
                    <FiUser aria-hidden="true" />
                    <span>
                      <strong>{user.name}</strong>
                      {user.email ? <small>{user.email}</small> : null}
                    </span>
                  </div>
                  <span className="profile-menu__separator" aria-hidden="true" />
                  <button
                    className="profile-menu__theme"
                    type="button"
                    onClick={toggleTheme}
                    role="menuitemcheckbox"
                    aria-checked={isDarkMode}
                  >
                    <span>
                      <FiMoon aria-hidden="true" />
                      {t('common.darkMode')}
                    </span>
                    <span className={`desktop-theme-toggle ${isDarkMode ? 'is-on' : 'is-off'}`} aria-hidden="true">
                      <span />
                      <strong>{isDarkMode ? 'ON' : 'OFF'}</strong>
                    </span>
                  </button>
                  <LanguageSwitch className="profile-menu__language" locale={locale} setLocale={setLocale} t={t} />
                  <span className="profile-menu__separator" aria-hidden="true" />
                  <button type="button" onClick={navigateToProfile} role="menuitem">
                    <FiUser aria-hidden="true" />
                    {t('common.profile')}
                  </button>
                  <button type="button" onClick={logoutFromMenu} role="menuitem">
                    <FiLogOut aria-hidden="true" />
                    {t('common.logout')}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="app-navbar__cta" type="button" onClick={() => onNavigate('diary')}>
              {t('nav.access')}
            </button>
          )}
        </div>

        {isMobileDrawerOpen ? (
          <div className="mobile-drawer" role="dialog" aria-label="Menu principale">
            <div className="mobile-drawer__panel">
              <div className="mobile-drawer__header">
                <span className="brand-logo" aria-hidden="true">MD</span>
                <strong>{t('app.brand')}</strong>
                <button type="button" onClick={() => setIsMobileDrawerOpen(false)} aria-label={t('nav.closeMenu')}>
                  <FiX aria-hidden="true" />
                </button>
              </div>

              <div className="mobile-drawer__links">
                {navItems.map((item) => (
                  <button
                    key={`drawer-${item.key}`}
                    className={activePage === item.key ? 'active' : ''}
                    type="button"
                    onClick={() => navigateFromMenu(item.key)}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>

              <div className="mobile-drawer__session">
                <div className="mobile-theme-row">
                  <span>
                    <FiMoon aria-hidden="true" />
                    {t('common.darkMode')}
                  </span>
                  <button
                    className={`mobile-theme-toggle ${isDarkMode ? 'is-on' : 'is-off'}`}
                    type="button"
                    onClick={toggleTheme}
                    aria-pressed={isDarkMode}
                  >
                    <span className="mobile-theme-toggle__track" aria-hidden="true">
                      <span />
                    </span>
                    <strong>{isDarkMode ? 'ON' : 'OFF'}</strong>
                  </button>
                </div>
                <LanguageSwitch className="mobile-theme-row mobile-language-row" locale={locale} setLocale={setLocale} t={t} />
                {user ? (
                  <>
                    <button className="mobile-account-card" type="button" onClick={() => setIsMobileAccountOpen((current) => !current)} aria-expanded={isMobileAccountOpen}>
                      <span className="mobile-account-card__avatar" aria-hidden="true">
                        <FiUser />
                      </span>
                      <span className="mobile-account-card__body">
                        <strong>{user.name}</strong>
                        {user.email ? <small>{user.email}</small> : null}
                      </span>
                      <FiChevronDown aria-hidden="true" />
                    </button>
                    {isMobileAccountOpen ? (
                      <div className="mobile-account-actions">
                        <button type="button" onClick={navigateToProfile}>
                          <FiUser aria-hidden="true" />
                          {t('common.profile')}
                        </button>
                        <button type="button" onClick={logoutFromMenu}>
                          <FiLogOut aria-hidden="true" />
                          {t('common.logout')}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <button type="button" onClick={() => navigateFromMenu('diary')}>{t('nav.access')}</button>
                )}
              </div>
            </div>
            <button className="mobile-drawer__scrim" type="button" onClick={() => setIsMobileDrawerOpen(false)} aria-label="Chiudi menu" />
          </div>
        ) : null}
      </nav>
    </header>
  )
}

export default AppNavbar
