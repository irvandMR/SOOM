import { useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { z } from 'zod'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'
import type { IngredientRequest } from '../../types/ingredient.types'

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nama bahan baku wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  unitId: z.string().min(1, 'Unit wajib dipilih'),
  minimumStock: z.number().min(0),
})

interface Category { id: string; name: string }
interface Unit { id: string; name: string; symbol: string }

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  categories: Category[]
  units: Unit[]
}

export default function AddModalIngredient({
  visible,
  onHide,
  onSuccess,
  categories,
  units,
}: Props) {
  const [form, setForm] = useState<IngredientRequest>({
    name: '',
    categoryId: '',
    unitId: '',
    minimumStock: 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setForm({
      name: '',
      categoryId: '',
      unitId: '',
      minimumStock: 0,
    })
    setErrors({})
  }

  // 🔥 reusable handler
  const handleChange = (field: keyof IngredientRequest, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    // clear error langsung
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    const result = ingredientSchema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}

      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string
        fieldErrors[key] = issue.message
      })

      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await api.post('/ingredients', form)

      onSuccess()
      onHide()
      resetForm()

      toast.success('Berhasil', 'Bahan baku berhasil ditambahkan')
    } catch (err: any) {
      setErrors({
        api: err.response?.data?.message ?? 'Gagal menambahkan',
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
      title="Tambah Bahan Baku"
      onConfirm={handleSave}
      confirmLabel="Simpan"
      loading={submitting}
    >
      {/* Nama */}
      <FormField label="Nama Bahan Baku" required>
        <InputText
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Contoh: Tepung Terigu"
          className={`w-full ${errors.name ? 'p-invalid' : ''}`}
          autoFocus
        />
        {errors.name ? <small className="p-error">{errors.name}</small> : null}
      </FormField>

      {/* Kategori */}
      <FormField label="Kategori" required>
        <Dropdown
          value={form.categoryId}
          onChange={(e) => handleChange('categoryId', e.value)}
          options={categories}
          optionLabel="name"
          optionValue="id"
          placeholder="Pilih kategori"
          className={`w-full ${errors.categoryId ? 'p-invalid' : ''}`}
        />
        {errors.categoryId ? (
          <small className="p-error">{errors.categoryId}</small>
        ) : null}
      </FormField>

      {/* Unit */}
      <FormField label="Unit" required>
        <Dropdown
          value={form.unitId}
          onChange={(e) => handleChange('unitId', e.value)}
          options={units}
          optionLabel="name"
          optionValue="id"
          placeholder="Pilih unit"
          className={`w-full ${errors.unitId ? 'p-invalid' : ''}`}
        />
        {errors.unitId ? (
          <small className="p-error">{errors.unitId}</small>
        ) : null}
      </FormField>

      {/* Minimum Stock */}
      <FormField label="Minimum Stok">
        <InputNumber
          value={form.minimumStock}
          onValueChange={(e) =>
            handleChange('minimumStock', e.value ?? 0)
          }
          className="w-full"
          minFractionDigits={0}
          maxFractionDigits={3}
        />
      </FormField>

      {/* API Error */}
      {errors.api ? (
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
      ) : null}
    </Modal>
  )
}