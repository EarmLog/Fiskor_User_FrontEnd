// ============================================================
// Rutas de la aplicacion.
// Las vistas privadas viven dentro de Layout (menu + barra).
// ============================================================
import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Inventario from './pages/Inventario'
import Ventas from './pages/Ventas'
import Compras from './pages/Compras'
import Clientes from './pages/Clientes'
import Proveedores from './pages/Proveedores'
import Tesoreria from './pages/Tesoreria'
import Nomina from './pages/Nomina'
import Fiscal from './pages/Fiscal'
import Usuarios from './pages/Usuarios'
import Empresa from './pages/Empresa'
import Reportes from './pages/Reportes'
import Auditoria from './pages/Auditoria'

export default function App() {
  const { token } = useAuth()

  // Ruta protegida: si no hay sesion, vamos al login.
  function RutaPrivada({ children }) {
    if (!token) return <Navigate to="/login" replace />
    return children
  }

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" replace />} />

      <Route
        path="/"
        element={
          <RutaPrivada>
            <Layout />
          </RutaPrivada>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="compras" element={<Compras />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="tesoreria" element={<Tesoreria />} />
        <Route path="nomina" element={<Nomina />} />
        <Route path="fiscal" element={<Fiscal />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="empresa" element={<Empresa />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="auditoria" element={<Auditoria />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}