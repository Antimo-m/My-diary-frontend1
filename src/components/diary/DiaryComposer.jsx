import { FiCheck, FiChevronLeft, FiX } from 'react-icons/fi'
import ImageFrame from '../ImageFrame'
import DatePicker from '../ui/DatePicker'
import IconButton from '../ui/IconButton'
import { useI18n } from '../../i18n/useI18n'

function DiaryComposer({ coverPreviewUrl, editingId, form, loading, onDiscard, onSubmit, setForm, updateForm }) {
  const { t } = useI18n()

  return (
    <>
      <div className="diary-detail__toolbar">
        <IconButton variant="gold" onClick={onDiscard} label={t('diary.toPages')}><FiChevronLeft /></IconButton>
      </div>
      <form className="diary-book diary-book--reader diary-book--compose" onSubmit={onSubmit}>
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
            <IconButton variant="danger" type="button" onClick={onDiscard} label={t('common.cancel')}>
              <FiX />
            </IconButton>
          </div>
        </section>
      </form>
    </>
  )
}

export default DiaryComposer
