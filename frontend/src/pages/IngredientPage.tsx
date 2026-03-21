import { useEffect, useState } from 'react'
import { Trash2, Plus, Pencil } from 'lucide-react'
import api from '../services/api'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'
import AddModalIngredient from '../components/ingredient/addModalIngredient'
import StockInModalIngredient from '../components/ingredient/stockInModalIngredient'
import type { Ingredient } from '../types/ingredient.types'
import EditModalIngredient from '../components/ingredient/editModalIngredient'
import { formatRupiah } from '../utils/format'

interface Category { id: string; name: string }
interface Unit { id: string; name: string; symbol: string, baseUnit: string }

export default function IngredientPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [first, setFirst] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockInModal, setShowStockInModal] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  const fetchIngredients = async () => {
    const res = await api.get('/ingredients')
    setIngredients(res.data.data)
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ingRes, catRes, unitRes] = await Promise.all([
          api.get('/ingredients'),
          api.get('/categories'),
          api.get('/units'),
        ])
        setIngredients(ingRes.data.data)
        setCategories(catRes.data.data.filter((c: any) => c?.type === 'INGREDIENT'))
        setUnits(unitRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Reset ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setFirst(0)
  }, [search, filterStatus, filterCategory])

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'Bahan baku ini akan dihapus permanen.',
      header: 'Hapus Bahan Baku?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await api.delete(`/ingredients/${id}`)
          await fetchIngredients()
          toast.success('Berhasil', 'Bahan baku berhasil dihapus')
        } catch (err: any) {
          toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus')
        }
      },
    })
  }

  const filteredIngredients = ingredients.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const isCritical = i.stockQuantity <= i.minimumStock
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'CRITICAL' && isCritical) ||
      (filterStatus === 'SAFE' && !isCritical)
    const matchCategory =
      filterCategory === 'ALL' || i.categoryName === filterCategory
    return matchSearch && matchStatus && matchCategory
  })

  const columns = [
    { header: 'Nama', field: 'name' },
    {
      header: 'Kategori', body: (row: Ingredient) => (
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{row.categoryName}</span>
      )
    },
    {
      header: 'Stok', body: (row: Ingredient) => (
        <span style={{ fontWeight: 500 }}>{row.stockQuantity} {row.unitSymbol}</span>
      )
    },
    {
      header: 'Min. Stok', body: (row: Ingredient) => (
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{row.minimumStock} {row.unitSymbol}</span>
      )
    },
    {
      header: 'Harga', body: (row: Ingredient) => (
        <span style={{ fontSize: 12 }}>
          {formatRupiah(row.purchasePrice)} / {row.unitSymbol}
        </span>
      )
    },
    {
      header: 'Harga Rata-rata', body: (row: Ingredient) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {formatRupiah(row.avgPurchasePrice)} / {row.unitSymbol}
        </span>
      )
    },
    {
      header: 'Status', body: (row: Ingredient) => (
        <StatusBadge status={row.stockQuantity <= row.minimumStock ? 'CRITICAL' : 'SAFE'} />
      )
    },
    {
      header: 'Aksi', body: (row: Ingredient) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button label="Edit" icon={<Pencil size={12} />} variant="secondary" size="small"
            onClick={() => { setSelectedIngredient(row); setShowEditModal(true) }} />
          <Button label="Stok" icon={<Plus size={12} />} variant="secondary" size="small"
            onClick={() => { setSelectedIngredient(row); setShowStockInModal(true) }} />
          <Button label="Hapus" icon={<Trash2 size={12} />} variant="danger" size="small"
            onClick={() => handleDelete(row.id)} />
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Stok Bahan Baku"
        subtitle={`${filteredIngredients.length} bahan baku terdaftar`}
        actionLabel="Tambah Bahan Baku"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: {
            value: search,
            onChange: setSearch,
            placeholder: 'Cari nama bahan baku...',
          },
          dropdowns: [
            {
              value: filterCategory,
              onChange: setFilterCategory,
              options: [
                { label: 'Semua Kategori', value: 'ALL' },
                ...categories.map(c => ({ label: c.name, value: c.name })),
              ],
              placeholder: 'Kategori',
            },
            {
              value: filterStatus,
              onChange: setFilterStatus,
              options: [
                { label: 'Semua Status', value: 'ALL' },
                { label: 'Aman', value: 'SAFE' },
                { label: 'Kritis', value: 'CRITICAL' },
              ],
              placeholder: 'Status',
            },
          ],
        }}
        onReset={() => { setSearch(''); setFilterStatus('ALL'); setFilterCategory('ALL') }}
        hasActiveFilter={!!(search || filterStatus !== 'ALL' || filterCategory !== 'ALL')}
        onRefresh={fetchIngredients}
      />

      <Table
        data={filteredIngredients}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada bahan baku"
        first={first}
        onFirstChange={setFirst}
      />

      <AddModalIngredient
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchIngredients}
        categories={categories}
        units={units}
      />

      <EditModalIngredient
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={fetchIngredients}
        categories={categories}
        units={units}
        ingredient={selectedIngredient}
      />

      <StockInModalIngredient
        visible={showStockInModal}
        onHide={() => setShowStockInModal(false)}
        onSuccess={fetchIngredients}
        ingredient={selectedIngredient}
      />
    </div>
  )
}