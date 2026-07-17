import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FiCheck, FiChevronLeft, FiChevronRight, FiPlus, FiRotateCcw, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import DiaryCard from '../components/DiaryCard'
import DiaryWalkthrough from '../components/DiaryWalkthrough'
import ImageFrame from '../components/ImageFrame'
import UserMessage from '../components/UserMessage'
import Button from '../components/ui/Button'
import DatePicker from '../components/ui/DatePicker'
import Dialog from '../components/ui/Dialog'
import EmptyState from '../components/ui/EmptyState'
import IconButton from '../components/ui/IconButton'
import Pagination from '../components/ui/Pagination'
import Skeleton from '../components/ui/Skeleton'
import Toast from '../components/ui/Toast'
import { useI18n } from '../i18n/useI18n'
import * as defaultDiaryApi from '../services/diaryApi'
import { getApiError } from '../utils/apiErrors'
import { currentDateInTimeZone } from '../utils/dateTime'
import './DiaryPage.css'

function createEmptyForm(timeZone) {
  return {
    entry_date: currentDateInTimeZone(timeZone),
    title: '',
    body: '',
    photo_dedication: '',
    cover_image: null,
    cover_image_url: '',
  }
}
const maxCoverImageBytes = 4 * 1024 * 1024
const allowedCoverImageTypes = ['image/jpeg', 'image/png', 'image/webp']

const defaultCopy = {
  createStripText: 'Aggiungi immagine, didascalia e testo in stile diario.',
  empty: 'Nessuna pagina trovata.',
  loadError: 'Non riesco a caricare il diario.',
  newPage: 'Nuova pagina',
  pageSaved: 'Pagina salvata.',
  pageSubtitle: 'Scrivi e conserva i momenti importanti.',
  pageTitle: 'Diario',
  recent: 'Pagine recenti',
  rereadSubtitle: 'Rileggi la tua pagina con calma.',
  saveError: 'Non riesco a salvare la pagina.',
  secretClass: '',
}

function paginateText(text, maxLength = 220) {
  const content = (text || '').trim()

  if (!content) {
    return ['']
  }

  const words = content.split(/\s+/)
  const pages = []
  let page = ''

  words.forEach((word) => {
    const nextPage = page ? `${page} ${word}` : word

    if (nextPage.length > maxLength && page) {
      pages.push(page)
      page = word
    } else {
      page = nextPage
    }
  })

  if (page) {
    pages.push(page)
  }

  return pages
}

function paginateTextToElement(text, element) {
  const content = (text || '').trim()

  if (!content || !element) {
    return [content]
  }

  const tokens = Array.from(content)
  const pages = []
  let start = 0

  while (start < tokens.length) {
    let low = start + 1
    let high = tokens.length
    let best = start + 1

    while (low <= high) {
      const middle = Math.floor((low + high) / 2)
      element.textContent = tokens.slice(start, middle).join('')

      if (element.scrollHeight <= element.clientHeight + 1) {
        best = middle
        low = middle + 1
      } else {
        high = middle - 1
      }
    }

    pages.push(tokens.slice(start, best).join(''))
    start = best
  }

  element.textContent = ''

  return pages.length ? pages : ['']
}

function useReaderPages(text) {
  const bodyRef = useRef(null)
  const measureRef = useRef(null)
  const [pages, setPages] = useState(() => paginateText(text, 620))

  useLayoutEffect(() => {
    const bodyElement = bodyRef.current
    const measureElement = measureRef.current

    if (!bodyElement || !measureElement) {
      return undefined
    }

    const recalculate = () => {
      measureElement.style.width = `${bodyElement.clientWidth}px`
      setPages(paginateTextToElement(text, measureElement))
    }

    recalculate()
    const observer = new ResizeObserver(recalculate)
    observer.observe(bodyElement)

    return () => observer.disconnect()
  }, [text])

  return { bodyRef, measureRef, pages }
}

function DiaryPage({ authLoading, copy, diaryApi = defaultDiaryApi, onForgotPassword, onLogin, onRegister, onResetPassword, user }) {
  const { t, timeZone } = useI18n()
  const today = currentDateInTimeZone(timeZone)
  const emptyForm = useMemo(() => createEmptyForm(timeZone), [timeZone])
  const translatedCopy = {
    createStripText: t('diary.addImageDedicationText'),
    empty: t('diary.empty'),
    loadError: t('diary.loadError'),
    newPage: t('diary.newPage'),
    pageSaved: t('diary.pageSaved'),
    pageSubtitle: t('diary.subtitle'),
    pageTitle: t('diary.pageTitle'),
    recent: t('diary.recent'),
    rereadSubtitle: t('diary.reread'),
    saveError: t('diary.saveError'),
    secretClass: '',
  }
  const pageCopy = { ...defaultCopy, ...translatedCopy, ...(copy ?? {}) }
  const routeBasePath = pageCopy.secretClass ? '/secret-diary' : '/diary'
  const [filters, setFilters] = useState({ q: '', date: '' })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editingIdentifier, setEditingIdentifier] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState([])
  const [notesMeta, setNotesMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: null, to: null })
  const [pageTurnDirection, setPageTurnDirection] = useState('next')
  const [readerPage, setReaderPage] = useState(0)
  const [dedicationPage, setDedicationPage] = useState(0)
  const [deleteNoteTarget, setDeleteNoteTarget] = useState(null)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [view, setView] = useState('list')
  const [successToast, setSuccessToast] = useState('')
  const coverPreviewUrl = useMemo(() => (
    form.cover_image ? URL.createObjectURL(form.cover_image) : form.cover_image_url
  ), [form.cover_image, form.cover_image_url])
  const dedicationPages = useMemo(() => (
    paginateText(selectedNote?.photo_dedication || t('diary.emptyDedication'))
  ), [selectedNote?.photo_dedication, t])
  const { bodyRef, measureRef, pages: readerPages } = useReaderPages(selectedNote?.body || t('diary.emptyBody'))

  useEffect(() => () => {
    if (coverPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  const loadNotes = async (nextFilters = filters) => {
    setLoading(true)
    setError('')

    try {
      const response = await diaryApi.listDiaryNotes({ per_page: 8, ...nextFilters })
      setNotes(response.data ?? [])
      setNotesMeta(response.meta ?? { current_page: 1, last_page: 1, total: 0, from: null, to: null })
    } catch (requestError) {
      setError(getApiError(requestError, pageCopy.loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      void Promise.resolve().then(async () => {
        await loadNotes()

        if (window.location.pathname.startsWith(`${routeBasePath}/`)) {
          const identifier = decodeURIComponent(window.location.pathname.slice(routeBasePath.length + 1))

          if (identifier) {
            try {
              setSelectedNote(await diaryApi.getDiaryNote(identifier))
              setReaderPage(0)
              setDedicationPage(0)
              setView('detail')
            } catch (requestError) {
              setError(getApiError(requestError, t('diary.openError')))
            }
          }
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useLayoutEffect(() => {
    if (view === 'detail') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [view, selectedNote?.id])

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

  const startCreate = () => {
    setEditingId(null)
    setEditingIdentifier(null)
    setForm(emptyForm)
    setSelectedNote(null)
    setError('')
    setView('create')
  }

  const updateForm = (event) => {
    const { files, name, value } = event.target
    const file = files?.[0]

    if (file && !allowedCoverImageTypes.includes(file.type)) {
      setError(t('diary.imageTypeError'))
      event.target.value = ''
      return
    }

    if (file && file.size > maxCoverImageBytes) {
      setError(t('diary.imageSizeError'))
      event.target.value = ''
      return
    }

    setError('')
    setForm((current) => ({ ...current, [name]: files ? file : value }))
  }

  const submitNote = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const savedNote = await diaryApi.saveDiaryNote(form, editingIdentifier)
      await loadNotes()
      setSelectedNote(savedNote)
      window.history.replaceState({}, '', `${routeBasePath}/${encodeURIComponent(savedNote.route_identifier ?? savedNote.slug ?? savedNote.id)}`)
      setReaderPage(0)
      setDedicationPage(0)
      setEditingId(null)
      setEditingIdentifier(null)
      setForm(emptyForm)
      setView('detail')
      setSuccessToast(editingId ? t('diary.pageUpdated') : pageCopy.pageSaved)
    } catch (requestError) {
      setError(getApiError(requestError, pageCopy.saveError))
    } finally {
      setLoading(false)
    }
  }

  const openNote = async (note) => {
    setLoading(true)
    setError('')

    try {
      const fullNote = await diaryApi.getDiaryNote(note.route_identifier ?? note.slug ?? note.id)
      setSelectedNote(fullNote)
      window.history.pushState({}, '', `${routeBasePath}/${encodeURIComponent(fullNote.route_identifier ?? fullNote.slug ?? fullNote.id)}`)
      setReaderPage(0)
      setDedicationPage(0)
      setView('detail')
    } catch (requestError) {
      setError(getApiError(requestError, t('diary.openError')))
    } finally {
      setLoading(false)
    }
  }

  const editNote = async (note) => {
    const identifier = note.route_identifier ?? note.slug ?? note.id
    const fullNote = note.body ? note : await diaryApi.getDiaryNote(identifier)
    setEditingId(fullNote.id)
    setEditingIdentifier(fullNote.route_identifier ?? fullNote.slug ?? fullNote.id)
    setSelectedNote(null)
    setForm({
      entry_date: fullNote.entry_date ?? today,
      title: fullNote.title ?? '',
      body: fullNote.body ?? '',
      photo_dedication: fullNote.photo_dedication ?? '',
      cover_image: null,
      cover_image_url: fullNote.cover_image_url ?? '',
    })
    setView('create')
  }

  const confirmRemoveNote = async () => {
    if (!deleteNoteTarget) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await diaryApi.deleteDiaryNote(deleteNoteTarget.route_identifier ?? deleteNoteTarget.slug ?? deleteNoteTarget.id)
      setDeleteNoteTarget(null)
      setSelectedNote(null)
      setView('list')
      await loadNotes()
      setSuccessToast(t('diary.pageDeleted'))
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a eliminare la pagina.'))
    } finally {
      setLoading(false)
    }
  }

  const submitFilters = async (event) => {
    event.preventDefault()
    await loadNotes({ ...filters, page: 1 })
  }

  const resetFilters = async () => {
    const nextFilters = { q: '', date: '' }
    setFilters(nextFilters)
    await loadNotes(nextFilters)
  }

  const goToNotesPage = async (page) => {
    await loadNotes({ ...filters, page })
  }

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const turnReaderPage = (nextPage, direction) => {
    setPageTurnDirection(direction)
    setReaderPage(nextPage)
  }

  const totalReaderPages = readerPages.length
  const leaveCompose = () => {
    setDiscardConfirmOpen(false)
    setEditingId(null)
    setEditingIdentifier(null)
    setForm(emptyForm)
    window.history.pushState({}, '', routeBasePath)
    setView('list')
  }
  const returnToList = () => {
    window.history.replaceState({}, '', routeBasePath)
    setSelectedNote(null)
    setView('list')
  }

  return (
    <Toast.Provider>
    <section className={`diary-page page-container ${pageCopy.secretClass}`}>
      <header className="page-header">
        <div>
          <h1 className="page-title">
            {view === 'detail' ? pageCopy.pageTitle : view === 'create' ? (editingId ? t('diary.editPage') : pageCopy.newPage) : pageCopy.pageTitle}
          </h1>
          <p className="page-subtitle">
            {view === 'detail'
              ? pageCopy.rereadSubtitle
              : pageCopy.pageSubtitle}
          </p>
        </div>
      </header>

      <UserMessage tone="error">{error}</UserMessage>
      <Toast open={Boolean(successToast)} onOpenChange={(isOpen) => !isOpen && setSuccessToast('')} tone="success">
        {successToast}
      </Toast>

      {view === 'list' ? (
        <>
          {!pageCopy.secretClass ? <DiaryWalkthrough t={t} /> : null}
          <div className="diary-create-strip diary-create-strip--fab-only">
            <button className="fab-action" type="button" onClick={startCreate} aria-label={pageCopy.newPage}><FiPlus aria-hidden="true" /></button>
          </div>

          <form className="smart-toolbar list-filter-toolbar diary-filter-toolbar" onSubmit={submitFilters} aria-label={t('diary.filter')}>
            <div className="toolbar-field toolbar-field--search">
              <input name="q" type="search" value={filters.q} onChange={updateFilter} placeholder={t('diary.search')} aria-label={t('diary.search')} />
            </div>
            <div className="toolbar-field journal-date-field">
              <DatePicker label={t('diary.filterDate')} value={filters.date} onChange={(value) => setFilters((current) => ({ ...current, date: value }))} />
            </div>
            <IconButton variant="gold" type="submit" label={t('diary.searchNotes')}><FiSearch /></IconButton>
            <IconButton variant="edit" type="button" onClick={resetFilters} label={t('diary.resetFilters')}><FiRotateCcw /></IconButton>
          </form>

          <div className="diary-layout">
            <div className="diary-grid">
              {loading && !notes.length ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="card" />)
              ) : null}
              {!loading && !notes.length ? <EmptyState title={pageCopy.empty} /> : null}
              {notes.map((note) => (
                <DiaryCard note={note} key={note.id} onDelete={setDeleteNoteTarget} onEdit={editNote} onOpen={openNote} />
              ))}
            </div>

            <aside className="surface recent-panel">
              <h2>{pageCopy.recent}</h2>
              <div className="recent-list">
                {notes.slice(0, 8).map((note) => (
                  <button className="recent-note" type="button" onClick={() => openNote(note)} key={`recent-${note.id}`}>
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
            onPageChange={goToNotesPage}
            labels={{ nav: t('diary.pagination'), previous: t('diary.previous'), next: t('diary.next'), of: t('common.of') }}
          />
        </>
      ) : null}

      {view === 'create' ? (
        <>
        <div className="diary-detail__toolbar">
          <IconButton variant="gold" onClick={() => setDiscardConfirmOpen(true)} label={t('diary.toPages')}><FiChevronLeft /></IconButton>
        </div>
        <form className="diary-book diary-book--reader diary-book--compose" onSubmit={submitNote}>
          <section className="diary-book__page diary-book__photo-page">
              <span className="eyebrow">{t('diary.photoAndDedication')}</span>
            <label className="photo-uploader">
              <input name="cover_image" type="file" accept="image/jpeg,image/png,image/webp" onChange={updateForm} />
              {coverPreviewUrl ? <ImageFrame src={coverPreviewUrl} alt={t('diary.coverPreview')} /> : null}
              <span>{coverPreviewUrl ? t('diary.replaceCover') : t('diary.chooseCover')}</span>
            </label>
            <label>
              {t('diary.dedication')}
              <textarea
                name="photo_dedication"
                value={form.photo_dedication}
                onChange={updateForm}
                maxLength="180"
                rows="4"
                placeholder={t('diary.dedicationPlaceholder')}
              />
            </label>
          </section>

          <section className="diary-book__page diary-book__text-page">
            <div className="diary-book__fields">
              <label>
                {t('diary.date')}
                <DatePicker label={t('diary.date')} value={form.entry_date} onChange={(value) => setForm((current) => ({ ...current, entry_date: value }))} />
              </label>
              <label>
                {t('diary.title')}
                <input name="title" value={form.title} onChange={updateForm} maxLength="120" required />
              </label>
            </div>
            <label className="diary-writing-area">
              {t('diary.text')}
              <textarea name="body" value={form.body} onChange={updateForm} rows="12" required />
            </label>
            <div className="diary-book__actions">
              <IconButton variant="confirm" type="submit" disabled={loading} label={loading ? t('diary.saving') : editingId ? t('diary.pageUpdated') : t('common.save')}>
                <FiCheck />
              </IconButton>
              <IconButton variant="danger" type="button" onClick={() => setDiscardConfirmOpen(true)} label={t('common.cancel')}>
                <FiX />
              </IconButton>
            </div>
          </section>
        </form>
        </>
      ) : null}

      {view === 'detail' && selectedNote ? (
        <div className="diary-detail">
          <div className="diary-detail__toolbar">
            <IconButton variant="gold" onClick={returnToList} label={t('diary.toPages')}><FiChevronLeft /></IconButton>
          </div>
          <article className="diary-book diary-book--reader diary-book--detail">
            <section className="diary-book__page diary-book__text-page diary-note-lines">
              <span className="eyebrow">{selectedNote.formatted_date}</span>
              <h2>{selectedNote.title}</h2>
              <p ref={bodyRef} className={`book-note-body page-turn-${pageTurnDirection}`}>
                {readerPages[readerPage] ?? readerPages[0]}
              </p>
              <p ref={measureRef} className="book-note-body diary-measure-box" aria-hidden="true" />
              <div className="diary-page-turner" aria-label={t('diary.pageNavigation')}>
                <IconButton variant="gold" disabled={readerPage === 0} onClick={() => turnReaderPage(Math.max(0, readerPage - 1), 'prev')} label={t('diary.previousPage')}>
                  <FiChevronLeft />
                </IconButton>
                <span>{readerPage + 1} / {totalReaderPages}</span>
                <IconButton variant="gold" disabled={readerPage >= totalReaderPages - 1} onClick={() => turnReaderPage(Math.min(totalReaderPages - 1, readerPage + 1), 'next')} label={t('diary.nextPage')}>
                  <FiChevronRight />
                </IconButton>
              </div>
            </section>

            <section className="diary-book__page diary-book__photo-page">
              <ImageFrame className="diary-image-frame--reader" src={selectedNote.cover_image_url} alt={`${t('diary.coverOf')} ${selectedNote.title}`}>
                <div className="book-cover-fallback">My Diary</div>
              </ImageFrame>
              <div className="diary-dedication">
                <p>{dedicationPages[dedicationPage]}</p>
                {dedicationPages.length > 1 ? (
                  <div className="dedication-pager" aria-label={t('diary.dedicationNavigation')}>
                    {dedicationPages.map((page, index) => (
                      <button
                        className={dedicationPage === index ? 'active' : ''}
                        key={`${page.slice(0, 12)}-${index}`}
                        type="button"
                        onClick={() => setDedicationPage(index)}
                        aria-label={`${t('diary.dedication')} ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          </article>
        </div>
      ) : null}

      {deleteNoteTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setDeleteNoteTarget(null)}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiTrash2 /></div>
          <div>
            <Dialog.Title asChild><h2>{t('diary.deletePageTitle')} “{deleteNoteTarget.title}”?</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('diary.deletePageCopy')}</p></Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" onClick={confirmRemoveNote} disabled={loading}>
              <FiTrash2 aria-hidden="true" />
              {t('kanban.delete')}
            </Button>
            <Button variant="cancel" onClick={() => setDeleteNoteTarget(null)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}

      {discardConfirmOpen ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setDiscardConfirmOpen(false)}>
          <div>
            <Dialog.Title asChild><h2>{t('diary.leaveEditorTitle')}</h2></Dialog.Title>
            <Dialog.Description asChild>
              <p className="dialog-copy">{editingId ? t('diary.leaveEditCopy') : t('diary.leaveCreateCopy')}</p>
            </Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" onClick={leaveCompose}>{t('diary.confirmLeave')}</Button>
            <Button variant="cancel" onClick={() => setDiscardConfirmOpen(false)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}
    </section>
    </Toast.Provider>
  )
}

export default DiaryPage
