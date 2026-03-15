import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { Eye, Trash2, Plus } from 'lucide-react'
import api from '../services/api'
import type { Order, OrderDetail, CreateOrderRequest, OrderItemRequest } from '../types/order.types'
import { formatRupiah, formatDate } from '../utils/format'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Modal from '../components/common/ui/Modal'
import FormField from '../components/common/ui/FormField'
import StatusBadge from '../components/common/ui/StatusBadge'
import Button from '../components/common/ui/Button'
import FilterBar from '../components/common/ui/FilterBar'
import ItemRow from '../components/common/ui/ItemRow'

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

const statusOrderOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Process', value: 'PROCESS' },
  { label: 'Done', value: 'DONE' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Filter
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [filterDateRange, setFilterDateRange] = useState<[Date | null, Date | null]>([null, null])

  // Forms
  const defaultForm: CreateOrderRequest = {
    customerName: '', customerPhone: '', customerAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    requiredDate: '',
    items: [{ productId: '', quantity: 1 }],
    initialPayment: 0, paymentType: 'DP', notes: '',
  }
  const [form, setForm] = useState<CreateOrderRequest>(defaultForm)
  const [newStatus, setNewStatus] = useState('')
  const [paymentForm, setPaymentForm] = useState({
    amount: 0, paymentType: 'SETTLEMENT',
    paymentDate: new Date().toISOString().split('T')[0], notes: '',
  })

  const fetchOrders = async () => {
    const res = await api.get('/orders')
    setOrders(res.data.data)
  }

  const fetchDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await api.get(`/orders/${id}`)
      setSelectedOrder(res.data.data)
      setNewStatus(res.data.data.status)
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

  const handleCreate = async () => {
    setError('')
    setSubmitting(true)
    try {
      await api.post('/orders', form)
      await fetchOrders()
      setShowCreateModal(false)
      setForm(defaultForm)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal membuat order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return
    setError('')
    setSubmitting(true)
    try {
      await api.put(`/orders/${selectedOrder.id}/status`, { status: newStatus })
      await fetchDetail(selectedOrder.id)
      await fetchOrders()
      setShowStatusModal(false)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal update status')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPayment = async () => {
    if (!selectedOrder) return
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/orders/${selectedOrder.id}/payments`, paymentForm)
      await fetchDetail(selectedOrder.id)
      await fetchOrders()
      setShowPaymentModal(false)
      setPaymentForm({ amount: 0, paymentType: 'SETTLEMENT', paymentDate: new Date().toISOString().split('T')[0], notes: '' })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal tambah pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus order ini?')) return
    try {
      await api.delete(`/orders/${id}`)
      await fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal menghapus')
    }
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', quantity: 1 }] })
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
  const updateItem = (i: number, field: keyof OrderItemRequest, value: any) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: value }
    setForm({ ...form, items })
  }

  const totalAmount = form.items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)
    return sum + (product?.defaultPrice ?? 0) * (item.quantity ?? 0)
  }, 0)

  const sisaBayar = selectedOrder ? selectedOrder.totalAmount - selectedOrder.paidAmount : 0

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
    { header: 'No. Order', body: (row: Order) => (
      <span style={{ fontWeight: 500, color: 'var(--accent)', fontSize: 12 }}>{row.orderNumber}</span>
    )},
    { header: 'Customer', field: 'customerName' },
    { header: 'Tgl Order', body: (row: Order) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.orderDate)}</span>
    )},
    { header: 'Tgl Dibutuhkan', body: (row: Order) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.requiredDate ? formatDate(row.requiredDate) : '-'}</span>
    )},
    { header: 'Total', body: (row: Order) => (
      <span style={{ fontWeight: 500 }}>{formatRupiah(row.totalAmount)}</span>
    )},
    { header: 'Status', body: (row: Order) => <StatusBadge status={row.status} /> },
    { header: 'Pembayaran', body: (row: Order) => <StatusBadge status={row.paymentStatus} /> },
    { header: 'Aksi', body: (row: Order) => (
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
    )},
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
      />

      <Table data={filteredOrders} columns={columns} loading={loading} emptyMessage="Belum ada order" />

      {/* ── CREATE MODAL ── */}
      <Modal
        visible={showCreateModal}
        onHide={() => { setShowCreateModal(false); setError(''); setForm(defaultForm) }}
        title="Buat Order Baru"
        onConfirm={handleCreate}
        confirmLabel="Buat Order"
        loading={submitting}
        width="560px"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Info Customer</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Nama Customer" required>
              <InputText value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nama customer" className="w-full" />
            </FormField>
            <FormField label="No. HP">
              <InputText value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="08xx" className="w-full" />
            </FormField>
          </div>
          <FormField label="Alamat">
            <InputText value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} placeholder="Alamat pengiriman" className="w-full" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Tanggal Order" required>
              <InputText type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} className="w-full" />
            </FormField>
            <FormField label="Tanggal Dibutuhkan">
              <InputText type="date" value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} className="w-full" />
            </FormField>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Produk</div>
            <Button label="Tambah Produk" icon={<Plus size={11} />} size="small" variant="secondary" onClick={addItem} />
          </div>
          {form.items.map((item, i) => (
            <ItemRow
                key={i}
                index={i}
                onRemove={() => removeItem(i)}
                showRemove={form.items.length > 1}
            >
                <FormField label="Produk" required>
                <Dropdown
                    value={item.productId}
                    onChange={(e) => updateItem(i, 'productId', e.value)}
                    options={products}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Pilih produk"
                    className="w-full"
                />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FormField label="Qty">
                    <InputNumber
                    value={item.quantity}
                    onValueChange={(e) => updateItem(i, 'quantity', e.value ?? 1)}
                    min={1}
                    className="w-full"
                    />
                </FormField>
                <FormField label="Subtotal">
                    <div style={{ padding: '8px 10px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--muted)' }}>
                    {formatRupiah((products.find(p => p.id === item.productId)?.defaultPrice ?? 0) * (item.quantity ?? 0))}
                    </div>
                </FormField>
                </div>
            </ItemRow>
            ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Total: {formatRupiah(totalAmount)}</span>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Pembayaran Awal (Opsional)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Jumlah Bayar">
              <InputNumber value={form.initialPayment} onValueChange={(e) => setForm({ ...form, initialPayment: e.value ?? 0 })} prefix="Rp " className="w-full" />
            </FormField>
            <FormField label="Tipe Pembayaran">
              <Dropdown value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.value })} options={[{ label: 'DP', value: 'DP' }, { label: 'Lunas', value: 'SETTLEMENT' }]} className="w-full" />
            </FormField>
          </div>
        </div>

        <FormField label="Catatan">
          <InputText value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." className="w-full" />
        </FormField>

        {error && <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>{error}</div>}
      </Modal>

      {/* ── DETAIL MODAL ── */}
      <Modal
        visible={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedOrder(null) }}
        title={selectedOrder?.orderNumber ?? 'Detail Order'}
        width="640px"
      >
        {detailLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: 24, color: 'var(--accent)' }} />
          </div>
        ) : selectedOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status & Aksi */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusBadge status={selectedOrder.status} />
                <StatusBadge status={selectedOrder.paymentStatus} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button label="Update Status" variant="secondary" size="small" onClick={() => setShowStatusModal(true)} />
                {selectedOrder.paymentStatus !== 'PAID' && (
                  <Button label="Tambah Bayar" icon={<Plus size={12} />} size="small" onClick={() => setShowPaymentModal(true)} />
                )}
              </div>
            </div>

            {/* Info Customer */}
            <div style={{ background: 'var(--sidebar-bg)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Info Customer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Nama', value: selectedOrder.customerName },
                  { label: 'No. HP', value: selectedOrder.customerPhone || '-' },
                  { label: 'Tgl Order', value: formatDate(selectedOrder.orderDate) },
                  { label: 'Tgl Dibutuhkan', value: selectedOrder.requiredDate ? formatDate(selectedOrder.requiredDate) : '-' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
              {selectedOrder.customerAddress && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Alamat</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{selectedOrder.customerAddress}</div>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Produk Dipesan</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Produk', 'Qty', 'Harga', 'Subtotal'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px', fontSize: 13, fontWeight: 500 }}>{item.productName}</td>
                      <td style={{ padding: '8px', fontSize: 13, color: 'var(--muted)' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', fontSize: 13, color: 'var(--muted)' }}>{formatRupiah(item.unitPrice)}</td>
                      <td style={{ padding: '8px', fontSize: 13, fontWeight: 500 }}>{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Total</td>
                    <td style={{ padding: '10px 8px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{formatRupiah(selectedOrder.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Ringkasan Bayar */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Total', value: formatRupiah(selectedOrder.totalAmount), color: 'var(--text)' },
                { label: 'Dibayar', value: formatRupiah(selectedOrder.paidAmount), color: '#2E7D32' },
                { label: 'Sisa', value: formatRupiah(sisaBayar), color: sisaBayar > 0 ? '#C62828' : '#2E7D32' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, background: 'var(--sidebar-bg)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* History Pembayaran */}
            {selectedOrder.payments.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>History Pembayaran</div>
                {selectedOrder.payments.map((payment) => (
                  <div key={payment.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                        {payment.paymentType === 'DP' ? 'Down Payment' : 'Pelunasan'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatDate(payment.paymentDate)}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2E7D32' }}>{formatRupiah(payment.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* ── UPDATE STATUS MODAL ── */}
      <Modal
        visible={showStatusModal}
        onHide={() => { setShowStatusModal(false); setError('') }}
        title="Update Status Order"
        onConfirm={handleUpdateStatus}
        confirmLabel="Update"
        loading={submitting}
        width="360px"
      >
        <FormField label="Status Baru" required>
          <Dropdown value={newStatus} onChange={(e) => setNewStatus(e.value)} options={statusOrderOptions} className="w-full" />
        </FormField>
        {error && <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>{error}</div>}
      </Modal>

      {/* ── ADD PAYMENT MODAL ── */}
      <Modal
        visible={showPaymentModal}
        onHide={() => { setShowPaymentModal(false); setError('') }}
        title="Tambah Pembayaran"
        onConfirm={handleAddPayment}
        confirmLabel="Simpan"
        loading={submitting}
        width="400px"
      >
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Sisa tagihan: <strong style={{ color: '#C62828' }}>{formatRupiah(sisaBayar)}</strong>
        </div>
        <FormField label="Jumlah Bayar" required>
          <InputNumber value={paymentForm.amount} onValueChange={(e) => setPaymentForm({ ...paymentForm, amount: e.value ?? 0 })} prefix="Rp " className="w-full" />
        </FormField>
        <FormField label="Tipe Pembayaran" required>
          <Dropdown value={paymentForm.paymentType} onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.value })} options={[{ label: 'DP', value: 'DP' }, { label: 'Pelunasan', value: 'SETTLEMENT' }]} className="w-full" />
        </FormField>
        <FormField label="Tanggal Bayar" required>
          <InputText type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} className="w-full" />
        </FormField>
        <FormField label="Catatan">
          <InputText value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Catatan pembayaran..." className="w-full" />
        </FormField>
        {error && <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>{error}</div>}
      </Modal>
    </div>
  )
}