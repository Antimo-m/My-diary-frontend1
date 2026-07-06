import * as RadixDialog from '@radix-ui/react-dialog'
import './Dialog.css'

function Dialog({ children, className = '', onOpenChange, open = true }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-backdrop" />
        <RadixDialog.Content className={`dialog-panel surface ${className}`}>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

Dialog.Title = RadixDialog.Title
Dialog.Description = RadixDialog.Description
Dialog.Close = RadixDialog.Close

export default Dialog
