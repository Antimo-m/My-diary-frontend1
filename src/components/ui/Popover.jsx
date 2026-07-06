import * as RadixPopover from '@radix-ui/react-popover'
import './Popover.css'

function Popover({ children, className = '', onOpenChange, open, sideOffset = 8, trigger }) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className={`ui-popover ${className}`} sideOffset={sideOffset} collisionPadding={12}>
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

export default Popover
