// ============================================================
// Compras a proveedores y cuentas por pagar.
// Registro de compras (aumenta inventario), detalle y anulacion.
// ============================================================
import { useEffect, useState } from 'react'
import { Plus, Eye, Ban, Truck, Search, Trash2 } from 'lucide-react'

import { useApp } from '../context/AppContext'
import { api } from '../services/api'
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

export default function Compras() {
  const { recargarTodo } = useApp()
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [detalle, setDetalle] = useState(null)
  const [error, setError] = useState('')

  // Formulario de la compra
  const [modalNueva, setModalNueva] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [compra, setCompra] = useState({
    proveedor_id: '',
    numero_factura: '',
    numero_control: '',
    condicion: 'contado',
    dias_credito: 30,
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: '',
    renglones: [],
  })

  const cargar = async () => {
    setCargando(true)
    try {
      const [resp, prov, prod] = await Promise.all([
        api.get('/compras', { params: { por_pagina: 300 } }),
        api.get('/proveedores', { params: { por_pagina: 200 } }),
        api.get('/inventario/productos', { params: { por_pagina: 500 } }),
      ])
      setCompras(resp.data.datos.items || [])
      setProveedores(prov.data.datos.items || [])
      setProductos(prod.data.datos.items || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrirNueva = () => {
    setCompra({
      proveedor_id: '',
      numero_factura: '',
      numero_control: '',
      condicion: 'contado',
      dias_credito: 30,
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: '',
      renglones: [],
    })
    setError('')
    setModalNueva(true)
  }

  const agregarRenglon = (producto) => {
    if (compra.renglones.some((r) => r.producto_id === producto.id)) {
      const existente = compra.renglones.find((r) => r.producto_id === producto.id)
      setCompra({
        ...compra,
        renglones: compra.renglones.map((r) =>
          r.producto_id === producto.id ? { ...r, cantidad: r.cantidad + 1 } : r,
        ),
      })
      return
    }
    setCompra({
      ...compra,
      renglones: [
        ...compra.renglones,
        {
          producto_id: producto.id,
          descripcion: producto.nombre,
          cantidad: 1,
          costo_unitario: producto.costo_divisa || 0,
          iva_porcentaje: producto.iva_porcentaje || 16,
        },
      ],
    })
  }

  const registrarCompra = async () => {
    setError('')
    if (!compra.proveedor_id) {
      setError('Seleccione el proveedor')
      return
    }
    if (!compra.renglones.length) {
      setError('Agregue al menos un renglon a la compra')
      return
    }
    setGuardando(true)
    try {
      const { data } = await api.post('/compras', {
        proveedor_id: Number(compra.proveedor_id),
        numero_factura: compra.numero_factura,
        numero_control: compra.numero_control,
        condicion: compra.condicion,
        dias_credito: compra.dias_credito,
        fecha: compra.fecha,
        observaciones: compra.observaciones,
        lineas: compra.renglones,
      })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModalNueva(false)
        cargar()
        recargarTodo()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo registrar la compra')
    } finally {
      setGuardando(false)
    }
  }

  const verDetalle = async (compra) => {
    try {
      const { data } = await api.get(`/compras/${compra.id}`)
      if (data.exito) setDetalle(data.datos)
    } catch {
      setError('No se pudo cargar el detalle')
    }
  }

  const anular = async (compra) => {
    if (!window.confirm(`¿Anular la compra ${compra.numero_factura}? Se resta del inventario.`)) return
    try {
      const { data } = await api.post(`/compras/${compra.id}/anular`)
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      cargar()
    } catch (err) {
      setError(err.mensaje || 'No se pudo anular la compra')
    }
  }

  const comprasFiltradas = compras.filter((c) => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return true
    return (
      c.numero_factura?.toLowerCase().includes(texto) ||
      c.proveedor_nombre?.toLowerCase().includes(texto)
    )
  })

  if (cargando && !compras.length) return <Cargando mensaje="Cargando compras..." />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Compras</h2>
          <p className="text-sm text-slate-500">Registro de compras a proveedores</p>
        </div>
        <Boton onClick={abrirNueva}>
          <Plus size={16} /> Nueva compra
        </Boton>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}

      <Entrada
        icono={Search}
        placeholder="Buscar por numero de factura o proveedor..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {comprasFiltradas.length ? (
        <div className="tarjeta overflow-hidden">
          <Tabla
            columnas={['Fecha', 'Factura', 'Proveedor', 'Condicion', 'Ret. IVA', 'Ret. ISLR', 'Total USD', 'Estado', '']}
            filas={comprasFiltradas.map((compra) => ({
              celdas: [
                compra.fecha,
                compra.numero_factura || '--',
                compra.proveedor_nombre,
                compra.condicion,
                compra.retencion_iva ? <Monto numero={compra.retencion_iva} tipo="usd" /> : '--',
                compra.retencion_islr ? <Monto numero={compra.retencion_islr} tipo="usd" /> : '--',
                <Monto numero={compra.total} tipo="usd" />,
                <Insignia color={compra.estado === 'anulada' ? 'rojo' : 'verde'}>{compra.estado}</Insignia>,
              ],
              acciones: [
                { icono: Eye, titulo: 'Ver detalle', color: 'azul', onClick: () => verDetalle(compra) },
                ...(compra.estado !== 'anulada'
                  ? [{ icono: Ban, titulo: 'Anular', color: 'rojo', onClick: () => anular(compra) }]
                  : []),
              ],
            }))}
          />
        </div>
      ) : (
        <Tarjeta>
          <Vacio mensaje="Aun no hay compras registradas" />
        </Tarjeta>
      )}

      {/* ===== Modal de nueva compra ===== */}
      <Modal
        titulo="Nueva compra"
        abierto={modalNueva}
        onCerrar={() => setModalNueva(false)}
        ancho="max-w-3xl"
        acciones={
          <>
            <Boton secundario onClick={() => setModalNueva(false)}>Cancelar</Boton>
            <Boton onClick={registrarCompra} disabled={guardando}>
              <Truck size={16} /> {guardando ? 'Registrando...' : 'Registrar compra'}
            </Boton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Seleccion
              etiqueta="Proveedor"
              valorVacio="Seleccione..."
              value={compra.proveedor_id}
              onChange={(e) => setCompra({ ...compra, proveedor_id: e.target.value })}
              opciones={proveedores.map((p) => ({ valor: String(p.id), texto: p.nombre }))}
            />
            <Entrada etiqueta="Fecha" type="date" value={compra.fecha} onChange={(e) => setCompra({ ...compra, fecha: e.target.value })} />
            <Entrada etiqueta="Numero de factura" value={compra.numero_factura} onChange={(e) => setCompra({ ...compra, numero_factura: e.target.value })} />
            <Entrada etiqueta="Numero de control" value={compra.numero_control} onChange={(e) => setCompra({ ...compra, numero_control: e.target.value })} />
            <Seleccion
              etiqueta="Condicion"
              value={compra.condicion}
              onChange={(e) => setCompra({ ...compra, condicion: e.target.value })}
              opciones={[
                { valor: 'contado', texto: 'Contado' },
                { valor: 'credito', texto: 'Credito' },
              ]}
            />
            {compra.condicion === 'credito' && (
              <Entrada etiqueta="Dias de credito" type="number" value={compra.dias_credito} onChange={(e) => setCompra({ ...compra, dias_credito: e.target.value })} />
            )}
          </div>

          {/* Selector de producto por codigo */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Agregar productos
            </p>
            <Seleccion
              valorVacio="Seleccione un producto para agregar..."
              value=""
              onChange={(e) => {
                const producto = productos.find((p) => String(p.id) === e.target.value)
                if (producto) agregarRenglon(producto)
              }}
              opciones={productos.map((p) => ({ valor: String(p.id), texto: `${p.codigo} - ${p.nombre}` }))}
            />
          </div>

          {compra.renglones.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-400">
                    <th className="px-3 py-2">Producto</th>
                    <th className="w-20 px-3 py-2">Cant.</th>
                    <th className="w-24 px-3 py-2">Costo USD</th>
                    <th className="w-16 px-3 py-2">IVA</th>
                    <th className="w-24 px-3 py-2 text-right">Total</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {compra.renglones.map((renglon, indice) => (
                    <tr key={indice} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{renglon.descripcion}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="campo px-2 py-1"
                          value={renglon.cantidad}
                          min="1"
                          onChange={(e) =>
                            setCompra({
                              ...compra,
                              renglones: compra.renglones.map((r, i) =>
                                i === indice ? { ...r, cantidad: Math.max(1, Number(e.target.value)) } : r,
                              ),
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="campo px-2 py-1"
                          value={renglon.costo_unitario}
                          onChange={(e) =>
                            setCompra({
                              ...compra,
                              renglones: compra.renglones.map((r, i) =>
                                i === indice ? { ...r, costo_unitario: Number(e.target.value) } : r,
                              ),
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="campo px-2 py-1"
                          value={renglon.iva_porcentaje}
                          onChange={(e) =>
                            setCompra({
                              ...compra,
                              renglones: compra.renglones.map((r, i) =>
                                i === indice ? { ...r, iva_porcentaje: Number(e.target.value) } : r,
                              ),
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-700">
                        {(renglon.cantidad * renglon.costo_unitario).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                          onClick={() => setCompra({ ...compra, renglones: compra.renglones.filter((_, i) => i !== indice) })}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== Detalle de la compra ===== */}
      <Modal
        titulo={`Detalle de compra ${detalle?.numero_factura || ''}`}
        abierto={!!detalle}
        onCerrar={() => setDetalle(null)}
        ancho="max-w-2xl"
      >
        {detalle && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-400">Proveedor</p>
                <p className="font-medium text-slate-700">{detalle.proveedor_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Fecha</p>
                <p className="font-medium text-slate-700">{detalle.fecha}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Condicion</p>
                <p className="capitalize font-medium text-slate-700">{detalle.condicion}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Estado</p>
                <p className="font-medium text-slate-700">{detalle.estado}</p>
              </div>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span><Monto numero={detalle.subtotal} tipo="usd" /></span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA</span><span><Monto numero={detalle.iva} tipo="usd" /></span>
              </div>
              {detalle.retencion_iva > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Retencion IVA</span><span>-<Monto numero={detalle.retencion_iva} tipo="usd" /></span>
                </div>
              )}
              {detalle.retencion_islr > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Retencion ISLR</span><span>-<Monto numero={detalle.retencion_islr} tipo="usd" /></span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-800">
                <span>Total en divisas</span><span><Monto numero={detalle.total} tipo="usd" /></span>
              </div>
            </div>
            <p className="text-xs text-slate-400">Registrada por: {detalle.usuario}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}