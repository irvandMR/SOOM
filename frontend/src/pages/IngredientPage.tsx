import { useEffect, useState } from 'react'
import { Trash2, Plus, Pencil } from 'lucide-react'
import api from '../services/api'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import StatusBadge from '../components/common/ui/StatusBadge'
import AddModalIngredient from '../components/ingredient/addModalIngredient'
import StockInModalIngredient from '../components/ingredient/stockInModalIngredient'
import type { Ingredient } from '../types/ingredient.types'
import EditModalIngredient from '../components/ingredient/editModalIngredient'

interface Category { id: string; name: string }
interface Unit { id: string; name: string; symbol: string }

export default function IngredientPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
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
        setCategories(catRes.data.data)
        setUnits(unitRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

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
        <span>Rp {row?.purchasePrice.toLocaleString('id-ID')}</span>
      )
    },
    {
      header: 'Harga Rata-rata', body: (row: Ingredient) => (
        <span>Rp {row.avgPurchasePrice.toLocaleString('id-ID')}</span>
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
          <Button
            label="Edit"
            icon={<Pencil size={12} />}
            variant="secondary"
            size="small"
            tooltip="Edit"
            onClick={() => { setSelectedIngredient(row); setShowEditModal(true) }}
          />
          <Button
            label="Stok"
            icon={<Plus size={12} />}
            variant="secondary"
            size="small"
            tooltip="Tambah Stok"
            onClick={() => { setSelectedIngredient(row); setShowStockInModal(true) }}
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
        title="Stok Bahan Baku"
        subtitle={`${ingredients.length} bahan baku terdaftar`}
        actionLabel="Tambah Bahan Baku"
        onAction={() => setShowAddModal(true)}
      />

      <Table
        data={ingredients}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada bahan baku"
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