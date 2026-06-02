import './IconButton.css'

function IconButton({ children, className = '', label, type = 'button', variant = 'default', ...props }) {
  return (
    <button className={`icon-action icon-action--${variant} ${className}`} type={type} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}

export default IconButton
