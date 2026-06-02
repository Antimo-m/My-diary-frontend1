import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiChevronLeft, FiChevronRight, FiEdit3, FiPlus, FiRotateCcw, FiSearch, FiTrash2 } from 'react-icons/fi'
import AuthPanel from '../components/AuthPanel'
import CustomDatePicker from '../components/CustomDatePicker'
import DiaryCard from '../components/DiaryCard'
import IconButton from '../components/IconButton'
import Modal from '../components/Modal'
import UserMessage from '../components/UserMessage'
import { deleteDiaryNote, getDiaryNote, listDiaryNotes, saveDiaryNote } from '../services/diaryApi'
import { getApiError } from '../utils/apiErrors'
import './DiaryPage.css'

const today = new Date().toISOString().slice(0, 10)

const emptyForm = {
  entry_date: today,
  title: '',
  body: '',
  photo_dedication: '',
  cover_image: null,
  cover_image_url: '',
}

function DiaryPage({ authLoading, onLogin, onRegister, user }) {
  const [filters, setFilters] = useState({ q: '', date: '' })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState([])
  const [pageTurnDirection, setPageTurnDirection] = useState('next')
  const [readerPage, setReaderPage] = useState(0)
  const [deleteNoteTarget, setDeleteNoteTarget] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [view, setView] = useState('list')
  const coverPreviewUrl = useMemo(() => (
    form.cover_image ? URL.createObjectURL(form.cover_image) : form.cover_image_url
  ), [form.cover_image, form.cover_image_url])

  useEffect(() => () => {
    if (coverPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  const loadNotes = async (nextFilters = filters) => {
    setLoading(true)
    setError('')

    try {
      setNotes(await listDiaryNotes(nextFilters))
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a caricare il diario.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      void Promise.resolve().then(() => loadNotes())
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

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSelectedNote(null)
    setError('')
    setView('create')
  }

  const updateForm = (event) => {
    const { files, name, value } = event.target
    setForm((current) => ({ ...current, [name]: files ? files[0] : value }))
  }

  const submitNote = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const savedNote = await saveDiaryNote(form, editingId)
      await loadNotes()
      setSelectedNote(savedNote)
      setReaderPage(0)
      setEditingId(null)
      setForm(emptyForm)
      setView('detail')
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a salvare la pagina.'))
    } finally {
      setLoading(false)
    }
  }

  const openNote = async (note) => {
    setLoading(true)
    setError('')

    try {
      setSelectedNote(await getDiaryNote(note.id))
      setReaderPage(0)
      setView('detail')
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco ad aprire la pagina.'))
    } finally {
      setLoading(false)
    }
  }

  const editNote = async (note) => {
    const fullNote = note.body ? note : await getDiaryNote(note.id)
    setEditingId(fullNote.id)
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
      await deleteDiaryNote(deleteNoteTarget.id)
      setDeleteNoteTarget(null)
      setSelectedNote(null)
      setView('list')
      await loadNotes()
    } catch (requestError) {
      setError(getApiError(requestError, 'Non riesco a eliminare la pagina.'))
    } finally {
      setLoading(false)
    }
  }

  const submitFilters = async (event) => {
    event.preventDefault()
    await loadNotes(filters)
  }

  const resetFilters = async () => {
    const nextFilters = { q: '', date: '' }
    setFilters(nextFilters)
    await loadNotes(nextFilters)
  }

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const turnReaderPage = (nextPage, direction) => {
    setPageTurnDirection(direction)
    setReaderPage(nextPage)
  }

  const totalReaderPages = selectedNote?.page_count ?? selectedNote?.body_pages?.length ?? 1

  return (
    <section className="diary-page page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Diario personale</p>
          <h1 className="page-title">
            {view === 'detail' ? 'Diario' : view === 'create' ? 'Nuova pagina' : 'Diario'}
          </h1>
          <p className="page-subtitle">
            {view === 'detail'
              ? 'Rileggi la tua pagina con calma.'
              : 'Scrivi e conserva i momenti importanti.'}
          </p>
        </div>

        {view !== 'list' ? (
          <IconButton variant="gold" onClick={() => setView('list')} label="Torna alle pagine"><FiChevronLeft /></IconButton>
        ) : null}
      </header>

      <UserMessage tone="error">{error}</UserMessage>

      {view === 'list' ? (
        <>
          <div className="diary-create-strip">
            <div>
              <span className="eyebrow">Nuova pagina</span>
              <p>Aggiungi immagine, dedica e testo in stile diario.</p>
            </div>
            <button className="fab-action" type="button" onClick={startCreate} aria-label="Nuova pagina"><FiPlus aria-hidden="true" /></button>
          </div>

          <form className="smart-toolbar list-filter-toolbar diary-filter-toolbar" onSubmit={submitFilters} aria-label="Filtra diario">
            <label className="toolbar-field toolbar-field--search">
              <input name="q" type="search" value={filters.q} onChange={updateFilter} placeholder="Cerca nel diario" />
            </label>
            <label className="toolbar-field journal-date-field">
              <CustomDatePicker label="Filtra per data" value={filters.date} onChange={(value) => setFilters((current) => ({ ...current, date: value }))} />
            </label>
            <IconButton variant="gold" type="submit" label="Cerca note"><FiSearch /></IconButton>
            <IconButton variant="edit" type="button" onClick={resetFilters} label="Ripristina filtri"><FiRotateCcw /></IconButton>
          </form>

          <div className="diary-layout">
            <div className="diary-grid">
              {loading && !notes.length ? <div className="empty-state surface">Caricamento pagine...</div> : null}
              {!loading && !notes.length ? <div className="empty-state surface">Nessuna pagina trovata.</div> : null}
              {notes.map((note) => (
                <DiaryCard note={note} key={note.id} onDelete={setDeleteNoteTarget} onEdit={editNote} onOpen={openNote} />
              ))}
            </div>

            <aside className="surface recent-panel">
              <h2>Pagine recenti</h2>
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
        </>
      ) : null}

      {view === 'create' ? (
        <form className="diary-book diary-book--compose" onSubmit={submitNote}>
          <section className="diary-book__page diary-book__photo-page">
            <span className="eyebrow">Immagine e dedica</span>
            <label className="photo-uploader">
              <input name="cover_image" type="file" accept="image/*" onChange={updateForm} />
              {coverPreviewUrl ? <img src={coverPreviewUrl} alt="Anteprima cover diario" /> : null}
              <span>{form.cover_image ? form.cover_image.name : coverPreviewUrl ? 'Sostituisci cover' : 'Scegli una cover'}</span>
            </label>
            <label>
              Dedica
              <textarea
                name="photo_dedication"
                value={form.photo_dedication}
                onChange={updateForm}
                maxLength="180"
                rows="4"
                placeholder="Una frase breve sotto la foto..."
              />
            </label>
          </section>

          <section className="diary-book__page diary-book__text-page">
            <div className="diary-book__fields">
              <label>
                Data
                <CustomDatePicker label="Data pagina" value={form.entry_date} onChange={(value) => setForm((current) => ({ ...current, entry_date: value }))} />
              </label>
              <label>
                Titolo
                <input name="title" value={form.title} onChange={updateForm} maxLength="120" required />
              </label>
            </div>
            <label className="diary-writing-area">
              Testo del diario
              <textarea name="body" value={form.body} onChange={updateForm} rows="12" required />
            </label>
            <div className="diary-book__actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                <FiCheck aria-hidden="true" />
                {loading ? 'Salvataggio...' : editingId ? 'Aggiorna pagina' : 'Salva pagina'}
              </button>
              <button className="btn btn-subtle" type="button" onClick={() => setView('list')}>Annulla</button>
            </div>
          </section>
        </form>
      ) : null}

      {view === 'detail' && selectedNote ? (
        <div className="diary-detail">
          <div className="diary-detail__actions">
            <IconButton variant="edit" onClick={() => editNote(selectedNote)} label="Modifica pagina"><FiEdit3 /></IconButton>
            <IconButton variant="danger" onClick={() => setDeleteNoteTarget(selectedNote)} label="Elimina pagina"><FiTrash2 /></IconButton>
          </div>
          <article className="diary-book diary-book--detail">
            <section className="diary-book__page diary-book__text-page diary-note-lines">
              <span className="eyebrow">{selectedNote.formatted_date}</span>
              <h2>{selectedNote.title}</h2>
              <p className={`book-note-body page-turn-${pageTurnDirection}`} key={`${selectedNote.id}-${readerPage}`}>
                {selectedNote.body_pages?.[readerPage] ?? selectedNote.body ?? 'Questa pagina non contiene ancora testo.'}
              </p>
              <div className="diary-page-turner" aria-label="Navigazione pagine diario">
                <IconButton variant="gold" disabled={readerPage === 0} onClick={() => turnReaderPage(Math.max(0, readerPage - 1), 'prev')} label="Pagina precedente">
                  <FiChevronLeft />
                </IconButton>
                <span>{readerPage + 1} / {totalReaderPages}</span>
                <IconButton variant="gold" disabled={readerPage >= totalReaderPages - 1} onClick={() => turnReaderPage(Math.min(totalReaderPages - 1, readerPage + 1), 'next')} label="Pagina successiva">
                  <FiChevronRight />
                </IconButton>
              </div>
            </section>

            <section className="diary-book__page diary-book__photo-page">
              <figure className="diary-photo-frame">
                {selectedNote.cover_image_url ? (
                  <img src={selectedNote.cover_image_url} alt={`Cover della pagina ${selectedNote.title}`} />
                ) : (
                  <div className="book-cover-fallback">My Diary</div>
                )}
                <figcaption>{selectedNote.photo_dedication || 'Nessuna dedica aggiunta.'}</figcaption>
              </figure>
            </section>
          </article>
        </div>
      ) : null}

      {deleteNoteTarget ? (
        <Modal labelledBy="delete-note-title" onClose={() => setDeleteNoteTarget(null)}>
          <div className="danger-modal-icon" aria-hidden="true"><FiTrash2 /></div>
          <div>
            <p className="eyebrow">Eliminazione pagina</p>
            <h2 id="delete-note-title">Eliminare “{deleteNoteTarget.title}”?</h2>
            <p className="modal-copy">La pagina del diario verra rimossa definitivamente.</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" type="button" onClick={confirmRemoveNote} disabled={loading}>
              <FiTrash2 aria-hidden="true" />
              Elimina
            </button>
            <button className="btn btn-cancel" type="button" onClick={() => setDeleteNoteTarget(null)}>Annulla</button>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}

export default DiaryPage
