import { useState } from 'react'
import { Trash2, Plus, Pencil } from 'lucide-react'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'
import AddModalIngredient from '../components/ingredient/addModalIngredient'
import StockInModalIngredient from '../components/ingredient/stockInModalIngredient'
import EditModalIngredient from '../components/ingredient/editModalIngredient'
import { formatRupiah } from '../utils/format'
import type { Ingredient } from '../types/ingredient.types'
import {
  useIngredients,
  useDeleteIngredient,
  INGREDIENT_KEYS,
} from '../hooks/queries/useIngredientQueries'
import { useCategories } from '../hooks/queries/useCategoryQueries'
import { useUnits } from '../hooks/queries/useUnitQueries'
import { useQueryClient } from '@tanstack/react-query'

interface Category { id: string; name: string; type?: string }

export default function IngredientPage() {
  const queryClient = useQueryClient()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'name',
    sortOrder: 1 as 1 | -1 | 0 | null,
    search: '',
    filterStatus: 'ALL',
    filterCategory: 'ALL'
  })

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: pageData, isLoading } = useIngredients({
    page: lazyParams.page,
    size: lazyParams.rows,
    search: lazyParams.search || undefined,
    sort: `${lazyParams.sortField},${lazyParams.sortOrder === 1 ? 'asc' : 'desc'}`
  })

  const { data: catData } = useCategories({ size: 100 })
  const { data: unitData } = useUnits({ size: 100 })
  const deleteIngredient = useDeleteIngredient()

  const ingredients = pageData?.content || []
  const totalRecords = pageData?.totalElements || 0

  const categories = (catData?.content || []).filter((c: Category) => c?.type === 'INGREDIENT')
  const units = unitData?.content || []

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onPage = (event: any) => {
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: event.page }))
  }

  const onSort = (event: any) => {
    setLazyParams(prev => ({ ...prev, sortField: event.sortField, sortOrder: event.sortOrder }))
  }

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'Bahan baku ini akan dihapus permanen.',
      header: 'Hapus Bahan Baku?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: () => deleteIngredient.mutate(id),
    })
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: INGREDIENT_KEYS.lists() })

  const columns = [
    { header: 'Nama', field: 'name', sortable: true },
    {
      header: 'Kategori', field: 'category.name', sortable: true, body: (row: Ingredient) => (
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{row.categoryName}</span>
      )
    },
    {
      header: 'Stok', field: 'stockQuantity', sortable: true, body: (row: Ingredient) => (
        <span style={{ fontWeight: 500 }}>{row.stockQuantity} {row.unitSymbol}</span>
      )
    },
    {
      header: 'Min. Stok', field: 'minimumStock', sortable: true, body: (row: Ingredient) => (
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{row.minimumStock} {row.unitSymbol}</span>
      )
    },
    {
      header: 'Harga', field: 'purchasePrice', sortable: true, body: (row: Ingredient) => (
        <span style={{ fontSize: 12 }}>{formatRupiah(row.purchasePrice)} / {row.unitSymbol}</span>
      )
    },
    {
      header: 'Harga Rata-rata', field: 'avgPurchasePrice', sortable: true, body: (row: Ingredient) => (
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
          {row.stockQuantity > 0 && (
            <Button
              label="Edit"
              icon={<Pencil size={12} />}
              variant="secondary"
              size="small"
              tooltip="Edit"
              onClick={() => { setSelectedIngredient(row); setShowEditModal(true) }}
            />
          )}
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

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockInModal, setShowStockInModal] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  return (
    <div>
      <PageHeader
        title="Stok Bahan Baku"
        subtitle={`${totalRecords} bahan baku terdaftar`}
        actionLabel="Tambah Bahan Baku"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: { 
            value: lazyParams.search, 
            onChange: (v) => setLazyParams(p => ({ ...p, search: v, page: 0, first: 0 })), 
            placeholder: 'Cari nama bahan baku...' 
          },
          dropdowns: [
            {
              value: lazyParams.filterCategory,
              onChange: (v) => setLazyParams(p => ({ ...p, filterCategory: v, page: 0, first: 0 })),
              options: [
                { label: 'Semua Kategori', value: 'ALL' },
                ...(categories as Category[]).map(c => ({ label: c.name, value: c.name })),
              ],
              placeholder: 'Kategori',
            },
            {
              value: lazyParams.filterStatus,
              onChange: (v) => setLazyParams(p => ({ ...p, filterStatus: v, page: 0, first: 0 })),
              options: [
                { label: 'Semua Status', value: 'ALL' },
                { label: 'Aman', value: 'SAFE' },
                { label: 'Kritis', value: 'CRITICAL' },
              ],
              placeholder: 'Status',
            },
          ],
        }}
        onReset={() => setLazyParams(p => ({ ...p, search: '', filterStatus: 'ALL', filterCategory: 'ALL', page: 0, first: 0 }))}
        hasActiveFilter={!!(lazyParams.search || lazyParams.filterStatus !== 'ALL' || lazyParams.filterCategory !== 'ALL')}
        onRefresh={refresh}
      />

      <Table
        data={ingredients}
        columns={columns}
        loading={isLoading}
        emptyMessage="Belum ada bahan baku"
        lazy
        totalRecords={totalRecords}
        first={lazyParams.first}
        rows={lazyParams.rows}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
      />

      <AddModalIngredient
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
        categories={categories as any}
        units={units as any}
      />

      <EditModalIngredient
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={refresh}
        categories={categories as any}
        units={units as any}
        ingredient={selectedIngredient}
      />

      <StockInModalIngredient
        visible={showStockInModal}
        onHide={() => setShowStockInModal(false)}
        onSuccess={refresh}
        ingredient={selectedIngredient}
      />
    </div>
  )
}