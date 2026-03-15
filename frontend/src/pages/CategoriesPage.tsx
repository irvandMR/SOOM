import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Trash2, Pencil } from 'lucide-react'
import api from '../services/api'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Modal from '../components/common/ui/Modal'
import FormField from '../components/common/ui/FormField'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'

interface Category { id: string; name: string; type: string }

const typeOptions = [
  { label: 'Ingredient', value: 'INGREDIENT' },
  { label: 'Product', value: 'PRODUCT' },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', type: 'INGREDIENT' })
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const fetchCategories = async () => {
    const res = await api.get('/categories')
    setCategories(res.data.data)
  }

  useEffect(() => {
    fetchCategories().finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
        if (editCategory) {
            // Konfirmasi sebelum update
            confirmDialog({
            message: 'Perubahan akan disimpan.',
            header: 'Update Kategori?',
            icon: 'pi pi-pencil',
            acceptLabel: 'Update',
            rejectLabel: 'Batal',
            accept: async () => {
                setError('')
                setSubmitting(true)
                try {
                await api.put(`/categories/${editCategory.id}`, form)
                await fetchCategories()
                setShowModal(false)
                setForm({ name: '', type: 'INGREDIENT' })
                setEditCategory(null)
                toast.success('Berhasil', 'Kategori berhasil diupdate')
                } catch (err: any) {
                setError(err.response?.data?.message ?? 'Gagal menyimpan')
                } finally {
                setSubmitting(false)
                }
            },
            })
            return
        }

        // Tambah baru — langsung simpan tanpa konfirmasi
        setError('')
        setSubmitting(true)
        try {
            await api.post('/categories', form)
            await fetchCategories()
            setShowModal(false)
            setForm({ name: '', type: 'INGREDIENT' })
            toast.success('Berhasil', 'Kategori berhasil ditambahkan')
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Gagal menyimpan')
        } finally {
            setSubmitting(false)
        }
    }

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
    { header: 'Tipe', body: (row: Category) => (
      <span style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
        background: row.type === 'INGREDIENT' ? '#E8F5E9' : '#E3F2FB',
        color: row.type === 'INGREDIENT' ? '#2E7D32' : '#1565A0',
      }}>
        {row.type}
      </span>
    )},
    { header: 'Aksi', body: (row: Category) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Button
          label="Edit"
          icon={<Pencil size={12} />}
          variant="secondary"
          size="small"
          tooltip="Edit"
          onClick={() => {
            setEditCategory(row)
            setForm({ name: row.name, type: row.type })
            setShowModal(true)
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
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Kategori"
        subtitle={`${categories.length} kategori terdaftar`}
        actionLabel="Tambah Kategori"
        onAction={() => {
          setEditCategory(null)
          setForm({ name: '', type: 'INGREDIENT' })
          setShowModal(true)
        }}
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
      />

      <Table
        data={filteredCategories}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada kategori"
      />

      <Modal
        visible={showModal}
        onHide={() => { setShowModal(false); setError(''); setEditCategory(null) }}
        title={editCategory ? 'Edit Kategori' : 'Tambah Kategori'}
        onConfirm={handleSave}
        confirmLabel="Simpan"
        loading={submitting}
        width="380px"
      >
        <FormField label="Nama Kategori" required>
          <InputText
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Tepung"
            className="w-full"
            autoFocus
          />
        </FormField>
        <FormField label="Tipe" required>
          <Dropdown
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.value })}
            options={typeOptions}
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