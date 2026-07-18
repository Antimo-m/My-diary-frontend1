import { useMemo, useState } from 'react'
import { FiBarChart2, FiBookOpen, FiCheck, FiGrid, FiMail } from 'react-icons/fi'
import { useI18n } from '../i18n/useI18n'
import Dialog from './ui/Dialog'
import './WelcomeModal.css'

const checklist = [
  { icon: FiMail, key: 'onboarding.email' },
  { icon: FiBookOpen, key: 'onboarding.diary' },
  { icon: FiGrid, key: 'onboarding.kanban' },
  { icon: FiBarChart2, key: 'onboarding.analysis' },
]

function WelcomeModal({ onClose }) {
  const { t } = useI18n()
  const [checkedItems, setCheckedItems] = useState(() => new Set(['onboarding.email']))
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const progress = useMemo(() => Math.round((checkedItems.size / checklist.length) * 100), [checkedItems])

  const toggleItem = (key) => {
    setCheckedItems((current) => {
      const next = new Set(current)

      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      return next
    })
  }

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && onClose(dontShowAgain)}>
      <div className="welcome-modal__icon" aria-hidden="true"><FiCheck /></div>
      <div>
        <Dialog.Title asChild><h2>{t('onboarding.title')}</h2></Dialog.Title>
        <Dialog.Description asChild><p className="dialog-copy">{t('onboarding.copy')}</p></Dialog.Description>
      </div>

      <div className="welcome-progress" aria-label={t('onboarding.progress')}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="welcome-checklist">
        {checklist.map((item) => {
          const Icon = item.icon
          const isChecked = checkedItems.has(item.key)

          return (
            <button className={isChecked ? 'is-checked' : ''} key={item.key} type="button" onClick={() => toggleItem(item.key)}>
              <Icon aria-hidden="true" />
              <span>{t(item.key)}</span>
              <FiCheck aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <label className="welcome-modal__check">
        <input type="checkbox" checked={dontShowAgain} onChange={(event) => setDontShowAgain(event.target.checked)} />
        {t('onboarding.dontShow')}
      </label>
      <div className="dialog-actions">
        <button className="btn btn-primary" type="button" onClick={() => onClose(dontShowAgain)}>
          <FiCheck aria-hidden="true" />
          {t('common.continue')}
        </button>
      </div>
    </Dialog>
  )
}

export default WelcomeModal
