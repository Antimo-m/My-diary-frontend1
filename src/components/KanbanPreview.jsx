import { FiPlus } from 'react-icons/fi'
import './KanbanPreview.css'

const columns = [
  { title: 'Da fare', color: '#00a7c8' },
  { title: 'In corso', color: '#ff6b4a' },
  { title: 'Completato', color: '#00a884' },
]

function KanbanPreview({ tasks = [] }) {
  const filledTasks = tasks.length ? tasks : []

  return (
    <div className="kanban-board" aria-label="Anteprima Kanban">
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
                <span>Nessuna attivita</span>
                <button className="inline-plus-button" type="button" aria-label="Aggiungi attivita"><FiPlus aria-hidden="true" /></button>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

export default KanbanPreview
