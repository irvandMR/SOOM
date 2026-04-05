import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import AddModalCategory from '../components/categories/addModalCategory'
import EditModalCategory from '../components/categories/editModalCategory'
import {
  useCategories,
  useDeleteCategory,
  CATEGORY_KEYS,
} from '../hooks/queries/useCategoryQueries'
import { useQueryClient } from '@tanstack/react-query'

interface Category {
  id: string
  name: string
  type: string
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'name',
    sortOrder: 1 as 1 | -1 | 0 | null,
    search: '',
    filterType: 'ALL'
  })

  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: pageData, isLoading } = useCategories({
    page: lazyParams.page,
    size: lazyParams.rows,
    search: lazyParams.search || undefined,
    sort: `${lazyParams.sortField},${lazyParams.sortOrder === 1 ? 'asc' : 'desc'}`
  })

  const deleteCategory = useDeleteCategory()

  const categories = pageData?.content || []
  const totalRecords = pageData?.totalElements || 0

  const refresh = () => queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onPage = (event: any) => {
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: event.page }))
  }

  const onSort = (event: any) => {
    setLazyParams(prev => ({ ...prev, sortField: event.sortField, sortOrder: event.sortOrder }))
  }

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'Kategori ini akan dihapus permanen.',
      header: 'Hapus Kategori?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: () => deleteCategory.mutate(id),
    })
  }

  const columns = [
    { header: 'Nama', field: 'name', sortable: true },
    {
      header: 'Tipe', field: 'type', sortable: true, body: (row: Category) => (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
          background: row.type === 'INGREDIENT' ? '#E8F5E9' : '#E3F2FB',
          color: row.type === 'INGREDIENT' ? '#2E7D32' : '#1565A0',
        }}>
          {row.type}
        </span>
      )
    },
    {
      header: 'Aksi', body: (row: Category) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            label="Edit"
            icon={<Pencil size={12} />}
            variant="secondary"
            size="small"
            tooltip="Edit"
            onClick={() => { setEditCategory(row); setShowEditModal(true) }}
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
        title="Kategori"
        subtitle={`${totalRecords} kategori terdaftar`}
        actionLabel="Tambah Kategori"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: { 
            value: lazyParams.search, 
            onChange: (v) => setLazyParams(p => ({ ...p, search: v, page: 0, first: 0 })), 
            placeholder: 'Cari nama kategori...' 
          },
          dropdowns: [{
            value: lazyParams.filterType,
            onChange: (v) => setLazyParams(p => ({ ...p, filterType: v, page: 0, first: 0 })),
            options: [
              { label: 'Semua Tipe', value: 'ALL' },
              { label: 'Ingredient', value: 'INGREDIENT' },
              { label: 'Product', value: 'PRODUCT' },
            ],
            placeholder: 'Tipe',
          }],
        }}
        onReset={() => setLazyParams(p => ({ ...p, search: '', filterType: 'ALL', page: 0, first: 0 }))}
        hasActiveFilter={!!(lazyParams.search || lazyParams.filterType !== 'ALL')}
        onRefresh={refresh}
      />

      <Table
        data={categories}
        columns={columns}
        loading={isLoading}
        emptyMessage="Belum ada kategori"
        lazy
        totalRecords={totalRecords}
        first={lazyParams.first}
        rows={lazyParams.rows}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
      />

      <AddModalCategory
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
      />

      <EditModalCategory
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={refresh}
        category={editCategory}
      />
    </div>
  )
}