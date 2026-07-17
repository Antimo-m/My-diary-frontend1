import { useState } from 'react'
import { FiArrowRight, FiCalendar, FiCheck, FiCheckSquare, FiEdit3, FiFolder, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import HomeFeatureVideo from './HomeFeatureVideo'
import kanbanDesktopVideo from '../assets/kanban-desktop.webm'
import kanbanDesktopVideoEn from '../assets/kanban-desktop-en.webm'
import kanbanMobileVideo from '../assets/kanban-mobile.webm'
import kanbanMobileVideoEn from '../assets/kanban-mobile-en.webm'
import './KanbanHub.css'

function KanbanHub({ onCreateProject, onDeleteProject, onEditProject, onOpenDaily, onOpenProject, projectForm, projects, setProjectForm, t }) {
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const submitProject = async (event) => {
    await onCreateProject(event)
    setIsCreatingProject(false)
  }

  return (
    <div className="kanban-hub">
      <div className="kanban-hub-actions">
        <button className="kanban-hub-card kanban-hub-card--daily" type="button" onClick={onOpenDaily}>
          <span className="kanban-hub-card__icon"><FiCalendar aria-hidden="true" /></span>
          <span>
            <small className="kanban-hub-card__kicker">{t('kanban.daily')}</small>
            <strong>{t('kanban.dailyTitle')}</strong>
            <small>{t('kanban.dailySubtitle')}</small>
          </span>
          <FiArrowRight className="kanban-hub-card__arrow" aria-hidden="true" />
        </button>

        <section className={`kanban-hub-card kanban-hub-card--project ${isCreatingProject ? 'is-creating' : ''}`}>
          <button className="kanban-hub-card__trigger" type="button" onClick={() => setIsCreatingProject(true)}>
            <span className="kanban-hub-card__icon"><FiFolder aria-hidden="true" /></span>
            <span>
              <small className="kanban-hub-card__kicker">{t('kanban.project')}</small>
              <strong>{t('kanban.createProject')}</strong>
              <small>{t('kanban.createProjectHint')}</small>
            </span>
            <span className="kanban-hub-card__plus" aria-hidden="true"><FiPlus /></span>
          </button>
          {isCreatingProject ? (
            <form className="kanban-hub-project-form" onSubmit={submitProject}>
              <label>
                <span>{t('kanban.name')}</span>
                <input
                  value={projectForm.name}
                  onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder={t('kanban.projectNamePlaceholder')}
                  autoFocus
                  required
                />
              </label>
              <button className="icon-action icon-action--confirm" type="submit" aria-label={t('kanban.createProject')}>
                <FiCheck aria-hidden="true" />
              </button>
              <button className="icon-action icon-action--danger" type="button" onClick={() => setIsCreatingProject(false)} aria-label={t('common.cancel')}>
                <FiX aria-hidden="true" />
              </button>
            </form>
          ) : null}
        </section>
      </div>

      <HomeFeatureVideo
        desktopSrc={kanbanDesktopVideo}
        desktopSrcEn={kanbanDesktopVideoEn}
        label={t('home.kanbanVideoLabel')}
        mobileSrc={kanbanMobileVideo}
        mobileSrcEn={kanbanMobileVideoEn}
        playbackRate={0.76}
        t={t}
        tone="kanban"
      />

      <section className="kanban-hub-projects">
        <header className="kanban-hub-projects__header">
          <span className="kanban-hub-projects__icon"><FiFolder aria-hidden="true" /></span>
          <div>
            <h2>{t('kanban.customProjects')}</h2>
            <p>{t('kanban.customProjectsCopy')}</p>
          </div>
          <span className="kanban-hub-projects__count" aria-label={`${projects.length} ${t('kanban.projectsCountLabel')}`}>
            <strong>{projects.length}</strong>
            <small>{t('kanban.projectsCountLabel')}</small>
          </span>
        </header>
        <div className="kanban-hub-projects__grid">
          {projects.length ? projects.map((project) => (
            <article className="kanban-hub-project" key={project.id}>
              <button className="kanban-hub-project__open" type="button" onClick={() => onOpenProject(project)}>
                <FiFolder aria-hidden="true" />
                <span className="kanban-hub-project__name">{project.name}</span>
                <small className="kanban-hub-project__task-count">
                  <FiCheckSquare aria-hidden="true" />
                  <strong>{project.tasks_count ?? 0}</strong>
                </small>
              </button>
              <div className="kanban-hub-project__actions">
                <button type="button" onClick={() => onEditProject(project)} aria-label={`${t('kanban.editProject')} ${project.name}`}>
                  <FiEdit3 aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onDeleteProject(project)} aria-label={`${t('kanban.deleteProject')} ${project.name}`}>
                  <FiTrash2 aria-hidden="true" />
                </button>
              </div>
            </article>
          )) : (
            <div className="kanban-hub-projects__empty">
              <FiFolder aria-hidden="true" />
              <strong>{t('kanban.noProjects')}</strong>
              <p>{t('kanban.noProjectsCopy')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default KanbanHub
