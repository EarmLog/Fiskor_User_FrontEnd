// ============================================================
// Marco principal de las vistas privadas (Dashboard).
// Incluye el menu lateral, la barra superior con la tasa BCV en
// tiempo real, la empresa activa, el estado de caja y el usuario.
// ============================================================
import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Receipt,
  Truck,
  Users,
  Store,
  Wallet,
  Calculator,
  Landmark,
  ShieldCheck,
  Building2,
  FileBarChart,
  FileText,
  History,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Banknote,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'

export default function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { usuario, cerrarSesion } = useAuth()
  const { empresa, tasa, tasaDatos, caja, formatoBs, recargarTasa } = useApp()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const cerrar = () => {
    cerrarSesion()
    navegar('/login')
  }

  const actualizarTasa = async () => {
    const { data } = await api.post('/tasas/actualizar')
    if (data.exito) recargarTasa()
  }

  const menus = [
    {
      titulo: 'Principal',
      opciones: [
        { ruta: '/', etiqueta: 'Panel', icono: LayoutDashboard },
        { ruta: '/pos', etiqueta: 'Punto de Venta', icono: ShoppingCart },
      ],
    },
    {
      titulo: 'Gestion',
      opciones: [
        { ruta: '/inventario', etiqueta: 'Inventario', icono: Boxes },
        { ruta: '/ventas', etiqueta: 'Ventas y Facturas', icono: Receipt },
        { ruta: '/compras', etiqueta: 'Compras', icono: Truck },
        { ruta: '/documentos', etiqueta: 'Formatos', icono: FileText },
      ],
    },
    {
      titulo: 'Contabilidad',
      opciones: [
        { ruta: '/clientes', etiqueta: 'Clientes y CxC', icono: Users },
        { ruta: '/proveedores', etiqueta: 'Proveedores y CxP', icono: Store },
        { ruta: '/tesoreria', etiqueta: 'Caja y Bancos', icono: Wallet },
      ],
    },
    {
      titulo: 'Recursos Humanos',
      opciones: [{ ruta: '/nomina', etiqueta: 'Nomina', icono: Calculator }],
    },
    {
      titulo: 'Fiscal',
      opciones: [{ ruta: '/fiscal', etiqueta: 'Seniat y Retenciones', icono: Landmark }],
    },
    {
      titulo: 'Administracion',
      opciones: [
        { ruta: '/usuarios', etiqueta: 'Usuarios', icono: ShieldCheck },
        { ruta: '/empresa', etiqueta: 'Empresa', icono: Building2 },
        { ruta: '/reportes', etiqueta: 'Reportes y Respaldos', icono: FileBarChart },
        { ruta: '/auditoria', etiqueta: 'Auditoria', icono: History },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Fondo oscuro del menu en pantallas pequenas */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* ===== Menu lateral ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 transition-transform duration-200 lg:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <button onClick={() => navegar('/')} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-marca-600 text-white">
              <Banknote size={20} />
            </span>
            <span className="text-lg font-bold text-white">
              Fiskor<span className="text-marca-400">ERP</span>
            </span>
          </button>
          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
          {menus.map((grupo) => (
            <div key={grupo.titulo} className="mb-4">
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {grupo.titulo}
              </p>
              {grupo.opciones.map((opcion) => (
                <NavLink
                  key={opcion.ruta}
                  to={opcion.ruta}
                  end={opcion.ruta === '/'}
                  onClick={() => setMenuAbierto(false)}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-marca-600 font-medium text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <opcion.icono size={18} />
                  {opcion.etiqueta}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ===== Contenido principal ===== */}
      <div className="lg:pl-64">
        {/* Barra superior */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-800 sm:text-base">
              {empresa?.nombre || 'Fiskor ERP'}
            </h1>
            <p className="hidden truncate text-xs text-slate-400 sm:block">{empresa?.rif}</p>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {/* Tasa BCV en tiempo real */}
            <div
              className={`hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-sm sm:flex ${
                tasaDatos?.fuente === 'manual' || !tasaDatos?.es_de_hoy
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
              title="Tasa de cambio del dia"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-500">USD</span>
              <span className="font-semibold text-slate-800">Bs. {tasa.toLocaleString('es-VE', { maximumFractionDigits: 2 })}</span>
              <button onClick={actualizarTasa} className="text-slate-400 hover:text-marca-600" title="Actualizar tasa">
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Estado de caja */}
            <div
              className={`hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-sm md:flex ${
                caja ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}
              title="Estado de la caja"
            >
              <span className={`h-2 w-2 rounded-full ${caja ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-xs font-medium text-slate-600">{caja ? 'Caja abierta' : 'Caja cerrada'}</span>
            </div>

            {/* Usuario */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-marca-100 text-sm font-bold text-marca-700">
                {usuario?.nombre?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-700">{usuario?.nombre}</p>
                <p className="text-xs text-slate-400">{usuario?.rol}</p>
              </div>
            </div>

            <button
              onClick={cerrar}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Cerrar sesion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Alerta de tasa manual / desactualizada */}
        {(!tasaDatos || !tasaDatos.valor || tasaDatos.fuente === 'manual' || !tasaDatos.es_de_hoy) && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 sm:px-6">
            {tasaDatos?.valor
              ? `La tasa actual (${tasaDatos.fuente}) se cargo manualmente. Actualicela desde la tasa del dia o el modulo de Empresa.`
              : 'No hay una tasa de cambio configurada. Carguela antes de facturar.'}
          </div>
        )}

        <main key={ubicacion.pathname} className="animate-fade-in p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}