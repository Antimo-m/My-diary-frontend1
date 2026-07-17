import { useEffect, useState } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery'

/**
 * Shared auto-advancing stepper used by the diary and kanban onboarding
 * walkthroughs. Callers pass their own `baseClass` (so existing CSS + e2e
 * class hooks are preserved) plus the illustration `clip` and `steps` data.
 */
function Walkthrough({ ariaLabel, baseClass, clip, steps, t }) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = steps[activeStep]

  useEffect(() => {
    if (reduceMotion) return undefined

    const intervalId = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length)
    }, 2600)

    return () => window.clearInterval(intervalId)
  }, [reduceMotion, steps.length])

  return (
    <aside className={baseClass} aria-label={ariaLabel}>
      <div className={`${baseClass}__clip is-${currentStep.key}`} aria-hidden="true">
        {clip}
      </div>

      <div className={`${baseClass}__content`}>
        <div>
          <h2>{t(currentStep.titleKey)}</h2>
        </div>
        <div className={`${baseClass}__steps`} role="tablist" aria-label={ariaLabel}>
          {steps.map((step, index) => {
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

export default Walkthrough
