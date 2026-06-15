import { useEffect, useState } from 'react'
import { FiColumns, FiFolderPlus, FiPlus } from 'react-icons/fi'
import useMediaQuery from '../hooks/useMediaQuery'
import './ProductWalkthrough.css'

const steps = [
  { icon: FiFolderPlus, key: 'project', titleKey: 'kanban.quickStartProject' },
  { icon: FiColumns, key: 'column', titleKey: 'kanban.quickStartColumn' },
  { icon: FiPlus, key: 'task', titleKey: 'kanban.quickStartTask' },
]

function ProductWalkthrough({ t }) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = steps[activeStep]

  useEffect(() => {
    if (reduceMotion) return undefined

    const intervalId = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length)
    }, 2600)

    return () => window.clearInterval(intervalId)
  }, [reduceMotion])

  return (
    <aside className="product-walkthrough" aria-label={t('kanban.quickStartAria')}>
      <div className={`product-walkthrough__clip is-${currentStep.key}`} aria-hidden="true">
        <div className="kanban-mini-project"><FiFolderPlus /><span /></div>
        <div className="kanban-mini-board">
          <div><strong>01</strong><span /></div>
          <div><strong>02</strong><span /></div>
          <div><strong>03</strong><span /></div>
        </div>
        <div className="kanban-mini-task"><FiPlus /><span /></div>
      </div>

      <div className="product-walkthrough__content">
        <div>
          <p className="eyebrow">{t('kanban.quickStartEyebrow')}</p>
          <h2>{t(currentStep.titleKey)}</h2>
        </div>
        <div className="product-walkthrough__steps" role="tablist" aria-label={t('kanban.quickStartAria')}>
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <button aria-label={t(step.titleKey)} aria-selected={activeStep === index} className={activeStep === index ? 'active' : ''} key={step.key} onClick={() => setActiveStep(index)} role="tab" type="button">
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

export default ProductWalkthrough
