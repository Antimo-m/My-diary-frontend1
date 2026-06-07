import { useDraggable } from '@dnd-kit/core'
import { FiCalendar, FiCheck, FiMove } from 'react-icons/fi'
import { useI18n } from '../i18n/useI18n'
import './ActivityCard.css'

function ActivityLabel({ label }) {
  return (
    <span className="label-pill" style={{ '--label-color': label.color }}>
      <span className="label-dot" aria-hidden="true" />
      <span>{label.name}</span>
    </span>
  )
}

function ActivityCard({ column, onOpen, onToggleComplete, task }) {
  const { localeTag, t, timeZone } = useI18n()
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: `task-${task.id}`,
    data: { columnId: column.id, task },
  })

  return (
    <article
      className={`activity-card ${isDragging ? 'is-dragging' : ''} ${task.is_completed ? 'is-completed' : ''}`}
      ref={setNodeRef}
      style={{
        '--task-color': task.color ?? column.color,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
    >
      <button className="activity-card__drag" type="button" aria-label={`Trascina ${task.title}`} {...attributes} {...listeners}>
        <FiMove aria-hidden="true" />
      </button>
      <button className="activity-card__open" type="button" onClick={() => onOpen(task)} aria-label={`Apri dettagli ${task.title}`}>
        <h3>{task.title}</h3>
        {task.due_date ? (
          <span className="task-deadline" title={t('kanban.due')}>
            <FiCalendar aria-hidden="true" />
            {t('kanban.due')} {new Date(task.due_date).toLocaleDateString(localeTag, { timeZone })}
          </span>
        ) : null}
        {task.reminder_sent_at ? (
          <span className="task-reminder-status task-reminder-status--sent">{t('kanban.emailSent')}</span>
        ) : task.reminder_at ? (
          <span className="task-reminder-status">{t('kanban.emailScheduled')}</span>
        ) : null}
        <div className="task-card-labels">
          {task.labels.map((label) => (
            <ActivityLabel label={label} key={`${task.id}-${label.id}`} />
          ))}
        </div>
      </button>
      <button
        className="activity-card__check"
        type="button"
        onClick={() => onToggleComplete(task)}
        aria-label={task.is_completed ? t('kanban.reopenTask') : t('kanban.completeTask')}
        aria-pressed={task.is_completed}
      >
        <FiCheck aria-hidden="true" />
      </button>
    </article>
  )
}

export default ActivityCard
