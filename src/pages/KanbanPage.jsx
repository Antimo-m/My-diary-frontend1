import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthPanel from '../components/AuthPanel'
import KanbanHub from '../components/KanbanHub'
import KanbanBoardView from '../components/kanban/KanbanBoardView'
import KanbanProjectModals from '../components/kanban/KanbanProjectModals'
import KanbanStructureModals from '../components/kanban/KanbanStructureModals'
import KanbanTaskModals from '../components/kanban/KanbanTaskModals'
import UserMessage from '../components/UserMessage'
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
  moveTask,
  toggleTaskComplete,
  updateColumn,
  updateLabel,
  updateProject,
  updateTask,
} from '../services/kanbanApi'
import useBachecaBoard from '../hooks/useBachecaBoard'
import { getApiError } from '../utils/apiErrors'
import { clockPart, currentDateInTimeZone } from '../utils/dateTime'
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

function kanbanRouteFromPathname(pathname) {
  const projectMatch = pathname.match(/^\/bacheca\/project\/([^/]+)/)

  if (projectMatch) {
    return { mode: 'project', projectIdentifier: decodeURIComponent(projectMatch[1]) }
  }

  if (pathname === '/bacheca/daily') {
    return { mode: 'daily', projectIdentifier: null }
  }

  return { mode: 'home', projectIdentifier: null }
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
  const { t, timeZone } = useI18n()
  const today = currentDateInTimeZone(timeZone)
  const location = useLocation()
  const navigate = useNavigate()
  const kanbanRoute = useMemo(() => kanbanRouteFromPathname(location.pathname), [location.pathname])
  const [activeTaskColumnId, setActiveTaskColumnId] = useState(null)
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
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [projectEditForm, setProjectEditForm] = useState(emptyProjectForm)
  const [projectEditTarget, setProjectEditTarget] = useState(null)
  const [projectDeleteTarget, setProjectDeleteTarget] = useState(null)
  const [validationToast, setValidationToast] = useState('')
  const [successToast, setSuccessToast] = useState('')
  const [taskDeleteTarget, setTaskDeleteTarget] = useState(null)
  const [taskDetailTarget, setTaskDetailTarget] = useState(null)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [columnToFocus, setColumnToFocus] = useState(null)
  const { board, boardError, boardLoading, invalidateBacheca, patchBoardTask, projects, projectsError, selectedProject } = useBachecaBoard({
    date,
    enabled: Boolean(user),
    route: kanbanRoute,
  })

  const navigateKanban = (mode, projectIdentifier = null) => {
    const path = mode === 'project' ? `/bacheca/project/${encodeURIComponent(projectIdentifier)}` : mode === 'daily' ? '/bacheca/daily' : '/bacheca'
    navigate(path)
  }

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
    await invalidateBacheca()
  }

  const resetDate = () => {
    setDate(today)
  }

  const submitProject = async (event) => {
    event.preventDefault()
    setError('')

    try {
      const project = await createProject(projectForm)
      setProjectForm(emptyProjectForm)
      await invalidateBacheca()
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
      await updateProject(projectEditTarget.route_identifier ?? projectEditTarget.slug ?? projectEditTarget.id, projectEditForm)
      await invalidateBacheca()
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
      if (kanbanRoute.mode === 'project' && selectedProject?.id === projectDeleteTarget.id) {
        navigateKanban('home')
      }
      await invalidateBacheca()
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
        setColumnToFocus(createdColumn.id)
      }

      closeColumnModal()
      await invalidateBacheca()
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
      await invalidateBacheca()
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
      await invalidateBacheca()
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
      await invalidateBacheca()
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
      await invalidateBacheca()
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
      await invalidateBacheca()
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
      await invalidateBacheca()
      setSuccessToast(t('kanban.labelDeleted'))
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const handleToggleTaskComplete = async (task) => {
    const nextCompleted = !task.is_completed
    patchBoardTask(task.id, {
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
    })

    try {
      const updatedTask = await toggleTaskComplete(task.id)
      patchBoardTask(task.id, updatedTask)
      setSuccessToast(nextCompleted ? t('kanban.taskCompleted') : t('kanban.taskReopened'))
    } catch (requestError) {
      setError(getApiError(requestError))
      await invalidateBacheca()
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

      <UserMessage tone="error">{error || (boardError ? getApiError(boardError, t('kanban.loadError')) : projectsError ? getApiError(projectsError, t('kanban.projectsLoadError')) : '')}</UserMessage>
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
        <KanbanBoardView
          board={board}
          boardLoading={boardLoading}
          date={date}
          mode={kanbanRoute.mode}
          onCreateColumn={openCreateColumn}
          onCreateLabel={openCreateLabel}
          onDeleteColumn={setColumnDeleteTarget}
          onDeleteLabel={setLabelDeleteTarget}
          onDragEnd={handleDragEnd}
          onEditColumn={openEditColumn}
          onEditLabel={openEditLabel}
          onNavigate={navigateKanban}
          onOpenTaskDetail={openTaskDetail}
          onOpenTaskForm={openTaskForm}
          onResetDate={resetDate}
          onSubmitDate={submitDate}
          onToggleTaskComplete={handleToggleTaskComplete}
          columnToFocus={columnToFocus}
          onColumnFocusHandled={() => setColumnToFocus(null)}
          setDate={setDate}
        />
      ) : null}

      <KanbanTaskModals
        activeTaskColumnId={activeTaskColumnId}
        board={board}
        closeTaskForm={closeTaskForm}
        editingTask={editingTask}
        loading={boardLoading}
        onConfirmDeleteTask={confirmDeleteTask}
        onEditTaskFromDetail={editTaskFromDetail}
        onSubmitTask={submitTask}
        onToggleTaskLabel={toggleTaskLabel}
        setTaskDeleteTarget={setTaskDeleteTarget}
        setTaskDetailTarget={setTaskDetailTarget}
        setTaskForm={setTaskForm}
        taskDeleteTarget={taskDeleteTarget}
        taskDetailTarget={taskDetailTarget}
        taskForm={taskForm}
        updateTaskField={updateTaskField}
      />

      <KanbanStructureModals
        columnDeleteTarget={columnDeleteTarget}
        columnEditTarget={columnEditTarget}
        columnForm={columnForm}
        closeColumnModal={closeColumnModal}
        closeLabelModal={closeLabelModal}
        isColumnModalOpen={isColumnModalOpen}
        isLabelModalOpen={isLabelModalOpen}
        labelDeleteTarget={labelDeleteTarget}
        labelEditTarget={labelEditTarget}
        labelForm={labelForm}
        onConfirmDeleteColumn={confirmDeleteColumn}
        onConfirmDeleteLabel={confirmDeleteLabel}
        onSubmitColumn={submitColumn}
        onSubmitLabel={submitLabel}
        setColumnDeleteTarget={setColumnDeleteTarget}
        setColumnForm={setColumnForm}
        setLabelDeleteTarget={setLabelDeleteTarget}
        setLabelForm={setLabelForm}
      />

      <KanbanProjectModals
        closeEditProject={closeEditProject}
        onConfirmDeleteProject={confirmDeleteProject}
        onSubmitProjectEdit={submitProjectEdit}
        projectDeleteTarget={projectDeleteTarget}
        projectEditForm={projectEditForm}
        projectEditTarget={projectEditTarget}
        setProjectDeleteTarget={setProjectDeleteTarget}
        setProjectEditForm={setProjectEditForm}
      />

    </section>
    </Toast.Provider>
  )
}

export default KanbanPage
