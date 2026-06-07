import { useCallback, useEffect, useMemo, useState } from 'react'
import { I18nContext } from './i18nContext'
import { translations } from './translations'

const supportedLocales = ['it', 'en']
const localeStorageKey = 'my-diary-locale'
const timeZoneStorageKey = 'my-diary-time-zone'

function normalizeLocale(locale) {
  const shortLocale = String(locale || '').slice(0, 2).toLowerCase()

  return supportedLocales.includes(shortLocale) ? shortLocale : 'it'
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => normalizeLocale(localStorage.getItem(localeStorageKey) || navigator.language))
  const [timeZone, setTimeZone] = useState(() => localStorage.getItem(timeZoneStorageKey) || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome')

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem(localeStorageKey, locale)
  }, [locale])

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
      t: (key) => translations[locale]?.[key] ?? translations.it[key] ?? key,
    }
  }, [locale, setLocale, timeZone])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
