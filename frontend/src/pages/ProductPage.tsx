import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { Plus, Trash2, Eye, ChefHat } from 'lucide-react'
import api from '../services/api'
import type { Product, ProductRequest, Recipe, RecipeRequest, RecipeItemRequest } from '../types/product.types'
import { formatRupiah } from '../utils/format'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Modal from '../components/common/ui/Modal'
import FormField from '../components/common/ui/FormField'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import ItemRow from '../components/common/ui/ItemRow'
import { useNavigate } from 'react-router'

interface Category { id: string; name: string }
interface Unit { id: string; name: string; symbol: string }
interface Ingredient { id: string; name: string; unitSymbol: string }

const typeOptions = [
  { label: 'Made to Order', value: 'MADE_TO_ORDER' },
  { label: 'Made to Stock', value: 'MADE_TO_STOCK' },
  { label: 'Resell', value: 'RESELL' },
]

const typeLabel: Record<string, string> = {
  MADE_TO_ORDER: 'Made to Order',
  MADE_TO_STOCK: 'Made to Stock',
  RESELL: 'Resell',
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipeLoading, setRecipeLoading] = useState(false)

  // Filter
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  // Forms
  const defaultForm: ProductRequest = {
    name: '', categoryId: '', unitId: '',
    type: 'MADE_TO_ORDER', defaultPrice: 0, targetMargin: 30,
  }
  const [form, setForm] = useState<ProductRequest>(defaultForm)
  const [recipeForm, setRecipeForm] = useState<RecipeRequest>({
    notes: '',
    items: [{ ingredientId: '', quantity: 0 }],
  })

  const fetchProducts = async () => {
    const res = await api.get('/products')
    setProducts(res.data.data)
  }

  const fetchRecipes = async (productId: string) => {
    setRecipeLoading(true)
    try {
      const res = await api.get(`/products/${productId}/recipes`)
      setRecipes(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setRecipeLoading(false)
    }
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, catRes, unitRes, ingRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
          api.get('/units'),
          api.get('/ingredients'),
        ])
        setProducts(prodRes.data.data)
        setCategories(catRes.data.data)
        setUnits(unitRes.data.data)
        setIngredients(ingRes.data.data)
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
      await api.post('/products', form)
      await fetchProducts()
      setShowAddModal(false)
      setForm(defaultForm)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menambahkan produk')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    try {
      await api.delete(`/products/${id}`)
      await fetchProducts()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal menghapus')
    }
  }

  const handleSaveRecipe = async () => {
    if (!selectedProduct) return
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/products/${selectedProduct.id}/recipes`, recipeForm)
      await fetchRecipes(selectedProduct.id)
      await fetchProducts()
      setRecipeForm({ notes: '', items: [{ ingredientId: '', quantity: 0 }] })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal simpan resep')
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivateRecipe = async (recipeId: string) => {
    if (!selectedProduct) return
    try {
      await api.put(`/products/${selectedProduct.id}/recipes/${recipeId}/activate`)
      await fetchRecipes(selectedProduct.id)
      await fetchProducts()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal aktifkan resep')
    }
  }

  const addRecipeItem = () => setRecipeForm({
    ...recipeForm,
    items: [...recipeForm.items, { ingredientId: '', quantity: 0 }]
  })

  const removeRecipeItem = (i: number) => setRecipeForm({
    ...recipeForm,
    items: recipeForm.items.filter((_, idx) => idx !== i)
  })

  const updateRecipeItem = (i: number, field: keyof RecipeItemRequest, value: any) => {
    const items = [...recipeForm.items]
    items[i] = { ...items[i], [field]: value }
    setRecipeForm({ ...recipeForm, items })
  }

  const hasActiveFilter = !!(search || filterType)

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || p.type === filterType
    return matchSearch && matchType
  })

  const recommendedPrice = selectedProduct
    ? selectedProduct.estimatedCost * (1 + selectedProduct.targetMargin / 100)
    : 0

  const columns = [
    { header: 'Nama', field: 'name' },
    { header: 'Tipe', body: (row: Product) => (
      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#E3F2FB', color: '#1565A0' }}>
        {typeLabel[row.type] ?? row.type}
      </span>
    )},
    { header: 'Kategori', body: (row: Product) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.categoryName}</span>
    )},
    { header: 'Harga', body: (row: Product) => (
      <span style={{ fontWeight: 500 }}>{formatRupiah(row.defaultPrice)}</span>
    )},
    { header: 'Est. Modal', body: (row: Product) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatRupiah(row.estimatedCost)}</span>
    )},
    { header: 'Stok', body: (row: Product) => (
      <span style={{ fontWeight: 500 }}>{row.stockQuantity} {row.unitName}</span>
    )},
    { header: 'Aksi', body: (row: Product) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Button
          label="Detail"
          icon={<Eye size={12} />}
          variant="secondary"
          size="small"
          tooltip="Lihat Detail"
          onClick={() => { setSelectedProduct(row); fetchRecipes(row.id); setShowDetailModal(true) }}
        />
        <Button
          label="Resep"
          icon={<ChefHat size={12} />}
          variant="secondary"
          size="small"
          tooltip="Kelola Resep"
          onClick={() => { setSelectedProduct(row); fetchRecipes(row.id); setShowRecipeModal(true) }}
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
        title="Produk & Resep"
        subtitle={`${products.length} produk terdaftar`}
        actionLabel="Tambah Produk"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: { value: search, onChange: setSearch, placeholder: 'Cari nama produk...' },
          dropdowns: [{
            value: filterType,
            onChange: setFilterType,
            options: [{ label: 'Semua Tipe', value: '' }, ...typeOptions],
            placeholder: 'Tipe Produk',
          }],
        }}
        onReset={() => { setSearch(''); setFilterType('') }}
        hasActiveFilter={hasActiveFilter}
      />

      <Table data={filteredProducts} columns={columns} loading={loading} emptyMessage="Belum ada produk" />

      {/* ── ADD MODAL ── */}
      <Modal
        visible={showAddModal}
        onHide={() => { setShowAddModal(false); setError(''); setForm(defaultForm) }}
        title="Tambah Produk Baru"
        onConfirm={handleAdd}
        confirmLabel="Simpan"
        loading={submitting}
        width="480px"
      >
        <FormField label="Nama Produk" required>
          <InputText value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" className="w-full" />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Kategori" required>
            <Dropdown value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.value })} options={categories} optionLabel="name" optionValue="id" placeholder="Pilih kategori" className="w-full" />
          </FormField>
          <FormField label="Unit" required>
            <Dropdown value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.value })} options={units} optionLabel="name" optionValue="id" placeholder="Pilih unit" className="w-full" />
          </FormField>
        </div>

        <FormField label="Tipe Produk" required>
          <Dropdown value={form.type} onChange={(e) => setForm({ ...form, type: e.value })} options={typeOptions} className="w-full" />
        </FormField>

        
          <FormField label="Harga Jual" required>
            <InputNumber value={form.defaultPrice} onValueChange={(e) => setForm({ ...form, defaultPrice: e.value ?? 0 })} prefix="Rp " className="w-full" />
          </FormField>
          <FormField label="Target Margin (%)">
            <InputNumber value={form.targetMargin} onValueChange={(e) => setForm({ ...form, targetMargin: e.value ?? 30 })} suffix="%" className="w-full" />
          </FormField>
        

        {error && <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>{error}</div>}
      </Modal>

      {/* ── DETAIL MODAL ── */}
      <Modal
        visible={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedProduct(null) }}
        title={selectedProduct?.name ?? 'Detail Produk'}
        width="500px"
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Info */}
            <div style={{ background: 'var(--sidebar-bg)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Kategori', value: selectedProduct.categoryName },
                  { label: 'Unit', value: selectedProduct.unitName },
                  { label: 'Tipe', value: typeLabel[selectedProduct.type] },
                  { label: 'Stok', value: `${selectedProduct.stockQuantity} ${selectedProduct.unitName}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimasi Modal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Harga Jual', value: formatRupiah(selectedProduct.defaultPrice), color: 'var(--accent)' },
                { label: 'Est. Modal', value: formatRupiah(selectedProduct.estimatedCost), color: 'var(--text)' },
                { label: 'Rek. Harga', value: formatRupiah(recommendedPrice), color: '#2E7D32' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--sidebar-bg)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Resep Aktif */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Resep Aktif
              </div>
              {recipeLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <i className="pi pi-spin pi-spinner" style={{ color: 'var(--accent)' }} />
                </div>
              ) : recipes.filter(r => r.isActive).length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
                  Belum ada resep aktif
                </div>
              ) : (
                recipes.filter(r => r.isActive).map(recipe => (
                  <div key={recipe.id}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                      Versi {recipe.versionNumber} · Est. Modal: {formatRupiah(recipe.estimatedCost)}
                    </div>
                    {recipe.items.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '6px 0', borderBottom: '1px solid var(--border)',
                        fontSize: 13,
                      }}>
                        <span>{item.ingredientName}</span>
                        <span style={{ color: 'var(--muted)' }}>{item.quantity} {item.unitSymbol}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                History Resep
                </div>
                <Button
                label="Lihat History Lengkap"
                variant="secondary"
                size="small"
                onClick={() => {
                    setShowRecipeModal(false)
                    navigate(`/products/${selectedProduct?.id}/recipes`)
                }}
                />
            </div>
          </div>
        )}
      </Modal>

      {/* ── RECIPE MODAL ── */}
      <Modal
        visible={showRecipeModal}
        onHide={() => { setShowRecipeModal(false); setError('') }}
        title={`Resep — ${selectedProduct?.name}`}
        width="580px"
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* History Resep */}
            {recipes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  History Resep
                </div>
                {recipes.map(recipe => (
                  <div key={recipe.id} style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8, padding: 12, marginBottom: 8,
                    background: recipe.isActive ? '#F0FFF4' : 'var(--white)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          Versi {recipe.versionNumber}
                        </span>
                        {recipe.isActive && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#E8F5E9', color: '#2E7D32', fontWeight: 500 }}>
                            Aktif
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          Est. {formatRupiah(recipe.estimatedCost)}
                        </span>
                        {!recipe.isActive && (
                          <Button
                            label="Aktifkan"
                            variant="secondary"
                            size="small"
                            onClick={() => handleActivateRecipe(recipe.id)}
                          />
                        )}
                      </div>
                    </div>
                    {recipe.items.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 12, padding: '4px 0',
                        borderTop: '1px solid var(--border)',
                      }}>
                        <span style={{ color: 'var(--text)' }}>{item.ingredientName}</span>
                        <span style={{ color: 'var(--muted)' }}>{item.quantity} {item.unitSymbol}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Tambah Resep Baru */}
            <div style={{ borderTop: recipes.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: recipes.length > 0 ? 16 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Tambah Versi Resep Baru
              </div>

              <FormField label="Catatan Resep">
                <InputText
                  value={recipeForm.notes}
                  onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
                  placeholder="Catatan versi resep ini..."
                  className="w-full"
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Bahan-bahan</div>
                <Button label="Tambah Bahan" icon={<Plus size={11} />} size="small" variant="secondary" onClick={addRecipeItem} />
              </div>

              {recipeForm.items.map((item, i) => {
                return (
                    <ItemRow
                    key={i}
                    index={i}
                    onRemove={() => removeRecipeItem(i)}
                    showRemove={recipeForm.items.length > 1}
                    >
                    <FormField label="Bahan Baku" required>
                        <Dropdown
                        value={item.ingredientId}
                        onChange={(e) => updateRecipeItem(i, 'ingredientId', e.value)}
                        options={ingredients}
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Pilih bahan"
                        className="w-full"
                        itemTemplate={(option) => (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{option.name}</span>
                            <span style={{
                                fontSize: 10, padding: '1px 6px', borderRadius: 4,
                                background: 'var(--sidebar-bg)', color: 'var(--muted)',
                                marginLeft: 8,
                            }}>
                                {option.unitSymbol}
                            </span>
                            </div>
                        )
                    }
                        />
                    </FormField>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                        <FormField label="Jumlah">
                        <InputNumber
                            value={item.quantity}
                            onValueChange={(e) => updateRecipeItem(i, 'quantity', e.value ?? 0)}
                            minFractionDigits={0}
                            maxFractionDigits={3}
                            className="w-full"
                        />
                        </FormField>

                    </div>
                    </ItemRow>
                )
                })}

              {error && <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>{error}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button
                  label="Simpan Resep"
                  icon={<Plus size={12} />}
                  onClick={handleSaveRecipe}
                  loading={submitting}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}