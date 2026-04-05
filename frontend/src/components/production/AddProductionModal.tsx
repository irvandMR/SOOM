import { useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { z } from 'zod'
import api from '../../services/api'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'
import type { CreateProductionRequest } from '../../types/production.types'
import { toLocalDateTimeString, formatRupiah } from '../../utils/format'

interface Product {
  id: string
  name: string
  unitName: string    // ← unit produk
  unitSymbol: string  // ← simbol unit produk
}

interface Recipe {
  id: string
  versionNumber: number
  isActive: boolean
  estimatedCost: number
  estimatedYield: number | null   // estimasi per batch dalam unit produk
  costPerUnit: number | null      // cost per unit produk
}

const schema = z.object({
  productId: z.string().min(1, 'Produk wajib dipilih'),
  recipeId: z.string().min(1, 'Resep wajib dipilih'),
  quantityProduced: z.number().min(0.001, 'Minimal > 0'),
  productionDate: z.string().min(1, 'Tanggal wajib diisi'),
  expiredDate: z.string().min(1, 'Tanggal wajib diisi'),
})

const defaultForm: CreateProductionRequest = {
  productId: '',
  recipeId: '',
  quantityProduced: 1,
  actualYield: undefined,
  productionDate: new Date().toISOString().split('T')[0],
  notes: '',
  expiredDate: toLocalDateTimeString(new Date()),
}

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  products: Product[]
}

export default function AddProductionModal({ visible, onHide, onSuccess, products }: Props) {
  const [form, setForm] = useState<CreateProductionRequest>(defaultForm)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [targetMargin, setTargetMargin] = useState<number>(30)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setForm(defaultForm)
    setRecipes([])
    setTargetMargin(30)
    setErrors({})
  }

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e })
  }

  const fetchRecipes = async (productId: string) => {
    try {
      const res = await api.get(`/products/${productId}/recipes`)
      const data = res.data.data
      setRecipes(data)
      const active = data.find((r: Recipe) => r.isActive)
      if (active) setForm((prev) => ({ ...prev, recipeId: active.id }))
    } catch (err) {
      console.error(err)
    }
  }

  const selectedProduct = products.find(p => p.id === form.productId)
  const selectedRecipe = recipes.find(r => r.id === form.recipeId)
  const unitSymbol = selectedProduct?.unitSymbol ?? ''
  const unitName = selectedProduct?.unitName ?? 'unit'

  // Batch = quantityProduced / estimatedYield
  const estimatedYieldPerBatch = selectedRecipe?.estimatedYield ?? 0
  const batch = estimatedYieldPerBatch > 0
    ? (form.quantityProduced ?? 0) / estimatedYieldPerBatch
    : form.quantityProduced ?? 0

  // Cost per unit produk dari resep
  const costPerUnit = selectedRecipe?.costPerUnit ?? 0

  // Total cost = costPerUnit x quantityProduced
  const totalEstimatedCost = costPerUnit * (form.quantityProduced ?? 0)

  // Rekomendasi harga per unit produk
  const recommendedPrice = targetMargin < 100
    ? costPerUnit / (1 - targetMargin / 100)
    : 0

  const showPreview = !!(form.recipeId && form.quantityProduced > 0 && costPerUnit > 0)

  const handleSave = async () => {
    const result = schema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message })
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
      setErrors({ api: err.response?.data?.message ?? 'Gagal catat produksi' })
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
      width="480px"
    >
      {/* Produk */}
      <FormField label="Produk" required>
        <Dropdown
          value={form.productId}
          onChange={(e) => {
            handleChange('productId', e.value)
            handleChange('recipeId', '')
            setRecipes([])
            fetchRecipes(e.value)
          }}
          options={products}
          optionLabel="name"
          optionValue="id"
          placeholder="Pilih produk"
          className={`w-full ${errors.productId ? 'p-invalid' : ''}`}
          itemTemplate={(opt) => (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{opt.name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{opt.unitSymbol}</span>
            </div>
          )}
        />
        {errors.productId && <small className="p-error">{errors.productId}</small>}
      </FormField>

      {/* Resep */}
      <FormField label="Resep" required>
        <Dropdown
          value={form.recipeId}
          onChange={(e) => handleChange('recipeId', e.value)}
          options={recipes.map(r => ({
            label: `Versi ${r.versionNumber}${r.isActive ? ' (Aktif)' : ''}${r.estimatedYield
              ? ` — est. ${r.estimatedYield} ${unitSymbol}/batch`
              : ''}`,
            value: r.id,
          }))}
          placeholder={form.productId ? 'Pilih resep' : 'Pilih produk dulu'}
          disabled={!form.productId}
          className={`w-full ${errors.recipeId ? 'p-invalid' : ''}`}
        />
        {errors.recipeId && <small className="p-error">{errors.recipeId}</small>}
      </FormField>

      {/* Jumlah Produksi */}
      <FormField
        label={`Berapa ${unitName} yang berhasil dibuat?`}
        required
      >
        <InputNumber
          value={form.quantityProduced}
          onValueChange={(e) => handleChange('quantityProduced', e.value ?? 1)}
          min={0.001}
          minFractionDigits={0}
          maxFractionDigits={3}
          suffix={unitSymbol ? ` ${unitSymbol}` : ''}
          className={`w-full ${errors.quantityProduced ? 'p-invalid' : ''}`}
        />
        {errors.quantityProduced && <small className="p-error">{errors.quantityProduced}</small>}
        {selectedRecipe?.estimatedYield && form.quantityProduced > 0 && (
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>
            ≈ {batch.toFixed(2)} batch resep
            ({selectedRecipe.estimatedYield} {unitSymbol}/batch)
          </small>
        )}
      </FormField>

      {/* Hasil Aktual — input langsung berapa yang berhasil */}
      <FormField label={`Hasil Aktual (${unitName}) — opsional`}>
        <InputNumber
          value={form.actualYield ?? null}
          onValueChange={(e) => handleChange('actualYield', e.value ?? undefined)}
          min={0}
          minFractionDigits={0}
          maxFractionDigits={3}
          suffix={unitSymbol ? ` ${unitSymbol}` : ''}
          placeholder={`${form.quantityProduced} ${unitSymbol} (sesuai jumlah produksi)`}
          className="w-full"
        />
        <small style={{ color: 'var(--muted)', fontSize: 11 }}>
          Isi jika ada yang gagal/rusak. 
          Contoh: buat 3 toples, 1 rusak → isi 2
        </small>
      </FormField>

      {/* Target Margin */}
      <FormField label="Target Margin (%)">
        <InputNumber
          value={targetMargin}
          onValueChange={(e) => setTargetMargin(e.value ?? 30)}
          suffix="%"
          min={0}
          max={99}
          className="w-full"
        />
      </FormField>

      {/* Preview Kalkulasi */}
      {showPreview && (
        <div style={{
          background: 'var(--sidebar-bg)',
          border: '1px solid var(--border)',
          borderRadius: 8, padding: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Kalkulasi
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              {
                label: `Est. Modal / ${unitName}`,
                value: formatRupiah(costPerUnit),
                color: 'var(--text)',
              },
              {
                label: `Total Modal (${form.quantityProduced} ${unitSymbol})`,
                value: formatRupiah(totalEstimatedCost),
                color: '#1565A0',
              },
              {
                label: `Rek. Harga / ${unitName}`,
                value: formatRupiah(recommendedPrice),
                color: '#2E7D32',
              },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tanggal */}
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
            value={form.expiredDate.slice(0, 16)}
            onChange={(e) => handleChange('expiredDate', e.target.value)}
            className={`w-full ${errors.expiredDate ? 'p-invalid' : ''}`}
          />
          {errors.expiredDate && <small className="p-error">{errors.expiredDate}</small>}
        </FormField>
      </div>

      {/* Catatan */}
      <FormField label="Catatan">
        <InputText
          value={form.notes ?? ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Catatan produksi..."
          className="w-full"
        />
      </FormField>

      {errors.api && (
        <div style={{
          background: '#FFEBEE',
          color: '#C62828',
          fontSize: 12,
          padding: '10px 12px',
          borderRadius: 6,
          lineHeight: 1.8,
        }}>
          {errors.api.split('\n').map((line, i) => (
            <div key={i} style={{
              fontWeight: i === 0 ? 600 : 400,
              marginBottom: i === 0 ? 4 : 0,
            }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}