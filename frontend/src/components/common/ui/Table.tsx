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
  }[]
  loading?: boolean
  emptyMessage?: string
  rows?: number
  first?: number
  onFirstChange?: (val: number) => void
}

export default function Table({
  data,
  columns,
  loading,
  emptyMessage = 'Tidak ada data',
  rows: externalRows,
  first: externalFirst,
  onFirstChange,
}: TableProps) {
  const [internalFirst, setInternalFirst] = useState(0)
  const [internalRows, setInternalRows] = useState(10)

  const first = externalFirst !== undefined ? externalFirst : internalFirst
  const setFirst = onFirstChange ?? setInternalFirst
  const rows = externalRows ?? internalRows

  const safeFirst = first > data.length ? 0 : first
  const pagedData = data.slice(safeFirst, safeFirst + rows)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Pagination kanan atas */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          total={data.length}
          rows={rows}
          first={safeFirst}
          onPageChange={setFirst}
          onRowsChange={(newRows) => {
            setInternalRows(newRows)
            setFirst(0)
          }}
        />
      </div>

      {/* Table box */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <DataTable
          value={pagedData}
          loading={loading}
          emptyMessage={emptyMessage}
          style={{ fontFamily: 'inherit', fontSize: 13 }}
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
            <Column key={i} field={col.field} header={col.header} body={col.body} style={col.style} />
          ))}
        </DataTable>
      </div>

    </div>
  )
}