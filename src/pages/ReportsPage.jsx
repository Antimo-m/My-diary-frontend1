import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiSend, FiSettings } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import CustomSelect from '../components/CustomSelect'
import UserMessage from '../components/UserMessage'
import Button from '../components/ui/Button'
import Pagination from '../components/ui/Pagination'
import Toast from '../components/ui/Toast'
import { useI18n } from '../i18n/useI18n'
import { collectEnvironment } from '../monitoring'
import { monitoringConfig } from '../config/monitoring'
import { createUserReport, listMyReports } from '../services/reportsApi'
import { getApiError } from '../utils/apiErrors'
import './ReportsPage.css'

const reportTypes = ['bug', 'problem', 'suggestion', 'request', 'feedback']
const emptyForm = { type: 'bug', subject: '', message: '' }

// Contesto tecnico allegato automaticamente: stesse informazioni dei report
// di monitoraggio, raccolte dal modulo e whitelistate dal backend.
function buildContext() {
  const { language, os, browser, route, url, viewport } = collectEnvironment()

  return {
    url,
    route,
    browser,
    os,
    viewport,
    language,
    app_version: monitoringConfig.release,
    environment: monitoringConfig.environment,
  }
}

export function ReportStatusBadge({ status, t }) {
  return <span className={`report-status report-status--${status}`}>{t(`reports.status.${status}`)}</span>
}

function ReportsPanel({ user }) {
  const { localeTag, t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [successToast, setSuccessToast] = useState('')
  const [page, setPage] = useState(1)

  const myReportsQuery = useQuery({
    queryKey: ['reports', 'mine', page],
    queryFn: () => listMyReports({ page }),
    placeholderData: keepPreviousData,
  })

  const submitMutation = useMutation({
    mutationFn: () => createUserReport({ ...form, context: buildContext() }),
    onSuccess: async () => {
      setForm(emptyForm)
      setSuccessToast(t('reports.sent'))
      await queryClient.invalidateQueries({ queryKey: ['reports', 'mine'] })
    },
    onError: (requestError) => setError(getApiError(requestError, t('reports.saveError'))),
  })

  const submit = (event) => {
    event.preventDefault()
    setError('')
    submitMutation.mutate()
  }

  const typeOptions = reportTypes.map((type) => ({ value: type, label: t(`reports.type.${type}`) }))
  const reports = myReportsQuery.data?.data ?? []
  const meta = myReportsQuery.data ?? {}

  return (
    <Toast.Provider>
    <section className="reports-page page-container">
      <header className="page-header reports-header">
        <div>
          <h1 className="page-title">{t('reports.title')}</h1>
          <p className="page-subtitle">{t('reports.subtitle')}</p>
        </div>
        {user.is_admin ? (
          <Button variant="outline" onClick={() => navigate('/segnalazioni/gestione')}>
            <FiSettings aria-hidden="true" />
            {t('reports.manage')}
          </Button>
        ) : null}
      </header>

      <UserMessage tone="error">{error || (myReportsQuery.error ? getApiError(myReportsQuery.error, t('reports.loadError')) : '')}</UserMessage>
      <Toast open={Boolean(successToast)} onOpenChange={(isOpen) => !isOpen && setSuccessToast('')} tone="success">
        {successToast}
      </Toast>

      <form className="report-form surface" onSubmit={submit}>
        <CustomSelect
          label={t('reports.type')}
          name="type"
          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
          options={typeOptions}
          value={form.type}
        />

        <label>
          <span>{t('reports.subject')}</span>
          <input
            maxLength={150}
            onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
            placeholder={t('reports.subjectPlaceholder')}
            required
            value={form.subject}
          />
        </label>

        <label>
          <span>{t('reports.message')}</span>
          <textarea
            maxLength={5000}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder={t('reports.messagePlaceholder')}
            required
            rows="6"
            value={form.message}
          />
        </label>

        <p className="report-form__note">{t('reports.contextNote')}</p>

        <Button variant="primary" type="submit" disabled={submitMutation.isPending}>
          <FiSend aria-hidden="true" />
          {submitMutation.isPending ? t('auth.wait') : t('reports.send')}
        </Button>
      </form>

      <section className="reports-mine surface" aria-label={t('reports.mineTitle')}>
        <h2>{t('reports.mineTitle')}</h2>
        {reports.length ? reports.map((report) => (
          <article className="report-row" key={report.id}>
            <div className="report-row__main">
              <strong>{report.subject}</strong>
              <small>{t(`reports.type.${report.type}`)} · {new Date(report.created_at).toLocaleDateString(localeTag)}</small>
            </div>
            <ReportStatusBadge status={report.status} t={t} />
          </article>
        )) : (
          <p className="report-empty">{myReportsQuery.isPending ? t('auth.wait') : t('reports.empty')}</p>
        )}

        <Pagination
          disabled={myReportsQuery.isFetching}
          from={meta.from}
          labels={{ nav: t('reports.mineTitle'), next: t('diary.next'), of: t('common.of'), previous: t('diary.previous') }}
          lastPage={meta.last_page ?? 1}
          onPageChange={setPage}
          page={meta.current_page ?? 1}
          to={meta.to}
          total={meta.total ?? 0}
        />
      </section>
    </section>
    </Toast.Provider>
  )
}

function ReportsPage({ authLoading, onForgotPassword, onLogin, onRegister, onResetPassword, user }) {
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

  return <ReportsPanel user={user} />
}

export default ReportsPage
