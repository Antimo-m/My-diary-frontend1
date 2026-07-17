import { FiArchive, FiCheck, FiEdit3, FiPlus } from 'react-icons/fi'
import Walkthrough from './ui/Walkthrough'
import './DiaryWalkthrough.css'

const diarySteps = [
  { icon: FiPlus, key: 'create', titleKey: 'diary.quickStartCreate' },
  { icon: FiCheck, key: 'save', titleKey: 'diary.quickStartSave' },
  { icon: FiArchive, key: 'find', titleKey: 'diary.quickStartFind' },
]

function DiaryWalkthrough({ t }) {
  const clip = (
    <>
      <div className="diary-mini-page">
        <span className="diary-mini-page__date">08 / 06</span>
        <strong>{t('diary.quickStartCreate')}</strong>
        <span className="diary-mini-page__line" />
        <span className="diary-mini-page__line diary-mini-page__line--short" />
        <FiEdit3 className="diary-mini-page__cursor" />
        <FiCheck className="diary-mini-page__saved" />
      </div>
      <div className="diary-mini-archive">
        <span />
        <span />
        <span />
      </div>
    </>
  )

  return (
    <Walkthrough
      ariaLabel={t('diary.quickStartAria')}
      baseClass="diary-walkthrough"
      clip={clip}
      steps={diarySteps}
      t={t}
    />
  )
}

export default DiaryWalkthrough
