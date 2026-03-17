import z from "zod"
import type { Product, Recipe, RecipeItemRequest, RecipeRequest } from "../../types/product.types"
import Modal from "../common/ui/Modal"
import { useNavigate } from "react-router-dom"
import Button from "../common/ui/Button"
import FormField from "../common/ui/FormField"
import { InputText } from "primereact/inputtext"
import { useState } from "react"
import ItemRow from "../common/ui/ItemRow"
import { Dropdown } from "primereact/dropdown"
import { InputNumber } from "primereact/inputnumber"
import { formatRupiah } from "../../utils/format"
import { Plus } from "lucide-react"
import { toast } from "../../store/useToastStore"
import api from "../../services/api"

interface Ingredient { id: string; name: string; unitSymbol: string }

interface Props{
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  recipes : Recipe[]
  product : Product | null
  onRecipeModal: () => void
  loading : boolean
  ingredients : Ingredient[]
}

const recipeSchema = z.object({
  items: z.array(
    z.object({
      ingredientId: z.string().min(1, 'Bahan baku wajib dipilih'),
      quantity: z.number().min(0.1, 'Qty tidak boleh kosong'),
    })
  ).min(1, 'Minimal 1 bahan'),
})

const defaultForm: RecipeRequest = {
  notes: '',
  items: [{ ingredientId: '', quantity: 0 }]
}

export default function RecipeManageModal({
  visible,
  onHide,
  onSuccess,
  product,
  recipes,
  onRecipeModal,
  loading,
  ingredients
}: Props){

  const navigate = useNavigate()
  const activeRecipe = recipes.find(r => r.isActive)

  const [recipeForm, setRecipeForm] = useState<RecipeRequest>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const removeRecipeItem = (i: number) => setRecipeForm({
    ...recipeForm,
    items: recipeForm.items.filter((_, idx) => idx !== i)
  })

  const updateRecipeItem = (i: number, field: keyof RecipeItemRequest, value: any) => {
    const items = [...recipeForm.items]
    items[i] = { ...items[i], [field]: value }
    setRecipeForm({ ...recipeForm, items })
  }

  const addRecipeItem = () => setRecipeForm({
    ...recipeForm,
    items: [...recipeForm.items, { ingredientId: '', quantity: 0 }]
  })

  const handleSaveRecipe = async () => {
    const result = recipeSchema.safeParse(recipeForm)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}

      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        fieldErrors[path] = issue.message
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
      setRecipeForm(defaultForm)
    } catch (err: any) {
      setErrors({ api: err.response?.data?.message ?? 'Gagal simpan resep' })
    } finally {
      setSubmitting(false)
    }
  }

  return(
    <Modal
        visible={visible}
        onHide={onHide}
        title={`Resep — ${product?.name}`}
        width="540px"
      >
        {product && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Resep Aktif */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Resep Aktif
                </div>
                <Button
                  label="Lihat History Lengkap →"
                  variant="ghost"
                  size="small"
                  onClick={() => {
                    onRecipeModal()
                    navigate(`/products/${product.id}/recipes`)
                  }}
                />
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <i className="pi pi-spin pi-spinner" style={{ color: 'var(--accent)' }} />
                </div>
              ) : !activeRecipe ? (
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
                  Belum ada resep aktif
                </div>
              ) : (
                <div style={{ border: '1px solid #A5D6A7', borderRadius: 8, padding: 12, background: '#F0FFF4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Versi {activeRecipe.versionNumber}</span>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#E8F5E9', color: '#2E7D32', fontWeight: 500 }}>Aktif</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Est. {formatRupiah(activeRecipe.estimatedCost)}</span>
                  </div>
                  {activeRecipe.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderTop: '1px solid var(--border)' }}>
                      <span>{item.ingredientName}</span>
                      <span style={{ color: 'var(--muted)' }}>{item.quantity} {item.unitSymbol}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tambah Versi Baru */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Tambah Versi Resep Baru
              </div>

              <FormField label="Catatan Resep">
                <InputText
                  value={recipeForm.notes}
                  onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
                  placeholder="Catatan versi resep ini..."
                  className="w-full"
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Bahan-bahan</div>
                <Button label="Tambah Bahan" icon={<Plus size={11} />} size="small" variant="secondary" onClick={addRecipeItem} />
              </div>

              {recipeForm.items.map((item, i) => {
                const selectedIng = ingredients.find(ing => ing.id === item.ingredientId)
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
                        onChange={(e) => updateRecipeItem(i, 'ingredientId', e.value)}
                        options={ingredients}
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Pilih bahan"
                        className="w-full"
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
                          className="w-full"
                        />
                        {errors[`items.${i}.quantity`] && <small className="p-error">{errors[`items.${i}.quantity`]}</small>}
                      </FormField>
                      {selectedIng && (
                        <div style={{
                          padding: '8px 12px', background: 'var(--sidebar-bg)',
                          border: '1px solid var(--border)', borderRadius: 7,
                          fontSize: 12, fontWeight: 600, color: 'var(--accent)',
                          marginBottom: 5, minWidth: 48, textAlign: 'center',
                        }}>
                          {selectedIng.unitSymbol}
                        </div>
                      )}
                    </div>
                  </ItemRow>
                )
              })}

              {errors.api && <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>{errors.api}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button label="Simpan Resep" icon={<Plus size={12} />} onClick={handleSaveRecipe} loading={submitting} />
              </div>
            </div>
          </div>
        )}
      </Modal>
  )
}