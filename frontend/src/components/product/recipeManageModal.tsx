import z from "zod"
import type { Product, Recipe, RecipeItemRequest, RecipeRequest } from "../../types/product.types"
import type { Unit } from "../../types/unit.types"
import Modal from "../common/ui/Modal"
import { useNavigate } from "react-router-dom"
import Button from "../common/ui/Button"
import FormField from "../common/ui/FormField"
import { InputText } from "primereact/inputtext"
import { useState, useEffect } from "react"
import ItemRow from "../common/ui/ItemRow"
import { Dropdown } from "primereact/dropdown"
import { InputNumber } from "primereact/inputnumber"
import { formatRupiah } from "../../utils/format"
import { Copy, Plus } from "lucide-react"
import { toast } from "../../store/useToastStore"
import api from "../../services/api"

interface Ingredient { id: string; name: string; unitSymbol: string; unitId: string }

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  recipes: Recipe[]
  product: Product | null
  onRecipeModal: () => void
  loading: boolean
  ingredients: Ingredient[]
  units: Unit[]
}

const recipeSchema = z.object({
  estimatedYield: z.number().min(0.001, 'Estimasi hasil wajib diisi'),
  items: z.array(
    z.object({
      ingredientId: z.string().min(1, 'Bahan baku wajib dipilih'),
      unitId: z.string().min(1, 'Unit wajib dipilih'),
      quantity: z.number().min(0.001, 'Qty tidak boleh kosong'),
    })
  ).min(1, 'Minimal 1 bahan'),
})

const defaultForm: RecipeRequest = {
  notes: '',
  estimatedYield: undefined,
  items: [{ ingredientId: '', quantity: 0, unitId: '' }]
}

export default function RecipeManageModal({
  visible,
  onHide,
  onSuccess,
  product,
  recipes,
  onRecipeModal,
  loading,
  ingredients,
  units,
}: Props) {
  const navigate = useNavigate()
  const activeRecipe = recipes.find(r => r.isActive)

  const [recipeForm, setRecipeForm] = useState<RecipeRequest>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // ← Reset form setiap kali produk berubah atau modal ditutup
  useEffect(() => {
    setRecipeForm(defaultForm)
    setErrors({})
  }, [product?.id, visible])

  const removeRecipeItem = (i: number) => setRecipeForm(prev => ({
    ...prev,
    items: prev.items.filter((_, idx) => idx !== i)
  }))

  const updateRecipeItem = (i: number, field: keyof RecipeItemRequest, value: any) => {
    setRecipeForm(prev => {
      const items = [...prev.items]
      items[i] = { ...items[i], [field]: value }
      return { ...prev, items }
    })
    setErrors(prev => { const e = { ...prev }; delete e[`items.${i}.${field}`]; return e })
  }

  const addRecipeItem = () => setRecipeForm(prev => ({
    ...prev,
    items: [...prev.items, { ingredientId: '', quantity: 0, unitId: '' }]
  }))

  // Copy dari resep aktif
  const handleCopyFromActive = () => {
    if (!activeRecipe) return
    setRecipeForm({
      notes: `Copy dari v${activeRecipe.versionNumber}`,
      estimatedYield: activeRecipe.estimatedYield ?? undefined,
      items: activeRecipe.items.map(item => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unitId: item.unitId,
      }))
    })
    setErrors({})
    toast.success('Berhasil', 'Resep disalin dari versi aktif')
  }

  // Preview kalkulasi
  const totalCost = recipeForm.items.reduce((acc, item) => {
    const ing = ingredients.find(i => i.id === item.ingredientId) as any
    if (!ing) return acc

    const recipeUnit = units.find(u => u.id === item.unitId)
    const stockUnit = units.find(u => u.id === ing.unitId)
    if (!recipeUnit || !stockUnit) return acc

    let qtyInStockUnit = item.quantity ?? 0
    if (recipeUnit.id !== stockUnit.id &&
      recipeUnit.conversionFactor != null &&
      stockUnit.conversionFactor != null) {
      const inBase = qtyInStockUnit * recipeUnit.conversionFactor
      qtyInStockUnit = inBase / stockUnit.conversionFactor
    }

    return acc + (ing.avgPurchasePrice ?? 0) * qtyInStockUnit
  }, 0)

  const costPerUnit = recipeForm.estimatedYield && recipeForm.estimatedYield > 0
    ? totalCost / recipeForm.estimatedYield
    : null

  const handleSaveRecipe = async () => {
    const result = recipeSchema.safeParse(recipeForm)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path.join('.')] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await api.post(`/products/${product?.id}/recipes`, recipeForm)
      toast.success('Berhasil', 'Resep berhasil disimpan')
      onSuccess()
      onHide()
    } catch (err: any) {
      setErrors({ api: err.response?.data?.message ?? 'Gagal simpan resep' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      title={`Resep — ${product?.name}`}
      width="580px"
    >
      {product && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Resep Aktif — STICKY */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--white)',
            paddingBottom: 12,
            marginBottom: 4,
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Resep Aktif
              </div>
              <Button
                label="Lihat History →"
                variant="ghost"
                size="small"
                onClick={() => { onRecipeModal(); navigate(`/products/${product.id}/recipes`) }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 12 }}>
                <i className="pi pi-spin pi-spinner" style={{ color: 'var(--accent)' }} />
              </div>
            ) : !activeRecipe ? (
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>
                Belum ada resep aktif
              </div>
            ) : (
              <div style={{ border: '1px solid #A5D6A7', borderRadius: 8, padding: 10, background: '#F0FFF4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      Versi {activeRecipe.versionNumber}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#E8F5E9', color: '#2E7D32', fontWeight: 500 }}>
                      Aktif
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                      {activeRecipe.estimatedYield && (
                        <span>{activeRecipe.estimatedYield} {product.unitSymbol}/batch</span>
                      )}
                      {activeRecipe.costPerUnit && (
                        <span style={{ color: '#2E7D32', fontWeight: 500 }}>
                          {formatRupiah(activeRecipe.costPerUnit)}/{product.unitSymbol}
                        </span>
                      )}
                    </div>
                    <Button
                      label="Copy"
                      icon={<Copy size={11} />}
                      size="small"
                      variant="secondary"
                      onClick={handleCopyFromActive}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
                  {activeRecipe.items.map(item => (
                    <span key={item.id} style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {item.ingredientName} {item.quantity}{
                        (item.unitSymbol === 'sdm' || item.unitSymbol === 'sdt') && item.unitName
                          ? (item.unitName.toLowerCase().includes('kering') || item.unitName.toLowerCase().includes('mass') 
                              ? ` ${item.unitSymbol} (mass)` 
                              : ` ${item.unitSymbol} (vol)`)
                          : ` ${item.unitSymbol}`
                      }
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Tambah Versi Baru */}
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Tambah Versi Resep Baru
            </div>

            <FormField label="Catatan Resep">
              <InputText
                value={recipeForm.notes ?? ''}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan versi resep ini..."
                className="w-full"
              />
            </FormField>

            <FormField label={`Estimasi Hasil per Batch (${product.unitName})`} required>
              <InputNumber
                value={recipeForm.estimatedYield ?? null}
                onValueChange={(e) => setRecipeForm(prev => ({ ...prev, estimatedYield: e.value ?? undefined }))}
                min={0.001}
                minFractionDigits={0}
                maxFractionDigits={3}
                placeholder={`Misal: 3 ${product.unitSymbol}`}
                suffix={` ${product.unitSymbol}`}
                className={`w-full ${errors.estimatedYield ? 'p-invalid' : ''}`}
              />
              {errors.estimatedYield && <small className="p-error">{errors.estimatedYield}</small>}
              <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                Berapa {product.unitName} yang dihasilkan dari 1x resep ini
              </small>
            </FormField>

            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>
              Bahan-bahan
            </div>

            {recipeForm.items.map((item, i) => {
              const selectedIng = ingredients.find(ing => ing.id === item.ingredientId)
              const compatibleUnits = units.filter(u => {
                if (!selectedIng) return true
                const ingUnit = units.find(unit => unit.id === selectedIng.unitId)
                if (!ingUnit) return true

                const massFamilies = ['g', 'mass']
                const volumeFamilies = ['ml', 'volume']

                const ingSymbol = ingUnit.symbol.toLowerCase()
                const uSymbol = u.symbol.toLowerCase()

                // Tentukan keluarga unit bahan baku
                const ingBase = ingUnit.baseUnit?.toLowerCase() || ''
                const isIngMass = massFamilies.includes(ingBase) || ['kg', 'g', 'mg'].includes(ingSymbol)
                const isIngVolume = volumeFamilies.includes(ingBase) || ['l', 'ml'].includes(ingSymbol)

                // Tentukan keluarga unit option (u)
                const uBase = u.baseUnit?.toLowerCase() || ''
                const isUMass = massFamilies.includes(uBase) || ['kg', 'g', 'mg'].includes(uSymbol)
                const isUVolume = volumeFamilies.includes(uBase) || ['l', 'ml'].includes(uSymbol)

                if (isIngMass && isUMass) return true
                if (isIngVolume && isUVolume) return true

                // Fallback default baseUnit match
                if (ingUnit.baseUnit && u.baseUnit === ingUnit.baseUnit) return true

                // Default
                return u.id === ingUnit.id
              })

              return (
                <ItemRow
                  key={i}
                  index={i}
                  onRemove={() => removeRecipeItem(i)}
                  showRemove={recipeForm.items.length > 1}
                >
                  <FormField label="Bahan Baku" required>
                    <Dropdown
                      value={item.ingredientId}
                      onChange={(e) => {
                        const ing = ingredients.find(ing => ing.id === e.value)
                        setRecipeForm(prev => {
                          const items = [...prev.items]
                          items[i] = {
                            ...items[i],
                            ingredientId: e.value,
                            unitId: ing?.unitId ?? ''
                          }
                          return { ...prev, items }
                        })
                        setErrors(prev => {
                          const err = { ...prev }
                          delete err[`items.${i}.ingredientId`]
                          return err
                        })
                      }}
                      options={ingredients}
                      optionLabel="name"
                      optionValue="id"
                      placeholder="Pilih bahan"
                      filter
                      filterPlaceholder="Cari bahan..."
                      className={`w-full ${errors[`items.${i}.ingredientId`] ? 'p-invalid' : ''}`}
                      itemTemplate={(opt) => (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{opt.name}</span>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--sidebar-bg)', color: 'var(--muted)' }}>
                            {opt.unitSymbol}
                          </span>
                        </div>
                      )}
                    />
                    {errors[`items.${i}.ingredientId`] && <small className="p-error">{errors[`items.${i}.ingredientId`]}</small>}
                  </FormField>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                    <FormField label="Jumlah">
                      <InputNumber
                        value={item.quantity}
                        onValueChange={(e) => updateRecipeItem(i, 'quantity', e.value ?? 0)}
                        min={0}
                        minFractionDigits={0}
                        maxFractionDigits={3}
                        className={`w-full ${errors[`items.${i}.quantity`] ? 'p-invalid' : ''}`}
                      />
                      {errors[`items.${i}.quantity`] && <small className="p-error">{errors[`items.${i}.quantity`]}</small>}
                    </FormField>

                    <FormField label="Unit">
                      <Dropdown
                        value={item.unitId}
                        onChange={(e) => updateRecipeItem(i, 'unitId', e.value ?? '')}
                        options={compatibleUnits}
                        optionLabel="symbol"
                        optionValue="id"
                        placeholder="unit"
                        disabled={!item.ingredientId}
                        className={`${errors[`items.${i}.unitId`] ? 'p-invalid' : ''}`}
                        style={{ minWidth: 90 }}
                      />
                      {errors[`items.${i}.unitId`] && <small className="p-error">{errors[`items.${i}.unitId`]}</small>}
                    </FormField>
                  </div>
                </ItemRow>
              )
            })}

            {/* Preview cost */}
            {costPerUnit !== null && recipeForm.estimatedYield && (
              <div style={{
                background: 'var(--sidebar-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 10,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginTop: 8,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                    Est. Modal / {product.unitName}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {formatRupiah(costPerUnit)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                    Hasil per Batch
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                    {recipeForm.estimatedYield} {product.unitSymbol}
                  </div>
                </div>
              </div>
            )}

            {errors.api && (
              <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>
                {errors.api}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Button
                label="Tambah Bahan"
                icon={<Plus size={11} />}
                size="small"
                variant="secondary"
                onClick={addRecipeItem}
              />
              <Button
                label="Simpan Resep"
                icon={<Plus size={12} />}
                onClick={handleSaveRecipe}
                loading={submitting}
              />
            </div>
          </div>

        </div>
      )}
    </Modal>
  )
}