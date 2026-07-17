import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import AuthPanel from '../components/AuthPanel'
import StatsDashboard from '../components/StatsDashboard'
import UserMessage from '../components/UserMessage'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'
import { useI18n } from '../i18n/useI18n'
import { listBachecaProjects } from '../services/kanbanApi'
import { getProfileStats } from '../services/profileApi'
import { getApiError } from '../utils/apiErrors'
import './ProfilePage.css'

function AnalysisPage({ authLoading, onForgotPassword, onLogin, onRegister, onResetPassword, user }) {
  const { locale, t } = useI18n()
  const [period, setPeriod] = useState('week')
  const [selectedBoard, setSelectedBoard] = useState('all')

  const statsQuery = useQuery({
    queryKey: ['profile-stats', selectedBoard, period],
    queryFn: () => getProfileStats({ board: selectedBoard, period }),
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
  })
  const projectsQuery = useQuery({
    queryKey: ['bacheca', 'projects'],
    queryFn: listBachecaProjects,
    enabled: Boolean(user),
  })
  const stats = statsQuery.data ?? null
  const projects = projectsQuery.data ?? []
  const error = statsQuery.error ? getApiError(statsQuery.error, t('profile.statsError')) : ''

  const changePeriod = (nextPeriod) => {
    setPeriod(nextPeriod)
  }

  const changeBoard = (nextBoard) => {
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
