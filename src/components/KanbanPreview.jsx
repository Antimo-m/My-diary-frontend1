import { FiPlus } from 'react-icons/fi'
import { useI18n } from '../i18n/useI18n'
import './KanbanPreview.css'

function KanbanPreview({ tasks = [] }) {
  const { t } = useI18n()
  const columns = [
    { title: t('kanban.todo'), color: '#d6a43a' },
    { title: t('kanban.doing'), color: '#a87624' },
    { title: t('kanban.done'), color: '#00a884' },
  ]
  const filledTasks = tasks.length ? tasks : []

  return (
    <div className="kanban-board" aria-label={t('kanban.preview')}>
      {columns.map((column, index) => (
        <section className="kanban-column" style={{ '--column-color': column.color }} key={column.title}>
          <header className="kanban-column-header">
            <h2>{column.title}</h2>
            <span className="kanban-count">{index === 0 ? filledTasks.length : index}</span>
          </header>

          <div className="kanban-dropzone">
            {index === 0 && filledTasks.length ? (
              filledTasks.map((task) => (
                <article className="task-card" style={{ '--task-color': task.color }} key={task.id}>
                  <div className="task-card-grip" aria-hidden="true">::</div>
                  <div className="task-card-content">
                    <h3>{task.title}</h3>
                    {task.description ? <p>{task.description}</p> : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="kanban-empty">
                <span>{t('kanban.noActivities')}</span>
                <button className="inline-plus-button" type="button" aria-label={t('kanban.addTask')}><FiPlus aria-hidden="true" /></button>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

export default KanbanPreview
