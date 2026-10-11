// ============================================================
// Panel principal (Dashboard).
// Muestra los indicadores del negocio, la serie de ventas y las
// alertas de inventario en tiempo real.
// ============================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  ShoppingCart,
  PackageSearch,
  HandCoins,
  ArrowDownCircle,
} from 'lucide-react'

import { useApp } from '../context/AppContext'
import { api } from '../services/api'
import { Alerta, Cargando, Insignia, Tarjeta, Vacio } from '../components/ui'
import { Monto } from '../components/ui'

export default function Dashboard() {
  const { tasa, tasaDatos, formatoBs } = useApp()
  const [datos, setDatos] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = async () => {
    setCargando(true)
    try {
      const [resp, mv] = await Promise.all([
        api.get('/reportes/dashboard'),
        api.get('/inventario/movimientos'),
      ])
      if (resp.data.exito) setDatos(resp.data.datos)
      setMovimientos((mv.data.datos || []).slice(0, 8))
    } catch {
      // ignoramos: se muestra el estado vacio
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cargando) return <Cargando mensaje="Preparando el panel..." />

  const tarjetas = [
    {
      titulo: 'Ventas de hoy',
      valor: datos ? formatoBs(datos.ventas_hoy_bs) : 'Bs. 0,00',
      sub: `${datos?.ventas_hoy_cantidad ?? 0} facturas emitidas`,
      icono: TrendingUp,
      color: 'bg-marca-50 text-marca-600',
    },
    {
      titulo: 'Ventas del mes',
      valor: datos ? formatoBs(datos.ventas_mes_bs) : 'Bs. 0,00',
      sub: 'Acumulado del ejercicio',
      icono: ShoppingCart,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      titulo: 'Por cobrar (CxC)',
      valor: datos ? <Monto numero={datos.por_cobrar_usd} tipo="usd" /> : '$ 0,00',
      sub: 'Saldo pendiente de clientes',
      icono: HandCoins,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      titulo: 'Productos bajo stock',
      valor: datos?.productos_bajo_stock ?? 0,
      sub: datos?.productos_bajo_stock ? 'Revise el inventario' : 'Sin alertas',
      icono: PackageSearch,
      color: datos?.productos_bajo_stock ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500',
    },
  ]

  const maximoSerie = Math.max(...(datos?.serie_ventas?.map((d) => d.total) || [0]), 1)

  return (
    <div className="space-y-6">
      {/* Tasa del dia */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Panel de control</h2>
          <p className="text-sm text-slate-500">
            Resumen general de {datos ? `la empresa y su actividad` : 'su actividad'}
          </p>
        </div>
        <div className="tarjeta flex items-center gap-3 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-500">Tasa BCV del dia</span>
          <span className="text-sm font-bold text-slate-800">Bs. {tasa.toLocaleString('es-VE', { maximumFractionDigits: 2 })}</span>
          <Insignia color={tasaDatos?.fuente === 'api' && tasaDatos?.es_de_hoy ? 'verde' : 'amarillo'}>
            {tasaDatos?.fuente === 'manual' ? 'Manual' : 'Automatica'}
          </Insignia>
        </div>
      </div>

      {/* Alertas si hiciera falta */}
      {datos?.ventas_hoy_bs === 0 && datos?.productos_bajo_stock === 0 && (
        <Alerta tipo="aviso">
          Use el <Link to="/pos" className="font-semibold underline">Punto de Venta</Link> para registrar la primera
          factura del dia y complete su inventario si hace falta.
        </Alerta>
      )}

      {/* Tarjetas de indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <Tarjeta key={tarjeta.titulo}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{tarjeta.titulo}</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{tarjeta.valor}</p>
                <p className="mt-1 text-xs text-slate-400">{tarjeta.sub}</p>
              </div>
              <span className={`rounded-lg p-3 ${tarjeta.color}`}>
                <tarjeta.icono size={22} />
              </span>
            </div>
          </Tarjeta>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grafica de ventas de los ultimos 7 dias */}
        <Tarjeta className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Ventas de los ultimos 7 dias</h3>
            <Insignia color="azul">{datos?.serie_ventas?.length ?? 0} dias</Insignia>
          </div>
          {datos?.serie_ventas?.length ? (
            <div className="flex h-48 items-end gap-2 sm:gap-4">
              {datos.serie_ventas.map((dato, indice) => (
                <div key={indice} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-marca-500 transition-all group-hover:bg-marca-600"
                      style={{ height: `${Math.max((dato.total / maximoSerie) * 100, 2)}%` }}
                    />
                    <span className="pointer-events-none absolute -top-6 hidden whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white group-hover:block">
                      {formatoBs(dato.total)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{dato.fecha}</span>
                </div>
              ))}
            </div>
          ) : (
            <Vacio mensaje="Aun no hay ventas para graficar" />
          )}
        </Tarjeta>

        {/* Ultimos movimientos */}
        <Tarjeta>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Movimientos recientes</h3>
            <Link to="/inventario" className="text-xs font-medium text-marca-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {movimientos.length ? (
            <ul className="space-y-3">
              {movimientos.map((movimiento) => (
                <li key={movimiento.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 rounded-lg p-2 ${
                      movimiento.tipo === 'entrada'
                        ? 'bg-emerald-50 text-emerald-600'
                        : movimiento.tipo === 'salida'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <ArrowDownCircle size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">{movimiento.producto_nombre}</p>
                    <p className="text-xs text-slate-400">
                      +{movimiento.cantidad} | {movimiento.motivo}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio mensaje="Sin movimientos todavia" />
          )}
        </Tarjeta>
      </div>
    </div>
  )
}