import { FiAlertTriangle, FiCheck, FiTrash2, FiX } from 'react-icons/fi'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import IconButton from '../ui/IconButton'
import { useI18n } from '../../i18n/useI18n'

function KanbanProjectModals({
  closeEditProject,
  onConfirmDeleteProject,
  onSubmitProjectEdit,
  projectDeleteTarget,
  projectEditForm,
  projectEditTarget,
  setProjectDeleteTarget,
  setProjectEditForm,
}) {
  const { t } = useI18n()

  return (
    <>
      {projectEditTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && closeEditProject()}>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.renameProject')}</h2></Dialog.Title>
          </div>
          <form className="dialog-form" onSubmit={onSubmitProjectEdit}>
            <label>
              {t('kanban.name')}
              <input
                value={projectEditForm.name}
                onChange={(event) => setProjectEditForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={t('kanban.projectNamePlaceholder')}
                required
              />
            </label>
            <div className="dialog-actions">
              <IconButton variant="confirm" type="submit" label={t('kanban.saveProject')}><FiCheck /></IconButton>
              <IconButton variant="danger" type="button" onClick={closeEditProject} label={t('common.cancel')}><FiX /></IconButton>
            </div>
          </form>
        </Dialog>
      ) : null}

      {projectDeleteTarget ? (
        <Dialog onOpenChange={(isOpen) => !isOpen && setProjectDeleteTarget(null)}>
          <div className="dialog-danger-icon" aria-hidden="true"><FiAlertTriangle /></div>
          <div>
            <Dialog.Title asChild><h2>{t('kanban.deleteProjectTitle')} “{projectDeleteTarget.name}”?</h2></Dialog.Title>
            <Dialog.Description asChild><p className="dialog-copy">{t('kanban.deleteProjectCopy')}</p></Dialog.Description>
          </div>
          <div className="dialog-actions">
            <Button variant="danger" onClick={onConfirmDeleteProject}><FiTrash2 aria-hidden="true" />{t('kanban.delete')}</Button>
            <Button variant="cancel" onClick={() => setProjectDeleteTarget(null)}>{t('common.cancel')}</Button>
          </div>
        </Dialog>
      ) : null}
    </>
  )
}

export default KanbanProjectModals
