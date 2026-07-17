import { FiPlus, FiRotateCcw, FiSearch } from 'react-icons/fi'
import DiaryCard from '../DiaryCard'
import DiaryWalkthrough from '../DiaryWalkthrough'
import DatePicker from '../ui/DatePicker'
import EmptyState from '../ui/EmptyState'
import IconButton from '../ui/IconButton'
import Pagination from '../ui/Pagination'
import Skeleton from '../ui/Skeleton'
import { useI18n } from '../../i18n/useI18n'

function DiaryList({
  filters,
  loading,
  notes,
  notesLoading,
  notesMeta,
  onCreate,
  onDelete,
  onEdit,
  onOpen,
  onPageChange,
  onResetFilters,
  onSubmitFilters,
  pageCopy,
  setFilters,
}) {
  const { t } = useI18n()

  return (
    <>
      {!pageCopy.secretClass ? <DiaryWalkthrough t={t} /> : null}
      <div className="diary-create-strip diary-create-strip--fab-only">
        <button className="fab-action" type="button" onClick={onCreate} aria-label={pageCopy.newPage}><FiPlus aria-hidden="true" /></button>
      </div>

      <form className="smart-toolbar list-filter-toolbar diary-filter-toolbar" onSubmit={onSubmitFilters} aria-label={t('diary.filter')}>
        <div className="toolbar-field toolbar-field--search">
          <input name="q" type="search" value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder={t('diary.search')} aria-label={t('diary.search')} />
        </div>
        <div className="toolbar-field journal-date-field">
          <DatePicker label={t('diary.filterDate')} value={filters.date} onChange={(value) => setFilters((current) => ({ ...current, date: value }))} />
        </div>
        <IconButton variant="gold" type="submit" label={t('diary.searchNotes')}><FiSearch /></IconButton>
        <IconButton variant="edit" type="button" onClick={onResetFilters} label={t('diary.resetFilters')}><FiRotateCcw /></IconButton>
      </form>

      <div className="diary-layout">
        <div className="diary-grid">
          {notesLoading && !notes.length ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="card" />)
          ) : null}
          {!notesLoading && !notes.length ? <EmptyState title={pageCopy.empty} /> : null}
          {notes.map((note) => (
            <DiaryCard note={note} key={note.id} onDelete={onDelete} onEdit={onEdit} onOpen={onOpen} />
          ))}
        </div>

        <aside className="surface recent-panel">
          <h2>{pageCopy.recent}</h2>
          <div className="recent-list">
            {notes.slice(0, 8).map((note) => (
              <button className="recent-note" type="button" onClick={() => onOpen(note)} key={`recent-${note.id}`}>
                <span>{note.title}</span>
                <small>{note.formatted_date}</small>
              </button>
            ))}
          </div>
        </aside>
      </div>
      <Pagination
        page={notesMeta.current_page}
        lastPage={notesMeta.last_page}
        from={notesMeta.from}
        to={notesMeta.to}
        total={notesMeta.total}
        disabled={loading}
        onPageChange={onPageChange}
        labels={{ nav: t('diary.pagination'), previous: t('diary.previous'), next: t('diary.next'), of: t('common.of') }}
      />
    </>
  )
}

export default DiaryList
