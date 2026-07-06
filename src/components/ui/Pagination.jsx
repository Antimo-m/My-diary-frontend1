import Button from './Button'
import './Pagination.css'

function Pagination({ disabled, from, labels, lastPage, onPageChange, page, to, total }) {
  if (lastPage <= 1) {
    return null
  }

  return (
    <nav className="ui-pagination" aria-label={labels.nav}>
      <Button variant="subtle" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
        {labels.previous}
      </Button>
      <span className="ui-pagination__summary">
        {from ?? 0}-{to ?? 0} {labels.of} {total}
      </span>
      <Button variant="subtle" disabled={disabled || page >= lastPage} onClick={() => onPageChange(page + 1)}>
        {labels.next}
      </Button>
    </nav>
  )
}

export default Pagination
