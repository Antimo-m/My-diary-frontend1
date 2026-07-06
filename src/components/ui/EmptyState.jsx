import Card from './Card'
import './EmptyState.css'

function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <Card className={`ui-empty-state ${className}`}>
      {icon ? <div className="ui-empty-state__icon" aria-hidden="true">{icon}</div> : null}
      {title ? <p className="ui-empty-state__title">{title}</p> : null}
      {description ? <p className="ui-empty-state__description">{description}</p> : null}
      {action ? <div className="ui-empty-state__action">{action}</div> : null}
    </Card>
  )
}

export default EmptyState
