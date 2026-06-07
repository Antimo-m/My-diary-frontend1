import UserMessage from './UserMessage'
import './AppToast.css'

function AppToast({ children, tone = 'success' }) {
  return (
    <div className={`app-toast ${children ? 'is-visible' : ''}`} aria-live="polite">
      <UserMessage tone={tone}>{children}</UserMessage>
    </div>
  )
}

export default AppToast
