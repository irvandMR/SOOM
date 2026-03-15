import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/common/AppLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import { ROUTES } from './constants/routes'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OrderPage from './pages/OrderPage'
import IngredientPage from './pages/IngredientPage'
import ProductPage from './pages/ProductPage'
import ProductionPage from './pages/ProductionPage'
import CashFlowPage from './pages/CashFlowPage'
import ProductRecipeHistoryPage from './pages/ProductRecipeHistoryPage'
import { useAuthStore } from './store/useAuthStore'
import { useEffect, useState } from 'react'
import api from './services/api'
import UnitsPage from './pages/UnitsPage'
import CategoriesPage from './pages/CategoriesPage'


export default function App() {

  const { accessToken, setAuth } = useAuthStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      if (!accessToken) {
        setChecking(false)
        return
      }
      try {
        // Cek apakah token masih valid dengan hit /auth/me
        const res = await api.get('/auth/me')
        setAuth(accessToken, res.data.data)
      } catch {
        // Token expired dan refresh gagal → sudah di-handle interceptor
      } finally {
        setChecking(false)
      }
    }
    checkSession()
  }, [])

  if (checking) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--content-bg)',
    }}>
      <i className="pi pi-spin pi-spinner" style={{ fontSize: 28, color: 'var(--accent)' }} />
    </div>
  )

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.ORDERS} element={<OrderPage />} />
        <Route path={ROUTES.INGREDIENTS} element={<IngredientPage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductPage />} />
        <Route path={ROUTES.PRODUCTIONS} element={<ProductionPage />} />
        <Route path={ROUTES.CASH_FLOW} element={<CashFlowPage />} />
        <Route path={ROUTES.PRODUCT_RECIPE_HISTORY} element={<ProductRecipeHistoryPage />} />
        <Route path={ROUTES.UNITS} element={<UnitsPage />} />
        <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}