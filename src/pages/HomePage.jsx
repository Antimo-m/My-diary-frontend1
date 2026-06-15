import { FiArrowRight, FiBarChart2, FiBookOpen, FiCalendar, FiFolder, FiGrid, FiPlus } from 'react-icons/fi'
import diaryDesktopVideo from '../assets/diary-desktop.webm'
import diaryMobileVideo from '../assets/diary-mobile.webm'
import kanbanDesktopVideo from '../assets/kanban-desktop.webm'
import kanbanMobileVideo from '../assets/kanban-mobile.webm'
import HomeFeatureVideo from '../components/HomeFeatureVideo'
import useHomeOverview from '../hooks/useHomeOverview'
import { useI18n } from '../i18n/useI18n'
import './HomePage.css'

function HomePage({ onNavigate }) {
  const { overview, status } = useHomeOverview()
  const { t } = useI18n()
  const recentProjects = overview.recent_projects ?? []
  const openProject = (project) => {
    const identifier = project.route_identifier ?? project.slug ?? project.id
    onNavigate('kanban', `/kanban/project/${encodeURIComponent(identifier)}`)
  }

  return (
    <section className="home-page page-container">
      <header className="home-hero">
        <p className="eyebrow">{t('home.type')}</p>
        <h1>{t('home.tagline')}</h1>
        <p className="lead">{t('home.description')}</p>

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

        {status === 'fallback' ? <p className="api-note">{t('home.fallback')}</p> : null}
      </header>

      <section className="home-product-zone home-product-zone--diary" aria-labelledby="home-diary-title">
        <header className="home-zone-header">
          <span className="home-zone-header__icon"><FiBookOpen aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">{t('home.diarySectionEyebrow')}</p>
            <h2 id="home-diary-title">{t('home.diarySectionTitle')}</h2>
            <p>{t('home.diarySectionCopy')}</p>
          </div>
          <div className="home-zone-header__actions">
            <button className="btn btn-primary" type="button" onClick={() => onNavigate('diary')}>
              <FiPlus aria-hidden="true" />
              {t('home.newDiaryShortcut')}
            </button>
            <button className="btn btn-outline" type="button" onClick={() => onNavigate('diary')}>
              {t('home.diaryCta')}
              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
        </header>

        <HomeFeatureVideo
          desktopSrc={diaryDesktopVideo}
          label={t('home.diaryVideoLabel')}
          mobileSrc={diaryMobileVideo}
          playbackRate={0.72}
          t={t}
          tone="diary"
        />
      </section>

      <section className="home-product-zone home-product-zone--kanban" aria-labelledby="home-kanban-title">
        <header className="home-zone-header">
          <span className="home-zone-header__icon"><FiGrid aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">{t('home.kanbanSectionEyebrow')}</p>
            <h2 id="home-kanban-title">{t('home.kanbanSectionTitle')}</h2>
            <p>{t('home.kanbanSectionCopy')}</p>
          </div>
          <div className="home-zone-header__actions">
            <button
              className="btn btn-kanban-shortcut home-kanban-quick-button"
              type="button"
              onClick={() => onNavigate('kanban')}
              aria-label={t('home.dailyShortcut')}
              title={t('home.dailyShortcut')}
            >
              <FiCalendar aria-hidden="true" />
            </button>
            <button className="btn btn-outline" type="button" onClick={() => onNavigate('kanban')}>
              {t('home.kanbanCta')}
              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
        </header>

        <HomeFeatureVideo
          desktopSrc={kanbanDesktopVideo}
          label={t('home.kanbanVideoLabel')}
          mobileSrc={kanbanMobileVideo}
          playbackRate={0.76}
          t={t}
          tone="kanban"
        />

        <section className="home-custom-projects" aria-labelledby="home-custom-projects-title">
          <header>
            <span><FiFolder aria-hidden="true" /></span>
            <div>
              <p className="eyebrow">{t('home.projectAreaEyebrow')}</p>
              <h3 id="home-custom-projects-title">{t('kanban.customProjects')}</h3>
              <p>{t('home.projectAreaCopy')}</p>
            </div>
            <button className="btn btn-kanban-shortcut" type="button" onClick={() => onNavigate('kanban')}>
              <FiPlus aria-hidden="true" />
              {t('kanban.createProject')}
            </button>
          </header>

          {recentProjects.length ? (
            <div className="home-project-shortcuts__list">
              {recentProjects.map((project) => (
                <button key={project.id} type="button" onClick={() => openProject(project)}>
                  <span><FiFolder aria-hidden="true" /></span>
                  <strong>{project.name}</strong>
                  <small>{project.tasks_count ?? 0} {t('home.tasks')}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="home-custom-projects__empty">
              <FiFolder aria-hidden="true" />
              <strong>{t('home.noCustomProjectsTitle')}</strong>
              <p>{t('home.noRecentBoards')}</p>
            </div>
          )}
        </section>
      </section>

      <aside className="home-analysis-note">
        <FiBarChart2 aria-hidden="true" />
        <div>
          <h2>{t('home.value.analysisTitle')}</h2>
          <p>{t('home.value.analysisCopy')}</p>
        </div>
      </aside>
    </section>
  )
}

export default HomePage
