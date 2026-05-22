import { useState } from 'react'
import { Eye } from 'lucide-react'
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
import { useOrders, useOrderDetail, ORDER_KEYS } from '../hooks/queries/useOrderQueries'
import { useProducts } from '../hooks/queries/useProductQueries'
import { useQueryClient } from '@tanstack/react-query'

export default function OrderPage() {
  const queryClient = useQueryClient()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'orderDate',
    sortOrder: -1 as 1 | -1 | 0 | null,
    search: '',
    status: 'ALL',
    paymentStatus: 'ALL',
    dateRange: [null, null] as [Date | null, Date | null]
  })

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: pageData, isLoading } = useOrders({
    page: lazyParams.page,
    size: lazyParams.rows,
    search: lazyParams.search || undefined,
    sort: `${lazyParams.sortField},${lazyParams.sortOrder === 1 ? 'asc' : 'desc'}`,
    status: lazyParams.status,
    paymentStatus: lazyParams.paymentStatus
  })

  const { data: allProducts = [] } = useProducts({ page: 0, size: 1000 })
  const products = (allProducts as any)?.content?.filter((p: any) => p.type !== 'RESELL') || []

  // Fetch detail hanya saat modal aktif & ada id yang dipilih
  const { data: selectedOrder, isLoading: detailLoading } = useOrderDetail(
    (showDetailModal || showStatusModal || showPaymentModal) ? selectedOrderId : null
  )

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onPage = (event: any) => {
    const pageNumber = Math.floor(event.first / event.rows)
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: pageNumber }))
  }

  const onSort = (event: any) => {
    setLazyParams(prev => ({ ...prev, sortField: event.sortField, sortOrder: event.sortOrder }))
  }

  const handleOpenDetail = (id: string) => {
    setSelectedOrderId(id)
    setShowDetailModal(true)
  }

  const refreshDetail = () => {
    if (selectedOrderId) {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(selectedOrderId) })
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() })
    }
  }

  const orders = pageData?.content || []
  const totalRecords = pageData?.totalElements || 0

  const columns = [
    {
      header: 'No. Order', field: 'orderNumber', sortable: true, body: (row: Order) => (
        <span style={{ fontWeight: 500, color: 'var(--accent)', fontSize: 12 }}>{row.orderNumber}</span>
      )
    },
    { header: 'Customer', field: 'customerName', sortable: true },
    {
      header: 'Tgl Order', field: 'orderDate', sortable: true, body: (row: Order) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.orderDate)}</span>
      )
    },
    {
      header: 'Tgl Dibutuhkan', field: 'requiredDate', sortable: true, body: (row: Order) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {row.requiredDate ? formatDate(row.requiredDate) : '-'}
        </span>
      )
    },
    {
      header: 'Total', field: 'totalAmount', sortable: true, body: (row: Order) => (
        <span style={{ fontWeight: 500 }}>{formatRupiah(row.totalAmount)}</span>
      )
    },
    { header: 'Status', field: 'status', sortable: true, body: (row: Order) => <StatusBadge status={row.status} /> },
    { header: 'Pembayaran', field: 'paymentStatus', sortable: true, body: (row: Order) => <StatusBadge status={row.paymentStatus} /> },
    {
      header: 'Aksi', body: (row: Order) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            label="Detail"
            icon={<Eye size={12} />}
            variant="secondary"
            size="small"
            tooltip="Lihat Detail"
            onClick={() => handleOpenDetail(row.id)}
          />
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Order"
        subtitle={`${totalRecords} order terdaftar`}
        actionLabel="Buat Order"
        onAction={() => setShowCreateModal(true)}
      />

      <FilterBar
        config={{
          search: { 
            value: lazyParams.search, 
            onChange: (v) => setLazyParams(p => ({ ...p, search: v, page: 0, first: 0 })), 
            placeholder: 'Cari customer atau no. order...' 
          },
          dateRange: {
            value: lazyParams.dateRange,
            onChange: (val) => setLazyParams(p => ({ ...p, dateRange: val ?? [null, null], page: 0, first: 0 })),
            placeholder: 'Filter tanggal'
          },
          dropdowns: [
            {
              value: lazyParams.status,
              onChange: (v) => setLazyParams(p => ({ ...p, status: v, page: 0, first: 0 })),
              options: [
                { label: 'Semua Status', value: 'ALL' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Process', value: 'PROCESS' },
                { label: 'Done', value: 'DONE' },
                { label: 'Delivered', value: 'DELIVERED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ],
              placeholder: 'Status Order',
            },
            {
              value: lazyParams.paymentStatus,
              onChange: (v) => setLazyParams(p => ({ ...p, paymentStatus: v, page: 0, first: 0 })),
              options: [
                { label: 'Semua Pembayaran', value: 'ALL' },
                { label: 'Belum Bayar', value: 'UNPAID' },
                { label: 'DP', value: 'DP' },
                { label: 'Lunas', value: 'PAID' },
              ],
              placeholder: 'Status Bayar',
            },
          ],
        }}
        onReset={() => setLazyParams(p => ({ ...p, search: '', status: 'ALL', paymentStatus: 'ALL', dateRange: [null, null], page: 0, first: 0 }))}
        hasActiveFilter={!!(lazyParams.search || lazyParams.status !== 'ALL' || lazyParams.paymentStatus !== 'ALL' || lazyParams.dateRange?.[0])}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() })}
      />

      <Table
        data={orders}
        columns={columns}
        loading={isLoading}
        emptyMessage="Belum ada order"
        lazy
        totalRecords={totalRecords}
        first={lazyParams.first}
        rows={lazyParams.rows}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
      />

      <CreateModalOrder
        visible={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() })}
        products={products}
      />

      <DetailModalOrder
        visible={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedOrderId(null) }}
        order={(selectedOrder as OrderDetail) ?? null}
        loading={detailLoading}
        onUpdateStatus={() => setShowStatusModal(true)}
        onAddPayment={() => setShowPaymentModal(true)}
      />

      <UpdateStatusModalOrder
        visible={showStatusModal}
        onHide={() => setShowStatusModal(false)}
        onSuccess={refreshDetail}
        order={(selectedOrder as OrderDetail) ?? null}
      />

      <AddPaymentModalOrder
        visible={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        onSuccess={refreshDetail}
        order={(selectedOrder as OrderDetail) ?? null}
      />
    </div>
  )
}