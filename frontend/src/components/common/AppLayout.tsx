import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSidebarStore } from '../../store/useSidebarStore'

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
  const location = useLocation()

  const breadcrumb = breadcrumbMap[location.pathname] ?? ['Main Menu']

  const sidebarWidth = collapsed
    ? 'var(--sidebar-collapsed)'
    : 'var(--sidebar-width)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--content-bg)' }}>

      {/* Sidebar */}
      <Sidebar />

      {/* Main — geser kanan sesuai lebar sidebar */}
      <div style={{
        flex: 1,
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>

        {/* Topbar */}
        <Topbar breadcrumb={breadcrumb} />

        {/* Content */}
        <main style={{
          flex: 1,
          marginTop: 'var(--topbar-height)',
          padding: '24px',
          background: 'var(--content-bg)',
        }}>
          <Outlet />
        </main>

      </div>
    </div>
  )
}