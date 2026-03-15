import { NavLink } from 'react-router-dom'
import { Sidebar as PrimeSidebar } from 'primereact/sidebar'
import { useSidebarStore } from '../../store/useSidebarStore'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { ROUTES } from '../../constants/routes'

const menuItems = [
  {
    label: 'Dashboard', path: ROUTES.DASHBOARD,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.2" fill="currentColor"/>
        <rect x="9" y="1" width="6" height="6" rx="1.2" fill="currentColor"/>
        <rect x="1" y="9" width="6" height="6" rx="1.2" fill="currentColor"/>
        <rect x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Order', path: ROUTES.ORDERS,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h9M2 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Stok Bahan Baku', path: ROUTES.INGREDIENTS,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M3 3h10v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M6 3v10M3 7h10" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    label: 'Produk & Resep', path: ROUTES.PRODUCTS,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5 3V2M11 3V2M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Produksi', path: ROUTES.PRODUCTIONS,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M3 13V8m4 5V5m4 8V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Keuangan', path: ROUTES.CASH_FLOW,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const SidebarContent = ({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) => (
  <>
    {/* Header */}
    <div style={{
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px 0 16px',
      borderBottom: '1px solid var(--sidebar-border)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          background: 'var(--accent)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="white"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="white"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="white"/>
          </svg>
        </div>
        {!collapsed && (
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--sidebar-text)', letterSpacing: '0.5px' }}>
            SOOM
          </span>
        )}
      </div>
    </div>

    {/* Menu */}
    <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
      {!collapsed && (
        <div style={{
          fontSize: 10, fontWeight: 600,
          color: 'var(--sidebar-muted)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          padding: '4px 16px 6px',
        }}>
          Main Menu
        </div>
      )}
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          onClick={onClose}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '10px 0' : '8px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: isActive ? 'var(--sidebar-text)' : 'var(--sidebar-muted)',
            background: isActive ? 'var(--sidebar-active)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: isActive ? 600 : 400,
            fontSize: 13,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.13s',
          })}
        >
          {item.icon}
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </nav>

    {/* Footer */}
    <div style={{ borderTop: '1px solid var(--sidebar-border)', padding: '10px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '8px 0' : '8px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: 'var(--sidebar-muted)', fontSize: 13,
      }}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {!collapsed && <span>Admin SOOM</span>}
      </div>
    </div>
  </>
)

export default function Sidebar() {
  const { collapsed, toggle } = useSidebarStore()
  const { isMobile } = useBreakpoint()

  // Mobile — PrimeSidebar drawer
  if (isMobile) {
    return (
      <PrimeSidebar
        visible={!collapsed}
        onHide={toggle}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--sidebar-bg)',
          padding: 0,
        }}
        pt={{
          header: { style: { display: 'none' } },
          content: { style: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } },
        }}
      >
        <SidebarContent collapsed={false} onClose={toggle} />
      </PrimeSidebar>
    )
  }

  // Desktop — fixed sidebar
  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s ease',
      overflow: 'visible',
      flexShrink: 0,
      height: '100vh',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 101,
    }}>
      <SidebarContent collapsed={collapsed} />

      {/* Toggle Button */}
      <button
        onClick={toggle}
        style={{
          position: 'absolute',
          top: 16, right: -12,
          width: 24, height: 24,
          border: '1px solid var(--sidebar-border)',
          borderRadius: '50%',
          background: 'var(--white)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          zIndex: 102,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        {collapsed ? (
          <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
            <path d="M3 2l5 3.5L3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
            <path d="M8 2L3 5.5l5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </aside>
  )
}