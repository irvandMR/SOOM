import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useState } from 'react'
import Pagination from './Pagination'

interface TableProps {
  data: any[]
  columns: {
    field?: string
    header: string
    body?: (row: any) => React.ReactNode
    style?: React.CSSProperties
    sortable?: boolean
  }[]
  loading?: boolean
  emptyMessage?: string
  rows?: number
  first?: number
  totalRecords?: number
  lazy?: boolean
  onPage?: (event: any) => void
  onSort?: (event: any) => void
  onFilter?: (event: any) => void
  onFirstChange?: (val: number) => void
  sortField?: string
  sortOrder?: 1 | -1 | 0 | null
}

export default function Table({
  data,
  columns,
  loading,
  emptyMessage = 'Tidak ada data',
  rows: externalRows,
  first: externalFirst,
  onFirstChange,
  totalRecords,
  lazy,
  onPage,
  onSort,
  onFilter,
  sortField,
  sortOrder,
}: TableProps) {
  const [internalFirst, setInternalFirst] = useState(0)
  const [internalRows, setInternalRows] = useState(10)

  const first = externalFirst !== undefined ? externalFirst : internalFirst
  const setFirst = onFirstChange ?? setInternalFirst
  const rows = externalRows ?? internalRows

  // Client-side pagination logic (only if not lazy)
  const safeFirst = !lazy && first > data.length ? 0 : first
  const displayData = lazy ? data : data.slice(safeFirst, safeFirst + rows)
  const total = lazy ? (totalRecords ?? 0) : data.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Pagination kanan atas */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          total={total}
          rows={rows}
          first={safeFirst}
          onPageChange={(newFirst) => {
            if (lazy && onPage) {
              onPage({ first: newFirst, rows })
            } else {
              setFirst(newFirst)
            }
          }}
          onRowsChange={(newRows) => {
            if (lazy && onPage) {
              onPage({ first: 0, rows: newRows })
            } else {
              setInternalRows(newRows)
              setFirst(0)
            }
          }}
        />
      </div>

      {/* Table box */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <DataTable
          value={displayData}
          loading={loading}
          emptyMessage={emptyMessage}
          style={{ fontFamily: 'inherit', fontSize: 13 }}
          lazy={lazy}
          totalRecords={total}
          first={safeFirst}
          rows={rows}
          onPage={onPage}
          onSort={onSort}
          onFilter={onFilter}
          sortField={sortField}
          sortOrder={sortOrder}
          pt={{
            thead: { style: { background: 'var(--sidebar-bg)' } },
            column: {
              headerCell: { style: { background: 'var(--sidebar-bg)', color: 'var(--muted)', fontSize: 11, fontWeight: 600, padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--border)' } },
              bodyCell: { style: { padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)' } },
            },
            wrapper: { style: { border: 'none' } },
          }}
        >
          {columns.map((col, i) => (
            <Column 
              key={i} 
              field={col.field} 
              header={col.header} 
              body={col.body} 
              style={col.style} 
              sortable={col.sortable} 
            />
          ))}
        </DataTable>
      </div>

    </div>
  )
}