import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import api from '../services/api'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import AddModalUserManagement from '../components/user/addModalUserManagement'
import EditModalUserManagement from '../components/user/editModalUserManagement'

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

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchUsers = async () => {
    const res = await api.get('/users')
    setUsers(res.data.data)
  }

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false))
  }, [])

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
              setShowEditModal(true)
            }}
          />
          {row.role !== 'admin' && (
            <Button
              label="Hapus"
              icon={<Trash2 size={12} />}
              variant="danger"
              size="small"
              tooltip="Hapus"
              onClick={() => handleDelete(row.id)}
            />
          )}
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
        onAction={() => setShowAddModal(true)}
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

      <AddModalUserManagement
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchUsers}
      />

      <EditModalUserManagement
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={fetchUsers}
        user={editUser}
      />
    </div>
  )
}