import { useState } from "react"
import type { ManualCashFlowRequest } from "../../types/cashflow.types"
import z from "zod"
import api from "../../services/api"
import { toast } from "../../store/useToastStore"
import Modal from "../common/ui/Modal"
import FormField from "../common/ui/FormField"
import { Dropdown } from "primereact/dropdown"
import { InputNumber } from "primereact/inputnumber"
import { InputText } from "primereact/inputtext"

const categoryOptions = [
  { label: 'Penjualan', value: 'Penjualan' },
  { label: 'Pembelian Bahan', value: 'Pembelian Bahan' },
  { label: 'Operasional', value: 'Operasional' },
  { label: 'Gaji', value: 'Gaji' },
  { label: 'Lainnya', value: 'Lainnya' },
]

const cashflowShcema = z.object({
    type: z.string().min(1, "Tipe wajib diisi!"),
    category : z.string().min(1, "Kategori wajib diisi!"),
    amount: z.number().gt(0, "Jumlah wajib diisi!"),
    description: z.string().min(1, "Deskripsi wajib diisi!"),
    transactionDate: z.string().min(1, "Tanggal wajib diisi!"),
})

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
}

export default function CreateManualCashFlow({visible, onHide, onSuccess}:Props){

    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const defaultForm: ManualCashFlowRequest = {
        type: 'IN',
        category: '',
        amount: 0,
        description: '',
        transactionDate: new Date().toISOString().split('T')[0],
    }
    const [form, setForm] = useState(defaultForm)

    const resetForm = () => {
        setForm(defaultForm)
        setErrors({})
    }

    const handleChange = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const handleSubmit = async () => {
        const result = cashflowShcema.safeParse(form)

        if (!result.success) {
            const fieldErrors: Record<string, string> = {}
            result.error.issues.forEach(issue => {
                const key = issue.path[0] as string
                fieldErrors[key] = issue.message
            })
            setErrors(fieldErrors)
            return
        }

        setErrors({})
        setSubmitting(true)

        try {
            await api.post('/units', form)
            onSuccess()
            onHide()
            resetForm()
            toast.success('Berhasil', 'Transaksi manual berhasil disimpan')
        } catch (err: any) {
            setErrors({
                api: err.response?.data?.message ?? 'Gagal menyimpan',
            })
        } finally {
            setSubmitting(false)
        }
    }

    return(
        <Modal
            visible={visible}
            onHide={() => { onHide(); resetForm() }}
            title="Input Transaksi Manual"
            onConfirm={handleSubmit}
            confirmLabel="Simpan"
            loading={submitting}
            width="440px"
        >
            <FormField label="Tipe" required>
                <Dropdown
                    value={form.type}
                    onChange={(e) => handleChange('type', e.value)}
                    options={[{ label: 'Pemasukan', value: 'IN' }, { label: 'Pengeluaran', value: 'OUT' }]}
                    className={`w-full ${errors.type ? 'p-invalid' : ''}`}
                />
                {errors.type && <small className="p-error">{errors.type}</small>}
            </FormField>

            <FormField label="Kategori" required>
                <Dropdown
                    value={form.category}
                    onChange={(e) => handleChange('category', e.value)}
                    options={categoryOptions}
                    placeholder="Pilih kategori"
                    className={`w-full ${errors.category ? 'p-invalid' : ''}`}
                />
                {errors.category && <small className="p-error">{errors.category}</small>}
            </FormField>

            <FormField label="Jumlah" required>
                <InputNumber
                    value={form.amount}
                    onValueChange={(e) => handleChange('amount', e.value ?? 0)}
                    className={`w-full ${errors.amount ? 'p-invalid' : ''}`}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={2}
                    placeholder="Rp"
                />
                {errors.amount && <small className="p-error">{errors.amount}</small>}
            </FormField>

            <FormField label="Deskripsi" required>
                <InputText
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Keterangan transaksi..."
                    className={`w-full ${errors.description ? 'p-invalid' : ''}`}
                />
                {errors.description && <small className="p-error">{errors.description}</small>}
            </FormField>

            <FormField label="Tanggal" required>
                <InputText
                    type="date"
                    value={form.transactionDate}
                    onChange={(e) => handleChange('transactionDate', e.target.value)}
                    className={`w-full ${errors.transactionDate ? 'p-invalid' : ''}`}
                />
                {errors.transactionDate && <small className="p-error">{errors.transactionDate}</small>}
            </FormField>

            {errors.api && (
                <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>
                    {errors.api}
                </div>
            )}
        </Modal>
    )
}