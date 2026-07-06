import './Skeleton.css'

function Skeleton({ className = '', lines = 3, variant = 'block' }) {
  if (variant === 'text') {
    return (
      <div className={`ui-skeleton ui-skeleton--text ${className}`} role="presentation" aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <span className="ui-skeleton__line" key={index} />
        ))}
      </div>
    )
  }

  return <div className={`ui-skeleton ui-skeleton--${variant} ${className}`} role="presentation" aria-hidden="true" />
}

export default Skeleton
