import { FiAlertTriangle, FiCheck, FiTrash2, FiX } from 'react-icons/fi'
import ColorPaletteInput from '../ColorPaletteInput'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import IconButton from '../ui/IconButton'
import { useI18n } from '../../i18n/useI18n'

function KanbanStructureModals({
  isMutating = false,
  columnDeleteTarget,
  columnEditTarget,
  columnForm,
  closeColumnModal,
  closeLabelModal,
  isColumnModalOpen,
  isLabelModalOpen,
  labelDeleteTarget,
  labelEditTarget,
  labelForm,
  onConfirmDeleteColumn,
  onConfirmDeleteLabel,
  onSubmitColumn,
  onSubmitLabel,
  setColumnDeleteTarget,
  setColumnForm,
  setLabelDeleteTarget,
  setLabelForm,
}) {
  const { t } = useI18n()

  return (
    <>
      {isColumnModalOpen ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && closeColumnModal()}>
          <div>
            <Dialog.Title asChild><h2>{columnEditTarget ? t('kanban.saveColumn') : t('kanban.createColumn')}</h2></Dialog.Title>
          </div>
          <form className="dialog-form" onSubmit={onSubmitColumn}>
            <label>
              {t('kanban.name')}
              <input
                value={columnForm.title}
                onChange={(event) => setColumnForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={t('kanban.columnPlaceholder')}
                required
              />
            </label>
            <ColorPaletteInput label={t('kanban.columnColor')} value={columnForm.color} onChange={(value) => setColumnForm((current) => ({ ...current, color: value }))} />
            <div className="dialog-actions">
              <IconButton variant="confirm" type="submit" disabled={isMutating} label={columnEditTarget ? t('kanban.saveColumn') : t('kanban.createColumn')}><FiCheck /></IconButton>
              <IconButton variant="danger" type="button" onClick={closeColumnModal} label={t('common.cancel')}><FiX /></IconButton>
            </div>
          </form>
        </Dialog>
      ) : null}

      {isLabelModalOpen ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && closeLabelModal()}>
          <div>
            <Dialog.Title asChild><h2>{labelEditTarget ? t('kanban.saveLabel') : t('kanban.createLabel')}</h2></Dialog.Title>
          </div>
          <form className="dialog-form" onSubmit={onSubmitLabel}>
            <label>
              {t('kanban.name')}
              <input
                value={labelForm.name}
                onChange={(event) => setLabelForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={t('kanban.labelPlaceholder')}
                required
              />
            </label>
            <div className="label-preview" style={{ '--label-color': labelForm.color }}>
              <span className="label-dot" aria-hidden="true" />
              <span>{labelForm.name || t('kanban.createLabel')}</span>
            </div>
            <ColorPaletteInput label={t('kanban.labels')} value={labelForm.color} onChange={(value) => setLabelForm((current) => ({ ...current, color: value }))} />
            <div className="dialog-actions">
              <IconButton variant="confirm" type="submit" disabled={isMutating} label={t('kanban.saveLabel')}><FiCheck /></IconButton>
              <IconButton variant="danger" type="button" onClick={closeLabelModal} label={t('common.cancel')}><FiX /></IconButton>
            </div>
          </form>
        </Dialog>
      ) : null}

      {columnDeleteTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setColumnDeleteTarget(null)}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiTrash2 /></div>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.columnDeleteTitle')}</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('kanban.columnDeleteCopy')}</p></Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" disabled={isMutating} onClick={onConfirmDeleteColumn}><FiTrash2 aria-hidden="true" />{t('kanban.delete')}</Button>
            <Button variant="cancel" onClick={() => setColumnDeleteTarget(null)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}

      {labelDeleteTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setLabelDeleteTarget(null)}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiAlertTriangle /></div>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.deleteLabelTitle')} “{labelDeleteTarget.name}”?</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('kanban.labelDeleteCopy')}</p></Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" disabled={isMutating} onClick={onConfirmDeleteLabel}><FiTrash2 aria-hidden="true" />{t('kanban.delete')}</Button>
            <Button variant="cancel" onClick={() => setLabelDeleteTarget(null)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}
    </>
  )
}

export default KanbanStructureModals
