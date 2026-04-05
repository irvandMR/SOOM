import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import AddModalUnit from '../components/units/addModalUnit'
import EditModalUnit from '../components/units/editModalUnit'
import { useUnits, useDeleteUnit, UNIT_KEYS } from '../hooks/queries/useUnitQueries'
import { useQueryClient } from '@tanstack/react-query'

interface Unit {
  id: string
  name: string
  symbol: string
}

export default function UnitsPage() {
  const queryClient = useQueryClient()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'name',
    sortOrder: 1 as 1 | -1 | 0 | null,
    search: ''
  })

  const [editUnit, setEditUnit] = useState<Unit | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: pageData, isLoading } = useUnits({
    page: lazyParams.page,
    size: lazyParams.rows,
    search: lazyParams.search || undefined,
    sort: `${lazyParams.sortField},${lazyParams.sortOrder === 1 ? 'asc' : 'desc'}`
  })

  const deleteUnit = useDeleteUnit()

  const units = pageData?.content || []
  const totalRecords = pageData?.totalElements || 0

  const refresh = () => queryClient.invalidateQueries({ queryKey: UNIT_KEYS.lists() })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onPage = (event: any) => {
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: event.page }))
  }

  const onSort = (event: any) => {
    setLazyParams(prev => ({ ...prev, sortField: event.sortField, sortOrder: event.sortOrder }))
  }

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'Unit ini akan dihapus permanen.',
      header: 'Hapus Unit?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: () => deleteUnit.mutate(id),
    })
  }

  const columns = [
    { header: 'Nama', field: 'name', sortable: true },
    {
      header: 'Simbol', field: 'symbol', sortable: true, body: (row: Unit) => (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4,
          background: 'var(--sidebar-bg)', color: 'var(--text)', fontWeight: 600,
        }}>
          {row.symbol}
        </span>
      )
    },
    { header: 'Base Unit', field: 'baseUnit', sortable: true },
    { header: 'Conversion', field: 'conversionFactor', sortable: true },
    {
      header: 'Aksi', body: (row: Unit) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            label="Edit"
            icon={<Pencil size={12} />}
            variant="secondary"
            size="small"
            tooltip="Edit"
            onClick={() => { setEditUnit(row); setShowEditModal(true) }}
          />
          <Button
            label="Hapus"
            icon={<Trash2 size={12} />}
            variant="danger"
            size="small"
            tooltip="Hapus"
            onClick={() => handleDelete(row.id)}
          />
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Units"
        subtitle={`${totalRecords} unit terdaftar`}
        actionLabel="Tambah Unit"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: {
            value: lazyParams.search,
            onChange: (v) => setLazyParams(p => ({ ...p, search: v, page: 0, first: 0 })),
            placeholder: 'Cari nama atau simbol unit...',
          },
        }}
        onReset={() => setLazyParams(p => ({ ...p, search: '', page: 0, first: 0 }))}
        hasActiveFilter={!!lazyParams.search}
        onRefresh={refresh}
      />

      <Table
        data={units}
        columns={columns}
        loading={isLoading}
        emptyMessage="Belum ada unit"
        lazy
        totalRecords={totalRecords}
        first={lazyParams.first}
        rows={lazyParams.rows}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
      />

      <AddModalUnit
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
      />
      <EditModalUnit
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={refresh}
        unit={editUnit}
      />
    </div>
  )
}