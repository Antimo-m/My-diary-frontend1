import { FiColumns, FiFolderPlus, FiPlus } from 'react-icons/fi'
import Walkthrough from './ui/Walkthrough'
import './ProductWalkthrough.css'

const steps = [
  { icon: FiFolderPlus, key: 'project', titleKey: 'kanban.quickStartProject' },
  { icon: FiColumns, key: 'column', titleKey: 'kanban.quickStartColumn' },
  { icon: FiPlus, key: 'task', titleKey: 'kanban.quickStartTask' },
]

function ProductWalkthrough({ t }) {
  const clip = (
    <>
      <div className="kanban-mini-project"><FiFolderPlus /><span /></div>
      <div className="kanban-mini-board">
        <div><strong>01</strong><span /></div>
        <div><strong>02</strong><span /></div>
        <div><strong>03</strong><span /></div>
      </div>
      <div className="kanban-mini-task"><FiPlus /><span /></div>
    </>
  )

  return (
    <Walkthrough
      ariaLabel={t('kanban.quickStartAria')}
      baseClass="product-walkthrough"
      clip={clip}
      eyebrow={t('kanban.quickStartEyebrow')}
      steps={steps}
      t={t}
    />
  )
}

export default ProductWalkthrough
