import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSidebarStore } from '../../store/useSidebarStore'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const breadcrumbMap: Record<string, string[]> = {
  '/': ['Main Menu', 'Dashboard'],
  '/orders': ['Main Menu', 'Order'],
  '/orders/new': ['Main Menu', 'Order', 'Buat Order Baru'],
  '/products': ['Main Menu', 'Produk & Resep'],
  '/ingredients': ['Main Menu', 'Stok Bahan Baku'],
  '/productions': ['Main Menu', 'Produksi'],
  '/cash-flow': ['Main Menu', 'Keuangan'],
}

export default function AppLayout() {
  const { collapsed } = useSidebarStore()
  const { isMobile } = useBreakpoint()
  const location = useLocation()

  const breadcrumb = breadcrumbMap[location.pathname] ?? ['Main Menu']

  const marginLeft = isMobile
    ? 0
    : collapsed
      ? 'var(--sidebar-collapsed)'
      : 'var(--sidebar-width)'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--content-bg)' }}>

      <Sidebar />

      <div style={{
        flex: 1,
        marginLeft,
        transition: 'margin-left 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>
        <Topbar breadcrumb={breadcrumb} />

        <main style={{
          flex: 1,
          marginTop: 'var(--topbar-height)',
          padding: isMobile ? '16px' : '24px',
          background: 'var(--content-bg)',
          overflowY: 'auto',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}