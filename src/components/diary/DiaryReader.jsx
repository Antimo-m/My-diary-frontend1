import { useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import ImageFrame from '../ImageFrame'
import IconButton from '../ui/IconButton'
import useReaderPages, { paginateText } from '../../hooks/useReaderPages'
import { useI18n } from '../../i18n/useI18n'

function DiaryReader({ note, onBack }) {
  const { t } = useI18n()
  const [readerPage, setReaderPage] = useState(0)
  const [dedicationPage, setDedicationPage] = useState(0)
  const [pageTurnDirection, setPageTurnDirection] = useState('next')
  const dedicationPages = useMemo(() => (
    paginateText(note.photo_dedication || t('diary.emptyDedication'))
  ), [note.photo_dedication, t])
  const { bodyRef, measureRef, pages: readerPages } = useReaderPages(note.body || t('diary.emptyBody'))
  const totalReaderPages = readerPages.length

  const turnReaderPage = (nextPage, direction) => {
    setPageTurnDirection(direction)
    setReaderPage(nextPage)
  }

  return (
    <div className="diary-detail">
      <div className="diary-detail__toolbar">
        <IconButton variant="gold" onClick={onBack} label={t('diary.toPages')}><FiChevronLeft /></IconButton>
      </div>
      <article className="diary-book diary-book--reader diary-book--detail">
        <section className="diary-book__page diary-book__text-page diary-note-lines">
          <span className="eyebrow">{note.formatted_date}</span>
          <h2>{note.title}</h2>
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
          <ImageFrame className="diary-image-frame--reader" src={note.cover_image_url} alt={`${t('diary.coverOf')} ${note.title}`}>
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
  )
}

export default DiaryReader
