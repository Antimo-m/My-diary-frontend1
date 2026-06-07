import { useEffect, useState } from 'react'
import { FiCheckCircle, FiEdit3, FiFlag, FiFolderPlus, FiGrid, FiMove, FiPlus, FiTag } from 'react-icons/fi'
import './ProductWalkthrough.css'

const steps = [
  {
    icon: FiGrid,
    key: 'hub',
    titleKey: 'home.demo.hubTitle',
    captionKey: 'home.demo.hubCaption',
  },
  {
    icon: FiFlag,
    key: 'daily',
    titleKey: 'home.demo.dailyTitle',
    captionKey: 'home.demo.dailyCaption',
  },
  {
    icon: FiFolderPlus,
    key: 'project',
    titleKey: 'home.demo.projectTitle',
    captionKey: 'home.demo.projectCaption',
  },
  {
    icon: FiEdit3,
    key: 'column',
    titleKey: 'home.demo.columnTitle',
    captionKey: 'home.demo.columnCaption',
  },
  {
    icon: FiPlus,
    key: 'task',
    titleKey: 'home.demo.taskTitle',
    captionKey: 'home.demo.taskCaption',
  },
  {
    icon: FiTag,
    key: 'label',
    titleKey: 'home.demo.labelTitle',
    captionKey: 'home.demo.labelCaption',
  },
  {
    icon: FiMove,
    key: 'move',
    titleKey: 'home.demo.moveTitle',
    captionKey: 'home.demo.moveCaption',
  },
  {
    icon: FiCheckCircle,
    key: 'complete',
    titleKey: 'home.demo.completeTitle',
    captionKey: 'home.demo.completeCaption',
  },
]

function ProductWalkthrough({ t }) {
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = steps[activeStep]
  const StepIcon = currentStep.icon

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length)
    }, 3600)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <section className="product-walkthrough" aria-label={t('home.demoAria')}>
      <div className={`product-walkthrough__screen is-${currentStep.key}`}>
        <div className="walkthrough-window">
          <div className="walkthrough-window__bar">
            <span />
            <span />
            <span />
          </div>

          <div className="walkthrough-window__content">
            <aside className="walkthrough-sidebar">
              <div className="walkthrough-logo">{t('app.brand').slice(0, 2)}</div>
              <span>{t('nav.diary')}</span>
              <span>{t('nav.kanban')}</span>
              <span>{t('nav.analysis')}</span>
            </aside>

            <main className="walkthrough-stage">
              <div className="walkthrough-hub">
                <button type="button">{t('kanban.dailyTitle')}</button>
                <button type="button">{t('kanban.createProject')}</button>
              </div>

              <div className="walkthrough-project-form">
                <span>{t('kanban.name')}</span>
                <strong>{t('home.demo.projectName')}</strong>
                <small>{t('kanban.projectCreated')}</small>
              </div>

              <div className="walkthrough-board">
                {['todo', 'doing', 'done'].map((column) => (
                  <div className={`walkthrough-column walkthrough-column--${column}`} key={column}>
                    <span>{t(`kanban.${column}`)}</span>
                    <div className="walkthrough-task" />
                    <div className="walkthrough-task walkthrough-task--small" />
                    {column === 'doing' ? <div className="walkthrough-label">{t('home.demo.labelName')}</div> : null}
                  </div>
                ))}
              </div>

              <div className="walkthrough-analysis">
                <span />
                <span />
                <span />
              </div>
            </main>
          </div>
        </div>

        <div className="walkthrough-cursor" aria-hidden="true">
          <StepIcon />
        </div>
      </div>

      <div className="product-walkthrough__caption">
        <p className="eyebrow">{t('home.demoLabel')}</p>
        <h2>{t(currentStep.titleKey)}</h2>
        <p>{t(currentStep.captionKey)}</p>
        <div className="walkthrough-steps" role="tablist" aria-label={t('home.demoSteps')}>
          {steps.map((step, index) => (
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

export default ProductWalkthrough
