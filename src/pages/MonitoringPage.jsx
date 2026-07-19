import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { FiActivity, FiSearch } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import UserMessage from '../components/UserMessage'
import Pagination from '../components/ui/Pagination'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useI18n } from '../i18n/useI18n'
import { getMonitoringStats, listMonitoringErrors } from '../services/monitoringApi'
import { getApiError } from '../utils/apiErrors'
import './MonitoringPage.css'

// Unica tinta dei grafici, validata (scripts dataviz) sui surface chiaro e
// scuro dell'app: ogni grafico e mono-serie, l'identita la porta il testo.
const chartColor = '#5d8746'
const periodOptions = [7, 30, 90]

function StatTile({ label, value }) {
  return (
    <div className="monitoring-tile surface">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

// Classifica compatta: etichetta + barra di magnitudine + conteggio visibile.
// Il valore in chiaro accanto alla barra e il "relief" richiesto quando il
// colore da solo non basta.
function TopList({ items, labelKey, title }) {
  const max = Math.max(1, ...items.map((item) => item.total))

  return (
    <section className="monitoring-list surface" aria-label={title}>
      <h3>{title}</h3>
      {items.map((item) => (
        <div className="monitoring-list__row" key={item[labelKey]}>
          <span className="monitoring-list__label">{item[labelKey]}</span>
          <span className="monitoring-list__meter" aria-hidden="true">
            <span style={{ width: `${(item.total / max) * 100}%` }} />
          </span>
          <strong>{item.total}</strong>
        </div>
      ))}
    </section>
  )
}

function MonitoringDashboard() {
  const { localeTag, t } = useI18n()
  const [days, setDays] = useState(30)
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({ q: '', page: 1 })

  const statsQuery = useQuery({
    queryKey: ['monitoring', 'stats', days],
    queryFn: () => getMonitoringStats(days),
  })
  const errorsQuery = useQuery({
    queryKey: ['monitoring', 'errors', filters],
    queryFn: () => listMonitoringErrors(filters),
    placeholderData: keepPreviousData,
  })

  const stats = statsQuery.data
  const errorRows = errorsQuery.data?.data ?? []
  const errorsMeta = errorsQuery.data ?? {}
  const trend = (stats?.trend ?? []).map((entry) => ({
    ...entry,
    label: new Date(`${entry.date}T00:00:00`).toLocaleDateString(localeTag, { day: '2-digit', month: 'short' }),
  }))

  const submitSearch = (event) => {
    event.preventDefault()
    setFilters({ q: searchInput.trim(), page: 1 })
  }

  const queryError = statsQuery.error ?? errorsQuery.error

  return (
    <section className="monitoring-page page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t('monitoring.title')}</h1>
          <p className="page-subtitle">{t('monitoring.subtitle')}</p>
        </div>
      </header>

      <UserMessage tone="error">{queryError ? getApiError(queryError, t('monitoring.loadError')) : ''}</UserMessage>

      <div className="monitoring-controls" role="group" aria-label={t('monitoring.period')}>
        {periodOptions.map((option) => (
          <button className={days === option ? 'active' : ''} key={option} type="button" onClick={() => setDays(option)}>
            {t(`monitoring.period.${option}`)}
          </button>
        ))}
      </div>

      <div className="monitoring-tiles">
        <StatTile label={t('monitoring.totalErrors')} value={stats?.totals?.errors ?? 0} />
        <StatTile label={t('monitoring.groups')} value={stats?.totals?.groups ?? 0} />
        <StatTile label={t('monitoring.affectedUsers')} value={stats?.totals?.affected_users ?? 0} />
      </div>

      <section className="monitoring-trend surface" aria-label={t('monitoring.trendTitle')}>
        <h3>{t('monitoring.trendTitle')}</h3>
        {trend.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--line)', opacity: 0.35 }} />
              <Bar dataKey="total" name={t('monitoring.totalErrors')} fill={chartColor} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="monitoring-empty">{t('monitoring.empty')}</p>
        )}
      </section>

      <div className="monitoring-columns">
        <TopList items={stats?.by_browser ?? []} labelKey="browser" title={t('monitoring.byBrowser')} />
        <TopList items={stats?.by_page ?? []} labelKey="page" title={t('monitoring.byPage')} />
        <TopList items={stats?.by_version ?? []} labelKey="app_version" title={t('monitoring.byVersion')} />
      </div>

      <section className="monitoring-groups surface" aria-label={t('monitoring.topGroups')}>
        <h3>{t('monitoring.topGroups')}</h3>
        <div className="monitoring-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('monitoring.totalErrors')}</th>
                <th>{t('monitoring.source')}</th>
                <th aria-hidden="true" />
                <th>{t('monitoring.lastSeen')}</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.top_groups ?? []).map((group) => (
                <tr key={group.fingerprint}>
                  <td><strong>{group.total}</strong></td>
                  <td><code>{group.source}</code></td>
                  <td className="monitoring-message">{group.message}</td>
                  <td>{group.last_seen ? new Date(group.last_seen).toLocaleString(localeTag) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="monitoring-reports surface" aria-label={t('monitoring.listTitle')}>
        <div className="monitoring-reports__head">
          <h3>{t('monitoring.listTitle')}</h3>
          <form className="monitoring-search" onSubmit={submitSearch}>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('monitoring.searchPlaceholder')}
              aria-label={t('monitoring.searchPlaceholder')}
            />
            <button className="btn" type="submit" aria-label={t('diary.search')}>
              <FiSearch aria-hidden="true" />
            </button>
          </form>
        </div>

        {errorRows.length ? errorRows.map((row) => (
          <article className="monitoring-report" key={row.id}>
            <div className="monitoring-report__main">
              <strong>{row.message}</strong>
              <small>
                <code>{row.source}</code> · {row.page} · {row.browser ?? '—'} · {row.user?.email ?? t('monitoring.anonymousUser')}
              </small>
            </div>
            <time dateTime={row.occurred_at}>{new Date(row.occurred_at).toLocaleString(localeTag)}</time>
          </article>
        )) : (
          <p className="monitoring-empty">{errorsQuery.isPending ? t('auth.wait') : t('monitoring.empty')}</p>
        )}

        <Pagination
          disabled={errorsQuery.isFetching}
          from={errorsMeta.from}
          labels={{ nav: t('monitoring.listTitle'), next: t('diary.next'), of: t('common.of'), previous: t('diary.previous') }}
          lastPage={errorsMeta.last_page ?? 1}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          page={errorsMeta.current_page ?? 1}
          to={errorsMeta.to}
          total={errorsMeta.total ?? 0}
        />
      </section>
    </section>
  )
}

function MonitoringPage({ authLoading, onForgotPassword, onLogin, onRegister, onResetPassword, user }) {
  const { t } = useI18n()

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

  if (!user.is_admin) {
    return (
      <section className="page-container monitoring-denied">
        <FiActivity aria-hidden="true" />
        <p>{t('monitoring.notAllowed')}</p>
      </section>
    )
  }

  return <MonitoringDashboard />
}

export default MonitoringPage
