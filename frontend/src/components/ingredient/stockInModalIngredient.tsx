import { useState, useEffect } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { z } from 'zod'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'
import { formatRupiah } from '../../utils/format'
import type { Ingredient, StockInRequest } from '../../types/ingredient.types'

const stockInSchema = z.object({
  quantity: z.number().min(0.001, 'Jumlah wajib diisi'),
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
  const [totalPrice, setTotalPrice] = useState<number>(0)   // ← harga total pembelian
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Auto-hitung purchasePrice per unit saat qty atau totalPrice berubah
  useEffect(() => {
    if (form.quantity > 0 && totalPrice > 0) {
      const pricePerUnit = totalPrice / form.quantity
      setForm(prev => ({ ...prev, purchasePrice: pricePerUnit }))
    } else {
      setForm(prev => ({ ...prev, purchasePrice: 0 }))
    }
  }, [form.quantity, totalPrice])

  const resetForm = () => {
    setForm({ quantity: 0, purchasePrice: 0, notes: '' })
    setTotalPrice(0)
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
          Stok saat ini: <strong>{ingredient.stockQuantity} {ingredient.unitSymbol}</strong>
        </div>
      )}

      <FormField label={`Jumlah (${ingredient?.unitSymbol ?? 'unit'})`} required>
        <InputNumber
          value={form.quantity}
          onValueChange={(e) => setForm(prev => ({ ...prev, quantity: e.value ?? 0 }))}
          className={`w-full ${errors.quantity ? 'p-invalid' : ''}`}
          minFractionDigits={0}
          maxFractionDigits={3}
        />
        {errors.quantity && <small className="p-error">{errors.quantity}</small>}
      </FormField>

      {/* ← Ganti dari harga per unit ke harga total */}
      <FormField label="Harga Total Pembelian">
        <InputNumber
          value={totalPrice}
          onValueChange={(e) => setTotalPrice(e.value ?? 0)}
          className="w-full"
          prefix="Rp "
          minFractionDigits={0}
        />
      </FormField>

      {/* Preview harga per unit — otomatis dihitung */}
      {form.quantity > 0 && totalPrice > 0 && (
        <div style={{
          background: 'var(--sidebar-bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          marginBottom: 8,
        }}>
          <span style={{ color: 'var(--muted)' }}>
            Harga per {ingredient?.unitSymbol}
          </span>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
            {formatRupiah(form.purchasePrice)}
          </span>
        </div>
      )}

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