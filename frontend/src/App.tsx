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

export default function App() {
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
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}