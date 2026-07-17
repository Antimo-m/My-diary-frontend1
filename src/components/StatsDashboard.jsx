import { useMemo, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import CustomSelect from './CustomSelect'
import './StatsDashboard.css'

const periodOptions = ['week', 'month', 'year']

function fillTrendRange(range, trend, valueKeys) {
  if (!range?.starts_at || !range?.ends_at) return trend ?? []

  const valuesByDate = new Map((trend ?? []).map((entry) => [entry.date, entry]))
  const cursor = new Date(`${range.starts_at}T12:00:00`)
  const end = new Date(`${range.ends_at}T12:00:00`)
  const result = []

  while (cursor <= end && result.length < 370) {
    const date = cursor.toISOString().slice(0, 10)
    result.push({
      date,
      ...Object.fromEntries(valueKeys.map((key) => [key, 0])),
      ...(valuesByDate.get(date) ?? {}),
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

function buildProductivityAdvice(stats, locale) {
  const kanban = stats?.kanban ?? {}
  const diary = stats?.diary ?? {}
  const total = kanban.total_activities ?? 0
  const completed = kanban.completed_activities ?? 0
  const open = Math.max(0, total - completed)
  const completionRate = Math.round(kanban.completion_rate ?? 0)
  const writingDays = diary.writing_days ?? 0

  if (locale === 'en') {
    return [
      total === 0
        ? 'Start with one concrete activity that can be completed today. A small, visible first step is more useful than a perfect plan.'
        : `You completed ${completed} of ${total} activities (${completionRate}%). Choose the next action from the ${open} still open and give it a clear finish line.`,
      completionRate < 40 && open > 0
        ? 'Reduce today’s work in progress: select at most three priorities and move everything else out of the active list.'
        : 'Your completion rhythm is solid. Protect it by preparing tomorrow’s first activity before ending today.',
      writingDays === 0
        ? 'Use the diary for a two-minute evening review: note what worked, what slowed you down, and tomorrow’s first step.'
        : `You wrote on ${writingDays} days in this period. Review those entries and turn one recurring thought into a scheduled action.`,
      'Group similar activities into one focused block and leave a short buffer before switching context.',
    ]
  }

  return [
    total === 0
      ? 'Inizia da una sola attività concreta, completabile oggi. Un primo passo piccolo e visibile è più utile di un piano perfetto.'
      : `Hai completato ${completed} attività su ${total} (${completionRate}%). Scegli la prossima azione tra le ${open} ancora aperte e definisci con chiarezza quando sarà conclusa.`,
    completionRate < 40 && open > 0
      ? 'Riduci il lavoro in corso: seleziona al massimo tre priorità per oggi e sposta tutto il resto fuori dalla lista attiva.'
      : 'Il tuo ritmo di completamento è solido. Proteggilo preparando la prima attività di domani prima di chiudere la giornata.',
    writingDays === 0
      ? 'Usa il diario per una revisione serale di due minuti: annota cosa ha funzionato, cosa ti ha rallentato e il primo passo di domani.'
      : `Hai scritto in ${writingDays} giorni del periodo. Rileggi quelle pagine e trasforma un pensiero ricorrente in un’azione pianificata.`,
    'Raggruppa le attività simili in un unico blocco di concentrazione e lascia un breve margine prima di cambiare contesto.',
  ]
}

function StatsDashboard({ locale, onBoardChange, onPeriodChange, period, projects = [], selectedBoard = 'all', stats, t }) {
  const [adviceIndex, setAdviceIndex] = useState(0)
  const adviceList = useMemo(() => buildProductivityAdvice(stats, locale), [locale, stats])
  const kanban = stats?.kanban ?? {}
  const diary = stats?.diary ?? {}
  const kanbanMessage = kanban.message_key ? t(kanban.message_key) : kanban.message
  const diaryMessage = diary.message_key ? t(diary.message_key) : diary.message
  const kanbanCompletion = [
    { name: t('profile.completed'), value: kanban.completed_activities ?? 0, color: '#8fb879' },
    { name: t('profile.open'), value: Math.max(0, (kanban.total_activities ?? 0) - (kanban.completed_activities ?? 0)), color: '#c9b489' },
  ]
  const diaryBreakdown = [
    { name: t('profile.publicDiary'), value: diary.public_notes ?? 0, color: '#d7a87c' },
    { name: t('profile.secretDiary'), value: diary.secret_notes ?? 0, color: '#9aa6c2' },
  ]
  const hasKanbanData = kanbanCompletion.some((entry) => entry.value > 0)
  const hasDiaryData = diaryBreakdown.some((entry) => entry.value > 0)
  const kanbanTrend = fillTrendRange(stats?.range, kanban.trend, ['completed', 'total'])
  const diaryTrend = fillTrendRange(stats?.range, diary.trend, ['public', 'secret'])
  const boardOptions = [
    { value: 'all', label: t('profile.allBoards') },
    { value: 'daily', label: t('profile.dailyBoard') },
    ...projects.map((project) => ({ value: String(project.id), label: project.name })),
  ]

  return (
    <section className="stats-dashboard">
      <div className="stats-dashboard__controls">
        <div className="stats-dashboard__board-select">
          <CustomSelect
            label={t('profile.board')}
            name="board"
            onChange={(event) => onBoardChange(event.target.value)}
            options={boardOptions}
            value={String(selectedBoard)}
          />
        </div>

        <div className="stats-dashboard__period" role="group" aria-label={t('profile.period')}>
          {periodOptions.map((option) => (
            <button className={period === option ? 'active' : ''} type="button" key={option} onClick={() => onPeriodChange(option)}>
              {t(`profile.period.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-dashboard__hero">
        <h2>{t('profile.periodSummary')}</h2>
        <p>{stats?.range?.starts_at} · {stats?.range?.ends_at}</p>
      </div>

      <div className="stats-dashboard__grid">
        <article className="stats-card stats-card--kanban">
          <div className="stats-card__heading">
            <h3>{kanbanMessage ?? t('profile.loadingStats')}</h3>
          </div>
          <strong className="stats-card__metric">{kanban.completion_rate ?? 0}%</strong>
          <span>{t('profile.completionRate')}</span>
          {hasKanbanData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={kanbanCompletion} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84}>
                  {kanbanCompletion.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="stats-zero-state" role="status">
              <strong>0%</strong>
              <span>{t('analysis.noKanbanData')}</span>
            </div>
          )}
          <div className="stats-pills">
            <span>{t('profile.total')}: <strong>{kanban.total_activities ?? 0}</strong></span>
            <span>{t('profile.completed')}: <strong>{kanban.completed_activities ?? 0}</strong></span>
          </div>
        </article>

        <article className="stats-card stats-card--diary">
          <div className="stats-card__heading">
            <h3>{diaryMessage ?? t('profile.loadingStats')}</h3>
          </div>
          <strong className="stats-card__metric">{diary.interactions ?? 0}</strong>
          <span>{t('profile.diaryInteractions')}</span>
          {hasDiaryData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={diaryBreakdown} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84}>
                  {diaryBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="stats-zero-state" role="status">
              <strong>0</strong>
              <span>{t('analysis.noDiaryData')}</span>
            </div>
          )}
          <div className="stats-pills">
            <span>{t('profile.writingDays')}: <strong>{diary.writing_days ?? 0}</strong></span>
            <span>{t('profile.publicDiary')}: <strong>{diary.public_notes ?? 0}</strong></span>
            <span>{t('profile.secretDiary')}: <strong>{diary.secret_notes ?? 0}</strong></span>
          </div>
        </article>

        <article className="stats-card stats-card--wide">
          <div className="stats-card__heading">
            <h3>{t('profile.kanbanTrend')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={kanbanTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString(locale === 'en' ? 'en-US' : 'it-IT', { day: '2-digit', month: 'short' })} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completed" name={t('profile.completed')} fill="#8fb879" />
              <Bar dataKey="total" name={t('profile.total')} fill="#c9b489" />
            </BarChart>
          </ResponsiveContainer>
          {!hasKanbanData ? <p className="stats-trend-note">{t('analysis.noTrendData')}</p> : null}
        </article>

        <article className="stats-card stats-card--wide">
          <div className="stats-card__heading">
            <h3>{t('profile.diaryTrendTitle')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={diaryTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString(locale === 'en' ? 'en-US' : 'it-IT', { day: '2-digit', month: 'short' })} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="public" name={t('profile.publicDiary')} fill="#d7a87c" />
              <Bar dataKey="secret" name={t('profile.secretDiary')} fill="#9aa6c2" />
            </BarChart>
          </ResponsiveContainer>
          {!hasDiaryData ? <p className="stats-trend-note">{t('analysis.noTrendData')}</p> : null}
        </article>

        <article className="stats-card stats-card--advice stats-card--wide">
          <div className="stats-card__heading">
            <h3>{t('analysis.adviceTitle')}</h3>
          </div>
          <p>{adviceList[adviceIndex % adviceList.length]}</p>
          <button className="advice-toast__next" type="button" onClick={() => {
            setAdviceIndex((current) => (current + 1) % adviceList.length)
          }}>
            <FiRefreshCw aria-hidden="true" />
            {t('analysis.nextAdvice')}
          </button>
        </article>
      </div>
    </section>
  )
}

export default StatsDashboard
