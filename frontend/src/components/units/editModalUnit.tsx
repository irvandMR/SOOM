import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { z } from 'zod'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import { confirmDialog } from '../common/ui/ConfirmDialog'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'

const unitSchema = z.object({
  name: z.string().min(1, 'Nama unit wajib diisi'),
  symbol: z.string().min(1, 'Simbol wajib diisi'),
})

interface Unit {
  id: string
  name: string
  symbol: string
}

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  unit: Unit | null
}

export default function EditModalUnit({
  visible,
  onHide,
  onSuccess,
  unit,
}: Props) {
  const [form, setForm] = useState({ name: '', symbol: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // 🔥 set data + reset error
  useEffect(() => {
    if (unit) {
      setForm({
        name: unit.name,
        symbol: unit.symbol,
      })
      setErrors({})
    }
  }, [unit])

  // 🔥 reusable handler
  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    // clear error langsung
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    if (!unit) return

    const result = unitSchema.safeParse(form)

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
      header: 'Update Unit?',
      icon: 'pi pi-pencil',
      acceptLabel: 'Update',
      rejectLabel: 'Batal',
      accept: async () => {
        setSubmitting(true)
        try {
          await api.put(`/units/${unit.id}`, form)

          onSuccess()
          onHide()
          setErrors({})

          toast.success('Berhasil', 'Unit berhasil diupdate')
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
      title="Edit Unit"
      onConfirm={handleSave}
      confirmLabel="Update"
      loading={submitting}
      width="380px"
    >
      {/* Nama */}
      <FormField label="Nama Unit" required>
        <InputText
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Contoh: Kilogram"
          className={`w-full ${errors.name ? 'p-invalid' : ''}`}
          autoFocus
        />
        {errors.name ? <small className="p-error">{errors.name}</small> : null}
      </FormField>

      {/* Simbol */}
      <FormField label="Simbol" required>
        <InputText
          value={form.symbol}
          onChange={(e) => handleChange('symbol', e.target.value)}
          placeholder="Contoh: kg"
          className={`w-full ${errors.symbol ? 'p-invalid' : ''}`}
        />
        {errors.symbol ? <small className="p-error">{errors.symbol}</small> : null}
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