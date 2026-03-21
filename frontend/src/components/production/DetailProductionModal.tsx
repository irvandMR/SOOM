import { useEffect, useState } from 'react'
import api from '../../services/api'
import Modal from '../common/ui/Modal'
import { formatRupiah } from '../../utils/format'

interface IngredientDetail {
  ingredientName: string
  unitSymbol: string
  qtyPerUnit: number
  totalQtyUsed: number
  avgPurchasePrice: number
  totalCost: number
}

interface ProductionDetail {
  id: string
  productName: string
  recipeVersion: number
  quantityProduced: number
  unitName: string | null
  unitSymbol: string | null
  estimatedYield: number | null
  actualYield: number | null
  availableQty: number | null
  productionDate: string
  expiredDate: string
  status: string
  notes: string
  estimatedCostPerUnit: number
  totalEstimatedCost: number
  recommendedPrice: number
  ingredients: IngredientDetail[]
  yieldUnitSymbol: string | null
}

interface Props {
  visible: boolean
  onHide: () => void
  productionId: string | null
}

export default function DetailProductionModal({ visible, onHide, productionId }: Props) {
  const [detail, setDetail] = useState<ProductionDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!productionId || !visible) return
    setLoading(true)
    api.get(`/productions/${productionId}/detail`)
      .then(res => setDetail(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [productionId, visible])

  return (
    <Modal
      visible={visible}
      onHide={() => { onHide(); setDetail(null) }}
      title="Detail Produksi"
      width="580px"
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <i className="pi pi-spin pi-spinner" style={{ color: 'var(--accent)', fontSize: 24 }} />
        </div>
      ) : detail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Info Produksi */}
          <div style={{ background: 'var(--sidebar-bg)', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Produk', value: detail.productName },
                { label: 'Versi Resep', value: `v${detail.recipeVersion}` },
                {
                  label: 'Qty Produksi',
                  value: `${detail.quantityProduced} ${detail.unitSymbol ?? ''}`  // toples
                },
                {
                  label: 'Est. Hasil',
                  value: detail.estimatedYield != null
                    ? `${detail.estimatedYield} ${detail.unitSymbol ?? ''}`  // ← tambah unitSymbol
                    : '—'
                },
                {
                  label: 'Hasil Aktual',
                  value: detail.actualYield != null
                    ? `${detail.actualYield} ${detail.yieldUnitSymbol ?? ''}`     // pcs
                    : '—'
                },
                {
                  label: 'Sisa Tersedia',
                  value: detail.availableQty != null
                    ? (
                      <span style={{ fontWeight: 600, color: detail.availableQty > 0 ? '#2E7D32' : '#C62828' }}>
                        {detail.availableQty} {detail.unitSymbol ?? ''} 
                      </span>
                    )
                    : '—'
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>
            {detail.notes && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Catatan</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{detail.notes}</div>
              </div>
            )}
          </div>

          {/* Kalkulasi — 3 kolom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              {
                label: `Est. Modal / ${detail.yieldUnitSymbol ?? 'unit'}`,
                value: formatRupiah(detail.estimatedCostPerUnit),
                color: 'var(--text)',
              },
              {
                label: 'Total Modal',
                value: formatRupiah(detail.totalEstimatedCost),
                color: '#1565A0',
              },
              {
                label: `Rek. Harga / ${detail.yieldUnitSymbol ?? 'unit'}`,
                value: formatRupiah(detail.recommendedPrice),
                color: '#2E7D32',
              },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'var(--sidebar-bg)', borderRadius: 8,
                padding: '10px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Daftar Bahan Baku */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
            }}>
              Bahan Baku yang Dipakai
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>

              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '8px 12px', background: 'var(--sidebar-bg)',
                fontSize: 11, fontWeight: 600, color: 'var(--muted)',
              }}>
                <span>Bahan</span>
                <span style={{ textAlign: 'right' }}>Qty/unit</span>
                <span style={{ textAlign: 'right' }}>Total Qty</span>
                <span style={{ textAlign: 'right' }}>Total Biaya</span>
              </div>

              {/* Rows */}
              {detail.ingredients.map((ing, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '8px 12px', fontSize: 12,
                  borderTop: '1px solid var(--border)',
                  color: 'var(--text)',
                }}>
                  <span style={{ fontWeight: 500 }}>{ing.ingredientName}</span>
                  <span style={{ textAlign: 'right', color: 'var(--muted)' }}>
                    {ing.qtyPerUnit} {ing.unitSymbol}
                  </span>
                  <span style={{ textAlign: 'right', color: 'var(--muted)' }}>
                    {ing.totalQtyUsed} {ing.unitSymbol}
                  </span>
                  <span style={{ textAlign: 'right', fontWeight: 500 }}>
                    {formatRupiah(ing.totalCost)}
                  </span>
                </div>
              ))}

              {/* Total row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '8px 12px', fontSize: 12, fontWeight: 600,
                borderTop: '2px solid var(--border)',
                background: 'var(--sidebar-bg)',
                color: 'var(--text)',
              }}>
                <span>Total</span>
                <span />
                <span />
                <span style={{ textAlign: 'right', color: '#1565A0' }}>
                  {formatRupiah(detail.totalEstimatedCost)}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
    </Modal>
  )
}