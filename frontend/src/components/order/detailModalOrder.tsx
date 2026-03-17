import { Plus } from 'lucide-react'
import Modal from '../common/ui/Modal'
import StatusBadge from '../common/ui/StatusBadge'
import Button from '../common/ui/Button'
import { formatRupiah, formatDate } from '../../utils/format'
import type { OrderDetail } from '../../types/order.types'

interface Props {
  visible: boolean
  onHide: () => void
  order: OrderDetail | null
  loading: boolean
  onUpdateStatus: () => void
  onAddPayment: () => void
}

export default function DetailModalOrder({ visible, onHide, order, loading, onUpdateStatus, onAddPayment }: Props) {
  const sisaBayar = order ? order.totalAmount - order.paidAmount : 0
  const isDelivered = order?.status === 'DELIVERED'

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      title={order?.orderNumber ?? 'Detail Order'}
      width="640px"
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: 24, color: 'var(--accent)' }} />
        </div>
      ) : order ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status & Aksi */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isDelivered ? (
                <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
                  Order sudah delivered
                </span>
              ) : (
                <Button label="Update Status" variant="secondary" size="small" onClick={onUpdateStatus} />
              )}
              {order.paymentStatus !== 'PAID' && (
                <Button label="Tambah Bayar" icon={<Plus size={12} />} size="small" onClick={onAddPayment} />
              )}
            </div>
          </div>

          {/* Info Customer */}
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Info Customer</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Nama', value: order.customerName },
                { label: 'No. HP', value: order.customerPhone || '-' },
                { label: 'Tgl Order', value: formatDate(order.orderDate) },
                { label: 'Tgl Dibutuhkan', value: order.requiredDate ? formatDate(order.requiredDate) : '-' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>
            {order.customerAddress && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Alamat</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{order.customerAddress}</div>
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
                {order.items.map((item) => (
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
                  <td style={{ padding: '10px 8px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{formatRupiah(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Ringkasan Bayar */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Total', value: formatRupiah(order.totalAmount), color: 'var(--text)' },
              { label: 'Dibayar', value: formatRupiah(order.paidAmount), color: '#2E7D32' },
              { label: 'Sisa', value: formatRupiah(sisaBayar), color: sisaBayar > 0 ? '#C62828' : '#2E7D32' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: 'var(--sidebar-bg)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* History Pembayaran */}
          {order.payments.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>History Pembayaran</div>
              {order.payments.map((payment) => (
                <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
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
  )
}