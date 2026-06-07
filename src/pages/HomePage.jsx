import { FiBarChart2, FiBookOpen, FiCalendar, FiGrid } from 'react-icons/fi'
import ProductWalkthrough from '../components/ProductWalkthrough'
import useHomeOverview from '../hooks/useHomeOverview'
import { useI18n } from '../i18n/useI18n'
import './HomePage.css'

function HomePage({ onNavigate }) {
  const { overview, status } = useHomeOverview()
  const { t } = useI18n()
  const recentProjects = overview.recent_projects ?? []
  const openProject = (projectId) => {
    window.history.pushState({}, '', `/kanban/project/${projectId}`)
    onNavigate('kanban')
  }

  return (
    <section className="home-page page-container">
      <header className="home-hero">
        <p className="eyebrow">{t('home.type')}</p>
        <h1>{t('home.tagline')}</h1>
        <p className="lead">{t('home.description')}</p>

        <div className="home-page__actions">
          <button className="btn btn-primary" type="button" onClick={() => onNavigate('diary')}>
            {t('home.diaryCta')}
          </button>
          <button className="btn btn-outline" type="button" onClick={() => onNavigate('kanban')}>
            {t('home.kanbanCta')}
          </button>
        </div>

        <div className="home-page__stats" aria-label={t('home.stats')}>
          <div>
            <strong>{overview.stats?.notes ?? 0}</strong>
            <span>{t('home.notes')}</span>
          </div>
          <div>
            <strong>{overview.stats?.today_tasks ?? 0}</strong>
            <span>{t('home.todayTasks')}</span>
          </div>
          <div>
            <strong>{overview.stats?.projects ?? 0}</strong>
            <span>{t('home.projects')}</span>
          </div>
        </div>

        {status === 'fallback' ? (
          <p className="api-note">{t('home.fallback')}</p>
        ) : null}
      </header>

      <ProductWalkthrough t={t} />

      <section className="home-value-grid" aria-label={t('home.valueTitle')}>
        <article>
          <FiBookOpen />
          <h2>{t('home.value.diaryTitle')}</h2>
          <p>{t('home.value.diaryCopy')}</p>
        </article>
        <article>
          <FiGrid />
          <h2>{t('home.value.kanbanTitle')}</h2>
          <p>{t('home.value.kanbanCopy')}</p>
        </article>
        <article>
          <FiBarChart2 />
          <h2>{t('home.value.analysisTitle')}</h2>
          <p>{t('home.value.analysisCopy')}</p>
        </article>
      </section>

      <section className="home-diary-hub" aria-label={t('home.hubTitle')}>
        <div className="home-hub-card home-hub-card--wide">
          <p className="eyebrow">{t('home.hubTitle')}</p>
          <h2>{t('home.hubSubtitle')}</h2>
          <div className="home-hub-actions">
            <button className="btn btn-primary" type="button" onClick={() => onNavigate('diary')}>
              {t('home.newDiaryShortcut')}
            </button>
            <button className="btn btn-kanban-shortcut" type="button" onClick={() => onNavigate('kanban')}>
              {t('home.dailyShortcut')}
            </button>
          </div>
        </div>

        <div className="home-hub-card">
          <FiCalendar />
          <h3>{t('home.suggestionTitle')}</h3>
          <p>{t('home.suggestionCopy')}</p>
        </div>

        <div className="home-hub-card home-project-shortcuts">
          <h3>{t('home.recentBoards')}</h3>
          {recentProjects.length ? (
            <div className="home-project-shortcuts__list">
              {recentProjects.map((project) => (
                <button key={project.id} type="button" onClick={() => openProject(project.id)}>
                  <span>{project.icon?.slice(0, 2)?.toUpperCase() || 'PR'}</span>
                  <strong>{project.name}</strong>
                  <small>{project.tasks_count ?? 0} {t('home.tasks')}</small>
                </button>
              ))}
            </div>
          ) : (
            <p>{t('home.noRecentBoards')}</p>
          )}
        </div>
      </section>
    </section>
  )
}

export default HomePage
