import { useLoadingStore } from '../../../store/useLoadingStore'

export default function LoadingOverlay() {
  const { isLoading } = useLoadingStore()

  if (!isLoading) return null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9998,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: '20px 28px',
        display: 'flex', alignItems: 'center', gap: 12,
        border: '1px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          width: 20, height: 20,
          border: '2.5px solid var(--border)',
          borderTop: '2.5px solid var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}/>
        <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
          Memproses...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}