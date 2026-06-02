import { FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi'
import './UserMessage.css'

const icons = {
  error: FiAlertTriangle,
  success: FiCheckCircle,
  info: FiInfo,
}

function UserMessage({ children, tone = 'error' }) {
  if (!children) {
    return null
  }

  const Icon = icons[tone] ?? FiInfo

  return (
    <div className={`user-message user-message--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

export default UserMessage
