import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import api from '../services/api'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import AddModalCategory from '../components/categories/addModalCategory'
import EditModalCategory from '../components/categories/editModalCategory'

interface Category {
  id: string
  name: string
  type: string
}

const typeOptions = [
  { label: 'Ingredient', value: 'INGREDIENT' },
  { label: 'Product', value: 'PRODUCT' },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchCategories = async () => {
    const res = await api.get('/categories')
    setCategories(res.data.data)
  }

  useEffect(() => {
    fetchCategories().finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    confirmDialog({
      message: 'Kategori ini akan dihapus permanen.',
      header: 'Hapus Kategori?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await api.delete(`/categories/${id}`)
          await fetchCategories()
          toast.success('Berhasil', 'Kategori berhasil dihapus')
        } catch (err: any) {
          toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus')
        }
      },
    })
  }

  const hasActiveFilter = !!(search || filterType)

  const filteredCategories = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || c.type === filterType
    return matchSearch && matchType
  })

  const columns = [
    { header: 'Nama', field: 'name' },
    {
      header: 'Tipe', body: (row: Category) => (
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
            onClick={() => {
              setEditCategory(row)
              setShowEditModal(true)
            }}
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
        subtitle={`${categories.length} kategori terdaftar`}
        actionLabel="Tambah Kategori"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: { value: search, onChange: setSearch, placeholder: 'Cari nama kategori...' },
          dropdowns: [{
            value: filterType,
            onChange: setFilterType,
            options: [{ label: 'Semua Tipe', value: '' }, ...typeOptions],
            placeholder: 'Tipe',
          }],
        }}
        onReset={() => { setSearch(''); setFilterType('') }}
        hasActiveFilter={hasActiveFilter}
        onRefresh={fetchCategories}
      />

      <Table
        data={filteredCategories}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada kategori"
      />

      <AddModalCategory
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchCategories}
      />

      <EditModalCategory
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={fetchCategories}
        category={editCategory}
      />
    </div>
  )
}