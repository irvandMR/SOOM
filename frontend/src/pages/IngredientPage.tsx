import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import api from '../services/api'
import type { Ingredient, IngredientRequest, StockInRequest } from '../types/ingredient.types'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Modal from '../components/common/ui/Modal'
import FormField from '../components/common/ui/FormField'
import StatusBadge from '../components/common/ui/StatusBadge'
import Button from '../components/common/ui/Button'
import { Plus, Trash2 } from 'lucide-react'

interface Category { id: string; name: string }
interface Unit { id: string; name: string; symbol: string }

export default function IngredientPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showStockInModal, setShowStockInModal] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [form, setForm] = useState<IngredientRequest>({ name: '', categoryId: '', unitId: '', minimumStock: 0 })
  const [stockInForm, setStockInForm] = useState<StockInRequest>({ quantity: 0, purchasePrice: 0, notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const handleAdd = async () => {
    setError('')
    setSubmitting(true)
    try {
      await api.post('/ingredients', form)
      await fetchIngredients()
      setShowAddModal(false)
      setForm({ name: '', categoryId: '', unitId: '', minimumStock: 0 })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menambahkan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStockIn = async () => {
    if (!selectedIngredient) return
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/ingredients/${selectedIngredient.id}/stock-in`, stockInForm)
      await fetchIngredients()
      setShowStockInModal(false)
      setStockInForm({ quantity: 0, purchasePrice: 0, notes: '' })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menambah stok')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus bahan baku ini?')) return
    try {
      await api.delete(`/ingredients/${id}`)
      await fetchIngredients()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal menghapus')
    }
  }

  const columns = [
    { header: 'Nama', field: 'name' },
    { header: 'Kategori', field: 'categoryName', body: (row: Ingredient) => (
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>{row.categoryName}</span>
    )},
    { header: 'Stok', body: (row: Ingredient) => (
      <span style={{ fontWeight: 500 }}>{row.stockQuantity} {row.unitSymbol}</span>
    )},
    { header: 'Min. Stok', body: (row: Ingredient) => (
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>{row.minimumStock} {row.unitSymbol}</span>
    )},
    { header: 'Harga Rata-rata', body: (row: Ingredient) => (
      <span>Rp {row.avgPurchasePrice.toLocaleString('id-ID')}</span>
    )},
    { header: 'Status', body: (row: Ingredient) => (
      <StatusBadge status={row.stockQuantity <= row.minimumStock ? 'CRITICAL' : 'SAFE'} />
    )},
    { header: 'Aksi', body: (row: Ingredient) => (
        <div style={{ display: 'flex', gap: 6 }}>
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
        )},
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

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        onHide={() => { setShowAddModal(false); setError('') }}
        title="Tambah Bahan Baku"
        onConfirm={handleAdd}
        loading={submitting}
      >
        <FormField label="Nama Bahan Baku" required>
          <InputText
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Tepung Terigu"
            className="w-full"
          />
        </FormField>

        <FormField label="Kategori" required>
          <Dropdown
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.value })}
            options={categories}
            optionLabel="name"
            optionValue="id"
            placeholder="Pilih kategori"
            className="w-full"
          />
        </FormField>

        <FormField label="Unit" required>
          <Dropdown
            value={form.unitId}
            onChange={(e) => setForm({ ...form, unitId: e.value })}
            options={units}
            optionLabel="name"
            optionValue="id"
            placeholder="Pilih unit"
            className="w-full"
          />
        </FormField>

        <FormField label="Minimum Stok">
          <InputNumber
            value={form.minimumStock}
            onValueChange={(e) => setForm({ ...form, minimumStock: e.value ?? 0 })}
            className="w-full"
            minFractionDigits={0}
            maxFractionDigits={3}
          />
        </FormField>

        {error && (
          <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>
            {error}
          </div>
        )}
      </Modal>

      {/* Stock In Modal */}
      <Modal
        visible={showStockInModal}
        onHide={() => { setShowStockInModal(false); setError('') }}
        title={`Tambah Stok — ${selectedIngredient?.name}`}
        onConfirm={handleStockIn}
        confirmLabel="Tambah Stok"
        loading={submitting}
        width="400px"
      >
        {selectedIngredient && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Stok saat ini: {selectedIngredient.stockQuantity} {selectedIngredient.unitSymbol}
          </div>
        )}

        <FormField label={`Jumlah (${selectedIngredient?.unitSymbol})`} required>
          <InputNumber
            value={stockInForm.quantity}
            onValueChange={(e) => setStockInForm({ ...stockInForm, quantity: e.value ?? 0 })}
            className="w-full"
            minFractionDigits={0}
            maxFractionDigits={3}
          />
        </FormField>

        <FormField label={`Harga Beli (per ${selectedIngredient?.unitSymbol})`}>
          <InputNumber
            value={stockInForm.purchasePrice}
            onValueChange={(e) => setStockInForm({ ...stockInForm, purchasePrice: e.value ?? 0 })}
            className="w-full"
            prefix="Rp "
            minFractionDigits={0}
          />
        </FormField>

        <FormField label="Catatan">
          <InputText
            value={stockInForm.notes}
            onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })}
            placeholder="Contoh: Beli di pasar"
            className="w-full"
          />
        </FormField>

        {error && (
          <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>
            {error}
          </div>
        )}
      </Modal>
    </div>
  )
}