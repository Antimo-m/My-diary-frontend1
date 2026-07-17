import { useCallback, useEffect, useMemo, useState } from 'react'
import { I18nContext } from './i18nContext'
import itMessages from './messages/it'

const supportedLocales = ['it', 'en']
const localeStorageKey = 'my-diary-locale'
const timeZoneStorageKey = 'my-diary-time-zone'

// Italian is the base language and ships in the main bundle; the other
// dictionaries are loaded on demand the first time their locale is active.
const messageLoaders = {
  en: () => import('./messages/en.js'),
}

function normalizeLocale(locale) {
  const shortLocale = String(locale || '').slice(0, 2).toLowerCase()

  return supportedLocales.includes(shortLocale) ? shortLocale : 'it'
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => normalizeLocale(localStorage.getItem(localeStorageKey) || navigator.language))
  const [timeZone, setTimeZone] = useState(() => localStorage.getItem(timeZoneStorageKey) || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome')
  const [messages, setMessages] = useState({ it: itMessages })

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem(localeStorageKey, locale)
  }, [locale])

  useEffect(() => {
    const loader = messageLoaders[locale]

    if (!loader || messages[locale]) {
      return undefined
    }

    let active = true

    loader().then((module) => {
      if (active) {
        setMessages((current) => ({ ...current, [locale]: module.default }))
      }
    })

    return () => {
      active = false
    }
  }, [locale, messages])

  useEffect(() => {
    localStorage.setItem(timeZoneStorageKey, timeZone)
  }, [timeZone])

  const setLocale = useCallback((nextLocale) => {
    setLocaleState((currentLocale) => {
      const normalizedLocale = normalizeLocale(nextLocale)

      return currentLocale === normalizedLocale ? currentLocale : normalizedLocale
    })
  }, [])

  const value = useMemo(() => {
    const localeTag = locale === 'en' ? 'en-US' : 'it-IT'

    return {
      locale,
      localeTag,
      changeLanguage: setLocale,
      setLocale,
      setTimeZone,
      supportedLocales,
      timeZone,
      t: (key) => messages[locale]?.[key] ?? itMessages[key] ?? key,
    }
  }, [locale, messages, setLocale, timeZone])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
