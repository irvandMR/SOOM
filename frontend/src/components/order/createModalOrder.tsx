import { useState, useEffect } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'
import Modal from '../common/ui/Modal'
import FormField from '../common/ui/FormField'
import Button from '../common/ui/Button'
import ItemRow from '../common/ui/ItemRow'
import { formatRupiah } from '../../utils/format'
import type { CreateOrderRequest, OrderItemRequest } from '../../types/order.types'
import type { Production } from '../../types/production.types'

interface Product {
  id: string
  name: string
  type: string
}

const orderSchema = z.object({
  customerName: z.string().min(1, 'Nama customer wajib diisi'),
  orderDate: z.string().min(1, 'Tanggal order wajib diisi'),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Produk wajib dipilih'),
      productionId: z.string().min(1, 'Produksi wajib dipilih'),
      quantity: z.number().min(1, 'Qty minimal 1'),
    })
  ).min(1, 'Minimal 1 produk'),
})

const defaultItem: OrderItemRequest = {
  productId: '',
  productionId: '',
  quantity: 1,
}

const defaultForm: CreateOrderRequest = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  orderDate: new Date().toISOString().split('T')[0],
  requiredDate: '',
  items: [{ ...defaultItem }],
  initialPayment: 0,
  paymentType: 'DP',
  notes: '',
}

interface Props {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  products: Product[]
}

export default function CreateModalOrder({ visible, onHide, onSuccess, products }: Props) {
  const [form, setForm] = useState<CreateOrderRequest>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [productionsMap, setProductionsMap] = useState<Record<number, Production[]>>({})
  const [loadingProductions, setLoadingProductions] = useState<Record<number, boolean>>({})
  const [itemPrices, setItemPrices] = useState<Record<number, number>>({})

  const resetForm = () => {
    setForm(defaultForm)
    setErrors({})
    setProductionsMap({})
    setLoadingProductions({})
    setItemPrices({})
  }

  const handleChange = (field: keyof CreateOrderRequest, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const updateItem = (i: number, field: keyof OrderItemRequest, value: any) => {
    setForm((prev) => {
      const items = [...prev.items]
      items[i] = { ...items[i], [field]: value }
      return { ...prev, items }
    })
    setErrors((prev) => ({ ...prev, [`items.${i}.${field}`]: '' }))
  }

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...defaultItem }],
    }))
  }

  const removeItem = (i: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== i),
    }))
    setProductionsMap((prev) => { const n = { ...prev }; delete n[i]; return n })
    setItemPrices((prev) => { const n = { ...prev }; delete n[i]; return n })
  }

  const fetchProductions = async (productId: string, index: number) => {
    setLoadingProductions((prev) => ({ ...prev, [index]: true }))
    try {
      const res = await api.get(`/productions/available?productId=${productId}`)
      setProductionsMap((prev) => ({ ...prev, [index]: res.data.data }))
    } catch (err) {
      console.error(err)
      setProductionsMap((prev) => ({ ...prev, [index]: [] }))
    } finally {
      setLoadingProductions((prev) => ({ ...prev, [index]: false }))
    }
  }

  // Ambil harga — pakai override manual atau rekomendasi produksi
  const getUnitPrice = (i: number): number => {
    if (itemPrices[i] !== undefined) return itemPrices[i]
    const item = form.items[i]
    const production = productionsMap[i]?.find(p => p.id === item?.productionId)
    if (!production) return 0
    return production.recommendedPrice > 0 ? production.recommendedPrice : 0
  }

  const totalAmount = form.items.reduce((sum, _, i) => {
    return sum + getUnitPrice(i) * (form.items[i].quantity ?? 0)
  }, 0)

  // Auto-fill initial payment if Lunas (SETTLEMENT)
  useEffect(() => {
    if (form.paymentType === 'SETTLEMENT') {
      setForm(prev => ({ ...prev, initialPayment: totalAmount }))
    }
  }, [form.paymentType, totalAmount])

  const handleSave = async () => {
    const result = orderSchema.safeParse(form)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path.join('.')] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    if ((form.initialPayment ?? 0) > totalAmount) {
      setErrors({ initialPayment: 'Pembayaran melebihi total' })
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      // ← Sertakan unitPrice per item
      const payload = {
        ...form,
        items: form.items.map((item, i) => ({
          ...item,
          unitPrice: getUnitPrice(i),
        }))
      }

      await api.post('/orders', payload)
      onSuccess()
      onHide()
      resetForm()
      toast.success('Berhasil', 'Order berhasil dibuat')
    } catch (err: any) {
      setErrors({ api: err.response?.data?.message ?? 'Gagal membuat order' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      onHide={() => { onHide(); resetForm() }}
      title="Buat Order Baru"
      onConfirm={handleSave}
      confirmLabel="Buat Order"
      loading={submitting}
      width="580px"
    >
      {/* Info Customer */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Info Customer
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Nama Customer" required>
            <InputText
              value={form.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              placeholder="Nama customer"
              className={`w-full ${errors.customerName ? 'p-invalid' : ''}`}
              autoFocus
            />
            {errors.customerName && <small className="p-error">{errors.customerName}</small>}
          </FormField>
          <FormField label="No. HP">
            <InputText value={form.customerPhone} onChange={(e) => handleChange('customerPhone', e.target.value)} placeholder="08xx" className="w-full" />
          </FormField>
        </div>
        <FormField label="Alamat">
          <InputText value={form.customerAddress} onChange={(e) => handleChange('customerAddress', e.target.value)} placeholder="Alamat pengiriman" className="w-full" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Tanggal Order" required>
            <InputText type="date" value={form.orderDate}
              onChange={(e) => handleChange('orderDate', e.target.value)}
              className={`w-full ${errors.orderDate ? 'p-invalid' : ''}`} />
            {errors.orderDate && <small className="p-error">{errors.orderDate}</small>}
          </FormField>
          <FormField label="Tanggal Dibutuhkan">
            <InputText type="date" value={form.requiredDate}
              onChange={(e) => handleChange('requiredDate', e.target.value)}
              className="w-full" />
          </FormField>
        </div>
      </div>

      {/* Produk */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Produk
          </div>
          <Button label="Tambah Produk" icon={<Plus size={11} />} size="small" variant="secondary" onClick={addItem} />
        </div>

        {form.items.map((item, i) => {
          const availableProductions = productionsMap[i] ?? []
          const selectedProduction = availableProductions.find(p => p.id === item.productionId)
          const unitPrice = getUnitPrice(i)
          const subtotal = unitPrice * (item.quantity ?? 0)
          const isOverridden = itemPrices[i] !== undefined

          return (
            <ItemRow key={i} index={i} onRemove={() => removeItem(i)} showRemove={form.items.length > 1}>

              {/* Pilih Produk */}
              <FormField label="Produk" required>
                <Dropdown
                  value={item.productId}
                  onChange={(e) => {
                    updateItem(i, 'productId', e.value)
                    updateItem(i, 'productionId', '')
                    setItemPrices(prev => { const n = { ...prev }; delete n[i]; return n })
                    fetchProductions(e.value, i)
                  }}
                  options={products}
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Pilih produk"
                  filter
                  filterPlaceholder="Cari produk..."
                  className={`w-full ${errors[`items.${i}.productId`] ? 'p-invalid' : ''}`}
                />
                {errors[`items.${i}.productId`] && <small className="p-error">{errors[`items.${i}.productId`]}</small>}
              </FormField>

              {/* Pilih Produksi */}
              <FormField label="Produksi" required>
                {loadingProductions[i] ? (
                  <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--muted)' }}>
                    <i className="pi pi-spin pi-spinner" style={{ marginRight: 6 }} />
                    Memuat produksi...
                  </div>
                ) : (
                  <Dropdown
                    value={item.productionId}
                    onChange={(e) => {
                      updateItem(i, 'productionId', e.value)
                      setItemPrices(prev => { const n = { ...prev }; delete n[i]; return n })
                    }}
                    options={availableProductions.map(p => ({
                      label: `${p.productionDate} — v${p.recipeVersion} — sisa ${p.availableQty} ${p.unitSymbol ?? ''}`,
                      value: p.id,
                    }))}
                    placeholder={
                      !item.productId ? 'Pilih produk dulu' :
                        availableProductions.length === 0 ? 'Tidak ada produksi tersedia' :
                          'Pilih produksi'
                    }
                    disabled={!item.productId || availableProductions.length === 0}
                    className={`w-full ${errors[`items.${i}.productionId`] ? 'p-invalid' : ''}`}
                  />
                )}
                {errors[`items.${i}.productionId`] && <small className="p-error">{errors[`items.${i}.productionId`]}</small>}
                {selectedProduction && (
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                    Tersedia: {selectedProduction.availableQty} {selectedProduction.unitSymbol}
                  </small>
                )}
              </FormField>

              {/* Qty + Harga */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FormField label="Qty">
                  <InputNumber
                    value={item.quantity}
                    onValueChange={(e) => updateItem(i, 'quantity', e.value ?? 1)}
                    min={1}
                    max={selectedProduction?.availableQty ?? undefined}
                    className="w-full"
                  />
                </FormField>

                <FormField label={`Harga / ${selectedProduction?.unitSymbol ?? 'unit'}`}>
                  <InputNumber
                    value={unitPrice}
                    onValueChange={(e) => setItemPrices(prev => ({ ...prev, [i]: e.value ?? 0 }))}
                    prefix="Rp "
                    className="w-full"
                    disabled={!selectedProduction}
                  />
                  {selectedProduction && isOverridden && (
                    <small style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Rek: {formatRupiah(selectedProduction.recommendedPrice)}
                      <span
                        style={{ color: 'var(--accent)', cursor: 'pointer', marginLeft: 6 }}
                        onClick={() => setItemPrices(prev => { const n = { ...prev }; delete n[i]; return n })}
                      >
                        ↺ Reset
                      </span>
                    </small>
                  )}
                  {selectedProduction && !isOverridden && (
                    <small style={{ fontSize: 11, color: '#2E7D32' }}>
                      ✓ Dari rekomendasi produksi
                    </small>
                  )}
                </FormField>
              </div>

              {/* Subtotal */}
              <div style={{
                padding: '8px 10px', background: 'var(--sidebar-bg)',
                border: '1px solid var(--border)', borderRadius: 7,
                fontSize: 13, display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: subtotal > 0 ? 'var(--text)' : 'var(--muted)' }}>
                  {subtotal > 0 ? formatRupiah(subtotal) : '—'}
                </span>
              </div>

            </ItemRow>
          )
        })}

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Total: {formatRupiah(totalAmount)}
          </span>
        </div>
      </div>

      {/* Pembayaran Awal */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Pembayaran Awal (Opsional)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Jumlah Bayar">
            <InputNumber
              value={form.initialPayment}
              onValueChange={(e) => handleChange('initialPayment', e.value ?? 0)}
              prefix="Rp "
              className={`w-full ${errors.initialPayment ? 'p-invalid' : ''}`}
            />
            {errors.initialPayment && <small className="p-error">{errors.initialPayment}</small>}
          </FormField>
          <FormField label="Tipe Pembayaran">
            <Dropdown
              value={form.paymentType}
              onChange={(e) => handleChange('paymentType', e.value)}
              options={[{ label: 'DP', value: 'DP' }, { label: 'Lunas', value: 'SETTLEMENT' }]}
              className="w-full"
            />
          </FormField>
        </div>
      </div>

      <FormField label="Catatan">
        <InputText value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Catatan tambahan..." className="w-full" />
      </FormField>

      {errors.api && (
        <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>
          {errors.api}
        </div>
      )}
    </Modal>
  )
}