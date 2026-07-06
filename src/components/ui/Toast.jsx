import * as RadixToast from '@radix-ui/react-toast'
import UserMessage from '../UserMessage'
import './Toast.css'

function ToastProvider({ children }) {
  return (
    <RadixToast.Provider duration={3500} swipeDirection="right">
      {children}
      <RadixToast.Viewport className="ui-toast-viewport" />
    </RadixToast.Provider>
  )
}

function Toast({ children, onOpenChange, open, tone = 'success' }) {
  if (!children) {
    return null
  }

  return (
    <RadixToast.Root className="ui-toast-root" open={open} onOpenChange={onOpenChange}>
      <RadixToast.Description asChild>
        <UserMessage tone={tone}>{children}</UserMessage>
      </RadixToast.Description>
    </RadixToast.Root>
  )
}

Toast.Provider = ToastProvider

export default Toast
