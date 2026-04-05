import { useState } from 'react'
import { Trash2, Eye, ChefHat } from 'lucide-react'
import type { Product, Recipe } from '../types/product.types'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import DetailProductModal from '../components/product/detailProductModal'
import RecipeManageModal from '../components/product/recipeManageModal'
import AddProductModal from '../components/product/addProductModal'
import {
  useProducts,
  useProductRecipes,
  useDeleteProduct,
  PRODUCT_KEYS,
} from '../hooks/queries/useProductQueries'
import { useCategories } from '../hooks/queries/useCategoryQueries'
import { useUnits } from '../hooks/queries/useUnitQueries'
import { useIngredients } from '../hooks/queries/useIngredientQueries'
import { useQueryClient } from '@tanstack/react-query'

interface Category { id: string; name: string; type?: string }

const typeLabel: Record<string, string> = {
  MADE_TO_ORDER: 'Made to Order',
  MADE_TO_STOCK: 'Made to Stock',
  RESELL: 'Resell',
}

export default function ProductPage() {
  const queryClient = useQueryClient()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'name',
    sortOrder: 1 as 1 | -1 | 0 | null,
    search: '',
    filterType: 'ALL',
    filterCategory: 'ALL'
  })

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: pageData, isLoading } = useProducts({
    page: lazyParams.page,
    size: lazyParams.rows,
    search: lazyParams.search || undefined,
    sort: `${lazyParams.sortField},${lazyParams.sortOrder === 1 ? 'asc' : 'desc'}`
  })

  const { data: catData } = useCategories({ size: 100 })
  const { data: unitData } = useUnits({ size: 100 })
  const { data: ingredientData } = useIngredients({ page: 0, size: 1000 }) // for lookup
  const ingredients = ingredientData?.content || []
  const deleteProduct = useDeleteProduct()

  const categories = (catData?.content || []).filter((c: Category) => c?.type === 'PRODUCT')
  const units = unitData?.content || []
  const products = pageData?.content || []
  const totalRecords = pageData?.totalElements || 0

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onPage = (event: any) => {
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: event.page }))
  }

  const onSort = (event: any) => {
    setLazyParams(prev => ({ ...prev, sortField: event.sortField, sortOrder: event.sortOrder }))
  }

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Fetch recipes hanya saat ada produk yang dipilih
  const { data: recipes = [], isLoading: recipeLoading } = useProductRecipes(selectedProduct?.id ?? null)

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'Produk ini akan dihapus permanen.',
      header: 'Hapus Produk?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: () => deleteProduct.mutate(id),
    })
  }

  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product)
    setShowDetailModal(true)
  }

  const handleOpenRecipe = (product: Product) => {
    setSelectedProduct(product)
    setShowRecipeModal(true)
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })

  const columns = [
    { header: 'Nama', field: 'name', sortable: true },
    {
      header: 'Tipe', field: 'type', sortable: true, body: (row: Product) => (
        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap', background: '#EEF0FB', color: '#5B6BD4' }}>
          {typeLabel[row.type] ?? row.type}
        </span>
      )
    },
    {
      header: 'Kategori', field: 'category.name', sortable: true, body: (row: Product) => (
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
      header: 'Stok', field: 'stockQuantity', sortable: true, body: (row: Product) => (
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
            onClick={() => handleOpenDetail(row)}
          />
          <Button label="Resep" icon={<ChefHat size={12} />} variant="secondary" size="small"
            tooltip="Kelola Resep"
            onClick={() => handleOpenRecipe(row)}
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
        subtitle={`${totalRecords} produk terdaftar`}
        actionLabel="Tambah Produk"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: { 
            value: lazyParams.search, 
            onChange: (v) => setLazyParams(p => ({ ...p, search: v, page: 0, first: 0 })), 
            placeholder: 'Cari nama produk...' 
          },
          dropdowns: [
            {
              value: lazyParams.filterCategory,
              onChange: (v) => setLazyParams(p => ({ ...p, filterCategory: v, page: 0, first: 0 })),
              options: [
                { label: 'Semua Kategori', value: 'ALL' },
                ...categories.map((c: Category) => ({ label: c.name, value: c.name })),
              ],
              placeholder: 'Kategori',
            },
            {
              value: lazyParams.filterType,
              onChange: (v) => setLazyParams(p => ({ ...p, filterType: v, page: 0, first: 0 })),
              options: [
                { label: 'Semua Tipe', value: 'ALL' },
                { label: 'Made to Order', value: 'MADE_TO_ORDER' },
                { label: 'Made to Stock', value: 'MADE_TO_STOCK' },
                { label: 'Resell', value: 'RESELL' },
              ],
              placeholder: 'Tipe Produk',
            },
          ],
        }}
        onReset={() => setLazyParams(p => ({ ...p, search: '', filterType: 'ALL', filterCategory: 'ALL', page: 0, first: 0 }))}
        hasActiveFilter={!!(lazyParams.search || lazyParams.filterType !== 'ALL' || lazyParams.filterCategory !== 'ALL')}
        onRefresh={refresh}
      />

      <Table
        data={products}
        columns={columns}
        loading={isLoading}
        emptyMessage="Belum ada produk"
        lazy
        totalRecords={totalRecords}
        first={lazyParams.first}
        rows={lazyParams.rows}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
      />

      <AddProductModal
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
        units={units as any}
        categories={categories}
      />

      <DetailProductModal
        visible={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedProduct(null) }}
        product={selectedProduct}
        recipes={recipes as Recipe[]}
        loading={recipeLoading}
        onRecipeModal={() => { setShowDetailModal(false); setShowRecipeModal(true) }}
      />

      <RecipeManageModal
        visible={showRecipeModal}
        onHide={() => setShowRecipeModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.recipes(selectedProduct?.id ?? '') })}
        recipes={recipes as Recipe[]}
        product={selectedProduct}
        onRecipeModal={() => setShowRecipeModal(false)}
        loading={recipeLoading}
        ingredients={ingredients as any}
        units={units as any}
      />
    </div>
  )
}