import { useState, useEffect } from "react"
import type { Ingredient, IngredientUpdateRequest } from "../../types/ingredient.types"
import Modal from "../common/ui/Modal"
import FormField from "../common/ui/FormField"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { InputNumber } from "primereact/inputnumber"
import { toast } from "../../store/useToastStore"
import api from "../../services/api"
import z from "zod"
import { confirmDialog } from "../common/ui/ConfirmDialog"
import { canConvertUnit, convertUnitQuantity } from "../../utils/unitConverter"

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nama bahan baku wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  unitId: z.string().min(1, 'Unit wajib dipilih'),
  minimumStock: z.number().min(0, 'Minimum stok tidak boleh negatif'),
  stockQuantity: z.number().min(0, 'Stok aktual tidak boleh negatif'),
  purchasePrice: z.number().min(0, 'Harga beli tidak boleh negatif'),
})

interface Category { id: string; name: string }
interface Unit { id: string; name: string; symbol: string }

interface Props{
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  ingredient: Ingredient | null
  categories: Category[]
  units: Unit[]
}

export default function EditModalIngredient({
  visible,
  onHide,
  onSuccess,
  ingredient,
  categories,
  units
}: Props){
  const [form, setForm] = useState<IngredientUpdateRequest>({
    name: '',
    categoryId: "",
    unitId: "",
    minimumStock: 0,
    stockQuantity: 0,
    purchasePrice: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [unitSymbol, setUnitSymbol] = useState<string>('')
  const [convertibleUnits, setConvertibleUnits] = useState<Unit[]>([])

  // Load ingredient data saat modal muncul
  useEffect(() => {
    if (ingredient) {
      setForm({
        name: ingredient.name,
        categoryId: ingredient.categoryId,
        unitId: ingredient.unitId,
        minimumStock: ingredient.minimumStock ?? 0,
        stockQuantity: ingredient.stockQuantity ?? 0,
        purchasePrice: ingredient.purchasePrice ?? 0
      })

      const unit = units.find(u => u.id === ingredient.unitId)
      setUnitSymbol(unit?.symbol ?? '')

      // filter unit yang bisa dikonversi dari unit saat ini
      const convertible = units.filter(u => canConvertUnit(unit?.symbol ?? '', u.symbol))
      setConvertibleUnits(convertible)
      setErrors({})
    }
  }, [ingredient])

  const resetForm = () => {
    setForm({
      name: '',
      categoryId: "",
      unitId: "",
      minimumStock: 0,
      stockQuantity: 0,
      purchasePrice: 0
    })
    setUnitSymbol('')
    setConvertibleUnits([])
    setErrors({})
  }

  const handleChange = (field: keyof IngredientUpdateRequest, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleUnitChange = (newUnitId: string) => {
    const newUnit = units.find(u => u.id === newUnitId)
    if (!newUnit) return

    const oldUnitSymbol = unitSymbol

    if (canConvertUnit(oldUnitSymbol, newUnit.symbol)) {
      const newStock = convertUnitQuantity(oldUnitSymbol, newUnit.symbol, form.stockQuantity)
      const newMinStock = convertUnitQuantity(oldUnitSymbol, newUnit.symbol, form.minimumStock)

      setForm(prev => ({
        ...prev,
        unitId: newUnitId,
        stockQuantity: newStock,
        minimumStock: newMinStock
      }))
      setUnitSymbol(newUnit.symbol)

      // update list unit yang bisa dikonversi lagi
      const convertible = units.filter(u => canConvertUnit(newUnit.symbol, u.symbol))
      setConvertibleUnits(convertible)
    }
  }

  const handleSave = async () => {
    if (!ingredient) return

    const result = ingredientSchema.safeParse(form)
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

    confirmDialog({
      message: 'Perubahan akan disimpan.',
      header: 'Update Bahan Baku?',
      icon: 'pi pi-pencil',
      acceptLabel: 'Update',
      rejectLabel: 'Batal',
      accept: async () => {
        setSubmitting(true)
        try {
          await api.put(`/ingredients/${ingredient.id}`, form)
          onSuccess()
          onHide()
          toast.success('Berhasil', 'Bahan baku berhasil diupdate')
        } catch (err: any) {
          setErrors({ api: err.response?.data?.message ?? 'Gagal menyimpan' })
        } finally {
          setSubmitting(false)
        }
      }
    })
  }

  return (
    <Modal
      visible={visible}
      onHide={() => { onHide(); resetForm() }}
      title="Update Bahan Baku"
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
        {errors.name && <small className="p-error">{errors.name}</small>}
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
        {errors.categoryId && <small className="p-error">{errors.categoryId}</small>}
      </FormField>

      {/* Unit */}
      <FormField label="Unit" required>
        <Dropdown
          value={form.unitId}
          onChange={(e) => handleUnitChange(e.value)}
          options={convertibleUnits}
          optionLabel="name"
          optionValue="id"
          placeholder="Pilih unit"
          className={`w-full ${errors.unitId ? 'p-invalid' : ''}`}
        />
        {errors.unitId && <small className="p-error">{errors.unitId}</small>}
      </FormField>

      {/* StockQuantity */}
      <FormField label={`Stok (${unitSymbol})`}>
        <InputNumber
          value={form.stockQuantity}
          onValueChange={(e) => handleChange('stockQuantity', e.value ?? 0)}
          className="w-full"
          min={0}
          minFractionDigits={0}
          maxFractionDigits={3}
        />
      </FormField>

      {/* Minimum Stock */}
      <FormField label={`Minimum Stok (${unitSymbol})`}>
        <InputNumber
          value={form.minimumStock}
          onValueChange={(e) => handleChange('minimumStock', e.value ?? 0)}
          className="w-full"
          min={0}
          minFractionDigits={0}
          maxFractionDigits={3}
        />
      </FormField>

      {/* Harga Beli */}
      <FormField label={`Harga Beli (${unitSymbol})`}>
        <InputNumber
          value={form.purchasePrice}
          onValueChange={(e) => handleChange('purchasePrice', e.value ?? 0)}
          className="w-full"
          prefix="Rp "
          minFractionDigits={0}
        />
      </FormField>

      {/* API Error */}
      {errors.api && (
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
      )}
    </Modal>
  )
}