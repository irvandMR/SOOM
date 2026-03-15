import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSidebarStore } from '../../store/useSidebarStore'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import GlobalToast from './ui/GlobalToast'
import ConfirmDialog from './ui/ConfirmDialog'
import LoadingOverlay from './ui/LoadingOverlay'

const breadcrumbMap: Record<string, string[]> = {
  '/': ['Main Menu', 'Dashboard'],
  '/orders': ['Main Menu', 'Order'],
  '/products': ['Main Menu', 'Produk & Resep'],
  '/ingredients': ['Main Menu', 'Stok Bahan Baku'],
  '/productions': ['Main Menu', 'Produksi'],
  '/cash-flow': ['Main Menu', 'Keuangan'],
  '/settings/units': ['Settings', 'Units'],
  '/settings/categories': ['Settings', 'Kategori'],
}

export default function AppLayout() {
  const { collapsed } = useSidebarStore()
  const { isMobile } = useBreakpoint()
  const location = useLocation()

  // Handle dynamic breadcrumb
  const getBreadcrumb = (): string[] => {
    const path = location.pathname

    if (path.startsWith('/products/') && path.endsWith('/recipes')) {
      return ['Main Menu', 'Produk & Resep', 'History Resep']
    }

    return breadcrumbMap[path] ?? ['Main Menu']
  }

  const breadcrumb = getBreadcrumb()

  const marginLeft = isMobile
    ? 0
    : collapsed
      ? 'var(--sidebar-collapsed)'
      : 'var(--sidebar-width)'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--content-bg)' }}>
      <GlobalToast />
      <ConfirmDialog />
      <LoadingOverlay /> 
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