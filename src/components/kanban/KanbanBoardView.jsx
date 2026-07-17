import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useEffect, useRef } from 'react'
import { FiEdit3, FiPlus, FiRotateCcw, FiSearch, FiTrash2 } from 'react-icons/fi'
import { KanbanColumn, LabelPill } from '../KanbanBoardParts'
import DatePicker from '../ui/DatePicker'
import IconButton from '../ui/IconButton'
import { useI18n } from '../../i18n/useI18n'

function KanbanBoardView({
  board,
  boardLoading,
  columnToFocus,
  date,
  mode,
  onColumnFocusHandled,
  onCreateColumn,
  onCreateLabel,
  onDeleteColumn,
  onDeleteLabel,
  onDragEnd,
  onEditColumn,
  onEditLabel,
  onNavigate,
  onOpenTaskDetail,
  onOpenTaskForm,
  onResetDate,
  onSubmitDate,
  onToggleTaskComplete,
  setDate,
}) {
  const { t } = useI18n()
  const boardRef = useRef(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 90, tolerance: 8 } }),
  )

  useEffect(() => {
    if (!columnToFocus || !board.columns.length) {
      return
    }

    const columnElement = boardRef.current?.querySelector(`[data-column-id="${columnToFocus}"]`)

    if (columnElement) {
      columnElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' })
      void Promise.resolve().then(onColumnFocusHandled)
    }
  }, [board.columns, columnToFocus, onColumnFocusHandled])

  return (
    <>
      <div className="kanban-mode-actions">
        <button className="btn kanban-mode-action kanban-mode-action--hub" type="button" onClick={() => onNavigate('home')}>{t('kanban.backToHub')}</button>
        {mode === 'project' ? <button className="btn kanban-mode-action kanban-mode-action--daily" type="button" onClick={() => onNavigate('daily')}>{t('kanban.daily')}</button> : null}
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
                    <button className="chip-action chip-action--edit" type="button" onClick={() => onEditLabel(label)} aria-label={`${t('common.save')} ${label.name}`}><FiEdit3 /></button>
                    <button className="chip-action chip-action--danger" type="button" onClick={() => onDeleteLabel(label)} aria-label={`${t('kanban.delete')} ${label.name}`}><FiTrash2 /></button>
                  </>
                )}
              />
            ))}
          </div>
        </div>
        <button className="fab-action label-add-button" type="button" onClick={onCreateLabel} aria-label={t('kanban.createLabel')}>
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      <div className="kanban-board-toolbar">
        <div>
          <h2>{t('kanban.organize')}</h2>
        </div>
      </div>

      {mode === 'daily' ? (
      <form className="smart-toolbar list-filter-toolbar kanban-filter-toolbar" onSubmit={onSubmitDate} aria-label={t('kanban.changeDate')}>
        <div className="toolbar-field journal-date-field">
          <DatePicker label={t('kanban.changeDate')} value={date} onChange={setDate} />
        </div>
        <IconButton variant="gold" type="submit" label={t('kanban.changeDate')}><FiSearch /></IconButton>
        <IconButton variant="edit" type="button" onClick={onResetDate} label={t('kanban.resetFilters')}><FiRotateCcw /></IconButton>
      </form>
      ) : null}

      <div className="kanban-add-column-row">
        <button className="fab-action" type="button" onClick={onCreateColumn} aria-label={t('kanban.addColumn')}>
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="kanban-board" aria-label={t('kanban.boardAria')} ref={boardRef}>
          {boardLoading && !board.columns.length ? <div className="surface">{t('kanban.loadingBoard')}</div> : null}
          {board.columns.map((column) => (
            <KanbanColumn
              column={column}
              key={column.id}
              onDeleteColumn={onDeleteColumn}
              onEditColumn={onEditColumn}
              onOpenTaskDetail={onOpenTaskDetail}
              onOpenTaskForm={onOpenTaskForm}
              onToggleTaskComplete={onToggleTaskComplete}
            />
          ))}
        </div>
      </DndContext>
    </>
  )
}

export default KanbanBoardView
