import './Card.css'

function Card({ as: Component = 'div', variant = 'surface', padding = 'md', className = '', children, ...props }) {
  return (
    <Component className={`ui-card ui-card--${variant} ui-card--pad-${padding} ${className}`} {...props}>
      {children}
    </Component>
  )
}

export default Card
