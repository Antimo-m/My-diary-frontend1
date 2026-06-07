import { useState } from 'react'
import { FiBriefcase, FiCalendar, FiCheck, FiEdit3, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import './KanbanHub.css'

function KanbanHub({ onCreateProject, onDeleteProject, onEditProject, onOpenDaily, onOpenProject, projectForm, projects, setProjectForm, t }) {
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const submitProject = async (event) => {
    await onCreateProject(event)
    setIsCreatingProject(false)
  }

  return (
    <div className="kanban-hub">
      <button className="kanban-hub-card kanban-hub-card--daily" type="button" onClick={onOpenDaily}>
        <FiCalendar aria-hidden="true" />
        <span>
          <strong>{t('kanban.dailyTitle')}</strong>
          <small>{t('kanban.dailySubtitle')}</small>
        </span>
      </button>

      <section className={`kanban-hub-card kanban-hub-card--project ${isCreatingProject ? 'is-creating' : ''}`}>
        <button className="kanban-hub-card__trigger" type="button" onClick={() => setIsCreatingProject(true)}>
          <FiBriefcase aria-hidden="true" />
          <span>
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

      <section className="kanban-hub-projects">
        <h2>{t('kanban.customProjects')}</h2>
        <div className="kanban-hub-projects__grid">
          {projects.length ? projects.map((project) => (
            <article className="kanban-hub-project" key={project.id}>
              <button className="kanban-hub-project__open" type="button" onClick={() => onOpenProject(project.id)}>
                <FiBriefcase aria-hidden="true" />
                <span>{project.name}</span>
                <small>{project.tasks_count ?? 0}</small>
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
          )) : <p>{t('kanban.noProjects')}</p>}
        </div>
      </section>
    </div>
  )
}

export default KanbanHub
