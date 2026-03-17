import { useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { z } from 'zod'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'
import { formatRupiah } from '../../utils/format'
import type { OrderDetail } from '../../types/order.types'

const paymentSchema = z.object({
  amount: z.number().min(1, 'Jumlah bayar wajib diisi'),
  paymentType: z.string().min(1),
  paymentDate: z.string().min(1, 'Tanggal wajib diisi'),
  notes: z.string().optional(),
})

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  order: OrderDetail | null
}

export default function AddPaymentModalOrder({
  visible,
  onHide,
  onSuccess,
  order,
}: Props) {
  const [form, setForm] = useState({
    amount: 0,
    paymentType: 'SETTLEMENT',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const sisaBayar = order
    ? order.totalAmount - order.paidAmount
    : 0

  const resetForm = () => {
    setForm({
      amount: 0,
      paymentType: 'SETTLEMENT',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setErrors({})
  }

  // 🔥 FIX UTAMA DI SINI
  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    // hapus error field yg sedang diubah
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const handleSave = async () => {
    if (!order) return

    const result = paymentSchema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}

      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string
        fieldErrors[key] = issue.message
      })

      setErrors(fieldErrors)
      return
    }

    if (form.amount > sisaBayar) {
      setErrors({
        amount: 'Jumlah melebihi sisa tagihan',
      })
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await api.post(`/orders/${order.id}/payments`, form)

      onSuccess()
      onHide()
      resetForm()

      toast.success('Berhasil', 'Pembayaran berhasil ditambahkan')
    } catch (err: any) {
      setErrors({
        api: err.response?.data?.message ?? 'Gagal tambah pembayaran',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      onHide={() => {
        onHide()
        resetForm()
      }}
      title="Tambah Pembayaran"
      onConfirm={handleSave}
      confirmLabel="Simpan"
      loading={submitting}
      width="400px"
    >
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        Sisa tagihan:{' '}
        <strong style={{ color: '#C62828' }}>
          {formatRupiah(sisaBayar)}
        </strong>
      </div>

      <FormField label="Jumlah Bayar" required>
        <InputNumber
          value={form.amount}
          onValueChange={(e) =>
            handleChange('amount', e.value ?? 0)
          }
          prefix="Rp "
          className={`w-full ${errors.amount ? 'p-invalid' : ''}`}
        />
        {errors.amount && (
          <small className="p-error">{errors.amount}</small>
        )}
      </FormField>

      <FormField label="Tipe Pembayaran" required>
        <Dropdown
          value={form.paymentType}
          onChange={(e) =>
            handleChange('paymentType', e.value)
          }
          options={[
            { label: 'DP', value: 'DP' },
            { label: 'Pelunasan', value: 'SETTLEMENT' },
          ]}
          className="w-full"
        />
      </FormField>

      <FormField label="Tanggal Bayar" required>
        <InputText
          type="date"
          value={form.paymentDate}
          onChange={(e) =>
            handleChange('paymentDate', e.target.value)
          }
          className={`w-full ${errors.paymentDate ? 'p-invalid' : ''}`}
        />
        {errors.paymentDate && (
          <small className="p-error">{errors.paymentDate}</small>
        )}
      </FormField>

      <FormField label="Catatan">
        <InputText
          value={form.notes}
          onChange={(e) =>
            handleChange('notes', e.target.value)
          }
          placeholder="Catatan pembayaran..."
          className="w-full"
        />
      </FormField>

      {errors.api && (
        <div
          style={{
            background: '#FFEBEE',
            color: '#C62828',
            fontSize: 12,
            padding: '8px 10px',
            borderRadius: 6,
          }}
        >
          {errors.api}
        </div>
      )}
    </Modal>
  )
}