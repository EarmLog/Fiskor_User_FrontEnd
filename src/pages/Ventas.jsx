// ============================================================
// Ventas y facturas emitidas.
// Listado con filtros, detalle completo y anulacion.
// ============================================================
import { useEffect, useState } from 'react'
import { Eye, Receipt, Ban, Search, FileText, FileDown, Printer } from 'lucide-react'

import { useApp } from '../context/AppContext'
import { api, descargarArchivo } from '../services/api'
import {
  Alerta,
  Boton,
  Cargando,
  Entrada,
  Insignia,
  Modal,
  Seleccion,
  Tabla,
  Tarjeta,
  Vacio,
} from '../components/ui'
import { Monto } from '../components/ui'

export default function Ventas() {
  const { formatoBs } = useApp()
  const [ventas, setVentas] = useState([])
  const [estado, setEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [detalle, setDetalle] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [ocupado, setOcupado] = useState(0)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await api.get('/ventas', {
        params: { estado: estado || undefined, por_pagina: 300 },
      })
      setVentas(data.datos.items || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  const verDetalle = async (venta) => {
    try {
      const { data } = await api.get(`/ventas/${venta.id}`)
      if (data.exito) setDetalle(data.datos)
    } catch {
      setError('No se pudo cargar el detalle')
    }
  }

  const anular = async (venta) => {
    if (!window.confirm(`¿Anular la factura ${venta.numero_factura}? Se repone el inventario.`)) return
    try {
      const { data } = await api.post(`/ventas/${venta.id}/anular`)
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      cargar()
    } catch (err) {
      setError(err.mensaje || 'No se pudo anular la venta')
    }
  }

  // Descarga el documento generado por el backend (PDF o Word).
  const descargarDocumento = async (venta, tipo) => {
    setError('')
    setMensaje('')
    setOcupado(venta.id)
    try {
      const { data } = await api.get(`/ventas/${venta.id}/${tipo}`)
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      const { categoria, nombre } = data.datos
      await descargarArchivo(categoria, nombre)
    } catch (err) {
      setError(err.mensaje || 'No se pudo generar el documento')
    } finally {
      setOcupado(0)
    }
  }

  // Envia la venta a la impresora fiscal (SENIAT) si esta configurada.
  const imprimirFiscal = async (venta) => {
    setError('')
    setMensaje('')
    setOcupado(venta.id)
    try {
      const { data } = await api.post(`/ventas/${venta.id}/fiscal`)
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      setMensaje(data.mensaje)
    } catch (err) {
      setError(err.mensaje || 'No se pudo emitir el documento fiscal')
    } finally {
      setOcupado(0)
    }
  }

  const ventasFiltradas = ventas.filter((v) => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return true
    return (
      v.numero_factura?.toLowerCase().includes(texto) ||
      v.cliente_nombre?.toLowerCase().includes(texto)
    )
  })

  const totalRegistrado = ventas.reduce((suma, v) => suma + (v.total_bolivares || 0), 0)

  if (cargando && !ventas.length) return <Cargando mensaje="Cargando ventas..." />

  const estadoColor = (estado) =>
    estado === 'emitida' ? 'verde' : estado === 'anulada' ? 'rojo' : 'azul'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ventas</h2>
          <p className="text-sm text-slate-500">
            {ventas.length} facturas · total registrado <span className="font-semibold">{formatoBs(totalRegistrado)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Seleccion
            valorVacio="Todos los estados"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-44"
            opciones={[
              { valor: '', texto: 'Todos los estados' },
              { valor: 'emitida', texto: 'Emitida' },
              { valor: 'anulada', texto: 'Anulada' },
              { valor: 'pagada', texto: 'Pagada' },
            ]}
          />
        </div>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}
      {mensaje && <Alerta tipo="exito" onCerrar={() => setMensaje('')}>{mensaje}</Alerta>}

      <Entrada
        icono={Search}
        placeholder="Buscar por numero de factura o cliente..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {ventasFiltradas.length ? (
        <div className="tarjeta overflow-hidden">
          <Tabla
            columnas={['Fecha', 'Factura', 'Cliente', 'Condicion', 'Total Bs.', 'Estado', '']}
            filas={ventasFiltradas.map((venta) => ({
              celdas: [
                venta.fecha,
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <FileText size={14} className="text-slate-400" /> {venta.numero_factura || '--'}
                </span>,
                venta.cliente_nombre,
                venta.condicion,
                formatoBs(venta.total_bolivares),
                <Insignia color={estadoColor(venta.estado)}>{venta.estado}</Insignia>,
              ],
              acciones: [
                { icono: Eye, titulo: 'Ver detalle', color: 'azul', onClick: () => verDetalle(venta) },
                { icono: FileDown, titulo: 'Descargar PDF', color: 'verde', onClick: () => descargarDocumento(venta, 'pdf') },
                { icono: FileText, titulo: 'Descargar Word', color: 'azul', onClick: () => descargarDocumento(venta, 'word') },
                { icono: Printer, titulo: 'Imprimir en fiscal', color: 'ambar', onClick: () => imprimirFiscal(venta) },
                ...(venta.estado === 'emitida'
                  ? [{ icono: Ban, titulo: 'Anular', color: 'rojo', onClick: () => anular(venta) }]
                  : []),
              ],
            }))}
          />
        </div>
      ) : (
        <Tarjeta>
          <Vacio mensaje="No hay ventas que mostrar. Registrelas desde el Punto de Venta." />
        </Tarjeta>
      )}

      {/* ===== Detalle de la venta ===== */}
      <Modal
        titulo={`Detalle de ${detalle?.numero_factura || 'venta'}`}
        abierto={!!detalle}
        onCerrar={() => setDetalle(null)}
        ancho="max-w-2xl"
      >
        {detalle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-400">Fecha</p>
                <p className="font-medium text-slate-700">{detalle.fecha}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Cliente</p>
                <p className="truncate font-medium text-slate-700">{detalle.cliente_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tipo</p>
                <p className="capitalize font-medium text-slate-700">{detalle.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Condicion</p>
                <p className="capitalize font-medium text-slate-700">{detalle.condicion}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-400">
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2 text-right">Cant.</th>
                    <th className="px-3 py-2 text-right">Precio USD</th>
                    <th className="px-3 py-2 text-right">IVA</th>
                    <th className="px-3 py-2 text-right">Total USD</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.detalles.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{d.descripcion}</td>
                      <td className="px-3 py-2 text-right">{d.cantidad}</td>
                      <td className="px-3 py-2 text-right"><Monto numero={d.precio_unitario} tipo="usd" /></td>
                      <td className="px-3 py-2 text-right">{d.iva_porcentaje}%</td>
                      <td className="px-3 py-2 text-right"><Monto numero={d.total} tipo="usd" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              {detalle.pagos?.map((pago, i) => (
                <Insignia key={i} color="gris">
                  {pago.metodo.replace('_', ' ')} · {pago.moneda} {Number(pago.monto).toFixed(2)}
                  {pago.igtf_aplicado > 0 ? ` · IGTF ${formatoBs(pago.igtf_aplicado)}` : ''}
                </Insignia>
              ))}
            </div>

            <div className="space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span><Monto numero={detalle.subtotal} tipo="usd" /></span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA</span><span><Monto numero={detalle.iva} tipo="usd" /></span>
              </div>
              {detalle.igtf > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>IGTF (3%)</span><span>{formatoBs(detalle.igtf)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-800">
                <span>Total en divisas</span><span><Monto numero={detalle.total_divisas} tipo="usd" /></span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>Total Bs.</span><span>{formatoBs(detalle.total_bolivares)}</span>
              </div>
              <p className="pt-1 text-xs text-slate-400">Tasa aplicada: Bs. {detalle.tasa_aplicada}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <Boton secundario onClick={() => descargarDocumento(detalle, 'word')} disabled={ocupado === detalle.id}>
                <FileText size={16} /> Word
              </Boton>
              <Boton secundario onClick={() => descargarDocumento(detalle, 'pdf')} disabled={ocupado === detalle.id}>
                <FileDown size={16} /> PDF
              </Boton>
              <Boton onClick={() => imprimirFiscal(detalle)} disabled={ocupado === detalle.id}>
                <Printer size={16} /> {ocupado === detalle.id ? 'Procesando...' : 'Imprimir fiscal'}
              </Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}