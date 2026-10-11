// ============================================================
// Auditoria: bitacora de operaciones del sistema.
// Quien hizo que, cuando y desde donde.
// ============================================================
import { useEffect, useState } from 'react'
import { History, Search, RefreshCw } from 'lucide-react'

import { api } from '../services/api'
import {
  Cargando,
  Entrada,
  Insignia,
  Seleccion,
  Tarjeta,
  Vacio,
} from '../components/ui'

export default function Auditoria() {
  const [trazas, setTrazas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState({ accion: '', modulo: '', usuario: '' })

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await api.get('/auditoria', {
        params: {
          accion: filtros.accion || undefined,
          modulo: filtros.modulo || undefined,
          usuario: filtros.usuario || undefined,
        },
      })
      setTrazas(data.datos || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.accion, filtros.modulo])

  const colorAccion = (accion) => {
    switch (accion) {
      case 'crear':
        return 'verde'
      case 'modificar':
        return 'azul'
      case 'eliminar':
      case 'anular':
        return 'rojo'
      default:
        return 'gris'
    }
  }

  const formatearFecha = (valor) => {
    if (!valor) return '--'
    try {
      return new Date(valor).toLocaleString('es-VE')
    } catch {
      return valor
    }
  }

  if (cargando && !trazas.length) return <Cargando mensaje="Cargando auditoria..." />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <History size={22} /> Auditoria
          </h2>
          <p className="text-sm text-slate-500">Trazas de las operaciones realizadas ({trazas.length} registros)</p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <Tarjeta className="flex flex-wrap items-end gap-3">
        <Seleccion
          etiqueta="Accion"
          valorVacio="Todas"
          value={filtros.accion}
          onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
          className="w-40"
          opciones={[
            { valor: '', texto: 'Todas' },
            { valor: 'crear', texto: 'Crear' },
            { valor: 'modificar', texto: 'Modificar' },
            { valor: 'eliminar', texto: 'Eliminar' },
            { valor: 'anular', texto: 'Anular' },
          ]}
        />
        <Entrada
          etiqueta="Modulo"
          placeholder="Ej: ventas"
          value={filtros.modulo}
          onChange={(e) => setFiltros({ ...filtros, modulo: e.target.value })}
          className="w-40"
        />
        <Entrada
          etiqueta="Usuario"
          icono={Search}
          placeholder="Correo del usuario"
          value={filtros.usuario}
          onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && cargar()}
          className="w-56"
        />
      </Tarjeta>

      {trazas.length ? (
        <Tarjeta className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-400">
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Accion</th>
                <th className="px-4 py-2">Modulo</th>
                <th className="px-4 py-2">Detalle</th>
                <th className="px-4 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {trazas.map((traza) => (
                <tr key={traza.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">{formatearFecha(traza.fecha)}</td>
                  <td className="px-4 py-2 text-slate-700">{traza.usuario_email}</td>
                  <td className="px-4 py-2">
                    <Insignia color={colorAccion(traza.accion)}>{traza.accion}</Insignia>
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {traza.modulo}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{traza.detalle}</td>
                  <td className="px-4 py-2 text-xs text-slate-400">{traza.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      ) : (
        <Tarjeta>
          <Vacio mensaje="No hay registros de auditoria con esos filtros" />
        </Tarjeta>
      )}
    </div>
  )
}