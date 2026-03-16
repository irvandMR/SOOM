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

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
]

const activeOptions = [
  { label: 'Aktif', value: true },
  { label: 'Tidak Aktif', value: false },
]

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'user', isActive: true })
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState<string>('')

  const fetchUsers = async () => {
    const res = await api.get('/users')
    setUsers(res.data.data)
  }

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (editUser) {
      confirmDialog({
        message: 'Perubahan akan disimpan.',
        header: 'Update User?',
        icon: 'pi pi-pencil',
        acceptLabel: 'Update',
        rejectLabel: 'Batal',
        accept: async () => {
          setError('')
          setSubmitting(true)
          try {
            await api.put(`/users/${editUser.id}`, form)
            await fetchUsers()
            setShowModal(false)
            resetForm()
            toast.success('Berhasil', 'User berhasil diupdate')
          } catch (err: any) {
            setError(err.response?.data?.message ?? 'Gagal menyimpan')
          } finally {
            setSubmitting(false)
          }
        },
      })
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await api.post('/users', form)
      await fetchUsers()
      setShowModal(false)
      resetForm()
      toast.success('Berhasil', 'User berhasil ditambahkan')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    confirmDialog({
      message: 'User ini akan dihapus permanen.',
      header: 'Hapus User?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await api.delete(`/users/${id}`)
          await fetchUsers()
          toast.success('Berhasil', 'User berhasil dihapus')
        } catch (err: any) {
          toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus')
        }
      },
    })
  }

  const resetForm = () => {
    setForm({ name: '', email: '', role: 'user', isActive: true })
    setEditUser(null)
  }

  const hasActiveFilter = !!(search || filterRole || filterActive !== '')

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase())
    const matchRole = !filterRole || u.role === filterRole
    const matchActive = filterActive === '' || u.active === (filterActive === 'true')
    return matchSearch && matchRole && matchActive
  })

  const columns = [
    { header: 'Nama', field: 'name' },
    { header: 'Email', field: 'email' },
    {
      header: 'Role', body: (row: User) => (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
          background: row.role === 'admin' ? '#FFF3E0' : '#E3F2FB',
          color: row.role === 'admin' ? '#E65100' : '#1565A0',
        }}>
          {row.role.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Status', body: (row: User) => (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
          background: row.active ? '#E8F5E9' : '#FFEBEE',
          color: row.active ? '#2E7D32' : '#C62828',
        }}>
          {row.active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      )
    },
    {
      header: 'Aksi', body: (row: User) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            label="Edit"
            icon={<Pencil size={12} />}
            variant="secondary"
            size="small"
            tooltip="Edit"
            onClick={() => {
              setEditUser(row)
              setForm({ name: row.name, email: row.email, role: row.role, isActive: row.active })
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
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} user terdaftar`}
        actionLabel="Tambah User"
        onAction={() => {
          resetForm()
          setShowModal(true)
        }}
      />

      <FilterBar
        config={{
          search: { value: search, onChange: setSearch, placeholder: 'Cari nama user...' },
          dropdowns: [
            {
              value: filterRole,
              onChange: setFilterRole,
              options: [{ label: 'Semua Role', value: '' }, ...roleOptions],
              placeholder: 'Role',
            },
            {
              value: filterActive,
              onChange: setFilterActive,
              options: [
                { label: 'Semua Status', value: '' },
                { label: 'Aktif', value: 'true' },
                { label: 'Tidak Aktif', value: 'false' },
              ],
              placeholder: 'Status',
            },
          ],
        }}
        onReset={() => { setSearch(''); setFilterRole(''); setFilterActive('') }}
        hasActiveFilter={hasActiveFilter}
        onRefresh={fetchUsers}
      />

      <Table
        data={filteredUsers}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada user"
      />

      <Modal
        visible={showModal}
        onHide={() => { setShowModal(false); setError(''); resetForm() }}
        title={editUser ? 'Edit User' : 'Tambah User'}
        onConfirm={handleSave}
        confirmLabel="Simpan"
        loading={submitting}
        width="420px"
      >
        <FormField label="Nama" required>
          <InputText
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: John Doe"
            className="w-full"
            autoFocus
          />
        </FormField>
        <FormField label="Email" required>
          <InputText
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Contoh: john@email.com"
            className="w-full"
          />
        </FormField>
        <FormField label="Role" required>
          <Dropdown
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.value })}
            options={roleOptions}
            className="w-full"
          />
        </FormField>
        <FormField label="Status" required>
          <Dropdown
            value={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.value })}
            options={activeOptions}
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