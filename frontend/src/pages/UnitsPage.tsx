import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Trash2, Pencil } from 'lucide-react'
import api from '../services/api'
import { toast } from '../store/useToastStore'
import { confirmDialog } from '../components/common/ui/ConfirmDialog'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Modal from '../components/common/ui/Modal'
import FormField from '../components/common/ui/FormField'
import Button from '../components/common/ui/Button'

interface Unit { id: string; name: string; symbol: string }

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editUnit, setEditUnit] = useState<Unit | null>(null)
  const [form, setForm] = useState({ name: '', symbol: '' })

  const fetchUnits = async () => {
    const res = await api.get('/units')
    setUnits(res.data.data)
  }

  useEffect(() => {
    fetchUnits().finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (editUnit) {
      confirmDialog({
        message: 'Perubahan akan disimpan.',
        header: 'Update Unit?',
        icon: 'pi pi-pencil',
        acceptLabel: 'Update',
        rejectLabel: 'Batal',
        accept: async () => {
          setError('')
          setSubmitting(true)
          try {
            await api.put(`/units/${editUnit.id}`, form)
            await fetchUnits()
            setShowModal(false)
            setForm({ name: '', symbol: '' })
            setEditUnit(null)
            toast.success('Berhasil', 'Unit berhasil diupdate')
          } catch (err: any) {
            setError(err.response?.data?.message ?? 'Gagal menyimpan')
          } finally {
            setSubmitting(false)
          }
        },
      })
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await api.post('/units', form)
      await fetchUnits()
      setShowModal(false)
      setForm({ name: '', symbol: '' })
      toast.success('Berhasil', 'Unit berhasil ditambahkan')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    confirmDialog({
      message: 'Unit ini akan dihapus permanen.',
      header: 'Hapus Unit?',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await api.delete(`/units/${id}`)
          await fetchUnits()
          toast.success('Berhasil', 'Unit berhasil dihapus')
        } catch (err: any) {
          toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus')
        }
      },
    })
  }

  const columns = [
    { header: 'Nama', field: 'name' },
    { header: 'Simbol', body: (row: Unit) => (
      <span style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 4,
        background: 'var(--sidebar-bg)', color: 'var(--text)', fontWeight: 600,
      }}>
        {row.symbol}
      </span>
    )},
    { header: 'Aksi', body: (row: Unit) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <Button
          label="Edit"
          icon={<Pencil size={12} />}
          variant="secondary"
          size="small"
          tooltip="Edit"
          onClick={() => {
            setEditUnit(row)
            setForm({ name: row.name, symbol: row.symbol })
            setShowModal(true)
          }}
        />
        <Button
          label="Hapus"
          icon={<Trash2 size={12} />}
          variant="danger"
          size="small"
          tooltip="Hapus"
          onClick={() => handleDelete(row.id)}
        />
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Units"
        subtitle={`${units.length} unit terdaftar`}
        actionLabel="Tambah Unit"
        onAction={() => {
          setEditUnit(null)
          setForm({ name: '', symbol: '' })
          setShowModal(true)
        }}
      />

      <Table
        data={units}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada unit"
      />

      <Modal
        visible={showModal}
        onHide={() => { setShowModal(false); setError(''); setEditUnit(null) }}
        title={editUnit ? 'Edit Unit' : 'Tambah Unit'}
        onConfirm={handleSave}
        confirmLabel={editUnit ? 'Update' : 'Simpan'}
        loading={submitting}
        width="380px"
      >
        <FormField label="Nama Unit" required>
          <InputText
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Kilogram"
            className="w-full"
            autoFocus
          />
        </FormField>
        <FormField label="Simbol" required>
          <InputText
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            placeholder="Contoh: kg"
            className="w-full"
          />
        </FormField>
        {error && (
          <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>
            {error}
          </div>
        )}
      </Modal>
    </div>
  )
}