import { useEffect } from 'react'

const appName = 'My Diary'

export const pageTitles = {
  home: 'app.brand',
  diary: 'nav.diary',
  secretDiary: 'nav.secretDiary',
  kanban: 'nav.kanban',
  profile: 'common.profile',
  analysis: 'nav.analysis',
}

function usePageTitle(pageKey, t) {
  const translatedTitle = t(pageTitles[pageKey] ?? 'app.brand')

  useEffect(() => {
    document.title = translatedTitle === appName ? appName : `${translatedTitle} - ${appName}`
  }, [translatedTitle])
}

export default usePageTitle
