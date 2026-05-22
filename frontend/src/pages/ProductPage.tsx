import { useState } from 'react'
import type { Product, Recipe } from '../types/product.types'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import Pagination from '../components/common/ui/Pagination'
import DetailProductModal from '../components/product/detailProductModal'
import RecipeManageModal from '../components/product/recipeManageModal'
import AddProductModal from '../components/product/addProductModal'
import ProductCard from '../components/product/ProductCard'
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
    const pageNumber = Math.floor(event.first / event.rows)
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: pageNumber }))
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

  // Card layout - removed table columns definition

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

      {/* Pagination Top */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Pagination
          total={totalRecords}
          rows={lazyParams.rows}
          first={lazyParams.first}
          onPageChange={(newFirst) => {
            const pageNumber = Math.floor(newFirst / lazyParams.rows)
            setLazyParams(prev => ({ ...prev, first: newFirst, page: pageNumber }))
          }}
          onRowsChange={(newRows) => {
            setLazyParams(prev => ({ ...prev, rows: newRows, first: 0, page: 0 }))
          }}
        />
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
          color: 'var(--muted)',
        }}>
          Loading...
        </div>
      ) : products.length === 0 ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
          color: 'var(--muted)',
          fontSize: 14,
        }}>
          Belum ada produk
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDetail={handleOpenDetail}
              onRecipe={handleOpenRecipe}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      

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