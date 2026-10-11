// ============================================================
// Reportes y respaldos.
// Exporta informacion a Excel y genera copias de seguridad.
// ============================================================
import { useEffect, useState } from 'react'
import {
  FileSpreadsheet,
  Download,
  DatabaseBackup,
  RefreshCw,
  Boxes,
  Receipt,
  Truck,
  HandCoins,
  Landmark,
  Users,
  Store,
} from 'lucide-react'

import { api } from '../services/api'
import { Alerta, Boton, Cargando, Entrada, Insignia, Tarjeta, Vacio } from '../components/ui'

const REPORTES = [
  { tipo: 'inventario', titulo: 'Inventario', descripcion: 'Productos, costos y stock', icono: Boxes },
  { tipo: 'ventas', titulo: 'Ventas', descripcion: 'Facturas emitidas en el periodo', icono: Receipt },
  { tipo: 'compras', titulo: 'Compras', descripcion: 'Compras a proveedores', icono: Truck },
  { tipo: 'cxc', titulo: 'Cuentas por cobrar', descripcion: 'Saldos pendientes de clientes', icono: HandCoins },
  { tipo: 'cxp', titulo: 'Cuentas por pagar', descripcion: 'Saldos pendientes con proveedores', icono: Landmark },
  { tipo: 'clientes', titulo: 'Clientes', descripcion: 'Listado completo de clientes', icono: Users },
  { tipo: 'proveedores', titulo: 'Proveedores', descripcion: 'Listado completo de proveedores', icono: Store },
]

export default function Reportes() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [respaldos, setRespaldos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [generando, setGenerando] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const cargarRespaldos = async () => {
    setCargando(true)
    try {
      const { data } = await api.get('/reportes/respaldos')
      setRespaldos(data.datos || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarRespaldos()
  }, [])

  const exportar = async (tipo) => {
    setError('')
    setMensaje('')
    setGenerando(tipo)
    try {
      const { data } = await api.get(`/reportes/exportar/${tipo}`, {
        params: { desde: desde || undefined, hasta: hasta || undefined },
      })
      if (data.exito) setMensaje(`Reporte generado: ${data.datos.archivo}`)
    } catch (err) {
      setError(err.mensaje || 'No se pudo generar el reporte')
    } finally {
      setGenerando('')
    }
  }

  const crearRespaldo = async () => {
    setError('')
    setMensaje('')
    try {
      const { data } = await api.post('/reportes/respaldos', { tipo: 'completo' })
      if (data.exito) {
        setMensaje('Respaldo de la base de datos generado correctamente')
        cargarRespaldos()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo crear el respaldo')
    }
  }

  const tamano = (bytes) => {
    if (!bytes) return '--'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Reportes y respaldos</h2>
        <p className="text-sm text-slate-500">Exporte informacion a Excel y proteja sus datos</p>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}
      {mensaje && <Alerta tipo="exito" onCerrar={() => setMensaje('')}>{mensaje}</Alerta>}

      <Tarjeta className="flex flex-wrap items-end gap-3">
        <Entrada etiqueta="Desde (para ventas y compras)" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-48" />
        <Entrada etiqueta="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-48" />
      </Tarjeta>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTES.map((reporte) => (
          <Tarjeta key={reporte.tipo} className="flex flex-col justify-between">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-lg bg-marca-50 p-3 text-marca-600">
                <reporte.icono size={20} />
              </span>
              <div>
                <p className="font-semibold text-slate-800">{reporte.titulo}</p>
                <p className="text-xs text-slate-400">{reporte.descripcion}</p>
              </div>
            </div>
            <Boton secundario className="w-full" onClick={() => exportar(reporte.tipo)} disabled={generando === reporte.tipo}>
              <FileSpreadsheet size={16} />
              {generando === reporte.tipo ? 'Generando...' : 'Exportar a Excel'}
            </Boton>
          </Tarjeta>
        ))}

        {/* Respaldo */}
        <Tarjeta className="flex flex-col justify-between border-2 border-dashed border-slate-200">
          <div className="mb-4 flex items-start gap-3">
            <span className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <DatabaseBackup size={20} />
            </span>
            <div>
              <p className="font-semibold text-slate-800">Respaldo de la base de datos</p>
              <p className="text-xs text-slate-400">Copia de seguridad completa (SQLite)</p>
            </div>
          </div>
          <Boton className="w-full" onClick={crearRespaldo}>
            <DatabaseBackup size={16} /> Generar respaldo ahora
          </Boton>
        </Tarjeta>
      </div>

      <Tarjeta>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-slate-800">
            <DatabaseBackup size={18} /> Respaldos recientes
          </h3>
          <Boton secundario onClick={cargarRespaldos}>
            <RefreshCw size={16} /> Actualizar
          </Boton>
        </div>
        {cargando ? (
          <Cargando mensaje="Cargando respaldos..." />
        ) : respaldos.length ? (
          <ul className="divide-y divide-slate-100">
            {respaldos.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <Download size={16} className="text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{r.nombre_archivo}</p>
                  <p className="truncate text-xs text-slate-400">
                    {r.drive_link ? (
                      <a href={r.drive_link} target="_blank" rel="noopener noreferrer" className="text-marca-600 hover:underline">
                        Enviado a Google Drive
                      </a>
                    ) : (
                      r.ruta
                    )}
                  </p>
                </div>
                <Insignia color="azul">{tamano(r.tamano_bytes)}</Insignia>
                <span className="hidden text-xs text-slate-400 sm:block">{r.generado_por}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Vacio mensaje="Aun no se han generado respaldos" />
        )}
      </Tarjeta>
    </div>
  )
}