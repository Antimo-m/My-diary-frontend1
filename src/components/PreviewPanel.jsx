import './PreviewPanel.css'

function PreviewPanel({ overview }) {
  const columns = overview.today_columns ?? []
  const recentNote = overview.recent_notes?.[0] ?? null
  const hasTasks = columns.some((column) => column.tasks?.length)

  return (
    <section className="preview-panel elevated-panel" aria-label="Anteprima diario e Kanban">
      <div className="preview-panel__header">
        <span>Oggi</span>
        <span className="date-badge">{overview.app?.formatted_today}</span>
      </div>

      {recentNote ? (
        <article className="preview-note">
          <span className="preview-note__label">Nota</span>
          <h2>{recentNote.title}</h2>
          <p>{recentNote.excerpt}</p>
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
                  <p>Nessuna attivita</p>
                )}
              </div>
            </section>
          ))
        ) : (
          <div className="preview-empty-state">Non hai attivita in programma per oggi.</div>
        )}
      </div>

      {columns.length && !hasTasks ? (
        <div className="preview-empty-state">Non hai attivita in programma per oggi.</div>
      ) : null}
    </section>
  )
}

export default PreviewPanel
