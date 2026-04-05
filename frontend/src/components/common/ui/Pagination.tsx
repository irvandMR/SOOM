import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  total: number
  rows: number
  first: number
  onPageChange: (first: number) => void
  onRowsChange: (rows: number) => void
}

export default function Pagination({ total, rows, first, onPageChange, onRowsChange }: PaginationProps) {
  const totalPages = Math.ceil(total / rows)
  const currentPage = Math.floor(first / rows) + 1

  const getPages = (): (number | '...')[] => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const btn = (active = false, disabled = false): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--sidebar-border)'}`,
    background: active ? 'var(--accent)' : 'var(--white)',
    color: active ? '#ffffff' : 'var(--sidebar-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    flexShrink: 0,
    transition: 'all 0.15s',
    boxShadow: active ? 'none' : '0 1px 3px rgba(36,61,77,0.1)',
  })

  const selectStyle: React.CSSProperties = {
    height: 30,
    borderRadius: 8,
    border: '1px solid var(--sidebar-border)',
    background: 'var(--white)',
    color: 'var(--sidebar-text)',
    fontSize: 12,
    padding: '0 8px',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 1px 3px rgba(36,61,77,0.1)',
  }


  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

      {/* Per page selector */}
      <select
        value={rows}
        onChange={(e) => {
          onRowsChange(Number(e.target.value))
          onPageChange(0)  // reset ke halaman 1
        }}
        style={selectStyle}
      >
        <option value={10}>10</option>
        <option value={50}>50 </option>
        <option value={100}>100 </option>
      </select>

      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />

      {/* First page */}
      <button style={btn(false, currentPage === 1)} disabled={currentPage === 1}
        onClick={() => onPageChange(0)}>
        <ChevronsLeft size={13} />
      </button>

      {/* Prev */}
      <button style={btn(false, currentPage === 1)} disabled={currentPage === 1}
        onClick={() => onPageChange((currentPage - 2) * rows)}>
        <ChevronLeft size={13} />
      </button>

      {/* Pages */}
      {getPages().map((page, i) =>
        page === '...'
          ? <span key={`dot-${i}`} style={{ width: 30, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>...</span>
          : <button key={page} style={btn(page === currentPage)}
              onClick={() => onPageChange((page - 1) * rows)}>
              {page}
            </button>
      )}

      {/* Next */}
      <button style={btn(false, currentPage === totalPages)} disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage * rows)}>
        <ChevronRight size={13} />
      </button>

      {/* Last page */}
      <button style={btn(false, currentPage === totalPages)} disabled={currentPage === totalPages}
        onClick={() => onPageChange((totalPages - 1) * rows)}>
        <ChevronsRight size={13} />
      </button>

    </div>
  )
}