import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiShield } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import CustomSelect from '../components/CustomSelect'
import UserMessage from '../components/UserMessage'
import Pagination from '../components/ui/Pagination'
import Toast from '../components/ui/Toast'
import { useI18n } from '../i18n/useI18n'
import { getAdminReportStats, listAdminReports, updateAdminReport } from '../services/reportsApi'
import { getApiError } from '../utils/apiErrors'
import { ReportStatusBadge } from './ReportsPage'
import './MonitoringPage.css'
import './ReportsPage.css'

const statusValues = ['open', 'in_progress', 'resolved', 'dismissed']
const typeValues = ['bug', 'problem', 'suggestion', 'request', 'feedback']

function AdminReportsBoard() {
  const { localeTag, t } = useI18n()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ q: '', status: '', type: '', page: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [error, setError] = useState('')
  const [successToast, setSuccessToast] = useState('')

  const statsQuery = useQuery({ queryKey: ['reports', 'admin', 'stats'], queryFn: getAdminReportStats })
  const reportsQuery = useQuery({
    queryKey: ['reports', 'admin', filters],
    queryFn: () => listAdminReports(filters),
    placeholderData: keepPreviousData,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => updateAdminReport(id, changes),
    onSuccess: async () => {
      setSuccessToast(t('reports.updated'))
      await queryClient.invalidateQueries({ queryKey: ['reports', 'admin'] })
    },
    onError: (requestError) => setError(getApiError(requestError, t('reports.updateError'))),
  })

  const stats = statsQuery.data
  const reports = reportsQuery.data?.data ?? []
  const meta = reportsQuery.data ?? {}

  const statusOptions = [{ value: '', label: t('reports.allStatuses') }, ...statusValues.map((status) => ({ value: status, label: t(`reports.status.${status}`) }))]
  const typeOptions = [{ value: '', label: t('reports.allTypes') }, ...typeValues.map((type) => ({ value: type, label: t(`reports.type.${type}`) }))]

  const submitSearch = (event) => {
    event.preventDefault()
    setFilters((current) => ({ ...current, q: searchInput.trim(), page: 1 }))
  }

  return (
    <Toast.Provider>
    <section className="reports-page page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t('reports.adminTitle')}</h1>
          <p className="page-subtitle">{t('reports.adminSubtitle')}</p>
        </div>
      </header>

      <UserMessage tone="error">{error || (reportsQuery.error ? getApiError(reportsQuery.error, t('reports.loadError')) : '')}</UserMessage>
      <Toast open={Boolean(successToast)} onOpenChange={(isOpen) => !isOpen && setSuccessToast('')} tone="success">
        {successToast}
      </Toast>

      <div className="monitoring-tiles">
        {statusValues.map((status) => (
          <div className="monitoring-tile surface" key={status}>
            <strong>{stats?.by_status?.[status] ?? 0}</strong>
            <span>{t(`reports.status.${status}`)}</span>
          </div>
        ))}
      </div>

      <form className="reports-filters" onSubmit={submitSearch}>
        <CustomSelect
          label={t('reports.statusLabel')}
          name="status"
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
          options={statusOptions}
          value={filters.status}
        />
        <CustomSelect
          label={t('reports.type')}
          name="type"
          onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))}
          options={typeOptions}
          value={filters.type}
        />
        <input
          aria-label={t('diary.search')}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t('monitoring.searchPlaceholder')}
          value={searchInput}
        />
        <button className="btn" type="submit">{t('diary.search')}</button>
      </form>

      <section className="reports-admin-list" aria-label={t('reports.adminTitle')}>
        {reports.length ? reports.map((report) => (
          <article className="report-card surface" key={report.id}>
            <header className="report-card__head">
              <div>
                <strong>{report.subject}</strong>
                <small>
                  {t(`reports.type.${report.type}`)} · {report.user?.email} · {new Date(report.created_at).toLocaleString(localeTag)}
                  {report.fingerprint ? <> · <code>{report.fingerprint}</code></> : null}
                </small>
              </div>
              <ReportStatusBadge status={report.status} t={t} />
            </header>
            <p className="report-card__message">{report.message}</p>
            {report.context ? (
              <small className="report-card__context">
                {[report.context.route, report.context.browser, report.context.os, report.context.viewport, report.context.app_version]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            ) : null}
            <div className="report-card__actions">
              {statusValues.filter((status) => status !== report.status).map((status) => (
                <button
                  className="btn report-card__status-button"
                  disabled={updateMutation.isPending}
                  key={status}
                  onClick={() => {
                    setError('')
                    updateMutation.mutate({ id: report.id, changes: { status } })
                  }}
                  type="button"
                >
                  {t(`reports.status.${status}`)}
                </button>
              ))}
            </div>
          </article>
        )) : (
          <p className="report-empty">{reportsQuery.isPending ? t('auth.wait') : t('reports.adminEmpty')}</p>
        )}
      </section>

      <Pagination
        disabled={reportsQuery.isFetching}
        from={meta.from}
        labels={{ nav: t('reports.adminTitle'), next: t('diary.next'), of: t('common.of'), previous: t('diary.previous') }}
        lastPage={meta.last_page ?? 1}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        page={meta.current_page ?? 1}
        to={meta.to}
        total={meta.total ?? 0}
      />
    </section>
    </Toast.Provider>
  )
}

function AdminReportsPage({ authLoading, onForgotPassword, onLogin, onRegister, onResetPassword, user }) {
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
        <FiShield aria-hidden="true" />
        <p>{t('monitoring.notAllowed')}</p>
      </section>
    )
  }

  return <AdminReportsBoard />
}

export default AdminReportsPage
