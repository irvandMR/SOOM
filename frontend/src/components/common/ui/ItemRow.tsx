import { X } from 'lucide-react'

interface ItemRowProps {
  index: number
  onRemove?: () => void
  showRemove?: boolean
  children: React.ReactNode
}

export default function ItemRow({ index, onRemove, showRemove = true, children }: ItemRowProps) {
  return (
    <div style={{
      background: 'var(--sidebar-bg)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
      position: 'relative',
    }}>
      {/* Nomor + Remove */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>
          Item {index + 1}
        </span>
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E57373', padding: 2, display: 'flex', alignItems: 'center' }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}