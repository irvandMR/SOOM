import { useSidebarStore } from '../../store/useSidebarStore'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useAuthStore } from '../../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { Menu } from 'primereact/menu'
import { useRef } from 'react'
import api from '../../services/api'

interface TopbarProps {
  breadcrumb: string[]
}

export default function Topbar({ breadcrumb }: TopbarProps) {
  const { collapsed, toggle } = useSidebarStore()
  const { isMobile } = useBreakpoint()
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const menuRef = useRef<Menu>(null)

   const handleLogout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (err) {
            console.error(err)
        } finally {
            clearAuth()
            navigate('/login')
        }
    }

    const avatarMenuItems = [
        {
            label: user?.name ?? 'Admin',
            items: [
                {
                label: 'Logout',
                icon: 'pi pi-sign-out',
                command: handleLogout,
                }
            ]
        }
    ]

   

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
      left: isMobile ? 0 : (collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'),
      zIndex: 99,
      transition: 'left 0.22s ease',
    }}>

      {/* Mobile — hamburger */}
      {isMobile && (
        <button
          onClick={toggle}
          style={{
            width: 30, height: 30,
            border: '1px solid var(--border)',
            borderRadius: 7,
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* Breadcrumb */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: 'var(--muted)',
        overflow: 'hidden',
      }}>
        {breadcrumb.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
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

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Date Filter — hide on mobile */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            border: '1px solid var(--border)',
            borderRadius: 7,
            background: 'var(--sidebar-bg)',
            fontSize: 12, color: 'var(--text)', fontWeight: 500,
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
        )}

        {/* Notification */}
        <button style={{
          width: 30, height: 30,
          border: '1px solid var(--border)',
          borderRadius: 7,
          background: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1a4.5 4.5 0 0 1 4.5 4.5V9l1.5 2H1L2.5 9V5.5A4.5 4.5 0 0 1 7 1z" stroke="var(--muted)" strokeWidth="1.2"/>
            <path d="M5.5 12a1.5 1.5 0 0 0 3 0" stroke="var(--muted)" strokeWidth="1.2"/>
          </svg>
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 7, height: 7,
            background: '#E24B4A',
            borderRadius: '50%',
            border: '1.5px solid white',
          }}/>
        </button>

        {/* Avatar + Dropdown */}
        <Menu model={avatarMenuItems} popup ref={menuRef} />
        <div
            onClick={(e) => menuRef.current?.toggle(e)}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', padding: '4px 8px',
                borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--sidebar-bg)',
            }}
            >
            <div style={{
                width: 26, height: 26,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'white',
                flexShrink: 0,
            }}>
                {user?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            {!isMobile && (
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                {user?.name ?? 'Admin'}
                </span>
            )}
            <svg width="10" height="10" viewBox="0 0 8 5" fill="none">
                <path d="M1 1l3 3 3-3" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
        </div>
      </div>
    </header>
  )
}