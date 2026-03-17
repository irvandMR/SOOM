import z from "zod";
import type { ProductRequest } from "../../types/product.types";
import { useState } from "react";
import Modal from "../common/ui/Modal";
import FormField from "../common/ui/FormField";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import api from "../../services/api";
import { toast } from "../../store/useToastStore";

const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi'),
    categoryId: z.string().min(1, 'Kategori wajib dipilih'),
    unitId: z.string().min(1, 'Unit wajib dipilih'),
    type: z.string().min(1, 'Tipe wajib diisi'),
    defaultPrice: z.number().min(0, 'Harga jual minimal 0'),
    targetMargin: z.number().min(0, 'Margin minimal 0')
})

const typeOptions = [
  { label: 'Made to Order', value: 'MADE_TO_ORDER' },
  { label: 'Made to Stock', value: 'MADE_TO_STOCK' },
  { label: 'Resell', value: 'RESELL' },
]

interface Category { id: string; name: string }
interface Unit { id: string; name: string; symbol: string }

const defaultForm: ProductRequest = {
    name: '', 
    categoryId: '', 
    unitId: '',
    type: 'MADE_TO_ORDER', 
    defaultPrice: 0, 
    targetMargin: 30,
}

interface Props {
    visible: boolean
    onHide: () => void
    onSuccess: () => void
    categories: Category[]
    units: Unit[]
}

export default function AddProductModal({
    visible,
    onHide,
    onSuccess,
    categories,
    units
}: Props) {
    const [form, setForm] = useState<ProductRequest>(defaultForm)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)

    const resetForm = () => {
        setForm(defaultForm)
        setErrors({})
    }

    const handleChange = (field: keyof ProductRequest, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => ({ ...prev, [field]: '' }))
    }

    const handleAdd = async () => {
        const result = productSchema.safeParse(form)

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
            await api.post('/products', form)
            onSuccess()
            onHide()
            resetForm()
            toast.success('Berhasil', 'Product berhasil ditambahkan')
        } catch (err: any) {
            setErrors({
                api: err.response?.data?.message ?? 'Gagal menyimpan',
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal
            visible={visible}
            onHide={() => { onHide(); resetForm() }}
            title="Tambah Produk Baru"
            onConfirm={handleAdd}
            confirmLabel="Simpan"
            loading={submitting}
            width="480px"
        >
            <FormField label="Nama Produk" required>
                <InputText 
                    value={form.name} 
                    onChange={(e) => handleChange('name', e.target.value)} 
                    placeholder="Nama produk" 
                    className="w-full" 
                />
                {errors.name && <small className="p-error">{errors.name}</small>}
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FormField label="Kategori" required>
                    <Dropdown 
                        value={form.categoryId} 
                        onChange={(e) => handleChange('categoryId', e.value)} 
                        options={categories} 
                        optionLabel="name" 
                        optionValue="id" 
                        placeholder="Pilih kategori" 
                        className="w-full" 
                    />
                    {errors.categoryId && <small className="p-error">{errors.categoryId}</small>}
                </FormField>

                <FormField label="Unit" required>
                    <Dropdown 
                        value={form.unitId} 
                        onChange={(e) => handleChange('unitId', e.value)} 
                        options={units} 
                        optionLabel="name" 
                        optionValue="id" 
                        placeholder="Pilih unit" 
                        className="w-full" 
                    />
                    {errors.unitId && <small className="p-error">{errors.unitId}</small>}
                </FormField>
            </div>

            <FormField label="Tipe Produk" required>
                <Dropdown 
                    value={form.type} 
                    onChange={(e) => handleChange('type', e.value)} 
                    options={typeOptions} 
                    className="w-full" 
                />
                {errors.type && <small className="p-error">{errors.type}</small>}
            </FormField>

            <FormField label="Harga Jual" required>
                <InputNumber 
                    value={form.defaultPrice} 
                    onValueChange={(e) => handleChange('defaultPrice', e.value)} 
                    prefix="Rp " 
                    className="w-full" 
                />
                {errors.defaultPrice && <small className="p-error">{errors.defaultPrice}</small>}
            </FormField>

            <FormField label="Target Margin (%)">
                <InputNumber 
                    value={form.targetMargin} 
                    onValueChange={(e) => handleChange('targetMargin', e.value ?? 30)} 
                    suffix="%" 
                    className="w-full" 
                />
                {errors.targetMargin && <small className="p-error">{errors.targetMargin}</small>}
            </FormField>

            {/* API Error */}
            {errors.api && (
                <div style={{
                    background: '#FFEBEE',
                    color: '#C62828',
                    fontSize: 12,
                    padding: '8px 10px',
                    borderRadius: 6,
                    marginTop: 8,
                }}>
                    {errors.api}
                </div>
            )}
        </Modal>
    )
}