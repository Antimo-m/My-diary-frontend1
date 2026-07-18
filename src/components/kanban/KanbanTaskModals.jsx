import { FiCalendar, FiEdit3, FiTrash2, FiX } from 'react-icons/fi'
import { LabelPill } from '../KanbanBoardParts'
import KanbanTaskForm from '../KanbanTaskForm'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import IconButton from '../ui/IconButton'
import { defaultPaletteColor } from '../../data/colors'
import { useI18n } from '../../i18n/useI18n'

function clockPart(value) {
  return value ? value.slice(0, 5) : ''
}

function localDateTimeLabel(value, localeTag) {
  if (!value) {
    return ''
  }

  const date = value.slice(0, 10)
  const time = value.slice(11, 16)

  return `${new Date(`${date}T00:00:00`).toLocaleDateString(localeTag)}${time ? `, ${time}` : ''}`
}

function KanbanTaskModals({
  activeTaskColumnId,
  board,
  closeTaskForm,
  editingTask,
  loading,
  onConfirmDeleteTask,
  onEditTaskFromDetail,
  onSubmitTask,
  onToggleTaskLabel,
  setTaskDeleteTarget,
  setTaskDetailTarget,
  setTaskForm,
  taskDeleteTarget,
  taskDetailTarget,
  taskForm,
  updateTaskField,
}) {
  const { localeTag, t, timeZone } = useI18n()

  return (
    <>
      {activeTaskColumnId ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && closeTaskForm()}>
          <KanbanTaskForm
            board={board}
            closeTaskForm={closeTaskForm}
            editingTask={editingTask}
            loading={loading}
            onSubmitTask={onSubmitTask}
            onToggleTaskLabel={onToggleTaskLabel}
            setTaskForm={setTaskForm}
            taskForm={taskForm}
            updateTaskField={updateTaskField}
          />
        </Dialog>
      ) : null}

      {taskDetailTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setTaskDetailTarget(null)}>
          <div className="task-detail-modal" style={{ '--task-color': taskDetailTarget.color ?? defaultPaletteColor }}>
            <div className="task-detail-modal__header">
              <Dialog.Title asChild><h2>{taskDetailTarget.title}</h2></Dialog.Title>
            </div>
            {taskDetailTarget.description ? <p className="task-detail-modal__description">{taskDetailTarget.description}</p> : null}
            <div className="task-detail-modal__meta">
              {taskDetailTarget.due_date ? (
                <span className="task-deadline">
                  <FiCalendar aria-hidden="true" />
                  {t('kanban.due')} {new Date(taskDetailTarget.due_date).toLocaleDateString(localeTag, { timeZone })}
                  {taskDetailTarget.due_time ? `, ${clockPart(taskDetailTarget.due_time)}` : ''}
                </span>
              ) : <span>{t('kanban.noDue')}</span>}
              {taskDetailTarget.custom_reminder_at ? <span>{t('kanban.reminder')}: {localDateTimeLabel(taskDetailTarget.custom_reminder_at, localeTag)}</span> : null}
              {taskDetailTarget.reminder_sent_at ? <span>{t('kanban.emailSent')}: {localDateTimeLabel(taskDetailTarget.reminder_sent_at, localeTag)}</span> : null}
            </div>
            {taskDetailTarget.labels.length ? (
              <div className="task-card-labels">
                {taskDetailTarget.labels.map((label) => (
                  <LabelPill label={label} key={`detail-${taskDetailTarget.id}-${label.id}`} />
                ))}
              </div>
            ) : null}
            <div className="dialog-actions">
              <IconButton variant="edit" type="button" onClick={() => onEditTaskFromDetail(taskDetailTarget)} label={t('task.update')}><FiEdit3 /></IconButton>
              <IconButton variant="danger" type="button" onClick={() => setTaskDeleteTarget(taskDetailTarget)} label={t('kanban.deleteActivity')}><FiTrash2 /></IconButton>
              <IconButton variant="gold" type="button" onClick={() => setTaskDetailTarget(null)} label={t('common.close')}><FiX /></IconButton>
            </div>
          </div>
        </Dialog>
      ) : null}

      {taskDeleteTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setTaskDeleteTarget(null)}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiTrash2 /></div>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.deleteTaskTitle')} “{taskDeleteTarget.title}”?</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('kanban.deleteTaskCopy')}</p></Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" disabled={loading} onClick={onConfirmDeleteTask}><FiTrash2 aria-hidden="true" />{t('kanban.delete')}</Button>
            <Button variant="cancel" onClick={() => setTaskDeleteTarget(null)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}
    </>
  )
}

export default KanbanTaskModals
