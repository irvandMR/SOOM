import { useEffect, useState } from 'react'
import { Dropdown } from 'primereact/dropdown'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'
import type { OrderDetail } from '../../types/order.types'

const statusOrderOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Process', value: 'PROCESS' },
  { label: 'Done', value: 'DONE' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  order: OrderDetail | null
}

export default function UpdateStatusModalOrder({ visible, onHide, onSuccess, order }: Props) {
    
  const [newStatus, setNewStatus] = useState(order?.status ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (order?.status) {
            setNewStatus(order.status)
        }
    }, [order])

  const handleSave = async () => {
    if (!order) return
    if (!newStatus) {
      setErrors({ status: 'Status wajib dipilih' })
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await api.put(`/orders/${order.id}/status`, { status: newStatus })
      onSuccess()
      onHide()
      toast.success('Berhasil', 'Status order berhasil diupdate')
    } catch (err: any) {
      setErrors({ api: err.response?.data?.message ?? 'Gagal update status' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      onHide={() => { onHide(); setErrors({}) }}
      title="Update Status Order"
      onConfirm={handleSave}
      confirmLabel="Update"
      loading={submitting}
      width="360px"
    >
      <FormField label="Status Baru" required>
        <Dropdown
          value={newStatus}
          onChange={(e) => setNewStatus(e.value)}
          options={statusOrderOptions}
          className={`w-full ${errors.status ? 'p-invalid' : ''}`}
        />
        {errors.status && <small className="p-error">{errors.status}</small>}
      </FormField>

      {errors.api && (
        <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>
          {errors.api}
        </div>
      )}
    </Modal>
  )
}