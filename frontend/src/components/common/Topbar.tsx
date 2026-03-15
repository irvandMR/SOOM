import { useSidebarStore } from "../../store/useSidebarStore"

interface TopbarProps {
  breadcrumb: string[]
}

export default function Topbar({ breadcrumb }: TopbarProps) {
    const { collapsed } = useSidebarStore()
  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--topbar-bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      position: 'fixed',
      top: 0,
      right: 0,
      left: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)', // ← fix ini
      zIndex: 99,
      transition: 'left 0.22s ease',
    }}>

      {/* Breadcrumb */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: 'var(--muted)',
      }}>
        {breadcrumb.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'var(--border)', fontSize: 14 }}>›</span>}
            <span style={
              i === breadcrumb.length - 1
                ? { color: 'var(--text)', fontWeight: 500, fontSize: 13 }
                : {}
            }>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Date Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          border: '1px solid var(--border)',
          borderRadius: 7,
          background: 'var(--sidebar-bg)',
          fontSize: 12,
          color: 'var(--text)',
          fontWeight: 500,
          cursor: 'pointer',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1.5" width="10" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M3.5 1v1.5M8.5 1v1.5M1 5h10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          Hari ini
          <svg width="8" height="8" viewBox="0 0 8 5" fill="none">
            <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Notification */}
        <button style={{
          width: 30, height: 30,
          border: '1px solid var(--border)',
          borderRadius: 7,
          background: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1a4.5 4.5 0 0 1 4.5 4.5V9l1.5 2H1L2.5 9V5.5A4.5 4.5 0 0 1 7 1z" stroke="var(--muted)" strokeWidth="1.2"/>
            <path d="M5.5 12a1.5 1.5 0 0 0 3 0" stroke="var(--muted)" strokeWidth="1.2"/>
          </svg>
          <span style={{
            position: 'absolute',
            top: 5, right: 5,
            width: 7, height: 7,
            background: '#E24B4A',
            borderRadius: '50%',
            border: '1.5px solid white',
          }}/>
        </button>

        {/* Avatar */}
        <div style={{
          width: 30, height: 30,
          borderRadius: '50%',
          background: 'var(--sidebar-active)',
          border: '1.5px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--sidebar-text)',
          cursor: 'pointer',
          flexShrink: 0,
        }}>
          RI
        </div>
      </div>
    </header>
  )
}