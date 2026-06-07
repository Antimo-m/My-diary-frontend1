import { useEffect, useState } from 'react'
import { FiEdit3, FiImage, FiLayers, FiPlus, FiRepeat } from 'react-icons/fi'
import './DiaryWalkthrough.css'

const diarySteps = [
  { icon: FiPlus, key: 'create', titleKey: 'diary.demo.createTitle', captionKey: 'diary.demo.createCaption' },
  { icon: FiEdit3, key: 'text', titleKey: 'diary.demo.textTitle', captionKey: 'diary.demo.textCaption' },
  { icon: FiImage, key: 'image', titleKey: 'diary.demo.imageTitle', captionKey: 'diary.demo.imageCaption' },
  { icon: FiLayers, key: 'organize', titleKey: 'diary.demo.organizeTitle', captionKey: 'diary.demo.organizeCaption' },
  { icon: FiRepeat, key: 'reread', titleKey: 'diary.demo.rereadTitle', captionKey: 'diary.demo.rereadCaption' },
]

function DiaryWalkthrough({ t }) {
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = diarySteps[activeStep]
  const StepIcon = currentStep.icon

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % diarySteps.length)
    }, 3500)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <section className="diary-walkthrough" aria-label={t('diary.demoAria')}>
      <div className={`diary-walkthrough__book is-${currentStep.key}`}>
        <div className="diary-walkthrough__page diary-walkthrough__page--left">
          <span className="diary-walkthrough__date">{t('diary.demo.date')}</span>
          <strong>{t('diary.demo.pageTitle')}</strong>
          <div className="diary-walkthrough__photo" />
          <p>{t('diary.demo.dedication')}</p>
        </div>
        <div className="diary-walkthrough__page diary-walkthrough__page--right">
          <span />
          <span />
          <span />
          <span />
          <div className="diary-walkthrough__entries">
            <button type="button">{t('diary.demo.entryOne')}</button>
            <button type="button">{t('diary.demo.entryTwo')}</button>
          </div>
        </div>
        <div className="diary-walkthrough__cursor" aria-hidden="true">
          <StepIcon />
        </div>
      </div>

      <div className="diary-walkthrough__caption">
        <p className="eyebrow">{t('diary.demoLabel')}</p>
        <h2>{t(currentStep.titleKey)}</h2>
        <p>{t(currentStep.captionKey)}</p>
        <div className="walkthrough-steps" role="tablist" aria-label={t('diary.demoSteps')}>
          {diarySteps.map((step, index) => (
            <button
              aria-label={t(step.titleKey)}
              aria-selected={activeStep === index}
              className={activeStep === index ? 'active' : ''}
              key={step.key}
              onClick={() => setActiveStep(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default DiaryWalkthrough
