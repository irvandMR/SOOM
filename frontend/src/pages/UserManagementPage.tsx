import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import AddModalUserManagement from '../components/user/addModalUserManagement'
import EditModalUserManagement from '../components/user/editModalUserManagement'
import { useUsers, useDeleteUser, USER_KEYS } from '../hooks/queries/useUserQueries'
import { useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export default function UserManagementPage() {
  const queryClient = useQueryClient()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'name',
    sortOrder: 1 as 1 | -1 | 0 | null,
    search: '',
    filterRole: 'ALL',
    filterActive: 'ALL'
  })

  const [editUser, setEditUser] = useState<User | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: pageData, isLoading } = useUsers({
    page: lazyParams.page,
    size: lazyParams.rows,
    search: lazyParams.search || undefined,
    sort: `${lazyParams.sortField},${lazyParams.sortOrder === 1 ? 'asc' : 'desc'}`
  })

  const deleteUser = useDeleteUser()

  const users = pageData?.content || []
  const totalRecords = pageData?.totalElements || 0

  const refresh = () => queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onPage = (event: any) => {
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: event.page }))
  }

  const onSort = (event: any) => {
    setLazyParams(prev => ({ ...prev, sortField: event.sortField, sortOrder: event.sortOrder }))
  }

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'User ini akan dihapus permanen.',
      header: 'Hapus User?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: () => deleteUser.mutate(id),
    })
  }

  const columns = [
    { header: 'Nama', field: 'name', sortable: true },
    { header: 'Email', field: 'email', sortable: true },
    {
      header: 'Role', field: 'role', sortable: true, body: (row: User) => (
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
      header: 'Status', field: 'isActive', sortable: true, body: (row: any) => (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
          background: row.isActive ? '#E8F5E9' : '#FFEBEE',
          color: row.isActive ? '#2E7D32' : '#C62828',
        }}>
          {row.isActive ? 'Aktif' : 'Tidak Aktif'}
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
            onClick={() => { setEditUser(row); setShowEditModal(true) }}
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
        subtitle={`${totalRecords} user terdaftar`}
        actionLabel="Tambah User"
        onAction={() => setShowAddModal(true)}
      />

      <FilterBar
        config={{
          search: { 
            value: lazyParams.search, 
            onChange: (v) => setLazyParams(p => ({ ...p, search: v, page: 0, first: 0 })), 
            placeholder: 'Cari nama user...' 
          },
          dropdowns: [
            {
              value: lazyParams.filterRole,
              onChange: (v) => setLazyParams(p => ({ ...p, filterRole: v, page: 0, first: 0 })),
              options: [
                { label: 'Semua Role', value: 'ALL' },
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
              ],
              placeholder: 'Role',
            },
            {
              value: lazyParams.filterActive,
              onChange: (v) => setLazyParams(p => ({ ...p, filterActive: v, page: 0, first: 0 })),
              options: [
                { label: 'Semua Status', value: 'ALL' },
                { label: 'Aktif', value: 'true' },
                { label: 'Tidak Aktif', value: 'false' },
              ],
              placeholder: 'Status',
            },
          ],
        }}
        onReset={() => setLazyParams(p => ({ ...p, search: '', filterRole: 'ALL', filterActive: 'ALL', page: 0, first: 0 }))}
        hasActiveFilter={!!(lazyParams.search || lazyParams.filterRole !== 'ALL' || lazyParams.filterActive !== 'ALL')}
        onRefresh={refresh}
      />

      <Table
        data={users}
        columns={columns}
        loading={isLoading}
        emptyMessage="Belum ada user"
        lazy
        totalRecords={totalRecords}
        first={lazyParams.first}
        rows={lazyParams.rows}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
      />

      <AddModalUserManagement
        visible={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={refresh}
      />

      <EditModalUserManagement
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={refresh}
        user={editUser}
      />
    </div>
  )
}