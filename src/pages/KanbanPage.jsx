import { DndContext, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiCalendar, FiCheck, FiEdit3, FiMove, FiPlus, FiRotateCcw, FiSearch, FiTrash2 } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import ColorPaletteInput from '../components/ColorPaletteInput'
import CustomDatePicker from '../components/CustomDatePicker'
import IconButton from '../components/IconButton'
import Modal from '../components/Modal'
import UserMessage from '../components/UserMessage'
import {
  createColumn,
  createLabel,
  createTask,
  deleteColumn,
  deleteLabel,
  deleteTask,
  getKanbanBoard,
  moveTask,
  updateColumn,
  updateLabel,
  updateTask,
} from '../services/kanbanApi'
import { getApiError } from '../utils/apiErrors'
import './KanbanPage.css'

const today = new Date().toISOString().slice(0, 10)
const emptyTaskForm = {
  title: '',
  description: '',
  due_date: '',
  due_time: '',
  reminder_option: 'none',
  custom_reminder_at: '',
  color: '#00a7c8',
  label_ids: [],
}
const reminderOptions = [
  { value: 'none', label: 'Nessun promemoria' },
  { value: 'custom', label: 'Scegli data e ora' },
]
const emptyColumnForm = { title: '', color: '#06b6d4' }
const emptyLabelForm = { name: '', color: '#00a7c8' }
const reminderAfterDueMessage = 'Il promemoria non puo essere successivo alla scadenza dell attivita.'
const reminderWithoutDueDateMessage = 'Imposta prima la scadenza dell attivita.'

function buildDueDateTime({ due_date, due_time }) {
  if (!due_date) {
    return null
  }

  return new Date(`${due_date}T${due_time || '23:59'}`)
}

function reminderValidationMessage(taskForm) {
  if (taskForm.reminder_option !== 'custom') {
    return ''
  }

  if (!taskForm.due_date) {
    return reminderWithoutDueDateMessage
  }

  if (!taskForm.custom_reminder_at) {
    return 'Scegli data e ora del promemoria.'
  }

  const reminderAt = new Date(taskForm.custom_reminder_at)
  const dueAt = buildDueDateTime(taskForm)

  return dueAt && reminderAt > dueAt ? reminderAfterDueMessage : ''
}

function LabelPill({ action, label }) {
  return (
    <span className="label-pill" style={{ '--label-color': label.color }}>
      <span className="label-dot" aria-hidden="true" />
      <span>{label.name}</span>
      {action}
    </span>
  )
}

function TaskCard({ column, onDelete, onEdit, task }) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: `task-${task.id}`,
    data: { columnId: column.id, task },
  })

  return (
    <article
      className={`task-card ${isDragging ? 'is-dragging' : ''}`}
      ref={setNodeRef}
      style={{
        '--task-color': task.color ?? column.color,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
    >
      <button className="task-drag-handle" type="button" aria-label={`Trascina ${task.title}`} {...attributes} {...listeners}>
        <FiMove aria-hidden="true" />
      </button>
      <div className="task-card-content">
        <h3>{task.title}</h3>
        {task.description ? <p>{task.description}</p> : null}
        {task.due_date ? (
          <span className="task-deadline" title="La data rappresenta la scadenza dell'attivita.">
            <FiCalendar aria-hidden="true" />
            Scadenza {new Date(task.due_date).toLocaleDateString('it-IT')}
          </span>
        ) : null}
        <div className="task-card-labels">
          {task.labels.map((label) => (
            <LabelPill label={label} key={`${task.id}-${label.id}`} />
          ))}
        </div>
      </div>
      <div className="task-card-actions">
        <button className="task-action task-action--edit" type="button" onClick={() => onEdit(column, task)} aria-label="Modifica attivita">
          <FiEdit3 aria-hidden="true" />
        </button>
        <button className="task-action task-action--danger" type="button" onClick={() => onDelete(task)} aria-label="Elimina attivita">
          <FiTrash2 aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

function KanbanColumn({ activeTaskColumnId, board, closeTaskForm, column, editingTask, loading, onDeleteColumn, onDeleteTask, onEditColumn, onEditTask, onOpenTaskForm, onSubmitTask, onToggleTaskLabel, taskForm, updateTaskField, setTaskForm }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.id}`,
    data: { columnId: column.id },
  })

  return (
    <section className={`kanban-column ${isOver ? 'is-over' : ''}`} ref={setNodeRef} style={{ '--column-color': column.color }}>
      <header className="kanban-column-header">
        <div>
          <h2>{column.title}</h2>
          <span className="kanban-count">{column.tasks.length}</span>
        </div>
        <div className="column-actions">
          <IconButton variant="edit" onClick={() => onEditColumn(column)} label="Modifica colonna"><FiEdit3 /></IconButton>
          <IconButton variant="danger" onClick={() => onDeleteColumn(column)} label="Elimina colonna"><FiTrash2 /></IconButton>
        </div>
      </header>

      <div className="kanban-dropzone">
        {column.tasks.length ? (
          column.tasks.map((task) => (
            <TaskCard column={column} key={task.id} onDelete={onDeleteTask} onEdit={onEditTask} task={task} />
          ))
        ) : (
          <div className="kanban-empty">Trascina qui una attivita oppure creane una nuova.</div>
        )}

        {activeTaskColumnId === column.id ? (
          <form className="column-task-form task-composer" onSubmit={onSubmitTask}>
            <header className="task-composer__header">
              <span className="eyebrow">{editingTask ? 'Modifica attivita' : 'Nuova attivita'}</span>
              <strong>{editingTask ? 'Aggiorna i dettagli' : 'Organizza un nuovo impegno'}</strong>
            </header>

            <section className="task-composer__section">
              <label className="task-field task-field--title">
                <span>Titolo</span>
                <input name="title" value={taskForm.title} onChange={updateTaskField} placeholder="Es. Preparare la riunione" required />
              </label>
              <label className="task-field">
                <span>Note</span>
                <textarea name="description" value={taskForm.description} onChange={updateTaskField} placeholder="Aggiungi dettagli utili, link o appunti veloci" rows="4" />
              </label>
            </section>

            <section className="task-composer__section">
              <div className="task-section-title">
                <FiCalendar aria-hidden="true" />
                <span>Scadenza e promemoria</span>
              </div>
              <div className="task-editor__row">
                <label className="deadline-field">
                  <span>Data scadenza</span>
                  <CustomDatePicker label="Scadenza attivita" value={taskForm.due_date} onChange={(value) => setTaskForm((current) => ({ ...current, due_date: value }))} />
                </label>
                <label className="deadline-field">
                  <span>Ora scadenza</span>
                  <input className="time-input" name="due_time" type="time" value={taskForm.due_time} onChange={updateTaskField} aria-label="Ora scadenza attivita" />
                </label>
              </div>
              <div className="task-editor__row task-editor__row--stacked">
                <label className="deadline-field">
                  <span>Promemoria email</span>
                  <select name="reminder_option" value={taskForm.reminder_option} onChange={updateTaskField}>
                    {reminderOptions.map((option) => (
                      <option value={option.value} key={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                {taskForm.reminder_option === 'custom' ? (
                  <label className="deadline-field">
                    <span>Data e ora promemoria</span>
                    <input className="datetime-input" name="custom_reminder_at" type="datetime-local" value={taskForm.custom_reminder_at} onChange={updateTaskField} required />
                    <small>Scegli un orario precedente alla scadenza dell attivita.</small>
                  </label>
                ) : null}
              </div>
            </section>

            <section className="task-composer__section">
              <ColorPaletteInput label="Colore attivita" value={taskForm.color} onChange={(value) => setTaskForm((current) => ({ ...current, color: value }))} />
              {board.labels.length ? (
                <div className="task-editor__labels" aria-label="Etichette attivita">
                  {board.labels.map((label) => (
                    <label className="label-check" style={{ '--label-color': label.color }} key={`task-label-${column.id}-${label.id}`}>
                      <input
                        type="checkbox"
                        checked={taskForm.label_ids.includes(label.id)}
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
              <button className="btn btn-primary" type="submit" disabled={loading}>
                <FiCheck aria-hidden="true" />
                {editingTask ? 'Aggiorna' : 'Aggiungi'}
              </button>
              <button className="btn btn-cancel" type="button" onClick={closeTaskForm}>Annulla</button>
            </div>
          </form>
        ) : (
          <button className="add-task-in-column" type="button" onClick={() => onOpenTaskForm(column)}>
            <FiPlus aria-hidden="true" />
            Aggiungi attivita
          </button>
        )}
      </div>
    </section>
  )
}

function KanbanPage({ authLoading, onLogin, onRegister, user }) {
  const [activeTaskColumnId, setActiveTaskColumnId] = useState(null)
  const [board, setBoard] = useState({ columns: [], labels: [], date: today })
  const [columnDeleteTarget, setColumnDeleteTarget] = useState(null)
  const [columnEditTarget, setColumnEditTarget] = useState(null)
  const [columnForm, setColumnForm] = useState(emptyColumnForm)
  const [date, setDate] = useState(today)
  const [editingTask, setEditingTask] = useState(null)
  const [error, setError] = useState('')
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false)
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false)
  const [labelDeleteTarget, setLabelDeleteTarget] = useState(null)
  const [labelEditTarget, setLabelEditTarget] = useState(null)
  const [labelForm, setLabelForm] = useState(emptyLabelForm)
  const [loading, setLoading] = useState(false)
  const [reminderModalMessage, setReminderModalMessage] = useState('')
  const [taskDeleteTarget, setTaskDeleteTarget] = useState(null)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 130, tolerance: 8 } }),
  )

  const loadBoard = async (nextDate = date) => {
    setLoading(true)
    setError('')

    try {
      setBoard(await getKanbanBoard(nextDate))
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a caricare la Kanban.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      void Promise.resolve().then(() => loadBoard())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (authLoading) {
    return <section className="page-container loading-state">Verifico la sessione...</section>
  }

  if (!user) {
    return (
      <section className="page-container">
        <AuthPanel onLogin={onLogin} onRegister={onRegister} />
      </section>
    )
  }

  const submitDate = async (event) => {
    event.preventDefault()
    await loadBoard(date)
  }

  const resetDate = async () => {
    setDate(today)
    await loadBoard(today)
  }

  const openCreateColumn = () => {
    setColumnEditTarget(null)
    setColumnForm(emptyColumnForm)
    setIsColumnModalOpen(true)
  }

  const openEditColumn = (column) => {
    setColumnEditTarget(column)
    setColumnForm({ title: column.title, color: column.color ?? '#06b6d4' })
    setIsColumnModalOpen(true)
  }

  const closeColumnModal = () => {
    setColumnEditTarget(null)
    setColumnForm(emptyColumnForm)
    setIsColumnModalOpen(false)
  }

  const submitColumn = async (event) => {
    event.preventDefault()
    setError('')

    try {
      if (columnEditTarget) {
        await updateColumn(columnEditTarget.id, columnForm)
      } else {
        await createColumn(columnForm)
      }

      closeColumnModal()
      await loadBoard()
    } catch (requestError) {
      setError(getApiError(requestError, columnEditTarget ? 'Non riesco ad aggiornare la colonna.' : 'Non riesco a creare la colonna.'))
    }
  }

  const confirmDeleteColumn = async () => {
    if (!columnDeleteTarget) {
      return
    }

    try {
      await deleteColumn(columnDeleteTarget.id)
      setColumnDeleteTarget(null)
      await loadBoard()
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a eliminare la colonna.'))
    }
  }

  const openTaskForm = (column, task = null) => {
    setActiveTaskColumnId(column.id)
    setEditingTask(task)
    setTaskForm(task ? {
      title: task.title ?? '',
      description: task.description ?? '',
      due_date: task.due_date ?? '',
      due_time: task.due_time ?? '',
      reminder_option: task.reminder_option ?? 'none',
      custom_reminder_at: task.custom_reminder_at ?? '',
      color: task.color ?? column.color ?? '#00a7c8',
      label_ids: task.labels?.map((label) => label.id) ?? [],
    } : {
      ...emptyTaskForm,
      due_date: date,
      color: column.color ?? '#00a7c8',
    })
  }

  const closeTaskForm = () => {
    setActiveTaskColumnId(null)
    setEditingTask(null)
    setTaskForm(emptyTaskForm)
  }

  const updateTaskField = (event) => {
    const { name, value } = event.target
    setTaskForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'reminder_option' && value === 'none' ? { custom_reminder_at: '' } : {}),
      ...(name === 'custom_reminder_at' && value && !current.due_date ? { due_date: value.slice(0, 10) } : {}),
    }))
  }

  const toggleTaskLabel = (labelId) => {
    setTaskForm((current) => {
      const hasLabel = current.label_ids.includes(labelId)
      return {
        ...current,
        label_ids: hasLabel
          ? current.label_ids.filter((id) => id !== labelId)
          : [...current.label_ids, labelId],
      }
    })
  }

  const submitTask = async (event) => {
    event.preventDefault()
    setError('')

    try {
      const validationMessage = reminderValidationMessage(taskForm)

      if (validationMessage) {
        setReminderModalMessage(validationMessage)
        return
      }

      const payload = {
        ...taskForm,
        task_date: date,
        kanban_column_id: activeTaskColumnId,
      }

      if (editingTask) {
        await updateTask(editingTask.id, payload)
      } else {
        await createTask(payload)
      }

      closeTaskForm()
      await loadBoard()
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a salvare il task.'))
    }
  }

  const confirmDeleteTask = async () => {
    if (!taskDeleteTarget) {
      return
    }

    try {
      await deleteTask(taskDeleteTarget.id)
      setTaskDeleteTarget(null)
      await loadBoard()
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a eliminare il task.'))
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    const task = active.data.current?.task
    const targetColumnId = over?.data.current?.columnId

    if (!task || !targetColumnId || task.kanban_column_id === targetColumnId) {
      return
    }

    const targetColumn = board.columns.find((column) => column.id === targetColumnId)

    if (!targetColumn) {
      return
    }

    try {
      await moveTask(task.id, {
        kanban_column_id: targetColumn.id,
        position: targetColumn.tasks.length,
        status: task.status,
      })
      await loadBoard()
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a spostare il task.'))
    }
  }

  const openCreateLabel = () => {
    setLabelEditTarget(null)
    setLabelForm(emptyLabelForm)
    setIsLabelModalOpen(true)
  }

  const openEditLabel = (label) => {
    setLabelEditTarget(label)
    setLabelForm({ name: label.name, color: label.color ?? '#00a7c8' })
    setIsLabelModalOpen(true)
  }

  const closeLabelModal = () => {
    setLabelEditTarget(null)
    setLabelForm(emptyLabelForm)
    setIsLabelModalOpen(false)
  }

  const submitLabel = async (event) => {
    event.preventDefault()
    setError('')

    try {
      if (labelEditTarget) {
        await updateLabel(labelEditTarget.id, labelForm)
      } else {
        await createLabel(labelForm)
      }

      closeLabelModal()
      await loadBoard()
    } catch (requestError) {
      setError(getApiError(requestError, labelEditTarget ? 'Non riesco ad aggiornare etichetta.' : 'Non riesco a creare etichetta.'))
    }
  }

  const confirmDeleteLabel = async () => {
    if (!labelDeleteTarget) {
      return
    }

    try {
      await deleteLabel(labelDeleteTarget.id)
      setLabelDeleteTarget(null)
      await loadBoard()
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a eliminare etichetta.'))
    }
  }

  return (
    <section className="kanban-page page-container">
      <header className="page-header kanban-topbar">
        <div>
          <p className="eyebrow">Board personale</p>
          <h1 className="page-title">Kanban</h1>
          <p className="page-subtitle">Qui puoi organizzare la tua giornata.</p>
        </div>

      </header>

      <UserMessage tone="error">{error}</UserMessage>

      <div className="mobile-kanban-actions">
        <button className="fab-action" type="button" onClick={openCreateColumn} aria-label="Aggiungi colonna">
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      <form className="smart-toolbar list-filter-toolbar kanban-filter-toolbar" onSubmit={submitDate} aria-label="Cambia data Kanban">
        <label className="toolbar-field journal-date-field">
          <CustomDatePicker label="Data Kanban" value={date} onChange={setDate} />
        </label>
        <IconButton variant="gold" type="submit" label="Cambia data"><FiSearch /></IconButton>
        <IconButton variant="edit" type="button" onClick={resetDate} label="Ripristina filtri"><FiRotateCcw /></IconButton>
      </form>

      <div className="label-toolbar surface">
        <div>
          <h2>Etichette</h2>
          <div className="label-chip-list">
            {board.labels.map((label) => (
              <LabelPill
                key={label.id}
                label={label}
                action={(
                  <>
                    <button className="chip-action chip-action--edit" type="button" onClick={() => openEditLabel(label)} aria-label={`Modifica ${label.name}`}><FiEdit3 /></button>
                    <button className="chip-action chip-action--danger" type="button" onClick={() => setLabelDeleteTarget(label)} aria-label={`Elimina ${label.name}`}><FiTrash2 /></button>
                  </>
                )}
              />
            ))}
          </div>
        </div>
        <button className="fab-action label-add-button" type="button" onClick={openCreateLabel} aria-label="Crea etichetta">
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="kanban-board" aria-label="Kanban della giornata">
          {loading && !board.columns.length ? <div className="surface">Caricamento board...</div> : null}
          {board.columns.map((column) => (
            <KanbanColumn
              activeTaskColumnId={activeTaskColumnId}
              board={board}
              closeTaskForm={closeTaskForm}
              column={column}
              editingTask={editingTask}
              key={column.id}
              loading={loading}
              onDeleteColumn={setColumnDeleteTarget}
              onDeleteTask={setTaskDeleteTarget}
              onEditColumn={openEditColumn}
              onEditTask={openTaskForm}
              onOpenTaskForm={openTaskForm}
              onSubmitTask={submitTask}
              onToggleTaskLabel={toggleTaskLabel}
              setTaskForm={setTaskForm}
              taskForm={taskForm}
              updateTaskField={updateTaskField}
            />
          ))}
          <button className="kanban-column add-column-card" type="button" onClick={openCreateColumn}>
            <span><FiPlus aria-hidden="true" /></span>
            Aggiungi Colonna
          </button>
        </div>
      </DndContext>

      {isColumnModalOpen ? (
        <Modal labelledBy="column-modal-title" onClose={closeColumnModal}>
          <div>
            <p className="eyebrow">{columnEditTarget ? 'Modifica colonna' : 'Nuova colonna'}</p>
            <h2 id="column-modal-title">{columnEditTarget ? 'Rinomina colonna' : 'Crea colonna'}</h2>
          </div>
          <form className="modal-form" onSubmit={submitColumn}>
            <label>
              Nome
              <input
                value={columnForm.title}
                onChange={(event) => setColumnForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Cose da fare domani"
                required
              />
            </label>
            <ColorPaletteInput label="Colore colonna" value={columnForm.color} onChange={(value) => setColumnForm((current) => ({ ...current, color: value }))} />
            <div className="modal-actions">
              <button className="btn btn-primary" type="submit"><FiCheck aria-hidden="true" />{columnEditTarget ? 'Salva' : 'Crea'}</button>
              <button className="btn btn-cancel" type="button" onClick={closeColumnModal}>Annulla</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isLabelModalOpen ? (
        <Modal labelledBy="label-modal-title" onClose={closeLabelModal}>
          <div>
            <p className="eyebrow">{labelEditTarget ? 'Modifica etichetta' : 'Nuova etichetta'}</p>
            <h2 id="label-modal-title">{labelEditTarget ? 'Aggiorna etichetta' : 'Crea etichetta'}</h2>
          </div>
          <form className="modal-form" onSubmit={submitLabel}>
            <label>
              Nome
              <input
                value={labelForm.name}
                onChange={(event) => setLabelForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Focus, Casa, Urgente..."
                required
              />
            </label>
            <div className="label-preview" style={{ '--label-color': labelForm.color }}>
              <span className="label-dot" aria-hidden="true" />
              <span>{labelForm.name || 'Anteprima etichetta'}</span>
            </div>
            <ColorPaletteInput label="Colore etichetta" value={labelForm.color} onChange={(value) => setLabelForm((current) => ({ ...current, color: value }))} />
            <div className="modal-actions">
              <button className="btn btn-primary" type="submit"><FiCheck aria-hidden="true" />Salva</button>
              <button className="btn btn-cancel" type="button" onClick={closeLabelModal}>Annulla</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {columnDeleteTarget ? (
        <Modal labelledBy="delete-column-title" onClose={() => setColumnDeleteTarget(null)}>
          <div className="danger-modal-icon" aria-hidden="true"><FiTrash2 /></div>
          <div>
            <p className="eyebrow">Eliminazione colonna</p>
            <h2 id="delete-column-title">Eliminare “{columnDeleteTarget.title}”?</h2>
            <p className="modal-copy">La colonna e le sue attivita verranno rimosse definitivamente.</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" type="button" onClick={confirmDeleteColumn}><FiTrash2 aria-hidden="true" />Elimina</button>
            <button className="btn btn-cancel" type="button" onClick={() => setColumnDeleteTarget(null)}>Annulla</button>
          </div>
        </Modal>
      ) : null}

      {taskDeleteTarget ? (
        <Modal labelledBy="delete-task-title" onClose={() => setTaskDeleteTarget(null)}>
          <div className="danger-modal-icon" aria-hidden="true"><FiTrash2 /></div>
          <div>
            <p className="eyebrow">Eliminazione attivita</p>
            <h2 id="delete-task-title">Eliminare “{taskDeleteTarget.title}”?</h2>
            <p className="modal-copy">Questa operazione non puo essere annullata.</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" type="button" onClick={confirmDeleteTask}><FiTrash2 aria-hidden="true" />Elimina</button>
            <button className="btn btn-cancel" type="button" onClick={() => setTaskDeleteTarget(null)}>Annulla</button>
          </div>
        </Modal>
      ) : null}

      {labelDeleteTarget ? (
        <Modal labelledBy="delete-label-title" onClose={() => setLabelDeleteTarget(null)}>
          <div className="danger-modal-icon" aria-hidden="true"><FiAlertTriangle /></div>
          <div>
            <p className="eyebrow">Eliminazione etichetta</p>
            <h2 id="delete-label-title">Eliminare “{labelDeleteTarget.name}”?</h2>
            <p className="modal-copy">L'etichetta verra rimossa dalle attivita associate.</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" type="button" onClick={confirmDeleteLabel}><FiTrash2 aria-hidden="true" />Elimina</button>
            <button className="btn btn-cancel" type="button" onClick={() => setLabelDeleteTarget(null)}>Annulla</button>
          </div>
        </Modal>
      ) : null}

      {reminderModalMessage ? (
        <Modal labelledBy="reminder-validation-title" onClose={() => setReminderModalMessage('')}>
          <div className="danger-modal-icon" aria-hidden="true"><FiAlertTriangle /></div>
          <div>
            <p className="eyebrow">Promemoria</p>
            <h2 id="reminder-validation-title">Controlla l orario</h2>
            <p className="modal-copy">{reminderModalMessage}</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" type="button" onClick={() => setReminderModalMessage('')}>Ho capito</button>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}

export default KanbanPage
