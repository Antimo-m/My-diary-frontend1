import { useEffect } from 'react'

const appName = 'My Diary'

export const pageTitles = {
  home: appName,
  diary: 'Diario',
  kanban: 'Kanban',
  calendar: 'Calendario',
  profile: 'Profilo',
  settings: 'Settings',
}

function usePageTitle(pageKey) {
  useEffect(() => {
    document.title = pageTitles[pageKey] ?? appName
  }, [pageKey])
}

export default usePageTitle
