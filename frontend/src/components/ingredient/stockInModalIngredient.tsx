import { useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { z } from 'zod'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'
import type { Ingredient, StockInRequest } from '../../types/ingredient.types'

const stockInSchema = z.object({
  quantity: z.number().min(1, 'Jumlah wajib diisi'),
  purchasePrice: z.number().min(0),
  notes: z.string().optional(),
})

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  ingredient: Ingredient | null
}

export default function StockInModalIngredient({ visible, onHide, onSuccess, ingredient }: Props) {
  const [form, setForm] = useState<StockInRequest>({ quantity: 0, purchasePrice: 0, notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setForm({ quantity: 0, purchasePrice: 0, notes: '' })
    setErrors({})
  }

  const handleSave = async () => {
    if (!ingredient) return
    const result = stockInSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await api.post(`/ingredients/${ingredient.id}/stock-in`, form)
      onSuccess()
      onHide()
      resetForm()
      toast.success('Berhasil', `Stok ${ingredient.name} berhasil ditambahkan`)
    } catch (err: any) {
      setErrors({ api: err.response?.data?.message ?? 'Gagal menambah stok' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      onHide={() => { onHide(); resetForm() }}
      title={`Tambah Stok — ${ingredient?.name}`}
      onConfirm={handleSave}
      confirmLabel="Tambah Stok"
      loading={submitting}
      width="400px"
    >
      {ingredient && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Stok saat ini: {ingredient.stockQuantity} {ingredient.unitSymbol}
        </div>
      )}

      <FormField label={`Jumlah (${ingredient?.unitSymbol})`} required>
        <InputNumber
          value={form.quantity}
          onValueChange={(e) => setForm({ ...form, quantity: e.value ?? 0 })}
          className={`w-full ${errors.quantity ? 'p-invalid' : ''}`}
          minFractionDigits={0}
          maxFractionDigits={3}
        />
        {errors.quantity && <small className="p-error">{errors.quantity}</small>}
      </FormField>

      <FormField label={`Harga Beli (per ${ingredient?.unitSymbol})`}>
        <InputNumber
          value={form.purchasePrice}
          onValueChange={(e) => setForm({ ...form, purchasePrice: e.value ?? 0 })}
          className="w-full"
          prefix="Rp "
          minFractionDigits={0}
        />
      </FormField>

      <FormField label="Catatan">
        <InputText
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Contoh: Beli di pasar"
          className="w-full"
        />
      </FormField>

      {errors.api && (
        <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>
          {errors.api}
        </div>
      )}
    </Modal>
  )
}