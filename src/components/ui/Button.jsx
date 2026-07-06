const variantClass = {
  primary: 'btn-primary',
  danger: 'btn-danger',
  cancel: 'btn-cancel',
  outline: 'btn-outline',
  subtle: 'btn-subtle',
}

function Button({ children, className = '', type = 'button', variant = 'primary', ...props }) {
  return (
    <button className={`btn ${variantClass[variant] ?? variantClass.primary} ${className}`} type={type} {...props}>
      {children}
    </button>
  )
}

export default Button
