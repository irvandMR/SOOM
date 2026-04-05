import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { z } from 'zod'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import { confirmDialog } from '../common/ui/ConfirmDialog'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
]

const activeOptions = [
  { label: 'Aktif', value: true },
  { label: 'Tidak Aktif', value: false },
]

const userSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  role: z.string().min(1, 'Role wajib diisi'),
  isActive: z.boolean(),
})

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  user: User | null
}

export default function EditModalUserManagement({
  visible,
  onHide,
  onSuccess,
  user,
}: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'user',
    isActive: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // 🔥 set data + reset error saat user berubah
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.active,
      })
      setErrors({})
    }
  }, [user])

  // 🔥 reusable handler (fix utama)
  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    // clear error field langsung
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    if (!user) return

    const result = userSchema.safeParse(form)

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
      header: 'Update User?',
      icon: 'pi pi-pencil',
      acceptLabel: 'Update',
      rejectLabel: 'Batal',
      accept: async () => {
        setSubmitting(true)
        try {
          await api.put(`/users/${user.id}`, form)

          onSuccess()
          onHide()
          setErrors({})

          toast.success('Berhasil', 'User berhasil diupdate')
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
      title="Edit User"
      onConfirm={handleSave}
      confirmLabel="Simpan"
      loading={submitting}
      width="420px"
    >
      {/* Nama */}
      <FormField label="Nama" required>
        <InputText
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Contoh: John Doe"
          className={`w-full ${errors.name ? 'p-invalid' : ''}`}
          autoFocus
        />
        {errors.name ? <small className="p-error">{errors.name}</small> : null}
      </FormField>

      {/* Email */}
      <FormField label="Email" required>
        <InputText
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Contoh: john@email.com"
          className={`w-full ${errors.email ? 'p-invalid' : ''}`}
        />
        {errors.email ? <small className="p-error">{errors.email}</small> : null}
      </FormField>

      {/* Role */}
      <FormField label="Role" required>
        <Dropdown
          value={form.role}
          onChange={(e) => handleChange('role', e.value)}
          options={roleOptions}
          className={`w-full ${errors.role ? 'p-invalid' : ''}`}
        />
        {errors.role ? <small className="p-error">{errors.role}</small> : null}
      </FormField>

      {/* Status */}
      <FormField label="Status" required>
        <Dropdown
          value={form.isActive}
          onChange={(e) => handleChange('isActive', e.value)}
          options={activeOptions}
          className="w-full"
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