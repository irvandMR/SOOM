import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { z } from 'zod'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import { confirmDialog } from '../common/ui/ConfirmDialog'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'

const typeOptions = [
  { label: 'Ingredient', value: 'INGREDIENT' },
  { label: 'Product', value: 'PRODUCT' },
]

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  type: z.string().min(1, 'Tipe wajib diisi'),
})

interface Category {
  id: string
  name: string
  type: string
}

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  category: Category | null
}

export default function EditModalCategory({
  visible,
  onHide,
  onSuccess,
  category,
}: Props) {
  const [form, setForm] = useState({ name: '', type: 'INGREDIENT' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // 🔥 set data + reset error
  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        type: category.type,
      })
      setErrors({})
    }
  }, [category])

  // 🔥 reusable handler
  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    // clear error langsung
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    if (!category) return

    const result = categorySchema.safeParse(form)

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

    confirmDialog({
      message: 'Perubahan akan disimpan.',
      header: 'Update Kategori?',
      icon: 'pi pi-pencil',
      acceptLabel: 'Update',
      rejectLabel: 'Batal',
      accept: async () => {
        setSubmitting(true)
        try {
          await api.put(`/categories/${category.id}`, form)

          onSuccess()
          onHide()
          setErrors({})

          toast.success('Berhasil', 'Kategori berhasil diupdate')
        } catch (err: any) {
          setErrors({
            api: err.response?.data?.message ?? 'Gagal menyimpan',
          })
        } finally {
          setSubmitting(false)
        }
      },
    })
  }

  return (
    <Modal
      visible={visible}
      onHide={() => {
        onHide()
        setErrors({})
      }}
      title="Edit Kategori"
      onConfirm={handleSave}
      confirmLabel="Update"
      loading={submitting}
      width="380px"
    >
      {/* Nama */}
      <FormField label="Nama Kategori" required>
        <InputText
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Contoh: Tepung"
          className={`w-full ${errors.name ? 'p-invalid' : ''}`}
          autoFocus
        />
        {errors.name ? <small className="p-error">{errors.name}</small> : null}
      </FormField>

      {/* Tipe */}
      <FormField label="Tipe" required>
        <Dropdown
          value={form.type}
          onChange={(e) => handleChange('type', e.value)}
          options={typeOptions}
          className={`w-full ${errors.type ? 'p-invalid' : ''}`}
        />
        {errors.type ? <small className="p-error">{errors.type}</small> : null}
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