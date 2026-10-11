// ============================================================
// Punto de Venta (POS).
// Carrito dinamico con IVA (16%), IGTF (3%) en pagos con
// divisas en efectivo y doble moneda (Bolivares y USD).
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Search, ShoppingCart, CheckCircle2, User, FileDown, Printer } from 'lucide-react'

import { useApp } from '../context/AppContext'
import { api, descargarArchivo } from '../services/api'
import { Alerta, Boton, Cargando, Entrada, Insignia, Modal, Seleccion } from '../components/ui'
import { Monto } from '../components/ui'

export default function POS() {
  const { tasa, tasaDatos, formatoBs, enBolivares, recargarTodo } = useApp()

  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)

  const [lineas, setLineas] = useState([]) // carrito de compra
  const [clienteId, setClienteId] = useState('')
  const [tipo, setTipo] = useState('factura')
  const [condicion, setCondicion] = useState('contado')

  const [pagos, setPagos] = useState([{ metodo: 'efectivo_bs', moneda: 'VES', monto: '' }])
  const [creado, setCreado] = useState(null) // venta registrada con exito
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [avisoDoc, setAvisoDoc] = useState('')

  const cargarBase = async () => {
    setCargando(true)
    try {
      const [respProductos, respClientes] = await Promise.all([
        api.get('/inventario/productos', { params: { por_pagina: 200 } }),
        api.get('/clientes', { params: { por_pagina: 200 } }),
      ])
      setProductos(respProductos.data.datos.items || [])
      setClientes(respClientes.data.datos.items || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarBase()
  }, [])

  // ---- Reglas fiscales en el carrito ----
  const totales = useMemo(() => {
    let subtotal = 0
    let descuento = 0
    let base = 0
    let iva = 0
    for (const linea of lineas) {
      const bruto = linea.cantidad * linea.precio
      const neto = bruto - linea.descuento
      subtotal += bruto
      descuento += linea.descuento
      base += neto
      iva += (neto * linea.iva) / 100
    }
    // IGTF: 3% del monto en divisas en efectivo convertido a Bs.
    let igtf = 0
    for (const pago of pagos) {
      if (pago.metodo === 'efectivo_divisa' && Number(pago.monto) > 0) {
        igtf += Number(pago.monto) * tasa * 0.03
      }
    }
    const totalDivisas = base + iva
    const totalBs = totalDivisas * tasa + igtf
    return {
      subtotal,
      descuento,
      base,
      iva,
      igtf,
      totalDivisas,
      totalBs,
      totalPagosBs: pagos.reduce((acum, p) => {
        const m = Number(p.monto) || 0
        return acum + (p.moneda === 'USD' ? m * tasa : m)
      }, 0),
    }
  }, [lineas, pagos, tasa])

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return productos
    return productos.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(texto) ||
        p.codigo?.toLowerCase().includes(texto) ||
        p.codigo_barras?.toLowerCase().includes(texto),
    )
  }, [productos, busqueda])

  // ---- Acciones del carrito ----
  const agregarLinea = (producto) => {
    setError('')
    const existente = lineas.find((l) => l.producto_id === producto.id)
    if (existente) {
      if (existente.cantidad + 1 > producto.stock_actual) {
        setError(`Stock insuficiente de ${producto.nombre}`)
        return
      }
      setLineas(
        lineas.map((l) => (l.producto_id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l)),
      )
      return
    }
    if (producto.stock_actual <= 0) {
      setError(`El producto ${producto.nombre} no tiene stock`)
      return
    }
    setLineas([
      ...lineas,
      {
        producto_id: producto.id,
        descripcion: producto.nombre,
        cantidad: 1,
        precio: producto.precio_divisa,
        iva: producto.iva_porcentaje,
        descuento: 0,
      },
    ])
  }

  const cambiarCantidad = (producto_id, cantidad) => {
    const producto = productos.find((p) => p.id === producto_id)
    if (cantidad < 1) return
    if (producto && cantidad > producto.stock_actual) {
      setError(`Stock insuficiente de ${producto.nombre}`)
      return
    }
    setLineas(lineas.map((l) => (l.producto_id === producto_id ? { ...l, cantidad } : l)))
  }

  const quitarLinea = (producto_id) => setLineas(lineas.filter((l) => l.producto_id !== producto_id))

  const cambiarPago = (indice, campo, valor) => {
    const nuevos = pagos.map((pago, i) => {
      if (i !== indice) return pago
      const actualizado = { ...pago, [campo]: valor }
      // Si cambia a efectivo en divisas, la moneda pasa a USD.
      if (campo === 'metodo') {
        actualizado.moneda = valor === 'efectivo_divisa' ? 'USD' : 'VES'
      }
      return actualizado
    })
    setPagos(nuevos)
  }

  const limpiarCarrito = () => {
    setLineas([])
    setPagos([{ metodo: 'efectivo_bs', moneda: 'VES', monto: '' }])
    setClienteId('')
    setCondicion('contado')
    setError('')
  }

  // ---- Registrar la venta ----
  const registrarVenta = async () => {
    setError('')
    if (!lineas.length) {
      setError('Agregue al menos un producto al carrito')
      return
    }
    if (condicion === 'credito' && !clienteId) {
      setError('Para vender a credito debe seleccionar un cliente')
      return
    }
    // Validamos que los pagos cubran el total (si es contado).
    if (condicion === 'contado') {
      const cubierto = pagos.reduce((acum, p) => {
        const m = Number(p.monto) || 0
        return acum + (p.moneda === 'USD' ? m * tasa : m)
      }, 0)
      if (cubierto < totales.totalBs * 0.999) {
        setError(`Los pagos deben cubrir el total (faltan ${formatoBs(totales.totalBs - cubierto)})`)
        return
      }
    }

    setGuardando(true)
    try {
      const cuerpo = {
        cliente_id: clienteId || null,
        condicion,
        tipo,
        lineas: lineas.map((l) => ({
          producto_id: l.producto_id,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio,
          iva_porcentaje: l.iva,
          descuento: l.descuento || 0,
        })),
        pagos: pagos
          .filter((p) => Number(p.monto) > 0)
          .map((p) => ({ metodo: p.metodo, moneda: p.moneda, monto: Number(p.monto) })),
      }
      const { data } = await api.post('/ventas', cuerpo)
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setCreado(data.datos)
        limpiarCarrito()
        recargarTodo()
        await cargarBase()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo registrar la venta')
    } finally {
      setGuardando(false)
    }
  }

  // Genera y descarga el documento de una venta (PDF o Word).
  const descargarDocumento = async (venta, tipo) => {
    if (!venta?.id) return
    setAvisoDoc('')
    setOcupado(true)
    try {
      const { data } = await api.get(`/ventas/${venta.id}/${tipo}`)
      if (data.exito) await descargarArchivo(data.datos.categoria, data.datos.nombre)
    } catch (err) {
      setAvisoDoc(err.mensaje || 'No se pudo generar el documento')
    } finally {
      setOcupado(false)
    }
  }

  // Envia la venta a la impresora fiscal si esta configurada.
  const imprimirFiscal = async (venta) => {
    if (!venta?.id) return
    setAvisoDoc('')
    setOcupado(true)
    try {
      const { data } = await api.post(`/ventas/${venta.id}/fiscal`)
      setAvisoDoc(data.exito ? data.mensaje : data.mensaje || 'No se pudo emitir el documento fiscal')
    } catch (err) {
      setAvisoDoc(err.mensaje || 'No se pudo emitir el documento fiscal')
    } finally {
      setOcupado(false)
    }
  }

  const monedas = ['VES', 'USD']

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Punto de Venta</h2>
          <p className="text-sm text-slate-500">
            Facturacion con IVA, IGTF y doble moneda
          </p>
        </div>
        <div className="tarjeta px-4 py-2 text-sm">
          <span className="text-slate-500">Tasa: </span>
          <span className="font-semibold text-slate-800">Bs. {tasa.toLocaleString('es-VE', { maximumFractionDigits: 2 })}</span>
          <Insignia color={tasaDatos?.fuente === 'manual' ? 'amarillo' : 'verde'} className="ml-2">
            {tasaDatos?.fuente === 'manual' ? 'manual' : 'automatica'}
          </Insignia>
        </div>
      </div>

      {tasa === 0 && (
        <Alerta tipo="error">
          No hay tasa de cambio configurada. Debe cargarla en el modulo de Empresa antes de facturar.
        </Alerta>
      )}

      {cargando ? (
        <Cargando mensaje="Cargando productos..." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* ============ Columna izquierda: productos ============ */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <Entrada
                icono={Search}
                placeholder="Busque por codigo, nombre o barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {productosFiltrados.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => agregarLinea(producto)}
                  disabled={producto.stock_actual <= 0}
                  className={`group flex flex-col rounded-xl border p-3 text-left transition-all ${
                    producto.stock_actual > 0
                      ? 'border-slate-200 bg-white shadow-card hover:border-marca-400 hover:shadow'
                      : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="truncate text-xs text-slate-400">{producto.codigo}</span>
                    {producto.alerta_stock && (
                      <Insignia color={producto.stock_actual <= 0 ? 'rojo' : 'amarillo'}>
                        {producto.stock_actual}
                      </Insignia>
                    )}
                  </div>
                  <p className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-700">
                    {producto.nombre}
                  </p>
                  <div className="mt-auto space-y-1">
                    <p className="text-sm font-bold text-marca-600">
                      <Monto numero={producto.precio_divisa} tipo="usd" />
                    </p>
                    <p className="text-xs font-medium text-slate-500">{formatoBs(enBolivares(producto.precio_divisa))}</p>
                  </div>
                </button>
              ))}
              {productosFiltrados.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-slate-400">
                  No se encontraron productos
                </p>
              )}
            </div>
          </div>

          {/* ============ Columna derecha: carrito ============ */}
          <div className="lg:col-span-2">
            <div className="tarjeta flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                  <ShoppingCart size={18} />
                  Carrito
                </h3>
                <Insignia color="azul">{lineas.length} articulos</Insignia>
              </div>

              {/* Datos de la factura */}
              <div className="grid grid-cols-2 gap-3 border-b border-slate-200 px-4 py-3">
                <Seleccion
                  etiqueta="Tipo de documento"
                  valorVacio=""
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  opciones={[
                    { valor: 'factura', texto: 'Factura' },
                    { valor: 'nota_entrega', texto: 'Nota de entrega' },
                  ]}
                />
                <Seleccion
                  etiqueta="Condicion"
                  value={condicion}
                  onChange={(e) => setCondicion(e.target.value)}
                  opciones={[
                    { valor: 'contado', texto: 'Contado' },
                    { valor: 'credito', texto: 'Credito' },
                  ]}
                />
                <div className="col-span-2">
                  <Seleccion
                    etiqueta="Cliente"
                    valorVacio="Consumidor final"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    opciones={clientes.map((c) => ({ valor: String(c.id), texto: `${c.nombre}` }))}
                  />
                </div>
              </div>

              {/* Carrito */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {lineas.length === 0 && (
                  <div className="flex flex-col items-center py-10 text-slate-400">
                    <ShoppingCart size={40} className="mb-2" />
                    <p className="text-sm">El carrito esta vacio</p>
                  </div>
                )}
                {lineas.map((linea) => (
                  <div key={linea.producto_id} className="mb-2 rounded-lg border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">{linea.descripcion}</p>
                        <p className="text-xs text-slate-400">
                          <Monto numero={linea.precio} tipo="usd" /> x {linea.cantidad}
                        </p>
                      </div>
                      <button
                        onClick={() => quitarLinea(linea.producto_id)}
                        className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                        aria-label="Quitar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                          onClick={() => cambiarCantidad(linea.producto_id, linea.cantidad - 1)}
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{linea.cantidad}</span>
                        <button
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                          onClick={() => cambiarCantidad(linea.producto_id, linea.cantidad + 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="ml-auto text-sm font-semibold text-slate-700">
                        <Monto numero={linea.cantidad * linea.precio} tipo="usd" />
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagos */}
              <div className="border-t border-slate-200 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Formas de pago
                </p>
                {pagos.map((pago, indice) => (
                  <div key={indice} className="mb-2 flex items-end gap-2">
                    <Seleccion
                      value={pago.metodo}
                      onChange={(e) => cambiarPago(indice, 'metodo', e.target.value)}
                      opciones={[
                        { valor: 'efectivo_bs', texto: 'Efectivo Bs.' },
                        { valor: 'efectivo_divisa', texto: 'Efectivo USD + IGTF' },
                        { valor: 'pago_movil', texto: 'Pago movil' },
                        { valor: 'transferencia', texto: 'Transferencia' },
                        { valor: 'punto_debito', texto: 'Punto / debito' },
                      ]}
                    />
                    <input
                      className="campo w-24"
                      type="number"
                      step="0.01"
                      placeholder={pago.moneda}
                      value={pago.monto}
                      onChange={(e) => cambiarPago(indice, 'monto', e.target.value)}
                    />
                    {pagos.length > 1 && (
                      <button
                        className="mb-0.5 rounded p-2 text-slate-300 hover:bg-red-50 hover:text-red-500"
                        onClick={() => setPagos(pagos.filter((_, i) => i !== indice))}
                        aria-label="Quitar pago"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="text-xs font-medium text-marca-600 hover:underline"
                  onClick={() => setPagos([...pagos, { metodo: 'efectivo_bs', moneda: 'VES', monto: '' }])}
                >
                  + Agregar otra forma de pago
                </button>
              </div>

              {/* Totales */}
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                {pagos.some((p) => p.metodo === 'efectivo_divisa') && (
                  <p className="mb-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                    El IGTF del 3% se aplica a los pagos en efectivo en divisas
                  </p>
                )}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span><Monto numero={totales.subtotal} tipo="usd" /></span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>IVA</span>
                    <span><Monto numero={totales.iva} tipo="usd" /></span>
                  </div>
                  {totales.igtf > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>IGTF (3%)</span>
                      <span>{formatoBs(totales.igtf)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Total en divisas</span>
                    <span><Monto numero={totales.totalDivisas} tipo="usd" /></span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-800">
                    <span>Total Bs.</span>
                    <span>{formatoBs(totales.totalBs)}</span>
                  </div>
                  {condicion === 'contado' && (
                    <div
                      className={`flex justify-between text-sm ${
                        totales.totalPagosBs >= totales.totalBs * 0.999 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      <span>Cubierto en pagos</span>
                      <span>{formatoBs(totales.totalPagosBs)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error y boton */}
              <div className="border-t border-slate-200 px-4 py-3">
                {error && (
                  <div className="mb-3">
                    <Alerta tipo="error">{error}</Alerta>
                  </div>
                )}
                <Boton onClick={registrarVenta} disabled={guardando || !lineas.length || tasa === 0} className="w-full py-3 text-base">
                  <Plus size={18} />
                  {guardando ? 'Registrando venta...' : 'Registrar venta'}
                </Boton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de exito */}
      <Modal
        titulo="Venta registrada"
        abierto={!!creado}
        onCerrar={() => setCreado(null)}
        ancho="max-w-md"
      >
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 size={56} className="mb-3 text-emerald-500" />
          <h4 className="text-lg font-bold text-slate-800">La factura se emitio correctamente</h4>
          <p className="mt-1 text-sm text-slate-500">
            Numero de factura: <span className="font-semibold">{creado?.numero_factura}</span>
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Boton secundario onClick={() => descargarDocumento(creado, 'pdf')} disabled={ocupado}>
              <FileDown size={16} /> PDF
            </Boton>
            <Boton secundario onClick={() => descargarDocumento(creado, 'word')} disabled={ocupado}>
              <FileDown size={16} /> Word
            </Boton>
            <Boton onClick={() => imprimirFiscal(creado)} disabled={ocupado}>
              <Printer size={16} /> Imprimir fiscal
            </Boton>
          </div>
          {avisoDoc && <p className="mt-3 text-xs text-slate-500">{avisoDoc}</p>}
          <Boton className="mt-4 w-full" onClick={() => setCreado(null)}>Nueva venta</Boton>
        </div>
      </Modal>
    </div>
  )
}