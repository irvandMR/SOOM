import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import api from '../services/api'
import type { Production, CreateProductionRequest } from '../types/production.types'
import { formatDate } from '../utils/format'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Modal from '../components/common/ui/Modal'
import FormField from '../components/common/ui/FormField'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'

interface Product { id: string; name: string }
interface Recipe { id: string; versionNumber: number; isActive: boolean }

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  // Filter
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateRange, setFilterDateRange] = useState<[Date | null, Date | null]>([null, null])

  const defaultForm: CreateProductionRequest = {
    productId: '',
    recipeId: '',
    quantityProduced: 1,
    productionDate: new Date().toISOString().split('T')[0],
    notes: '',
  }
  const [form, setForm] = useState<CreateProductionRequest>(defaultForm)

  const fetchProductions = async () => {
    const res = await api.get('/productions')
    setProductions(res.data.data)
  }

  const fetchRecipesByProduct = async (productId: string) => {
    try {
      const res = await api.get(`/products/${productId}/recipes`)
      setRecipes(res.data.data)
      // Auto pilih resep aktif
      const activeRecipe = res.data.data.find((r: Recipe) => r.isActive)
      if (activeRecipe) setForm(prev => ({ ...prev, recipeId: activeRecipe.id }))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, productRes] = await Promise.all([
          api.get('/productions'),
          api.get('/products'),
        ])
        setProductions(prodRes.data.data)
        setProducts(productRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      await api.post('/productions', form)
      await fetchProductions()
      setShowModal(false)
      setForm(defaultForm)
      setRecipes([])
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal catat produksi')
    } finally {
      setSubmitting(false)
    }
  }

  const hasActiveFilter = !!(search || filterStatus || filterDateRange[0])

  const filteredProductions = productions.filter(p => {
    const matchSearch = p.productName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchDate = (() => {
      if (!filterDateRange[0]) return true
      const date = new Date(p.productionDate)
      const start = filterDateRange[0]!
      const end = filterDateRange[1] ?? filterDateRange[0]!
      return date >= start && date <= end
    })()
    return matchSearch && matchStatus && matchDate
  })

  const columns = [
    { header: 'Produk', field: 'productName' },
    { header: 'Versi Resep', body: (row: Production) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Versi {row.recipeVersion}</span>
    )},
    { header: 'Qty Produksi', body: (row: Production) => (
      <span style={{ fontWeight: 500 }}>{row.quantityProduced}</span>
    )},
    { header: 'Tgl Produksi', body: (row: Production) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.productionDate)}</span>
    )},
    { header: 'Status', body: (row: Production) => <StatusBadge status={row.status} /> },
    { header: 'Catatan', body: (row: Production) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.notes || '-'}</span>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Produksi"
        subtitle={`${productions.length} produksi tercatat`}
        actionLabel="Catat Produksi"
        onAction={() => setShowModal(true)}
      />

      <FilterBar
        config={{
          search: { value: search, onChange: setSearch, placeholder: 'Cari nama produk...' },
          dateRange: { value: filterDateRange, onChange: setFilterDateRange, placeholder: 'Filter tanggal' },
          dropdowns: [{
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { label: 'Semua Status', value: '' },
              { label: 'Sukses', value: 'SUCCESS' },
              { label: 'Gagal', value: 'FAILED' },
            ],
            placeholder: 'Status',
          }],
        }}
        onReset={() => { setSearch(''); setFilterStatus(''); setFilterDateRange([null, null]) }}
        hasActiveFilter={hasActiveFilter}
      />

      <Table
        data={filteredProductions}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada data produksi"
      />

      {/* Modal */}
      <Modal
        visible={showModal}
        onHide={() => { setShowModal(false); setError(''); setForm(defaultForm); setRecipes([]) }}
        title="Catat Produksi Baru"
        onConfirm={handleSubmit}
        confirmLabel="Simpan"
        loading={submitting}
        width="460px"
      >
        <FormField label="Produk" required>
          <Dropdown
            value={form.productId}
            onChange={(e) => {
              setForm({ ...form, productId: e.value, recipeId: '' })
              fetchRecipesByProduct(e.value)
            }}
            options={products}
            optionLabel="name"
            optionValue="id"
            placeholder="Pilih produk"
            className="w-full"
          />
        </FormField>

        <FormField label="Resep" required>
          <Dropdown
            value={form.recipeId}
            onChange={(e) => setForm({ ...form, recipeId: e.value })}
            options={recipes.map(r => ({
              label: `Versi ${r.versionNumber}${r.isActive ? ' (Aktif)' : ''}`,
              value: r.id,
            }))}
            placeholder={form.productId ? 'Pilih resep' : 'Pilih produk dulu'}
            disabled={!form.productId}
            className="w-full"
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Jumlah Produksi" required>
            <InputNumber
              value={form.quantityProduced}
              onValueChange={(e) => setForm({ ...form, quantityProduced: e.value ?? 1 })}
              min={1}
              minFractionDigits={0}
              maxFractionDigits={3}
              className="w-full"
            />
          </FormField>
          <FormField label="Tanggal Produksi" required>
            <InputText
              type="date"
              value={form.productionDate}
              onChange={(e) => setForm({ ...form, productionDate: e.target.value })}
              className="w-full"
            />
          </FormField>
        </div>

        <FormField label="Catatan">
          <InputText
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Catatan produksi..."
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