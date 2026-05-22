import { Trash2, CheckCircle } from 'lucide-react'
import type { Recipe } from '../../types/product.types'
import Button from '../common/ui/Button'

interface RecipeCardProps {
  recipe: Recipe
  isActive?: boolean
  onActivate?: (recipeId: string) => void
  onDelete: (recipeId: string) => void
}

export default function RecipeCard({ recipe, isActive, onActivate, onDelete }: RecipeCardProps) {
  return (
    <div style={{
      background: 'var(--white)',
      border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 10,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'all 0.3s ease',
      boxShadow: isActive ? '0 2px 8px rgba(91, 107, 212, 0.2)' : '0 1px 3px rgba(36,61,77,0.08)',
      position: 'relative',
    }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(36,61,77,0.15)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isActive ? '0 2px 8px rgba(91, 107, 212, 0.2)' : '0 1px 3px rgba(36,61,77,0.08)'
      }}
    >
      {/* Active Badge */}
      {isActive && (
        <div style={{
          position: 'absolute',
          top: -12,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 12px',
          borderRadius: 20,
          background: 'var(--accent)',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 600,
        }}>
          <CheckCircle size={12} />
          Aktif
        </div>
      )}

      {/* Header: Version & Date */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
          }}>
            v{recipe.version}
          </h3>
          <span style={{
            fontSize: 11,
            color: 'var(--muted)',
            marginTop: 4,
            display: 'block',
          }}>
            {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : '-'}
          </span>
        </div>
      </div>

      {/* Ingredients */}
      {recipe.items && recipe.items.length > 0 && (
        <div>
          <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 500 }}>Bahan ({recipe.items.length})</span>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 8,
          }}>
            {recipe.items.slice(0, 3).map((item: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                padding: '6px 0',
                borderBottom: idx < recipe.items.length - 1 && idx < 2 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ color: 'var(--text)', flex: 1 }}>
                  {item.ingredientName || item.name}
                </span>
                <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {item.quantity} {item.unitName}
                </span>
              </div>
            ))}
            {recipe.items.length > 3 && (
              <span style={{
                fontSize: 11,
                color: 'var(--accent)',
                fontWeight: 500,
                marginTop: 4,
              }}>
                +{recipe.items.length - 3} bahan lainnya
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {recipe.notes && (
        <div>
          <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 500 }}>Catatan</span>
          <p style={{
            margin: '6px 0 0 0',
            fontSize: 12,
            color: 'var(--text)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {recipe.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid var(--border)',
      }}>
        {onActivate && !isActive && (
          <Button
            label="Aktifkan"
            variant="primary"
            size="small"
            onClick={() => onActivate(recipe.id)}
            style={{ flex: 1 }}
          />
        )}
        <Button
          label="Hapus"
          icon={<Trash2 size={12} />}
          variant="danger"
          size="small"
          onClick={() => onDelete(recipe.id)}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  )
}
