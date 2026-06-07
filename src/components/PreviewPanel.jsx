import { textPreview } from '../utils/textPreview'
import { useI18n } from '../i18n/useI18n'
import './PreviewPanel.css'

function PreviewPanel({ overview }) {
  const { t } = useI18n()
  const columns = overview.today_columns ?? []
  const recentNote = overview.recent_notes?.[0] ?? null
  const hasTasks = columns.some((column) => column.tasks?.length)

  return (
    <section className="preview-panel elevated-panel" aria-label="Diary and Kanban preview">
      <div className="preview-panel__header">
        <span>{t('home.today')}</span>
        <span className="date-badge">{overview.app?.formatted_today}</span>
      </div>

      {recentNote ? (
        <article className="preview-note">
          <span className="preview-note__label">{t('home.note')}</span>
          <h2>{recentNote.title}</h2>
          <p>{textPreview(recentNote.excerpt || recentNote.body, 155)}</p>
        </article>
      ) : null}

      <div className="mini-kanban-preview">
        {columns.length ? (
          columns.map((column) => (
            <section className="mini-column" style={{ '--column-color': column.color }} key={column.id}>
              <header>
                <span>{column.title}</span>
                <strong>{column.tasks?.length ?? 0}</strong>
              </header>
              <div className="mini-task-list">
                {column.tasks?.length ? (
                  column.tasks.slice(0, 3).map((task) => (
                    <article className="mini-task" style={{ '--task-color': task.color ?? column.color }} key={task.id}>
                      <h3>{task.title}</h3>
                      {task.due_time ? <span>{task.due_time}</span> : null}
                    </article>
                  ))
                ) : (
                  <p>{t('home.emptyTasks')}</p>
                )}
              </div>
            </section>
          ))
        ) : (
          <div className="preview-empty-state">{t('home.emptyTasks')}</div>
        )}
      </div>

      {columns.length && !hasTasks ? (
        <div className="preview-empty-state">{t('home.emptyTasks')}</div>
      ) : null}
    </section>
  )
}

export default PreviewPanel
