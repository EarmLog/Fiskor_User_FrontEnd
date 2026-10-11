// ============================================================
// Fiscal: retenciones, libros de ventas/compras y resumen de IVA.
// Herramientas para la declaracion en el Seniat.
// ============================================================
import { useEffect, useState } from 'react'
import { Landmark, Plus, FileBarChart, Receipt, Truck, Calculator } from 'lucide-react'

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
  Tarjeta,
  Vacio,
} from '../components/ui'

const bn = (n) => `Bs. ${Number(n || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`

export default function Fiscal() {
  const { formatoBs } = useApp()
  const [pestana, setPestana] = useState('retenciones')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [retenciones, setRetenciones] = useState([])
  const [libroVentas, setLibroVentas] = useState(null)
  const [libroCompras, setLibroCompras] = useState(null)
  const [resumenIva, setResumenIva] = useState(null)

  const [modalRetencion, setModalRetencion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [retencion, setRetencion] = useState({
    tipo: 'IVA',
    sujeto_nombre: '',
    sujeto_rif: '',
    numero_documento: '',
    base_imponible: '',
    porcentaje: 75,
    periodo: new Date().toLocaleDateString('es-VE', { month: '2-digit', year: 'numeric' }),
    fecha: new Date().toISOString().slice(0, 10),
  })

  const cargarTodo = async () => {
    setCargando(true)
    try {
      const [respRet, respVentas, respCompras, respIva] = await Promise.all([
        api.get('/fiscal/retenciones'),
        api.get('/fiscal/libro-ventas', { params: { desde: desde || undefined, hasta: hasta || undefined } }),
        api.get('/fiscal/libro-compras', { params: { desde: desde || undefined, hasta: hasta || undefined } }),
        api.get('/fiscal/resumen-iva', { params: { desde: desde || undefined, hasta: hasta || undefined } }),
      ])
      setRetenciones(respRet.data.datos || [])
      setLibroVentas(respVentas.data.datos)
      setLibroCompras(respCompras.data.datos)
      setResumenIva(respIva.data.datos)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarTodo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emitirRetencion = async () => {
    setError('')
    if (!retencion.sujeto_nombre || !Number(retencion.base_imponible)) {
      setError('Indique el sujeto y la base imponible')
      return
    }
    setGuardando(true)
    try {
      const { data } = await api.post('/fiscal/retenciones', {
        tipo: retencion.tipo,
        sujeto_nombre: retencion.sujeto_nombre,
        sujeto_rif: retencion.sujeto_rif,
        sujeto_tipo: 'proveedor',
        numero_documento: retencion.numero_documento,
        base_imponible: Number(retencion.base_imponible),
        porcentaje: Number(retencion.porcentaje),
        periodo: retencion.periodo,
        fecha: retencion.fecha,
      })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModalRetencion(false)
        cargarTodo()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo emitir la retencion')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <Cargando mensaje="Cargando informacion fiscal..." />

  const pestanas = [
    { id: 'retenciones', etiqueta: 'Retenciones', icono: Landmark },
    { id: 'libro-ventas', etiqueta: 'Libro de ventas', icono: Receipt },
    { id: 'libro-compras', etiqueta: 'Libro de compras', icono: Truck },
    { id: 'resumen-iva', etiqueta: 'Resumen IVA', icono: Calculator },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Modulo fiscal</h2>
          <p className="text-sm text-slate-500">Retenciones, libros y resumen de IVA para el Seniat</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {pestanas.map((p) => (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                pestana === p.id ? 'bg-marca-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <p.icono size={16} /> {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}

      {/* Filtro por periodo */}
      {pestana !== 'retenciones' && (
        <div className="tarjeta flex flex-wrap items-end gap-3 px-4 py-3">
          <Entrada etiqueta="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
          <Entrada etiqueta="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
          <Boton secundario onClick={cargarTodo}>Filtrar</Boton>
        </div>
      )}

      {/* ===== Retenciones ===== */}
      {pestana === 'retenciones' && (
        <>
          <div className="flex justify-end">
            <Boton onClick={() => { setError(''); setModalRetencion(true) }}>
              <Plus size={16} /> Emitir retencion
            </Boton>
          </div>
          {retenciones.length ? (
            <div className="tarjeta overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-400">
                    <th className="px-4 py-2">Comprobante</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Sujeto</th>
                    <th className="px-4 py-2">RIF</th>
                    <th className="px-4 py-2 text-right">Base</th>
                    <th className="px-4 py-2 text-right">%</th>
                    <th className="px-4 py-2 text-right">Retenido</th>
                    <th className="px-4 py-2">Periodo</th>
                  </tr>
                </thead>
                <tbody>
                  {retenciones.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-700">{r.numero_comprobante}</td>
                      <td className="px-4 py-2">
                        <Insignia color={r.tipo === 'IVA' ? 'azul' : 'morado'}>{r.tipo}</Insignia>
                      </td>
                      <td className="px-4 py-2">{r.sujeto_nombre}</td>
                      <td className="px-4 py-2">{r.sujeto_rif}</td>
                      <td className="px-4 py-2 text-right">{bn(r.base_imponible)}</td>
                      <td className="px-4 py-2 text-right">{r.porcentaje}%</td>
                      <td className="px-4 py-2 text-right font-semibold text-marca-600">{bn(r.monto_retenido)}</td>
                      <td className="px-4 py-2">{r.periodo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Tarjeta>
              <Vacio mensaje="Aun no se han emitido retenciones" />
            </Tarjeta>
          )}
        </>
      )}

      {/* ===== Libro de ventas ===== */}
      {pestana === 'libro-ventas' && libroVentas && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Tarjeta className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total base imponible</span>
              <span className="text-lg font-bold text-marca-600">{bn(libroVentas.total_base)}</span>
            </Tarjeta>
            <Tarjeta className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total IVA</span>
              <span className="text-lg font-bold text-marca-600">{bn(libroVentas.total_iva)}</span>
            </Tarjeta>
          </div>
          <Tarjeta className="overflow-x-auto">
            {libroVentas.filas.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-400">
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Factura</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">RIF</th>
                    <th className="px-4 py-2 text-right">Base (USD)</th>
                    <th className="px-4 py-2 text-right">IVA (USD)</th>
                    <th className="px-4 py-2 text-right">IGTF (Bs)</th>
                    <th className="px-4 py-2 text-right">Total (Bs)</th>
                  </tr>
                </thead>
                <tbody>
                  {libroVentas.filas.map((f, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2">{f.fecha}</td>
                      <td className="px-4 py-2 font-medium">{f.numero_factura}</td>
                      <td className="px-4 py-2">{f.razon_social}</td>
                      <td className="px-4 py-2">{f.rif}</td>
                      <td className="px-4 py-2 text-right">{Number(f.base_imponible).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{Number(f.iva).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{Number(f.igtf).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatoBs(f.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Vacio mensaje="No hay ventas en el periodo" />
            )}
          </Tarjeta>
        </>
      )}

      {/* ===== Libro de compras ===== */}
      {pestana === 'libro-compras' && libroCompras && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Tarjeta className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Base</span>
              <span className="text-lg font-bold text-marca-600">${Number(libroCompras.total_base).toFixed(2)}</span>
            </Tarjeta>
            <Tarjeta className="flex items-center justify-between">
              <span className="text-sm text-slate-500">IVA</span>
              <span className="text-lg font-bold text-marca-600">${Number(libroCompras.total_iva).toFixed(2)}</span>
            </Tarjeta>
            <Tarjeta className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Retencion</span>
              <span className="text-lg font-bold text-amber-600">${Number(libroCompras.total_retencion).toFixed(2)}</span>
            </Tarjeta>
          </div>
          <Tarjeta className="overflow-x-auto">
            {libroCompras.filas.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-400">
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Factura</th>
                    <th className="px-4 py-2">Proveedor</th>
                    <th className="px-4 py-2">RIF</th>
                    <th className="px-4 py-2 text-right">Base</th>
                    <th className="px-4 py-2 text-right">IVA</th>
                    <th className="px-4 py-2 text-right">Ret. IVA</th>
                  </tr>
                </thead>
                <tbody>
                  {libroCompras.filas.map((f, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2">{f.fecha}</td>
                      <td className="px-4 py-2 font-medium">{f.numero_factura}</td>
                      <td className="px-4 py-2">{f.razon_social}</td>
                      <td className="px-4 py-2">{f.rif}</td>
                      <td className="px-4 py-2 text-right">{Number(f.base_imponible).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{Number(f.iva).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{Number(f.retencion_iva).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Vacio mensaje="No hay compras en el periodo" />
            )}
          </Tarjeta>
        </>
      )}

      {/* ===== Resumen IVA ===== */}
      {pestana === 'resumen-iva' && resumenIva && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Tarjeta className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Debito fiscal (ventas)</span>
            <span className="text-lg font-bold text-slate-800">${Number(resumenIva.debito_fiscal).toFixed(2)}</span>
          </Tarjeta>
          <Tarjeta className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Credito fiscal (compras)</span>
            <span className="text-lg font-bold text-slate-800">${Number(resumenIva.credito_fiscal).toFixed(2)}</span>
          </Tarjeta>
          <Tarjeta className="flex items-center justify-between">
            <span className="text-sm text-slate-500">IVA retenido</span>
            <span className="text-lg font-bold text-amber-600">${Number(resumenIva.iva_retenido).toFixed(2)}</span>
          </Tarjeta>
          <Tarjeta className="flex items-center justify-between border-2 border-marca-200 bg-marca-50">
            <span className="font-semibold text-slate-700">Saldo a pagar (borrador)</span>
            <span className="text-xl font-bold text-marca-700">${Number(resumenIva.saldo_a_pagar).toFixed(2)}</span>
          </Tarjeta>
          <div className="sm:col-span-2">
            <Alerta tipo="aviso">
              Este es un borrador de calculo. Consulte al contador antes de presentar la declaracion.
            </Alerta>
          </div>
        </div>
      )}

      {/* ===== Modal retencion ===== */}
      <Modal
        titulo="Emitir comprobante de retencion"
        abierto={modalRetencion}
        onCerrar={() => setModalRetencion(false)}
        ancho="max-w-lg"
        acciones={
          <>
            <Boton secundario onClick={() => setModalRetencion(false)}>Cancelar</Boton>
            <Boton onClick={emitirRetencion} disabled={guardando}>
              <FileBarChart size={16} /> {guardando ? 'Emitiendo...' : 'Emitir'}
            </Boton>
          </>
        }
      >
        <div className="space-y-4">
          <Seleccion
            etiqueta="Tipo de retencion"
            value={retencion.tipo}
            onChange={(e) => {
              const tipo = e.target.value
              setRetencion({ ...retencion, tipo, porcentaje: tipo === 'IVA' ? 75 : 5 })
            }}
            opciones={[
              { valor: 'IVA', texto: 'IVA (75%)' },
              { valor: 'ISLR', texto: 'ISLR (5%)' },
            ]}
          />
          <Entrada etiqueta="Sujeto (proveedor o cliente)" value={retencion.sujeto_nombre} onChange={(e) => setRetencion({ ...retencion, sujeto_nombre: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Entrada etiqueta="RIF" value={retencion.sujeto_rif} onChange={(e) => setRetencion({ ...retencion, sujeto_rif: e.target.value })} />
            <Entrada etiqueta="Numero de documento" value={retencion.numero_documento} onChange={(e) => setRetencion({ ...retencion, numero_documento: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Entrada etiqueta="Base imponible (USD)" type="number" value={retencion.base_imponible} onChange={(e) => setRetencion({ ...retencion, base_imponible: e.target.value })} />
            <Entrada etiqueta="Porcentaje" type="number" value={retencion.porcentaje} onChange={(e) => setRetencion({ ...retencion, porcentaje: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Entrada etiqueta="Periodo" value={retencion.periodo} onChange={(e) => setRetencion({ ...retencion, periodo: e.target.value })} />
            <Entrada etiqueta="Fecha" type="date" value={retencion.fecha} onChange={(e) => setRetencion({ ...retencion, fecha: e.target.value })} />
          </div>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Monto estimado: <span className="font-semibold text-marca-600">
              ${((Number(retencion.base_imponible) || 0) * (Number(retencion.porcentaje) || 0) / 100).toFixed(2)}
            </span>
          </p>
        </div>
      </Modal>
    </div>
  )
}