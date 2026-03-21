import { useEffect, useState } from 'react'
import { Trash2, Eye, ChefHat } from 'lucide-react'
import api from '../services/api'
import type { Product, Recipe } from '../types/product.types'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import DetailProductModal from '../components/product/detailProductModal'
import RecipeManageModal from '../components/product/recipeManageModal'
import AddProductModal from '../components/product/addProductModal'
import type { Unit } from '../types/unit.types'

interface Category { id: string; name: string }
interface Ingredient { id: string; name: string; unitSymbol: string, unitId: string }

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

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipeLoading, setRecipeLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [first, setFirst] = useState(0)

  const [filterCategory, setFilterCategory] = useState('ALL') 

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
        setCategories(catRes.data.data.filter((c: any) => c?.type === 'PRODUCT'))
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

  useEffect(() => {
    setFirst(0)
  }, [search, filterType, filterCategory])

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'Produk ini akan dihapus permanen.',
      header: 'Hapus Produk?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await api.delete(`/products/${id}`)
          await fetchProducts()
          toast.success('Berhasil', 'Produk berhasil dihapus')
        } catch (err: any) {
          toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus')
        }
      },
    })
  }

  const handleSuccessSaveRecipe = async () => {
    if (!selectedProduct) return
    await fetchRecipes(selectedProduct.id)
    await fetchProducts()
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'ALL' || p.type === filterType
    const matchCategory = filterCategory === 'ALL' || p.categoryName === filterCategory  // ← tambah
    return matchSearch && matchType && matchCategory
  })

  const columns = [
  { header: 'Nama', field: 'name' },
  {
    header: 'Tipe', body: (row: Product) => (
      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap', background: '#EEF0FB', color: '#5B6BD4' }}>
        {typeLabel[row.type] ?? row.type}
      </span>
    )
  },
  {
    header: 'Kategori', body: (row: Product) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.categoryName}</span>
    )
  },
  {
    header: 'Versi Resep', body: (row: Product) => (
      row.activeRecipeVersion
        ? <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
            background: '#E8F5E9', color: '#2E7D32',
          }}>
            v{row.activeRecipeVersion}
          </span>
        : <span style={{ fontSize: 12, color: 'var(--muted)' }}>—</span>
    )
  },
  {
    header: 'Stok', body: (row: Product) => (
      <span style={{ fontWeight: 500 }}>
        {row.stockQuantity} {row.stockUnitName ?? row.unitName}
      </span>
    )
  },
  {
    header: 'Aksi', body: (row: Product) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Button label="Detail" icon={<Eye size={12} />} variant="secondary" size="small"
          tooltip="Lihat Detail"
          onClick={() => { setSelectedProduct(row); fetchRecipes(row.id); setShowDetailModal(true) }}
        />
        <Button label="Resep" icon={<ChefHat size={12} />} variant="secondary" size="small"
          tooltip="Kelola Resep"
          onClick={() => { setSelectedProduct(row); fetchRecipes(row.id); setShowRecipeModal(true) }}
        />
        <Button label="Hapus" icon={<Trash2 size={12} />} variant="danger" size="small"
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
        title="Produk & Resep"
        subtitle={`${filteredProducts.length} produk terdaftar`}
        actionLabel="Tambah Produk"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: { value: search, onChange: setSearch, placeholder: 'Cari nama produk...' },
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
            value: filterType,
            onChange: setFilterType,
            options: [
              { label: 'Semua Tipe', value: 'ALL' },
              { label: 'Made to Order', value: 'MADE_TO_ORDER' },
              { label: 'Made to Stock', value: 'MADE_TO_STOCK' },
              { label: 'Resell', value: 'RESELL' },
            ],
            placeholder: 'Tipe Produk',
          }],
        }}
        onReset={() => { setSearch(''); setFilterType('ALL') }}
        hasActiveFilter={!!(search || filterType !== 'ALL')}
        onRefresh={fetchProducts}
      />

      <Table
        data={filteredProducts}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada produk"
        first={first}
        onFirstChange={setFirst}
      />

      <AddProductModal
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchProducts}
        units={units}
        categories={categories}
      />

      <DetailProductModal
        visible={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedProduct(null) }}
        product={selectedProduct}
        recipes={recipes}
        loading={loading}
        onRecipeModal={() => { setShowDetailModal(false); setShowRecipeModal(true) }}
      />

      <RecipeManageModal
        visible={showRecipeModal}
        onHide={() => setShowRecipeModal(false)}
        onSuccess={handleSuccessSaveRecipe}
        recipes={recipes}
        product={selectedProduct}
        onRecipeModal={() => setShowRecipeModal(false)}
        loading={recipeLoading}
        ingredients={ingredients}
        units={units}
      />
    </div>
  )
}