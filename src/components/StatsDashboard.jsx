import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import './StatsDashboard.css'

const periodOptions = ['week', 'month', 'year']

const productivityAdvice = {
  it: [
    'Trasforma ogni obiettivo grande in un primo task cosi piccolo da poterlo iniziare subito.',
    'Scegli le tre priorita del giorno prima di aprire nuove richieste o nuove distrazioni.',
    'Lavora a blocchi brevi: un timer chiaro rende piu facile restare dentro il task.',
    'Raggruppa attivita simili, cosi il cervello cambia contesto meno spesso.',
    'Prima di pianificare tutto, identifica il prossimo passo concreto.',
    'Se un task richiede meno di due minuti, chiudilo o mettilo subito nel posto giusto.',
    'Usa le pause come parte del lavoro: tornare lucida vale piu che restare ferma sullo schermo.',
    'Dai una scadenza anche ai task piccoli: il tempo indefinito tende ad allargarsi.',
    'Scrivi fuori dalla testa cio che ti distrae, poi torna al blocco di lavoro attivo.',
    'Lascia spazio tra due impegni importanti: il recupero protegge la qualita.',
    'Misura il progresso con task completati, non con ore passate davanti alla lista.',
    'Quando un progetto sembra enorme, crea una colonna solo per la prima fase.',
    'Se rimandi qualcosa da giorni, riducilo a una versione da dieci minuti.',
    'Controlla le notifiche a finestre decise, non ogni volta che chiamano.',
    'Prepara il task di domani alla fine di oggi: iniziare diventa piu leggero.',
    'Usa colori ed etichette per distinguere urgenza, energia richiesta e area di vita.',
    'Tieni una lista breve per il presente e una lista separata per le idee future.',
    'Completa un ciclo prima di aprirne tre nuovi: la chiarezza cresce con le chiusure.',
    'Rileggi i dati della settimana per capire dove il ritmo funziona davvero.',
    'Celebra i micro progressi: sono loro che tengono viva la continuita.',
  ],
  en: [
    'Turn every big goal into a first task small enough to start immediately.',
    'Choose the three priorities of the day before opening new requests or distractions.',
    'Work in short blocks: a clear timer makes it easier to stay inside the task.',
    'Batch similar activities so your mind changes context less often.',
    'Before planning everything, identify the next concrete step.',
    'If a task takes less than two minutes, close it or put it in the right place immediately.',
    'Treat breaks as part of the work: returning clear matters more than staring at the screen.',
    'Give small tasks a deadline too: undefined time tends to expand.',
    'Write distractions outside your head, then return to the active work block.',
    'Leave space between two important commitments: recovery protects quality.',
    'Measure progress by completed tasks, not by hours spent looking at the list.',
    'When a project feels huge, create a column only for the first phase.',
    'If you have postponed something for days, reduce it to a ten-minute version.',
    'Check notifications in planned windows, not every time they call.',
    'Prepare tomorrow task at the end of today: starting becomes lighter.',
    'Use colors and labels to separate urgency, energy required, and area of life.',
    'Keep a short list for the present and a separate list for future ideas.',
    'Complete one cycle before opening three new ones: clarity grows with closure.',
    'Review weekly data to understand where your rhythm actually works.',
    'Celebrate micro-progress: it is what keeps continuity alive.',
  ],
}

function StatsDashboard({ locale, onBoardChange, onPeriodChange, period, projects = [], selectedBoard = 'all', stats, t }) {
  const [adviceIndex, setAdviceIndex] = useState(() => Math.floor(Math.random() * productivityAdvice.it.length))
  const adviceList = productivityAdvice[locale] ?? productivityAdvice.it
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAdviceIndex((current) => (current + 1 + Math.floor(Math.random() * (adviceList.length - 1))) % adviceList.length)
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [adviceList.length])

  return (
    <section className="stats-dashboard">
      <div className="stats-dashboard__controls">
        <label className="stats-dashboard__board-select">
          <span>{t('profile.board')}</span>
          <select value={selectedBoard} onChange={(event) => onBoardChange(event.target.value)}>
            <option value="all">{t('profile.allBoards')}</option>
            <option value="daily">{t('profile.dailyBoard')}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <div className="stats-dashboard__period" role="group" aria-label={t('profile.period')}>
          {periodOptions.map((option) => (
            <button className={period === option ? 'active' : ''} type="button" key={option} onClick={() => onPeriodChange(option)}>
              {t(`profile.period.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-dashboard__hero">
        <p className="eyebrow">{t('profile.analysis')}</p>
        <h2>{t('profile.periodSummary')}</h2>
        <p>{stats?.range?.starts_at} · {stats?.range?.ends_at}</p>
      </div>

      <div className="stats-dashboard__grid">
        <article className="stats-card stats-card--kanban">
          <div className="stats-card__heading">
            <p className="eyebrow">Kanban</p>
            <h3>{kanbanMessage ?? t('profile.loadingStats')}</h3>
          </div>
          <strong className="stats-card__metric">{kanban.completion_rate ?? 0}%</strong>
          <span>{t('profile.completionRate')}</span>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={kanbanCompletion} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84}>
                {kanbanCompletion.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="stats-pills">
            <span>{t('profile.total')}: <strong>{kanban.total_activities ?? 0}</strong></span>
            <span>{t('profile.completed')}: <strong>{kanban.completed_activities ?? 0}</strong></span>
          </div>
        </article>

        <article className="stats-card stats-card--diary">
          <div className="stats-card__heading">
            <p className="eyebrow">{t('nav.diary')}</p>
            <h3>{diaryMessage ?? t('profile.loadingStats')}</h3>
          </div>
          <strong className="stats-card__metric">{diary.interactions ?? 0}</strong>
          <span>{t('profile.diaryInteractions')}</span>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={diaryBreakdown} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84}>
                {diaryBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="stats-pills">
            <span>{t('profile.writingDays')}: <strong>{diary.writing_days ?? 0}</strong></span>
            <span>{t('profile.publicDiary')}: <strong>{diary.public_notes ?? 0}</strong></span>
            <span>{t('profile.secretDiary')}: <strong>{diary.secret_notes ?? 0}</strong></span>
          </div>
        </article>

        <article className="stats-card stats-card--wide">
          <div className="stats-card__heading">
            <p className="eyebrow">{t('profile.dailyTrend')}</p>
            <h3>{t('profile.kanbanTrend')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={kanban.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString(locale === 'en' ? 'en-US' : 'it-IT', { day: '2-digit', month: 'short' })} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completed" name={t('profile.completed')} fill="#8fb879" />
              <Bar dataKey="total" name={t('profile.total')} fill="#c9b489" />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="stats-card stats-card--wide">
          <div className="stats-card__heading">
            <p className="eyebrow">{t('profile.diaryTrend')}</p>
            <h3>{t('profile.diaryTrendTitle')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={diary.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString(locale === 'en' ? 'en-US' : 'it-IT', { day: '2-digit', month: 'short' })} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="public" name={t('profile.publicDiary')} fill="#d7a87c" />
              <Bar dataKey="secret" name={t('profile.secretDiary')} fill="#9aa6c2" />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="stats-card stats-card--advice stats-card--wide">
          <div className="stats-card__heading">
            <p className="eyebrow">{t('analysis.adviceEyebrow')}</p>
            <h3>{t('analysis.adviceTitle')}</h3>
          </div>
          <p>{adviceList[adviceIndex % adviceList.length]}</p>
        </article>
      </div>
    </section>
  )
}

export default StatsDashboard
