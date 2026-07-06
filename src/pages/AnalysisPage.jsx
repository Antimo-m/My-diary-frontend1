import { useEffect, useState } from 'react'
import AuthPanel from '../components/AuthPanel'
import StatsDashboard from '../components/StatsDashboard'
import UserMessage from '../components/UserMessage'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'
import { useI18n } from '../i18n/useI18n'
import { listKanbanProjects } from '../services/kanbanApi'
import { getProfileStats } from '../services/profileApi'
import { getApiError } from '../utils/apiErrors'
import './ProfilePage.css'

function AnalysisPage({ authLoading, onForgotPassword, onLogin, onRegister, onResetPassword, user }) {
  const { locale, t } = useI18n()
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('week')
  const [projects, setProjects] = useState([])
  const [selectedBoard, setSelectedBoard] = useState('all')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!user) {
      return undefined
    }

    let isMounted = true
    const loadStats = () => {
      getProfileStats({ board: selectedBoard, period })
        .then((data) => {
          if (isMounted) {
            setStats(data)
          }
        })
        .catch((requestError) => {
          if (isMounted) {
            setError(getApiError(requestError, t('profile.statsError')))
          }
        })
    }

    loadStats()
    const intervalId = window.setInterval(loadStats, 15000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [period, selectedBoard, t, user])

  useEffect(() => {
    if (!user) {
      return
    }

    listKanbanProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [user])

  const changePeriod = (nextPeriod) => {
    setError('')
    setPeriod(nextPeriod)
  }

  const changeBoard = (nextBoard) => {
    setError('')
    setSelectedBoard(nextBoard)
  }

  if (authLoading) {
    return <section className="page-container loading-state">{t('auth.wait')}</section>
  }

  if (!user) {
    return (
      <section className="page-container">
        <AuthPanel onForgotPassword={onForgotPassword} onLogin={onLogin} onRegister={onRegister} onResetPassword={onResetPassword} />
      </section>
    )
  }

  return (
    <section className="profile-page analysis-page page-container">
      <header className="page-header profile-analysis-header">
        <div>
          <p className="eyebrow">{t('profile.analysis')}</p>
          <h1 className="page-title">{t('nav.analysis')}</h1>
          <p className="page-subtitle">{t('profile.analysisSubtitle')}</p>
        </div>
      </header>

      <UserMessage tone="error">{error}</UserMessage>
      {!stats ? (
        <Card className="analysis-loading">
          <Skeleton variant="text" lines={4} />
        </Card>
      ) : null}
      <StatsDashboard
        locale={locale}
        onBoardChange={changeBoard}
        onPeriodChange={changePeriod}
        period={period}
        projects={projects}
        selectedBoard={selectedBoard}
        stats={stats}
        t={t}
      />
    </section>
  )
}

export default AnalysisPage
