import { FiEdit3, FiTrash2 } from 'react-icons/fi'
import { useI18n } from '../i18n/useI18n'
import { textPreview } from '../utils/textPreview'
import IconButton from './IconButton'
import './DiaryCard.css'

function DiaryCard({ note, onDelete, onEdit, onOpen }) {
  const { t } = useI18n()

  return (
    <article className="journal-entry">
      <button className="journal-entry__content" type="button" onClick={() => onOpen(note)}>
        <span className="journal-entry__thumb">
          {note.cover_image_url ? (
            <img src={note.cover_image_url} alt={`${t('diary.coverOf')} ${note.title}`} />
          ) : (
            <span aria-hidden="true">MD</span>
          )}
        </span>
        <time>{note.formatted_date}</time>
        <span>
          <h2>{note.title}</h2>
          <p>{textPreview(note.excerpt || note.body || t('diary.emptyBody'), 95)}</p>
        </span>
      </button>
      <div className="journal-entry__actions">
        <IconButton variant="edit" onClick={() => onEdit(note)} label={t('diary.pageUpdated')}><FiEdit3 /></IconButton>
        <IconButton variant="danger" onClick={() => onDelete(note)} label={t('diary.deletePage')}><FiTrash2 /></IconButton>
      </div>
    </article>
  )
}

export default DiaryCard
