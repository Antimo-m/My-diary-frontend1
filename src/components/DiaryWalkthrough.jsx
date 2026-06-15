import { useEffect, useState } from 'react'
import { FiArchive, FiCheck, FiEdit3, FiPlus } from 'react-icons/fi'
import useMediaQuery from '../hooks/useMediaQuery'
import './DiaryWalkthrough.css'

const diarySteps = [
  { icon: FiPlus, key: 'create', titleKey: 'diary.quickStartCreate' },
  { icon: FiCheck, key: 'save', titleKey: 'diary.quickStartSave' },
  { icon: FiArchive, key: 'find', titleKey: 'diary.quickStartFind' },
]

function DiaryWalkthrough({ t }) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = diarySteps[activeStep]

  useEffect(() => {
    if (reduceMotion) return undefined

    const intervalId = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % diarySteps.length)
    }, 2600)

    return () => window.clearInterval(intervalId)
  }, [reduceMotion])

  return (
    <aside className="diary-walkthrough" aria-label={t('diary.quickStartAria')}>
      <div className={`diary-walkthrough__clip is-${currentStep.key}`} aria-hidden="true">
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
      </div>

      <div className="diary-walkthrough__content">
        <div>
          <p className="eyebrow">{t('diary.quickStartEyebrow')}</p>
          <h2>{t(currentStep.titleKey)}</h2>
        </div>
        <div className="diary-walkthrough__steps" role="tablist" aria-label={t('diary.quickStartAria')}>
          {diarySteps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <button
                aria-label={t(step.titleKey)}
                aria-selected={activeStep === index}
                className={activeStep === index ? 'active' : ''}
                key={step.key}
                onClick={() => setActiveStep(index)}
                role="tab"
                type="button"
              >
                <StepIcon aria-hidden="true" />
                <span>{index + 1}</span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export default DiaryWalkthrough
