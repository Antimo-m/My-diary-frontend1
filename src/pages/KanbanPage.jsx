import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'
import { FiAlertTriangle, FiCalendar, FiCheck, FiEdit3, FiPlus, FiRotateCcw, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import ColorPaletteInput from '../components/ColorPaletteInput'
import KanbanHub from '../components/KanbanHub'
import KanbanTaskForm from '../components/KanbanTaskForm'
import { KanbanColumn, LabelPill } from '../components/KanbanBoardParts'
import Modal from '../components/Modal'
import UserMessage from '../components/UserMessage'
import Button from '../components/ui/Button'
import DatePicker from '../components/ui/DatePicker'
import Dialog from '../components/ui/Dialog'
import IconButton from '../components/ui/IconButton'
import Toast from '../components/ui/Toast'
import { useI18n } from '../i18n/useI18n'
import {
  createColumn,
  createLabel,
  createProject,
  createTask,
  deleteColumn,
  deleteLabel,
  deleteProject,
  deleteTask,
  getBachecaBoard,
  getBachecaProject,
  listBachecaProjects,
  moveTask,
  toggleTaskComplete,
  updateColumn,
  updateLabel,
  updateProject,
  updateTask,
} from '../services/kanbanApi'
import { getApiError } from '../utils/apiErrors'
import { currentDateInTimeZone } from '../utils/dateTime'
import './KanbanPage.css'

const emptyTaskForm = {
  title: '',
  description: '',
  due_date: '',
  due_time: '',
  reminder_option: 'none',
  custom_reminder_at: '',
  color: '#d6a43a',
  label_ids: [],
}
const emptyColumnForm = { title: '', color: '#d6a43a' }
const emptyLabelForm = { name: '', color: '#d6a43a' }
const emptyProjectForm = { name: '', icon: 'folder' }

function initialKanbanRoute() {
  const projectMatch = window.location.pathname.match(/^\/bacheca\/project\/([^/]+)/)

  if (projectMatch) {
    return { mode: 'project', projectIdentifier: decodeURIComponent(projectMatch[1]) }
  }

  if (window.location.pathname === '/bacheca/daily') {
    return { mode: 'daily', projectIdentifier: null }
  }

  return { mode: 'home', projectIdentifier: null }
}

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

function buildDueDateTime({ due_date, due_time }) {
  if (!due_date) {
    return null
  }

  return new Date(`${due_date}T${due_time || '23:59'}`)
}

function reminderValidationMessage(taskForm, t) {
  if (taskForm.reminder_option !== 'custom') {
    return ''
  }

  if (!taskForm.custom_reminder_at) {
    return t('task.selectReminder')
  }

  const reminderAt = new Date(taskForm.custom_reminder_at)
  const dueAt = buildDueDateTime(taskForm)

  return dueAt && reminderAt > dueAt ? t('task.reminderHint') : ''
}

function KanbanPage({ authLoading, onForgotPassword, onLogin, onRegister, onResetPassword, user }) {
  const { localeTag, t, timeZone } = useI18n()
  const today = currentDateInTimeZone(timeZone)
  const [kanbanRoute, setKanbanRoute] = useState(initialKanbanRoute)
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
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [projectEditForm, setProjectEditForm] = useState(emptyProjectForm)
  const [projectEditTarget, setProjectEditTarget] = useState(null)
  const [projectDeleteTarget, setProjectDeleteTarget] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [validationToast, setValidationToast] = useState('')
  const [successToast, setSuccessToast] = useState('')
  const [taskDeleteTarget, setTaskDeleteTarget] = useState(null)
  const [taskDetailTarget, setTaskDetailTarget] = useState(null)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const boardRef = useRef(null)
  const pendingColumnFocusId = useRef(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 90, tolerance: 8 } }),
  )

  const navigateKanban = (mode, projectIdentifier = null) => {
    const path = mode === 'project' ? `/bacheca/project/${encodeURIComponent(projectIdentifier)}` : mode === 'daily' ? '/bacheca/daily' : '/bacheca'
    window.history.pushState({}, '', path)
    setKanbanRoute({ mode, projectIdentifier })
  }

  const loadProjects = async () => {
    try {
      setProjects(await listBachecaProjects())
    } catch (requestError) {
      setProjects([])
      setError(getApiError(requestError, t('kanban.projectsLoadError')))
    }
  }

  const loadBoard = async (nextDate = date, route = kanbanRoute) => {
    setLoading(true)
    setError('')

    try {
      if (route.mode === 'project' && route.projectIdentifier) {
        const projectBoard = await getBachecaProject(route.projectIdentifier)
        setSelectedProject(projectBoard.project)
        setBoard({ columns: projectBoard.columns, labels: projectBoard.labels, date: nextDate })
      } else {
        setSelectedProject(null)
        setBoard(await getBachecaBoard(nextDate))
      }
    } catch (requestError) {
      setError(getApiError(requestError, t('kanban.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      void Promise.resolve().then(async () => {
        await loadProjects()
        if (kanbanRoute.mode !== 'home') {
          await loadBoard(date, kanbanRoute)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, kanbanRoute.mode, kanbanRoute.projectIdentifier])

  useEffect(() => {
    if (!pendingColumnFocusId.current || !board.columns.length) {
      return
    }

    const columnElement = boardRef.current?.querySelector(`[data-column-id="${pendingColumnFocusId.current}"]`)
    pendingColumnFocusId.current = null
    columnElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' })
  }, [board.columns])

  if (authLoading) {
    return <section className="page-container loading-state">{t('auth.wait')}</section>
  }

  if (!user) {
    return (
      <section className="page-container">
        <AuthPanel onForgotPassword={onForgotPassword} onLogin={onLogin} onRegister={onRegister} onResetPassword={onResetPassword} />
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

  const submitProject = async (event) => {
    event.preventDefault()
    setError('')

    try {
      const project = await createProject(projectForm)
      setProjectForm(emptyProjectForm)
      await loadProjects()
      navigateKanban('project', project.route_identifier ?? project.slug ?? project.id)
      setSuccessToast(t('kanban.projectCreated'))
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const openEditProject = (project) => {
    setProjectEditTarget(project)
    setProjectEditForm({ name: project.name ?? '', icon: project.icon ?? 'folder' })
  }

  const closeEditProject = () => {
    setProjectEditTarget(null)
    setProjectEditForm(emptyProjectForm)
  }

  const submitProjectEdit = async (event) => {
    event.preventDefault()

    if (!projectEditTarget) {
      return
    }

    setError('')

    try {
      const updatedProject = await updateProject(projectEditTarget.route_identifier ?? projectEditTarget.slug ?? projectEditTarget.id, projectEditForm)
      setProjects((current) => current.map((project) => (project.id === updatedProject.id ? { ...project, ...updatedProject } : project)))
      if (selectedProject?.id === updatedProject.id) {
        setSelectedProject((current) => ({ ...current, ...updatedProject }))
      }
      closeEditProject()
      setSuccessToast(t('kanban.projectUpdated'))
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const confirmDeleteProject = async () => {
    if (!projectDeleteTarget) {
      return
    }

    setError('')

    try {
      await deleteProject(projectDeleteTarget.route_identifier ?? projectDeleteTarget.slug ?? projectDeleteTarget.id)
      setProjects((current) => current.filter((project) => project.id !== projectDeleteTarget.id))
      if (kanbanRoute.mode === 'project' && selectedProject?.id === projectDeleteTarget.id) {
        navigateKanban('home')
        setBoard({ columns: [], labels: [], date })
        setSelectedProject(null)
      }
      setProjectDeleteTarget(null)
      setSuccessToast(t('kanban.projectDeleted'))
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const openCreateColumn = () => {
    setColumnEditTarget(null)
    setColumnForm(emptyColumnForm)
    setIsColumnModalOpen(true)
  }

  const openEditColumn = (column) => {
    setColumnEditTarget(column)
    setColumnForm({ title: column.title, color: column.color ?? '#d6a43a' })
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
        const createdColumn = await createColumn({
          ...columnForm,
          ...(kanbanRoute.mode === 'project' ? { project_id: selectedProject?.id } : { date }),
        })
        pendingColumnFocusId.current = createdColumn.id
      }

      closeColumnModal()
      await loadBoard()
      setSuccessToast(columnEditTarget ? t('kanban.columnUpdated') : t('kanban.columnCreated'))
    } catch (requestError) {
      setError(getApiError(requestError))
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
      setSuccessToast(t('kanban.columnDeleted'))
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const openTaskForm = (column, task = null) => {
    setTaskDetailTarget(null)
    setActiveTaskColumnId(column.id)
    setEditingTask(task)
    setTaskForm(task ? {
      title: task.title ?? '',
      description: task.description ?? '',
      due_date: task.due_date ?? '',
      due_time: clockPart(task.due_time),
      reminder_option: task.reminder_option ?? 'none',
      custom_reminder_at: task.custom_reminder_at ?? '',
      color: task.color ?? column.color ?? '#d6a43a',
      label_ids: task.labels?.map((label) => label.id) ?? [],
    } : {
      ...emptyTaskForm,
      color: column.color ?? '#d6a43a',
    })
  }

  const openTaskDetail = (task) => {
    setTaskDetailTarget(task)
  }

  const editTaskFromDetail = (task) => {
    const taskColumn = board.columns.find((column) => column.id === task.kanban_column_id)

    if (taskColumn) {
      openTaskForm(taskColumn, task)
    }
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
      const validationMessage = reminderValidationMessage(taskForm, t)

      if (validationMessage) {
        setValidationToast(validationMessage)
        return
      }

      const payload = {
        ...taskForm,
        ...(kanbanRoute.mode === 'project' ? { project_id: selectedProject?.id } : { task_date: date }),
        kanban_column_id: activeTaskColumnId,
      }

      if (editingTask) {
        await updateTask(editingTask.id, payload)
      } else {
        await createTask(payload)
      }

      closeTaskForm()
      await loadBoard()
      setSuccessToast(editingTask ? t('kanban.taskUpdated') : t('kanban.taskCreated'))
    } catch (requestError) {
      setValidationToast(getApiError(requestError))
    }
  }

  const confirmDeleteTask = async () => {
    if (!taskDeleteTarget) {
      return
    }

    try {
      await deleteTask(taskDeleteTarget.id)
      setTaskDeleteTarget(null)
      setTaskDetailTarget(null)
      await loadBoard()
      setSuccessToast(t('kanban.taskDeleted'))
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    const task = active.data.current?.task
    const targetColumnId = over?.data.current?.columnId

    if (!task || !targetColumnId) {
      return
    }

    await moveTaskToColumn(task, targetColumnId)
  }

  const moveTaskToColumn = async (task, targetColumnId) => {
    if (!task || task.kanban_column_id === targetColumnId) {
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
      setSuccessToast(t('kanban.taskMoved'))
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const openCreateLabel = () => {
    setLabelEditTarget(null)
    setLabelForm(emptyLabelForm)
    setIsLabelModalOpen(true)
  }

  const openEditLabel = (label) => {
    setLabelEditTarget(label)
    setLabelForm({ name: label.name, color: label.color ?? '#d6a43a' })
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
      setSuccessToast(labelEditTarget ? t('kanban.labelUpdated') : t('kanban.labelCreated'))
    } catch (requestError) {
      setError(getApiError(requestError))
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
      setSuccessToast(t('kanban.labelDeleted'))
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const optimisticallyPatchTask = (taskId, patch) => {
    setBoard((currentBoard) => ({
      ...currentBoard,
      columns: currentBoard.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
      })),
    }))
  }

  const handleToggleTaskComplete = async (task) => {
    const nextCompleted = !task.is_completed
    optimisticallyPatchTask(task.id, {
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
    })

    try {
      const updatedTask = await toggleTaskComplete(task.id)
      optimisticallyPatchTask(task.id, updatedTask)
      setSuccessToast(nextCompleted ? t('kanban.taskCompleted') : t('kanban.taskReopened'))
    } catch (requestError) {
      setError(getApiError(requestError))
      await loadBoard()
    }
  }

  const activeBoardTitle = kanbanRoute.mode === 'project'
    ? selectedProject?.name ?? t('kanban.customProjects')
    : kanbanRoute.mode === 'daily'
      ? t('kanban.dailyTitle')
      : t('kanban.homeTitle')

  return (
    <Toast.Provider>
    <section className="kanban-page page-container">
      <header className="page-header kanban-topbar">
        <div>
          <h1 className="page-title">{activeBoardTitle}</h1>
          <p className="page-subtitle">{kanbanRoute.mode === 'project' ? t('kanban.projectSubtitle') : t('kanban.subtitle')}</p>
        </div>

      </header>

      <UserMessage tone="error">{error}</UserMessage>
      <Toast open={Boolean(successToast)} onOpenChange={(isOpen) => !isOpen && setSuccessToast('')} tone="success">
        {successToast}
      </Toast>
      <Toast open={Boolean(validationToast)} onOpenChange={(isOpen) => !isOpen && setValidationToast('')} tone="error">
        {validationToast}
      </Toast>

      {kanbanRoute.mode === 'home' ? (
        <KanbanHub
          onCreateProject={submitProject}
          onDeleteProject={setProjectDeleteTarget}
          onEditProject={openEditProject}
          onOpenDaily={() => navigateKanban('daily')}
          onOpenProject={(project) => navigateKanban('project', project.route_identifier ?? project.slug ?? project.id)}
          projectForm={projectForm}
          projects={projects}
          setProjectForm={setProjectForm}
          t={t}
        />
      ) : null}

      {kanbanRoute.mode !== 'home' ? (
        <>
          <div className="kanban-mode-actions">
            <button className="btn kanban-mode-action kanban-mode-action--hub" type="button" onClick={() => navigateKanban('home')}>{t('kanban.backToHub')}</button>
            {kanbanRoute.mode === 'project' ? <button className="btn kanban-mode-action kanban-mode-action--daily" type="button" onClick={() => navigateKanban('daily')}>{t('kanban.daily')}</button> : null}
          </div>

      <div className="label-toolbar">
        <div>
          <h2>{t('kanban.labels')}</h2>
          <div className="label-chip-list">
            {board.labels.map((label) => (
              <LabelPill
                key={label.id}
                label={label}
                action={(
                  <>
                    <button className="chip-action chip-action--edit" type="button" onClick={() => openEditLabel(label)} aria-label={`${t('common.save')} ${label.name}`}><FiEdit3 /></button>
                    <button className="chip-action chip-action--danger" type="button" onClick={() => setLabelDeleteTarget(label)} aria-label={`${t('kanban.delete')} ${label.name}`}><FiTrash2 /></button>
                  </>
                )}
              />
            ))}
          </div>
        </div>
        <button className="fab-action label-add-button" type="button" onClick={openCreateLabel} aria-label={t('kanban.createLabel')}>
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      <div className="kanban-board-toolbar">
        <div>
          <h2>{t('kanban.organize')}</h2>
        </div>
      </div>

      {kanbanRoute.mode === 'daily' ? (
      <form className="smart-toolbar list-filter-toolbar kanban-filter-toolbar" onSubmit={submitDate} aria-label={t('kanban.changeDate')}>
        <div className="toolbar-field journal-date-field">
          <DatePicker label={t('kanban.changeDate')} value={date} onChange={setDate} />
        </div>
        <IconButton variant="gold" type="submit" label={t('kanban.changeDate')}><FiSearch /></IconButton>
        <IconButton variant="edit" type="button" onClick={resetDate} label={t('kanban.resetFilters')}><FiRotateCcw /></IconButton>
      </form>
      ) : null}

      <div className="kanban-add-column-row">
        <button className="fab-action" type="button" onClick={openCreateColumn} aria-label={t('kanban.addColumn')}>
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="kanban-board" aria-label={t('kanban.boardAria')} ref={boardRef}>
          {loading && !board.columns.length ? <div className="surface">{t('kanban.loadingBoard')}</div> : null}
          {board.columns.map((column) => (
            <KanbanColumn
              column={column}
              key={column.id}
              onDeleteColumn={setColumnDeleteTarget}
              onEditColumn={openEditColumn}
              onOpenTaskDetail={openTaskDetail}
              onOpenTaskForm={openTaskForm}
              onToggleTaskComplete={handleToggleTaskComplete}
            />
          ))}
        </div>
      </DndContext>
        </>
      ) : null}

      {activeTaskColumnId ? (
        <Modal labelledBy="task-form-title" onClose={closeTaskForm}>
          <KanbanTaskForm
            board={board}
            closeTaskForm={closeTaskForm}
            editingTask={editingTask}
            loading={loading}
            onSubmitTask={submitTask}
            onToggleTaskLabel={toggleTaskLabel}
            setTaskForm={setTaskForm}
            taskForm={taskForm}
            titleId="task-form-title"
            updateTaskField={updateTaskField}
          />
        </Modal>
      ) : null}

      {taskDetailTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setTaskDetailTarget(null)}>
          <div className="task-detail-modal" style={{ '--task-color': taskDetailTarget.color ?? '#d6a43a' }}>
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
              <IconButton variant="edit" type="button" onClick={() => editTaskFromDetail(taskDetailTarget)} label={t('task.update')}><FiEdit3 /></IconButton>
              <IconButton variant="danger" type="button" onClick={() => setTaskDeleteTarget(taskDetailTarget)} label={t('kanban.deleteActivity')}><FiTrash2 /></IconButton>
              <IconButton variant="gold" type="button" onClick={() => setTaskDetailTarget(null)} label={t('common.close')}><FiX /></IconButton>
            </div>
          </div>
        </Dialog>
      ) : null}

      {isColumnModalOpen ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && closeColumnModal()}>
          <div>
            <Dialog.Title asChild><h2>{columnEditTarget ? t('kanban.saveColumn') : t('kanban.createColumn')}</h2></Dialog.Title>
          </div>
          <form className="dialog-form" onSubmit={submitColumn}>
            <label>
              {t('kanban.name')}
              <input
                value={columnForm.title}
                onChange={(event) => setColumnForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={t('kanban.columnPlaceholder')}
                required
              />
            </label>
            <ColorPaletteInput label={t('kanban.columnColor')} value={columnForm.color} onChange={(value) => setColumnForm((current) => ({ ...current, color: value }))} />
            <div className="dialog-actions">
              <IconButton variant="confirm" type="submit" label={columnEditTarget ? t('kanban.saveColumn') : t('kanban.createColumn')}><FiCheck /></IconButton>
              <IconButton variant="danger" type="button" onClick={closeColumnModal} label={t('common.cancel')}><FiX /></IconButton>
            </div>
          </form>
        </Dialog>
      ) : null}

      {isLabelModalOpen ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && closeLabelModal()}>
          <div>
            <Dialog.Title asChild><h2>{labelEditTarget ? t('kanban.saveLabel') : t('kanban.createLabel')}</h2></Dialog.Title>
          </div>
          <form className="dialog-form" onSubmit={submitLabel}>
            <label>
              {t('kanban.name')}
              <input
                value={labelForm.name}
                onChange={(event) => setLabelForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={t('kanban.labelPlaceholder')}
                required
              />
            </label>
            <div className="label-preview" style={{ '--label-color': labelForm.color }}>
              <span className="label-dot" aria-hidden="true" />
              <span>{labelForm.name || t('kanban.createLabel')}</span>
            </div>
            <ColorPaletteInput label={t('kanban.labels')} value={labelForm.color} onChange={(value) => setLabelForm((current) => ({ ...current, color: value }))} />
            <div className="dialog-actions">
              <IconButton variant="confirm" type="submit" label={t('kanban.saveLabel')}><FiCheck /></IconButton>
              <IconButton variant="danger" type="button" onClick={closeLabelModal} label={t('common.cancel')}><FiX /></IconButton>
            </div>
          </form>
        </Dialog>
      ) : null}

      {columnDeleteTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setColumnDeleteTarget(null)}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiTrash2 /></div>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.columnDeleteTitle')}</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('kanban.columnDeleteCopy')}</p></Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" onClick={confirmDeleteColumn}><FiTrash2 aria-hidden="true" />{t('kanban.delete')}</Button>
            <Button variant="cancel" onClick={() => setColumnDeleteTarget(null)}>{t('common.cancel')}</Button>
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
            <Button variant="danger" onClick={confirmDeleteTask}><FiTrash2 aria-hidden="true" />{t('kanban.delete')}</Button>
            <Button variant="cancel" onClick={() => setTaskDeleteTarget(null)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}

      {labelDeleteTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setLabelDeleteTarget(null)}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiAlertTriangle /></div>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.deleteLabelTitle')} “{labelDeleteTarget.name}”?</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('kanban.labelDeleteCopy')}</p></Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" onClick={confirmDeleteLabel}><FiTrash2 aria-hidden="true" />{t('kanban.delete')}</Button>
            <Button variant="cancel" onClick={() => setLabelDeleteTarget(null)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}

      {projectEditTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && closeEditProject()}>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.renameProject')}</h2></Dialog.Title>
          </div>
          <form className="dialog-form" onSubmit={submitProjectEdit}>
            <label>
              {t('kanban.name')}
              <input
                value={projectEditForm.name}
                onChange={(event) => setProjectEditForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={t('kanban.projectNamePlaceholder')}
                required
              />
            </label>
            <div className="dialog-actions">
              <IconButton variant="confirm" type="submit" label={t('kanban.saveProject')}><FiCheck /></IconButton>
              <IconButton variant="danger" type="button" onClick={closeEditProject} label={t('common.cancel')}><FiX /></IconButton>
            </div>
          </form>
        </Dialog>
      ) : null}

      {projectDeleteTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setProjectDeleteTarget(null)}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiAlertTriangle /></div>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.deleteProjectTitle')} “{projectDeleteTarget.name}”?</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('kanban.deleteProjectCopy')}</p></Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" onClick={confirmDeleteProject}><FiTrash2 aria-hidden="true" />{t('kanban.delete')}</Button>
            <Button variant="cancel" onClick={() => setProjectDeleteTarget(null)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}

    </section>
    </Toast.Provider>
  )
}

export default KanbanPage
