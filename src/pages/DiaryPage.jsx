import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiTrash2 } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import DiaryComposer from '../components/diary/DiaryComposer'
import DiaryList from '../components/diary/DiaryList'
import DiaryReader from '../components/diary/DiaryReader'
import UserMessage from '../components/UserMessage'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import Toast from '../components/ui/Toast'
import useDiaryNotes from '../hooks/useDiaryNotes'
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

function DiaryPage({ authLoading, copy, diaryApi = defaultDiaryApi, onForgotPassword, onLogin, onRegister, onResetPassword, user }) {
  const { t, timeZone } = useI18n()
  const navigate = useNavigate()
  const { identifier: routeIdentifier } = useParams()
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
  const [appliedFilters, setAppliedFilters] = useState({ q: '', date: '', page: 1 })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editingIdentifier, setEditingIdentifier] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { invalidateNotes, notes, notesError, notesLoading, notesMeta } = useDiaryNotes({
    diaryApi,
    enabled: Boolean(user),
    filters: appliedFilters,
    scope: routeBasePath,
  })
  const [deleteNoteTarget, setDeleteNoteTarget] = useState(null)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [view, setView] = useState('list')
  const [successToast, setSuccessToast] = useState('')
  const coverPreviewUrl = useMemo(() => (
    form.cover_image ? URL.createObjectURL(form.cover_image) : form.cover_image_url
  ), [form.cover_image, form.cover_image_url])

  useEffect(() => () => {
    if (coverPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  // Sincronizza la vista con l'URL (/diary/:identifier). Gli aggiornamenti di
  // stato sono differiti in un microtask: la regola set-state-in-effect vieta
  // i setState sincroni nel corpo dell'effect.
  useEffect(() => {
    if (!user) {
      return
    }

    if (!routeIdentifier) {
      if (view === 'detail') {
        void Promise.resolve().then(() => {
          setSelectedNote(null)
          setView('list')
        })
      }
      return
    }

    const currentIdentifier = selectedNote ? String(selectedNote.route_identifier ?? selectedNote.slug ?? selectedNote.id) : ''

    if (view === 'detail' && currentIdentifier === routeIdentifier) {
      return
    }

    void Promise.resolve().then(async () => {
      try {
        setSelectedNote(await diaryApi.getDiaryNote(routeIdentifier))
        setView('detail')
      } catch (requestError) {
        setError(getApiError(requestError, t('diary.openError')))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, routeIdentifier])

  useEffect(() => {
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
      await invalidateNotes()
      setSelectedNote(savedNote)
      navigate(`${routeBasePath}/${encodeURIComponent(savedNote.route_identifier ?? savedNote.slug ?? savedNote.id)}`, { replace: true })
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
      navigate(`${routeBasePath}/${encodeURIComponent(fullNote.route_identifier ?? fullNote.slug ?? fullNote.id)}`)
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
      await invalidateNotes()
      setSuccessToast(t('diary.pageDeleted'))
    } catch (requestError) {
      setError(getApiError(requestError, t('diary.deleteError')))
    } finally {
      setLoading(false)
    }
  }

  const submitFilters = (event) => {
    event.preventDefault()
    setAppliedFilters({ ...filters, page: 1 })
  }

  const resetFilters = () => {
    setFilters({ q: '', date: '' })
    setAppliedFilters({ q: '', date: '', page: 1 })
  }

  const goToNotesPage = (page) => {
    setAppliedFilters((current) => ({ ...current, page }))
  }

  const leaveCompose = () => {
    setDiscardConfirmOpen(false)
    setEditingId(null)
    setEditingIdentifier(null)
    setForm(emptyForm)
    navigate(routeBasePath)
    setView('list')
  }
  const returnToList = () => {
    navigate(routeBasePath, { replace: true })
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

      <UserMessage tone="error">{error || (notesError ? getApiError(notesError, pageCopy.loadError) : '')}</UserMessage>
      <Toast open={Boolean(successToast)} onOpenChange={(isOpen) => !isOpen && setSuccessToast('')} tone="success">
        {successToast}
      </Toast>

      {view === 'list' ? (
        <DiaryList
          filters={filters}
          loading={loading}
          notes={notes}
          notesLoading={notesLoading}
          notesMeta={notesMeta}
          onCreate={startCreate}
          onDelete={setDeleteNoteTarget}
          onEdit={editNote}
          onOpen={openNote}
          onPageChange={goToNotesPage}
          onResetFilters={resetFilters}
          onSubmitFilters={submitFilters}
          pageCopy={pageCopy}
          setFilters={setFilters}
        />
      ) : null}

      {view === 'create' ? (
        <DiaryComposer
          coverPreviewUrl={coverPreviewUrl}
          editingId={editingId}
          form={form}
          loading={loading}
          onDiscard={() => setDiscardConfirmOpen(true)}
          onSubmit={submitNote}
          setForm={setForm}
          updateForm={updateForm}
        />
      ) : null}

      {view === 'detail' && selectedNote ? (
        <DiaryReader key={selectedNote.id} note={selectedNote} onBack={returnToList} />
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
