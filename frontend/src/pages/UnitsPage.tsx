import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import api from '../services/api'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import AddModalUnit from '../components/units/addModalUnit'
import EditModalUnit from '../components/units/editModalUnit'

interface Unit {
  id: string
  name: string
  symbol: string
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [editUnit, setEditUnit] = useState<Unit | null>(null)
  const [search, setSearch] = useState('')
  const [first, setFirst] = useState(0)                    // ← tambah
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchUnits = async () => {
    const res = await api.get('/units')
    setUnits(res.data.data)
  }

  useEffect(() => {
    fetchUnits().finally(() => setLoading(false))
  }, [])

  // Reset ke halaman 1 saat search berubah
  useEffect(() => {
    setFirst(0)
  }, [search])

  const handleDelete = async (id: string) => {
    confirmDialog({
      message: 'Unit ini akan dihapus permanen.',
      header: 'Hapus Unit?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await api.delete(`/units/${id}`)
          await fetchUnits()
          toast.success('Berhasil', 'Unit berhasil dihapus')
        } catch (err: any) {
          toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus')
        }
      },
    })
  }

  const filteredUnits = units.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.symbol.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { header: 'Nama', field: 'name' },
    {
      header: 'Simbol', body: (row: Unit) => (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4,
          background: 'var(--sidebar-bg)', color: 'var(--text)', fontWeight: 600,
        }}>
          {row.symbol}
        </span>
      )
    },
    { header: 'Base Unit', field: 'baseUnit' },
    { header: 'Conversion', field: 'conversionFactor' },
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
        subtitle={`${filteredUnits.length} unit terdaftar`}
        actionLabel="Tambah Unit"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: {
            value: search,
            onChange: setSearch,
            placeholder: 'Cari nama atau simbol unit...',
          },
        }}
        onReset={() => setSearch('')}
        hasActiveFilter={!!search}
        onRefresh={fetchUnits}
      />

      <Table
        data={filteredUnits}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada unit"
        first={first}
        onFirstChange={setFirst}
      />

      <AddModalUnit
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchUnits}
      />
      <EditModalUnit
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={fetchUnits}
        unit={editUnit}
      />
    </div>
  )
}