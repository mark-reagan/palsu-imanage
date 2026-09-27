export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  const { current_page: current, last_page: last } = meta

  return (
    <nav className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4" aria-label="Pagination">
      <p className="text-sm text-slate-500" role="status" aria-live="polite">
        Page {current} of {last} &middot; {meta.total} total
      </p>
      <div className="flex gap-2">
        <button
          className="btn-secondary btn-sm interactive-focus-sm"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Previous page"
        >
          Previous
        </button>
        <button
          className="btn-secondary btn-sm interactive-focus-sm"
          disabled={current >= last}
          onClick={() => onPageChange(current + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  )
}
