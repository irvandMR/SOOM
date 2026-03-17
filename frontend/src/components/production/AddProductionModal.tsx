import {  useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { z } from 'zod'
import api from '../../services/api'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'
import type { CreateProductionRequest } from '../../types/production.types'
import { toLocalDateTimeString } from '../../utils/format'

interface Product { id: string; name: string }
interface Recipe { id: string; versionNumber: number; isActive: boolean }

const schema = z.object({
  productId: z.string().min(1, 'Produk wajib dipilih'),
  recipeId: z.string().min(1, 'Resep wajib dipilih'),
  quantityProduced: z.number().min(1, 'Minimal 1'),
  productionDate: z.string().min(1, 'Tanggal wajib diisi'),
  expiredDate: z.string().min(1, 'Tanggal wajib diisi'),
})

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  products: Product[]
}

const defaultForm: CreateProductionRequest = {
  productId: '',
  recipeId: '',
  quantityProduced: 1,
  productionDate: new Date().toISOString().split('T')[0],
  notes: '',
  expiredDate: toLocalDateTimeString(new Date()) ,
}

export default function AddProductionModal({
  visible,
  onHide,
  onSuccess,
  products,
}: Props) {
  const [form, setForm] = useState<CreateProductionRequest>(defaultForm)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setForm(defaultForm)
    setRecipes([])
    setErrors({})
  }

  // 🔥 handle change (hapus error saat input)
  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    setErrors((prev) => {
      const newErr = { ...prev }
      delete newErr[field]
      return newErr
    })
  }

  const fetchRecipes = async (productId: string) => {
    try {
      const res = await api.get(`/products/${productId}/recipes`)
      const data = res.data.data
      setRecipes(data)

      const active = data.find((r: Recipe) => r.isActive)
      if (active) {
        setForm((prev) => ({ ...prev, recipeId: active.id }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async () => {
    const result = schema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}

      result.error.issues.forEach((i) => {
        const key = i.path[0] as string
        fieldErrors[key] = i.message
      })

      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      await api.post('/productions', form)

      onSuccess()
      onHide()
      resetForm()
    } catch (err: any) {
      setErrors({
        api: err.response?.data?.message ?? 'Gagal catat produksi',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      onHide={() => { onHide(); resetForm() }}
      title="Catat Produksi Baru"
      onConfirm={handleSave}
      confirmLabel="Simpan"
      loading={submitting}
      width="460px"
    >
      <FormField label="Produk" required>
        <Dropdown
          value={form.productId}
          onChange={(e) => {
            handleChange('productId', e.value)
            handleChange('recipeId', '')
            fetchRecipes(e.value)
          }}
          options={products}
          optionLabel="name"
          optionValue="id"
          placeholder="Pilih produk"
          className={`w-full ${errors.productId ? 'p-invalid' : ''}`}
        />
        {errors.productId && <small className="p-error">{errors.productId}</small>}
      </FormField>

      <FormField label="Resep" required>
        <Dropdown
          value={form.recipeId}
          onChange={(e) => handleChange('recipeId', e.value)}
          options={recipes.map(r => ({
            label: `Versi ${r.versionNumber}${r.isActive ? ' (Aktif)' : ''}`,
            value: r.id,
          }))}
          placeholder={form.productId ? 'Pilih resep' : 'Pilih produk dulu'}
          disabled={!form.productId}
          className={`w-full ${errors.recipeId ? 'p-invalid' : ''}`}
        />
        {errors.recipeId && <small className="p-error">{errors.recipeId}</small>}
      </FormField>
      <FormField label="Jumlah Produksi" required>
        <InputNumber
          value={form.quantityProduced}
          onValueChange={(e) => handleChange('quantityProduced', e.value ?? 1)}
          min={1}
          className={`w-full ${errors.quantityProduced ? 'p-invalid' : ''}`}
        />
        {errors.quantityProduced && <small className="p-error">{errors.quantityProduced}</small>}
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        <FormField label="Tanggal Produksi" required>
          <InputText
            type="date"
            value={form.productionDate}
            onChange={(e) => handleChange('productionDate', e.target.value)}
            className={`w-full ${errors.productionDate ? 'p-invalid' : ''}`}
          />
          {errors.productionDate && <small className="p-error">{errors.productionDate}</small>}
        </FormField>

        <FormField label="Tanggal Expired" required>
          <InputText
            type="datetime-local"
            value={form.expiredDate.slice(0,16)} // "yyyy-MM-ddTHH:mm"
            onChange={(e) => handleChange('expiredDate', e.target.value)}
            className={`w-full ${errors.expiredDate ? 'p-invalid' : ''}`}
          />
          {errors.expiredDate && <small className="p-error">{errors.expiredDate}</small>}
        </FormField>
        
      </div>

      <FormField label="Catatan">
        <InputText
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Catatan produksi..."
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