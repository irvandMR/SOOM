import { useEffect, useState } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import api from '../services/api'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import StatusBadge from '../components/common/ui/StatusBadge'
import CreateModalOrder from '../components/order/createModalOrder'
import DetailModalOrder from '../components/order/detailModalOrder'
import UpdateStatusModalOrder from '../components/order/updateStatusModalOrder'
import AddPaymentModalOrder from '../components/order/addPaymentModalOrder'
import { formatRupiah, formatDate } from '../utils/format'
import type { Order, OrderDetail } from '../types/order.types'

interface Product { id: string; name: string; defaultPrice: number }

const statusOptions = [
  { label: 'Semua Status', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Process', value: 'PROCESS' },
  { label: 'Done', value: 'DONE' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const paymentStatusOptions = [
  { label: 'Semua Pembayaran', value: '' },
  { label: 'Belum Bayar', value: 'UNPAID' },
  { label: 'DP', value: 'DP' },
  { label: 'Lunas', value: 'PAID' },
]

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [filterDateRange, setFilterDateRange] = useState<[Date | null, Date | null]>([null, null])

  const fetchOrders = async () => {
    const res = await api.get('/orders')
    setOrders(res.data.data)
  }

  const fetchDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await api.get(`/orders/${id}`)
      setSelectedOrder(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/products'),
        ])
        setOrders(ordersRes.data.data)
        setProducts(productsRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleDelete = (id: string) => {
    confirmDialog({
      message: 'Order ini akan dihapus permanen.',
      header: 'Hapus Order?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await api.delete(`/orders/${id}`)
          await fetchOrders()
          toast.success('Berhasil', 'Order berhasil dihapus')
        } catch (err: any) {
          toast.error('Gagal', 'Gagal menghapus')
        }
      },
    })
  }

  const handleSuccessStatus = async () => {
    if (selectedOrder) await fetchDetail(selectedOrder.id)
    await fetchOrders()
  }

  const handleSuccessPayment = async () => {
    if (selectedOrder) await fetchDetail(selectedOrder.id)
    await fetchOrders()
  }

  const hasActiveFilter = !!(search || filterStatus || filterPaymentStatus || filterDateRange[0])

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || o.status === filterStatus
    const matchPayment = !filterPaymentStatus || o.paymentStatus === filterPaymentStatus
    const matchDate = (() => {
      if (!filterDateRange[0]) return true
      const orderDate = new Date(o.orderDate)
      const start = filterDateRange[0]!
      const end = filterDateRange[1] ?? filterDateRange[0]!
      return orderDate >= start && orderDate <= end
    })()
    return matchSearch && matchStatus && matchPayment && matchDate
  })

  const columns = [
    {
      header: 'No. Order', body: (row: Order) => (
        <span style={{ fontWeight: 500, color: 'var(--accent)', fontSize: 12 }}>{row.orderNumber}</span>
      )
    },
    { header: 'Customer', field: 'customerName' },
    {
      header: 'Tgl Order', body: (row: Order) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.orderDate)}</span>
      )
    },
    {
      header: 'Tgl Dibutuhkan', body: (row: Order) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.requiredDate ? formatDate(row.requiredDate) : '-'}</span>
      )
    },
    {
      header: 'Total', body: (row: Order) => (
        <span style={{ fontWeight: 500 }}>{formatRupiah(row.totalAmount)}</span>
      )
    },
    { header: 'Status', body: (row: Order) => <StatusBadge status={row.status} /> },
    { header: 'Pembayaran', body: (row: Order) => <StatusBadge status={row.paymentStatus} /> },
    {
      header: 'Aksi', body: (row: Order) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            label="Detail"
            icon={<Eye size={12} />}
            variant="secondary"
            size="small"
            tooltip="Lihat Detail"
            onClick={() => { fetchDetail(row.id); setShowDetailModal(true) }}
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
        title="Order"
        subtitle={`${filteredOrders.length} order ditampilkan`}
        actionLabel="Buat Order"
        onAction={() => setShowCreateModal(true)}
      />

      <FilterBar
        config={{
          search: { value: search, onChange: setSearch, placeholder: 'Cari customer atau no. order...' },
          dateRange: { value: filterDateRange, onChange: setFilterDateRange, placeholder: 'Filter tanggal' },
          dropdowns: [
            { value: filterStatus, onChange: setFilterStatus, options: statusOptions, placeholder: 'Status Order' },
            { value: filterPaymentStatus, onChange: setFilterPaymentStatus, options: paymentStatusOptions, placeholder: 'Status Bayar' },
          ],
        }}
        onReset={() => { setSearch(''); setFilterStatus(''); setFilterPaymentStatus(''); setFilterDateRange([null, null]) }}
        hasActiveFilter={hasActiveFilter}
        onRefresh={fetchOrders}
      />

      <Table data={filteredOrders} columns={columns} loading={loading} emptyMessage="Belum ada order" />

      <CreateModalOrder
        visible={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={fetchOrders}
        products={products}
      />

      <DetailModalOrder
        visible={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedOrder(null) }}
        order={selectedOrder}
        loading={detailLoading}
        onUpdateStatus={() => setShowStatusModal(true)}
        onAddPayment={() => setShowPaymentModal(true)}
      />

      <UpdateStatusModalOrder
        visible={showStatusModal}
        onHide={() => setShowStatusModal(false)}
        onSuccess={handleSuccessStatus}
        order={selectedOrder}
      />

      <AddPaymentModalOrder
        visible={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        onSuccess={handleSuccessPayment}
        order={selectedOrder}
      />
    </div>
  )
}