import { useDroppable } from '@dnd-kit/core'
import { FiEdit3, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useI18n } from '../i18n/useI18n'
import ActivityCard from './ActivityCard'
import IconButton from './ui/IconButton'

export function LabelPill({ action, label }) {
  return (
    <span className="label-pill" style={{ '--label-color': label.color }}>
      <span className="label-dot" aria-hidden="true" />
      <span>{label.name}</span>
      {action}
    </span>
  )
}

export function KanbanColumn({ column, onDeleteColumn, onEditColumn, onOpenTaskDetail, onOpenTaskForm, onToggleTaskComplete }) {
  const { t } = useI18n()
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.id}`,
    data: { columnId: column.id },
  })

  return (
    <section className={`kanban-column ${isOver ? 'is-over' : ''}`} data-column-id={column.id} ref={setNodeRef} style={{ '--column-color': column.color }}>
      <header className="kanban-column-header">
        <div>
          <h2>{column.title}</h2>
          <span className="kanban-count">{column.tasks.length}</span>
        </div>
        <div className="column-actions">
          <IconButton variant="edit" onClick={() => onEditColumn(column)} label={t('kanban.saveColumn')}><FiEdit3 /></IconButton>
          <IconButton variant="danger" onClick={() => onDeleteColumn(column)} label={t('kanban.deleteColumn')}><FiTrash2 /></IconButton>
        </div>
      </header>

      <div className="kanban-dropzone">
        {column.tasks.length ? (
          column.tasks.map((task) => (
            <ActivityCard column={column} key={task.id} onOpen={onOpenTaskDetail} onToggleComplete={onToggleTaskComplete} task={task} />
          ))
        ) : (
          <div className="kanban-empty">{t('kanban.emptyColumn')}</div>
        )}

        <button className="add-task-in-column" type="button" onClick={() => onOpenTaskForm(column)} aria-label={t('task.create')} title={t('task.create')}>
          <FiPlus aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
