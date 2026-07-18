import { FiCalendar, FiCheck, FiX } from 'react-icons/fi'
import ColorPaletteInput from './ColorPaletteInput'
import CustomSelect from './CustomSelect'
import DatePicker from './ui/DatePicker'
import Dialog from './ui/Dialog'
import IconButton from './ui/IconButton'
import TimePicker from './ui/TimePicker'
import { useI18n } from '../i18n/useI18n'

function datePart(value) {
  return value ? value.slice(0, 10) : ''
}

function timePart(value) {
  return value ? value.slice(11, 16) : ''
}

function combineDateTime(date, time) {
  if (!date) {
    return ''
  }

  return `${date}T${time || '09:00'}`
}

function KanbanTaskForm({
  board,
  closeTaskForm,
  editingTask,
  loading,
  onSubmitTask,
  onToggleTaskLabel,
  setTaskForm,
  taskForm,
  updateTaskField,
}) {
  const { t } = useI18n()
  const reminderOptions = [
    { value: 'none', label: t('task.noReminder') },
    { value: 'custom', label: t('task.selectReminder') },
  ]
  const selectedLabelIds = new Set(taskForm.label_ids)

  return (
    <form className="column-task-form task-composer" onSubmit={onSubmitTask}>
      <header className="task-composer__header">
        <Dialog.Title asChild><strong>{editingTask ? t('task.updateDetails') : t('task.newDetails')}</strong></Dialog.Title>
      </header>

      <section className="task-composer__section">
        <label className="task-field task-field--title">
          <span>{t('task.title')}</span>
          <input name="title" value={taskForm.title} onChange={updateTaskField} placeholder={t('task.titlePlaceholder')} required />
        </label>
        <label className="task-field">
          <span>{t('task.notes')}</span>
          <textarea name="description" value={taskForm.description} onChange={updateTaskField} placeholder={t('task.details')} rows="4" />
        </label>
      </section>

      <section className="task-composer__section task-schedule-section">
        <div className="task-section-title">
          <FiCalendar aria-hidden="true" />
          <span>{t('task.schedule')}</span>
        </div>
        <div className="task-schedule-grid">
          <label className="deadline-field">
            <span>{t('task.deadlineDate')}</span>
            <DatePicker label={t('task.deadlineDate')} value={taskForm.due_date} onChange={(value) => setTaskForm((current) => ({ ...current, due_date: value }))} />
          </label>
          <label className="deadline-field">
            <span>{t('task.deadlineTime')}</span>
            <TimePicker label={t('task.deadlineTime')} value={taskForm.due_time} onChange={(value) => setTaskForm((current) => ({ ...current, due_time: value }))} />
          </label>
        </div>
        <div className="task-reminder-group">
          <CustomSelect
            className="deadline-field"
            label={t('task.emailReminder')}
            name="reminder_option"
            onChange={updateTaskField}
            options={reminderOptions}
            value={taskForm.reminder_option}
          />
          {taskForm.reminder_option === 'custom' ? (
            <div className="reminder-datetime-row">
              <label className="deadline-field">
                <span>{t('task.reminderDate')}</span>
                <DatePicker
                  label={t('task.reminderDate')}
                  value={datePart(taskForm.custom_reminder_at)}
                  onChange={(value) => setTaskForm((current) => ({
                    ...current,
                    custom_reminder_at: combineDateTime(value, timePart(current.custom_reminder_at)),
                  }))}
                />
              </label>
              <label className="deadline-field">
                <span>{t('task.reminderTime')}</span>
                <TimePicker
                  label={t('task.reminderTime')}
                  value={timePart(taskForm.custom_reminder_at)}
                  onChange={(value) => setTaskForm((current) => ({
                    ...current,
                    custom_reminder_at: combineDateTime(datePart(current.custom_reminder_at), value),
                  }))}
                />
              </label>
              <small>{t('task.reminderHint')}</small>
            </div>
          ) : null}
        </div>
      </section>

      <section className="task-composer__section">
        <ColorPaletteInput label={t('task.color')} value={taskForm.color} onChange={(value) => setTaskForm((current) => ({ ...current, color: value }))} />
        {board.labels.length ? (
          <div className="task-editor__labels" aria-label={t('task.labels')}>
            {board.labels.map((label) => (
              <label className="label-check" style={{ '--label-color': label.color }} key={`task-label-${label.id}`}>
                <input
                  type="checkbox"
                  aria-label={label.name}
                  checked={selectedLabelIds.has(label.id)}
                  onChange={() => onToggleTaskLabel(label.id)}
                />
                <span className="label-pill">
                  <span className="label-dot" aria-hidden="true" />
                  <span>{label.name}</span>
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </section>

      <div className="task-editor__actions">
        <IconButton variant="confirm" type="submit" disabled={loading} label={editingTask ? t('task.update') : t('kanban.addTask')}>
          <FiCheck />
        </IconButton>
        <IconButton variant="danger" type="button" onClick={closeTaskForm} label={t('common.cancel')}>
          <FiX />
        </IconButton>
      </div>
    </form>
  )
}

export default KanbanTaskForm
