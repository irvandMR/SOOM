import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChefHat, CheckCircle } from 'lucide-react'
import api from '../services/api'
import type { Recipe } from '../types/product.types'
import { formatRupiah } from '../utils/format'
import Button from '../components/common/ui/Button'

interface Product {
  id: string
  name: string
  categoryName: string
  unitName: string
  defaultPrice: number
  estimatedCost: number
  targetMargin: number
}

export default function ProductRecipeHistoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productRes, recipesRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/recipes`),
        ])
        setProduct(productRes.data.data)
        setRecipes(recipesRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const handleActivate = async (recipeId: string) => {
    try {
      await api.put(`/products/${id}/recipes/${recipeId}/activate`)
      const res = await api.get(`/products/${id}/recipes`)
      setRecipes(res.data.data)
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal aktifkan resep')
    }
  }

  const activeRecipe = recipes.find(r => r.isActive)
  const recommendedPrice = product
    ? product.estimatedCost * (1 + product.targetMargin / 100)
    : 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <i className="pi pi-spin pi-spinner" style={{ fontSize: 24, color: 'var(--accent)' }} />
    </div>
  )

  if (!product) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Produk tidak ditemukan</div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button
          icon={<ArrowLeft size={14} />}
          variant="ghost"
          iconOnly
          onClick={() => navigate('/products')}
        />
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
            History Resep — {product.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {recipes.length} versi resep · {product.categoryName}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

        {/* Kiri — Semua Versi Resep */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recipes.length === 0 ? (
            <div style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 10, padding: 40,
              textAlign: 'center', color: 'var(--muted)', fontSize: 13,
            }}>
              <ChefHat size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <div>Belum ada resep</div>
            </div>
          ) : (
            recipes.map((recipe) => (
              <div key={recipe.id} style={{
                background: 'var(--white)',
                border: `1px solid ${recipe.isActive ? '#A5D6A7' : 'var(--border)'}`,
                borderRadius: 10,
                padding: 16,
                position: 'relative',
              }}>
                {/* Recipe Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28,
                      background: recipe.isActive ? '#E8F5E9' : 'var(--sidebar-bg)',
                      borderRadius: 7,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {recipe.isActive
                        ? <CheckCircle size={14} color="#2E7D32" />
                        : <ChefHat size={14} color="var(--muted)" />
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                        Versi {recipe.versionNumber}
                      </div>
                      {recipe.notes && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{recipe.notes}</div>
                      )}
                    </div>
                    {recipe.isActive && (
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 4,
                        background: '#E8F5E9', color: '#2E7D32', fontWeight: 600,
                      }}>
                        Aktif
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Est. Modal: <strong style={{ color: 'var(--text)' }}>{formatRupiah(recipe.estimatedCost)}</strong>
                    </span>
                    {!recipe.isActive && (
                      <Button
                        label="Aktifkan"
                        variant="secondary"
                        size="small"
                        onClick={() => handleActivate(recipe.id)}
                      />
                    )}
                  </div>
                </div>

                {/* Bahan-bahan */}
                <div style={{ background: 'var(--sidebar-bg)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bahan</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Jumlah</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Est. Biaya</span>
                    </div>
                  </div>
                  {recipe.items.map((item, i) => (
                    <div key={item.id} style={{
                      padding: '8px 12px',
                      borderBottom: i < recipe.items.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.ingredientName}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 80, textAlign: 'right' }}>
                          {item.quantity} {item.unitSymbol}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 90, textAlign: 'right' }}>-</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Kanan — Info Produk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Info Produk */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Info Produk
            </div>
            {[
              { label: 'Kategori', value: product.categoryName },
              { label: 'Unit', value: product.unitName },
              { label: 'Harga Jual', value: formatRupiah(product.defaultPrice) },
              { label: 'Target Margin', value: `${product.targetMargin}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Estimasi dari Resep Aktif */}
          {activeRecipe && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Estimasi (Resep Aktif)
              </div>
              {[
                { label: 'Est. Modal', value: formatRupiah(activeRecipe.estimatedCost), color: 'var(--text)' },
                { label: 'Harga Jual', value: formatRupiah(product.defaultPrice), color: 'var(--accent)' },
                { label: 'Rek. Harga', value: formatRupiah(recommendedPrice), color: '#2E7D32' },
                {
                  label: 'Est. Profit',
                  value: formatRupiah(product.defaultPrice - activeRecipe.estimatedCost),
                  color: product.defaultPrice > activeRecipe.estimatedCost ? '#2E7D32' : '#C62828',
                },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Summary
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
              Total versi resep: <strong style={{ color: 'var(--text)' }}>{recipes.length}</strong>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Resep aktif: <strong style={{ color: '#2E7D32' }}>Versi {activeRecipe?.versionNumber ?? '-'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}