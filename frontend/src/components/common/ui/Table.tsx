import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

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
}

export default function Table({ data, columns, loading, emptyMessage = 'Tidak ada data' }: TableProps) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <DataTable
        value={data}
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
          <Column
            key={i}
            field={col.field}
            header={col.header}
            body={col.body}
            style={col.style}
          />
        ))}
      </DataTable>
    </div>
  )
}