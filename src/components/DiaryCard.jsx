import { FiEdit3, FiTrash2 } from 'react-icons/fi'
import openDiaryDefault from '../assets/open-diary-default.svg'
import IconButton from './IconButton'
import './DiaryCard.css'

function DiaryCard({ note, onDelete, onEdit, onOpen }) {
  return (
    <article className="diary-page-card">
      <button className="diary-card-link" type="button" onClick={() => onOpen(note)}>
        <div className="diary-card-cover">
        {note.cover_image_url ? (
          <img src={note.cover_image_url} alt={`Cover della pagina ${note.title}`} />
        ) : (
          <img className="diary-card-cover-fallback" src={openDiaryDefault} alt="Diario aperto" />
        )}
        </div>
        <div className="diary-card-body">
          <h2>{note.title}</h2>
          <time>{note.formatted_date}</time>
          <p>{note.excerpt}</p>
        </div>
      </button>
      <div className="diary-card-actions">
        <IconButton variant="edit" onClick={() => onEdit(note)} label="Modifica pagina"><FiEdit3 /></IconButton>
        <IconButton variant="danger" onClick={() => onDelete(note)} label="Elimina pagina"><FiTrash2 /></IconButton>
      </div>
    </article>
  )
}

export default DiaryCard
