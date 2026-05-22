import { Trash2, Eye, ChefHat } from 'lucide-react'
import type { Product } from '../../types/product.types'
import Button from '../common/ui/Button'

interface ProductCardProps {
  product: Product
  onDetail: (product: Product) => void
  onRecipe: (product: Product) => void
  onDelete: (id: string) => void
}

const typeLabel: Record<string, string> = {
  MADE_TO_ORDER: 'Made to Order',
  MADE_TO_STOCK: 'Made to Stock',
  RESELL: 'Resell',
}

const typeColor: Record<string, { bg: string; text: string }> = {
  MADE_TO_ORDER: { bg: '#EEF0FB', text: '#5B6BD4' },
  MADE_TO_STOCK: { bg: '#E8F5E9', text: '#2E7D32' },
  RESELL: { bg: '#FFF3E0', text: '#E65100' },
}

export default function ProductCard({ product, onDetail, onRecipe, onDelete }: ProductCardProps) {
  const colors = typeColor[product.type] || { bg: '#F5F5F5', text: '#666666' }

  return (
    <div className="product-card" data-testid="product-card" style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'all 0.3s ease',
      boxShadow: '0 1px 3px rgba(36,61,77,0.08)',
      cursor: 'pointer',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(36,61,77,0.15)',
      },
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(36,61,77,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(36,61,77,0.08)'
      }}
    >
      {/* Header: Nama & Type */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: '0 0 6px 0',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {product.name}
          </h3>
          <span style={{
            display: 'inline-block',
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 4,
            background: colors.bg,
            color: colors.text,
            fontWeight: 500,
          }}>
            {typeLabel[product.type] ?? product.type}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        fontSize: 12,
      }}>
        {/* Kategori */}
        <div>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>Kategori</span>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text)', fontWeight: 500 }}>
            {product.categoryName || '-'}
          </p>
        </div>

        {/* Versi Resep */}
        <div>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>Versi Resep</span>
          {product.activeRecipeVersion ? (
            <p style={{
              margin: '4px 0 0 0',
              display: 'inline-block',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 500,
              background: '#E8F5E9',
              color: '#2E7D32',
            }}>
              v{product.activeRecipeVersion}
            </p>
          ) : (
            <p style={{ margin: '4px 0 0 0', color: 'var(--muted)' }}>—</p>
          )}
        </div>

        {/* Stok */}
        <div>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>Stok</span>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text)', fontWeight: 500 }}>
            {product.stockQuantity} {product.stockUnitName ?? product.unitName}
          </p>
        </div>

        {/* Unit */}
        <div>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>Unit</span>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text)', fontWeight: 500 }}>
            {product.unitName || '-'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid var(--border)',
      }}>
        <Button
          label="Detail"
          icon={<Eye size={12} />}
          variant="secondary"
          size="small"
          onClick={() => onDetail(product)}
          style={{ flex: 1 }}
        />
        <Button
          label="Resep"
          icon={<ChefHat size={12} />}
          variant="secondary"
          size="small"
          onClick={() => onRecipe(product)}
          style={{ flex: 1 }}
        />
        <Button
          label="Hapus"
          icon={<Trash2 size={12} />}
          variant="danger"
          size="small"
          onClick={() => onDelete(product.id)}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  )
}
